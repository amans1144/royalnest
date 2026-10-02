import { NextResponse } from 'next/server';
import { CORS, denyAdminRead, denyPublish, storageFailure } from '../../../../lib/content-store';
import { getState, putState } from '../../../../lib/db';

/**
 * Shared state for the admin console.
 *
 *   GET /api/admin/state/<key>            -> { ok, key, value, version, updatedAt }
 *   PUT /api/admin/state/<key>            -> { ok, version, updatedAt }
 *        body { value, baseVersion? }
 *
 * Why this exists: every admin screen used to keep its data in the browser's
 * own localStorage, so a project traced on one laptop simply did not exist on
 * another — and clearing site data destroyed it. This keeps that state in the
 * website's Postgres (site.admin_state), behind the same shared token as
 * publishing. It is deliberately a key/value store: the admin owns the shapes.
 *
 * `version` gives last-write-wins a voice: a client that passes `baseVersion`
 * gets a 409 instead of silently overwriting a colleague's edit. The check and
 * the write are one SQL statement, so it holds under concurrent saves too.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Only lowercase words, digits, dash and underscore per segment, at most three
 * segments, and no segment may be empty. Keys are no longer filenames, but a
 * small, predictable key space is still what stops this becoming a general
 * write-anything store.
 */
const SEGMENT = /^[a-z0-9][a-z0-9_-]{0,63}$/;

function keyFrom(parts: string[]): string | null {
  // The route is mounted at /api/admin/..., and every key is namespaced under
  // `state` so other admin endpoints can be added later without collisions.
  if (parts.length < 2 || parts.length > 4) return null;
  if (parts[0] !== 'state') return null;
  const segs = parts.slice(1).map((s) => s.toLowerCase());
  if (!segs.every((s) => SEGMENT.test(s))) return null;
  return segs.join('/');
}

/** Layout images arrive as data URIs, so bodies here are legitimately large. */
const MAX_BYTES = 24 * 1024 * 1024;

const bad = (status: number, error: string) =>
  NextResponse.json({ ok: false, error }, { status, headers: CORS });

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(req: Request, ctx: { params: Promise<{ key: string[] }> }) {
  const denied = denyAdminRead(req);
  if (denied) return bad(denied.status, denied.error);

  const key = keyFrom((await ctx.params).key);
  if (!key) return bad(400, 'Invalid state key.');

  try {
    const env = await getState(key);
    return NextResponse.json(
      { ok: true, key, ...env },
      // Admin state is private and changes constantly — never let it be cached.
      { headers: { ...CORS, 'Cache-Control': 'no-store, private' } },
    );
  } catch (err) {
    return storageFailure(err);
  }
}

export async function PUT(req: Request, ctx: { params: Promise<{ key: string[] }> }) {
  // A write to shared admin state is exactly as sensitive as a publish, so it
  // uses the same guard — including failing closed when no token is configured.
  const denied = denyPublish(req);
  if (denied) return bad(denied.status, denied.error);

  const key = keyFrom((await ctx.params).key);
  if (!key) return bad(400, 'Invalid state key.');

  const raw = await req.text();
  if (raw.length > MAX_BYTES) {
    return bad(413, 'That change is too large to store. Use image URLs rather than uploads.');
  }

  let body: { value?: unknown; baseVersion?: unknown };
  try {
    body = JSON.parse(raw) as typeof body;
  } catch {
    return bad(400, 'Malformed request body.');
  }
  if (!body || typeof body !== 'object' || !('value' in body)) {
    return bad(400, 'Request body must contain `value`.');
  }
  const baseVersion =
    typeof body.baseVersion === 'number' && Number.isInteger(body.baseVersion) && body.baseVersion >= 0
      ? body.baseVersion
      : undefined;

  try {
    const res = await putState(key, body.value, baseVersion);
    if (!res.ok) {
      return NextResponse.json(
        {
          ok: false,
          conflict: true,
          error:
            'Someone else changed this since you loaded it. Refresh to pick up their version, then re-apply your change.',
          version: res.version,
        },
        { status: 409, headers: CORS },
      );
    }
    return NextResponse.json(
      { ok: true, key, version: res.version, updatedAt: res.updatedAt },
      { headers: CORS },
    );
  } catch (err) {
    return storageFailure(err);
  }
}
