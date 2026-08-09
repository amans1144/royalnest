import { NextResponse } from 'next/server';
import {
  isMarketingCategory,
  isMarketingKind,
  isSafeMediaUrl,
  detectMarketingKind,
  type MarketingItem,
} from '@spb/types';
import { CORS, denyPublish, readStore, storePath, writeStore } from '../../../lib/content-store';

/**
 * Shared store for the Marketing Material page, mirroring /api/gallery: the
 * admin publishes the asset list that the public site renders at /marketing.
 * Persisted under DATA_DIR — see lib/content-store for where that lands and
 * how writes are made crash-safe. Replaced by NestJS + Postgres + S3 later.
 *
 *   GET  /api/marketing -> { items, updatedAt }
 *   POST /api/marketing { items } -> { ok, count }   (requires PUBLISH_TOKEN)
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FILE = storePath('spb-published-marketing.json');

/** Generous but finite, so a runaway publish can't fill the disk. */
const MAX_ITEMS = 300;

type Store = { items: MarketingItem[]; updatedAt: string | null };

const EMPTY: Store = { items: [], updatedAt: null };

async function read(): Promise<Store> {
  const parsed = await readStore<Store>(FILE, EMPTY);
  return Array.isArray(parsed.items) ? parsed : EMPTY;
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
    const body = (await req.json()) as { items?: unknown };
    const items = sanitise(body.items);
    const store: Store = { items, updatedAt: new Date().toISOString() };
    await writeStore(FILE, store);
    return NextResponse.json({ ok: true, count: items.length }, { headers: CORS });
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Failed to save marketing material' },
      { status: 500, headers: CORS },
    );
  }
}
