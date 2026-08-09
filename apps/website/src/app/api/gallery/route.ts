import { NextResponse } from 'next/server';
import { isGalleryCategory, type GalleryImage } from '@spb/types';
import { CORS, denyPublish, readStore, storePath, writeStore } from '../../../lib/content-store';

/**
 * Shared gallery store so the admin's Media Library can publish the photo set
 * the public gallery renders. Persisted under DATA_DIR — see lib/content-store.
 * Replaced by NestJS + Postgres + S3 later.
 *
 *   GET  /api/gallery -> { images, updatedAt }
 *   POST /api/gallery { images } -> { ok, count }
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FILE = storePath('spb-published-gallery.json');

type Store = { images: GalleryImage[]; updatedAt: string | null };

const EMPTY: Store = { images: [], updatedAt: null };

async function read(): Promise<Store> {
  const parsed = await readStore<Store>(FILE, EMPTY);
  return Array.isArray(parsed.images) ? parsed : EMPTY;
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
  return NextResponse.json(await read(), { headers: CORS });
}

export async function POST(req: Request) {
  const denied = denyPublish(req);
  if (denied) {
    return NextResponse.json(
      { ok: false, error: denied.error },
      { status: denied.status, headers: CORS },
    );
  }
  try {
    const body = (await req.json()) as { images?: unknown };
    const images = sanitise(body.images);
    const store: Store = { images, updatedAt: new Date().toISOString() };
    await writeStore(FILE, store);
    return NextResponse.json({ ok: true, count: images.length }, { headers: CORS });
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Failed to save gallery' },
      { status: 500, headers: CORS },
    );
  }
}
