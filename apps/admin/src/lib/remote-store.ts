'use client';

import { WEBSITE_URL } from './site-config';
import { publishHeaders } from './publish';

/**
 * Shared admin state, held on the website rather than in this browser.
 *
 * Everything here used to live in localStorage, which meant a project traced on
 * one laptop did not exist on any other and a cleared browser destroyed it.
 * These helpers talk to /api/admin/state/<key> instead, so every admin sees the
 * same data from any machine.
 *
 * localStorage is still written on every save, but only as a **cache and
 * offline fallback** — never as the source of truth. That keeps the panel
 * usable if the website is briefly unreachable, and it is what the one-time
 * migration reads from.
 */

const base = `${WEBSITE_URL}/api/admin/state`;

/**
 * Every request is bounded.
 *
 * Without this, a website that hangs rather than refuses — a half-open
 * connection, a proxy swallowing the request, DNS stalling — would leave the
 * admin on "Loading shared data…" indefinitely, because the hydration gate
 * waits on these promises. A refused connection fails fast; a hung one does
 * not, and that is the case worth defending against. On timeout we fall back
 * to this device's cached copy and say so.
 */
const TIMEOUT_MS = 8000;

async function withTimeout(url: string, init: RequestInit): Promise<Response> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: ctl.signal });
  } finally {
    clearTimeout(timer);
  }
}

export type Loaded<T> = {
  value: T;
  /** Server version at load time; pass it back to detect a clobber. */
  version: number;
  /** True when the value came from the local cache, not the server. */
  stale: boolean;
  error: string | null;
};

/**
 * Deliberately the SAME localStorage key the admin used before this change —
 * not a new namespace. That makes the migration automatic: whatever an admin
 * had already saved locally is exactly what gets found and pushed up the first
 * time they open the panel, so nobody loses a traced map to this refactor.
 */
const cacheKey = (key: string) => key.replace(/\//g, '__');

function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(cacheKey(key));
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeCache(key: string, value: unknown): void {
  try {
    localStorage.setItem(cacheKey(key), JSON.stringify(value));
  } catch {
    /* quota — the server copy is authoritative anyway */
  }
}

function describe(status: number): string {
  if (status === 401)
    return 'The website rejected the admin token — NEXT_PUBLIC_PUBLISH_TOKEN here and PUBLISH_TOKEN on the website must match.';
  if (status === 503)
    return 'The website cannot serve shared admin data — either PUBLISH_TOKEN is not set or its database is unreachable.';
  if (status === 413) return 'That change is too large to store. Use image URLs rather than uploads.';
  return `${WEBSITE_URL} returned ${status}.`;
}

/**
 * Read shared state.
 *
 * A server value of `null` means "nothing stored yet". In that case anything
 * already in this browser's cache is migrated up, so an admin who had been
 * working locally before this change keeps their projects and traced maps
 * instead of opening an empty panel.
 */
export async function loadState<T>(key: string, fallback: T): Promise<Loaded<T>> {
  try {
    const res = await withTimeout(`${base}/${key}`, {
      headers: publishHeaders(),
      cache: 'no-store',
    });
    if (!res.ok) {
      const cached = readCache<T>(key);
      // The website's own reason (e.g. its database is down) beats a guess
      // from the status code — a 503 is no longer only a missing token.
      const err = (await res.json().catch(() => null)) as { error?: string } | null;
      return {
        value: cached ?? fallback,
        version: 0,
        stale: true,
        error: err?.error ?? describe(res.status),
      };
    }
    const body = (await res.json()) as { value: T | null; version: number };

    if (body.value === null || body.value === undefined) {
      const cached = readCache<T>(key);
      if (cached !== null) {
        const up = await saveState(key, cached, body.version);
        return {
          value: cached,
          version: up.ok ? up.version : body.version,
          stale: false,
          error: up.ok ? null : up.error,
        };
      }
      return { value: fallback, version: body.version, stale: false, error: null };
    }

    writeCache(key, body.value);
    return { value: body.value, version: body.version, stale: false, error: null };
  } catch {
    const cached = readCache<T>(key);
    return {
      value: cached ?? fallback,
      version: 0,
      stale: true,
      error: `Could not reach ${WEBSITE_URL}. Showing the last copy saved on this device; changes will not be shared until it is reachable.`,
    };
  }
}

export type Saved =
  | { ok: true; version: number }
  | { ok: false; error: string; conflict?: boolean; version?: number };

/** Write shared state. Pass `baseVersion` to be told about a conflict. */
export async function saveState(
  key: string,
  value: unknown,
  baseVersion?: number,
): Promise<Saved> {
  // Cache first: if the network write fails the operator still has their work.
  writeCache(key, value);
  try {
    const res = await withTimeout(`${base}/${key}`, {
      method: 'PUT',
      headers: publishHeaders(),
      body: JSON.stringify(baseVersion === undefined ? { value } : { value, baseVersion }),
    });
    const body = (await res.json().catch(() => null)) as
      | { ok?: boolean; version?: number; error?: string; conflict?: boolean }
      | null;

    if (res.status === 409) {
      return {
        ok: false,
        conflict: true,
        version: body?.version,
        error: body?.error ?? 'Someone else changed this since you loaded it.',
      };
    }
    if (!res.ok || !body?.ok || typeof body.version !== 'number') {
      return { ok: false, error: body?.error ?? describe(res.status) };
    }
    return { ok: true, version: body.version };
  } catch {
    return {
      ok: false,
      error: `Could not reach ${WEBSITE_URL}. Your change is saved on this device only.`,
    };
  }
}
