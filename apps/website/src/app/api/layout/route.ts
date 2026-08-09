import { NextResponse } from 'next/server';
import { CORS, denyPublish, readStore, storePath, writeStore } from '../../../lib/content-store';

/**
 * Shared layout store, keyed by project slug, so the admin can publish a plot
 * layout per project that the public site renders. Persisted under DATA_DIR —
 * see lib/content-store. Replaced by NestJS + Postgres + S3 later.
 *
 *   GET  /api/layout                -> { projects: string[] }   (slugs with a live map)
 *   GET  /api/layout?project=<slug> -> { image, plots, updatedAt }
 *   POST /api/layout  { projectId, image, plots }
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FILE = storePath('spb-published-layouts.json');

type Layout = { image: unknown; plots: unknown[]; updatedAt: string };
type Store = Record<string, Layout>;

const read = (): Promise<Store> => readStore<Store>(FILE, {});

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(req: Request) {
  const store = await read();
  const slug = new URL(req.url).searchParams.get('project');

  if (slug) {
    const layout = store[slug];
    return NextResponse.json(layout ?? { image: null, plots: [], updatedAt: null }, { headers: CORS });
  }

  const projects = Object.keys(store).filter(
    (k) => store[k]?.image && Array.isArray(store[k]?.plots) && store[k]!.plots.length > 0,
  );
  return NextResponse.json({ projects }, { headers: CORS });
}

export async function POST(req: Request) {
  const denied = denyPublish(req);
  if (denied) {
    return NextResponse.json({ ok: false, error: denied.error }, { status: denied.status, headers: CORS });
  }
  try {
    const body = await req.json();
    const projectId: string | undefined = body.projectId;
    if (!projectId) {
      return NextResponse.json({ ok: false, error: 'projectId is required' }, { status: 400, headers: CORS });
    }
    const store = await read();
    store[projectId] = {
      image: body.image ?? null,
      plots: Array.isArray(body.plots) ? body.plots : [],
      updatedAt: new Date().toISOString(),
    };
    await writeStore(FILE, store);
    return NextResponse.json({ ok: true, project: projectId, count: store[projectId]!.plots.length }, { headers: CORS });
  } catch {
    return NextResponse.json({ ok: false, error: 'Failed to save layout' }, { status: 500, headers: CORS });
  }
}
