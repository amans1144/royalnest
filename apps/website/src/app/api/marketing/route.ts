import { NextResponse } from 'next/server';
import {
  isMarketingCategory,
  isMarketingKind,
  isSafeMediaUrl,
  detectMarketingKind,
  type MarketingItem,
} from '@spb/types';
import { CORS, denyPublish, storageFailure } from '../../../lib/content-store';
import { getContent, putContent } from '../../../lib/db';

/**
 * Shared store for the Marketing Material page, mirroring /api/gallery: the
 * admin publishes the asset list that the public site renders at /marketing.
 * Stored in Postgres (site.content) — see lib/db.
 *
 *   GET  /api/marketing -> { items, updatedAt }
 *   POST /api/marketing { items } -> { ok, count }   (requires PUBLISH_TOKEN)
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Generous but finite, so a runaway publish can't bloat the table. */
const MAX_ITEMS = 300;

type Store = { items: MarketingItem[]; updatedAt: string | null };

const EMPTY: Store = { items: [], updatedAt: null };

async function read(): Promise<Store> {
  const row = await getContent<MarketingItem[]>('marketing');
  return row && Array.isArray(row.value) ? { items: row.value, updatedAt: row.updatedAt } : EMPTY;
}

const str = (v: unknown, max: number): string =>
  typeof v === 'string' ? v.trim().slice(0, max) : '';

/** Keep only well-formed, safely-linkable entries so one bad row can't break
 *  the page — anything with an unusable URL is dropped rather than rendered. */
function sanitise(input: unknown): MarketingItem[] {
  if (!Array.isArray(input)) return [];
  return input.slice(0, MAX_ITEMS).flatMap((raw, i) => {
    if (!raw || typeof raw !== 'object') return [];
    const r = raw as Record<string, unknown>;
    if (!isSafeMediaUrl(r.url)) return [];
    const url = r.url.trim();
    const item: MarketingItem = {
      id: str(r.id, 60) || `mkt-${i}`,
      kind: isMarketingKind(r.kind) ? r.kind : detectMarketingKind(url),
      url,
      title: str(r.title, 120) || 'Untitled',
      description: str(r.description, 400),
      category: isMarketingCategory(r.category) ? r.category : 'Other',
    };
    if (isSafeMediaUrl(r.thumbnail)) item.thumbnail = r.thumbnail.trim();
    return [item];
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
  let body: { items?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Malformed request body.' },
      { status: 400, headers: CORS },
    );
  }
  try {
    const items = sanitise(body.items);
    await putContent('marketing', items);
    return NextResponse.json({ ok: true, count: items.length }, { headers: CORS });
  } catch (err) {
    return storageFailure(err);
  }
}
