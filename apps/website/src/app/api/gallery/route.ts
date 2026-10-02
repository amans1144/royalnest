import { NextResponse } from 'next/server';
import { isGalleryCategory, type GalleryImage } from '@spb/types';
import { CORS, denyPublish, storageFailure } from '../../../lib/content-store';
import { getContent, putContent } from '../../../lib/db';

/**
 * Shared gallery store so the admin's Media Library can publish the photo set
 * the public gallery renders. Stored in Postgres (site.content) — see lib/db.
 *
 *   GET  /api/gallery -> { images, updatedAt }
 *   POST /api/gallery { images } -> { ok, count }
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Store = { images: GalleryImage[]; updatedAt: string | null };

const EMPTY: Store = { images: [], updatedAt: null };

async function read(): Promise<Store> {
  const row = await getContent<GalleryImage[]>('gallery');
  return row && Array.isArray(row.value) ? { images: row.value, updatedAt: row.updatedAt } : EMPTY;
}

/** Keep only well-formed entries so a bad publish can't break the gallery. */
function sanitise(input: unknown): GalleryImage[] {
  if (!Array.isArray(input)) return [];
  return input.flatMap((raw, i) => {
    if (!raw || typeof raw !== 'object') return [];
    const r = raw as Record<string, unknown>;
    if (typeof r.src !== 'string' || !r.src) return [];
    return [
      {
        id: typeof r.id === 'string' && r.id ? r.id : `img-${i}`,
        src: r.src,
        label: typeof r.label === 'string' && r.label.trim() ? r.label.trim() : 'Untitled',
        category: isGalleryCategory(r.category) ? r.category : 'Township',
      },
    ];
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET() {
  try {
    return NextResponse.json(await read(), { headers: CORS });
  } catch (err) {
    return storageFailure(err, EMPTY);
  }
}

export async function POST(req: Request) {
  const denied = denyPublish(req);
  if (denied) {
    return NextResponse.json(
      { ok: false, error: denied.error },
      { status: denied.status, headers: CORS },
    );
  }
  let body: { images?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Malformed request body.' },
      { status: 400, headers: CORS },
    );
  }
  try {
    const images = sanitise(body.images);
    await putContent('gallery', images);
    return NextResponse.json({ ok: true, count: images.length }, { headers: CORS });
  } catch (err) {
    return storageFailure(err);
  }
}
