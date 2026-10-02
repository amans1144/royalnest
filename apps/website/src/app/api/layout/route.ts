import { NextResponse } from 'next/server';
import { CORS, denyPublish, storageFailure } from '../../../lib/content-store';
import { getLayout, listLiveLayouts, putLayout } from '../../../lib/db';

/**
 * Published plot layouts, one per project slug, so the admin can publish a map
 * that the public site renders. Stored in Postgres (site.layouts) — see lib/db.
 *
 *   GET  /api/layout                -> { projects: string[] }   (slugs with a live map)
 *   GET  /api/layout?project=<slug> -> { image, plots, updatedAt }
 *   POST /api/layout  { projectId, image, plots }
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EMPTY = { image: null, plots: [], updatedAt: null };

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get('project');
  try {
    if (slug) {
      return NextResponse.json((await getLayout(slug)) ?? EMPTY, { headers: CORS });
    }
    return NextResponse.json({ projects: await listLiveLayouts() }, { headers: CORS });
  } catch (err) {
    return storageFailure(err, slug ? EMPTY : { projects: [] });
  }
}

export async function POST(req: Request) {
  const denied = denyPublish(req);
  if (denied) {
    return NextResponse.json({ ok: false, error: denied.error }, { status: denied.status, headers: CORS });
  }
  let body: { projectId?: unknown; image?: unknown; plots?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: 'Malformed request body.' }, { status: 400, headers: CORS });
  }
  const projectId = typeof body.projectId === 'string' ? body.projectId.trim() : '';
  if (!projectId || projectId.length > 120) {
    return NextResponse.json({ ok: false, error: 'projectId is required' }, { status: 400, headers: CORS });
  }
  const plots = Array.isArray(body.plots) ? body.plots : [];
  try {
    await putLayout(projectId, body.image ?? null, plots);
    return NextResponse.json({ ok: true, project: projectId, count: plots.length }, { headers: CORS });
  } catch (err) {
    return storageFailure(err);
  }
}
