import { NextResponse } from 'next/server';
import { DbUnavailable } from './db';

/**
 * Shared plumbing for the publish endpoints (/api/gallery, /api/marketing,
 * /api/settings, /api/layout, /api/admin/state, /api/lead): who may write, and
 * which origins may call. Storage itself lives in lib/db — Postgres, not files.
 */

/* ── Publish authorisation ────────────────────────────────────────────────
   These endpoints rewrite what the public site shows, so on the open internet
   they cannot stay unauthenticated. The admin sends PUBLISH_TOKEN as a header;
   in production a missing token fails closed, because an unset secret must
   never silently mean "anyone may publish".                                 */

const TOKEN = process.env.PUBLISH_TOKEN?.trim() ?? '';
const IS_PROD = process.env.NODE_ENV === 'production';

/** Constant-time-ish compare; avoids leaking the token length via early exit. */
function tokensMatch(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export type PublishDenial = { status: number; error: string };

/** Null when the request may publish, otherwise the response to send back. */
export function denyPublish(req: Request): PublishDenial | null {
  if (!TOKEN) {
    return IS_PROD
      ? {
          status: 503,
          error:
            'PUBLISH_TOKEN is not set on the website. Publishing is disabled until it is configured.',
        }
      : null; // local development stays frictionless
  }
  const sent = req.headers.get('x-publish-token')?.trim() ?? '';
  return tokensMatch(TOKEN, sent) ? null : { status: 401, error: 'Invalid or missing publish token.' };
}

/**
 * Guard for reading private data back out (enquiries).
 *
 * Same token as publishing, but this is a READ and the stakes are different:
 * the other GET endpoints are deliberately public because they serve the
 * content the site already displays, whereas enquiries are customers' names,
 * phone numbers and email addresses. So this fails closed in production with
 * no token — an unset secret must never mean "anyone may download the leads".
 */
export function denyAdminRead(req: Request): PublishDenial | null {
  if (!TOKEN) {
    return IS_PROD
      ? {
          status: 503,
          error:
            'PUBLISH_TOKEN is not set on the website, so enquiries cannot be read remotely. Set it and restart.',
        }
      : null; // local development stays frictionless
  }
  const sent = req.headers.get('x-publish-token')?.trim() ?? '';
  return tokensMatch(TOKEN, sent)
    ? null
    : { status: 401, error: 'Invalid or missing publish token.' };
}

/** Browsers only need to reach these from the admin app. */
const ALLOWED_ORIGIN = process.env.ADMIN_ORIGIN?.trim() || '*';

export const CORS: Record<string, string> = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  // PUT is required by /api/admin/state. Without it the browser's preflight
  // refuses every shared-state write while GETs keep succeeding — which looks
  // exactly like "my changes save but nobody else sees them".
  'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-publish-token',
  ...(ALLOWED_ORIGIN === '*' ? {} : { Vary: 'Origin' }),
};

/**
 * The response for a storage failure.
 *
 * `fallback` is the empty shape the endpoint normally returns, so the public
 * site's hooks — which only check for the fields they render — keep their
 * built-in content instead of choking on an error object. 503 rather than
 * 500: the request was fine, the database was not there to take it.
 */
export function storageFailure(err: unknown, fallback: object = {}) {
  const error =
    err instanceof DbUnavailable ? err.message : 'Unexpected storage error. Check the website logs.';
  if (!(err instanceof DbUnavailable)) console.error('[store]', err);
  return NextResponse.json(
    { ...fallback, ok: false, error },
    { status: 503, headers: { ...CORS, 'Cache-Control': 'no-store' } },
  );
}
