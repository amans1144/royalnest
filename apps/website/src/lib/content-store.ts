import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Server-side store shared by the publish endpoints (/api/gallery,
 * /api/marketing, /api/settings, /api/layout).
 *
 * In development this stays in the OS temp dir, outside the project, so the
 * dev-server file watcher doesn't reload on every publish. In production that
 * is the wrong place — systemd-tmpfiles clears /tmp, and on some images it is
 * a tmpfs that empties on reboot — so DATA_DIR must point at a directory that
 * survives restarts. Everything published from the admin lives there.
 */
const DATA_DIR = process.env.DATA_DIR?.trim() || os.tmpdir();

export const storePath = (fileName: string): string => path.join(DATA_DIR, fileName);

export async function readStore<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8')) as T;
  } catch {
    return fallback;
  }
}

/**
 * Write via a temp file and rename. rename(2) is atomic on the same
 * filesystem, so a crash or a power cut mid-publish leaves the previous
 * content intact instead of a half-written file the site can't parse.
 */
export async function writeStore(file: string, data: unknown): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  try {
    await fs.writeFile(tmp, JSON.stringify(data), 'utf8');
    await fs.rename(tmp, file);
  } catch (err) {
    await fs.rm(tmp, { force: true }).catch(() => {});
    throw err;
  }
}

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

/** Browsers only need to reach these from the admin app. */
const ALLOWED_ORIGIN = process.env.ADMIN_ORIGIN?.trim() || '*';

export const CORS: Record<string, string> = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-publish-token',
  ...(ALLOWED_ORIGIN === '*' ? {} : { Vary: 'Origin' }),
};
