'use client';

import { loadState, saveState } from './remote-store';

/**
 * In-memory mirror of the shared admin state held on the website.
 *
 * Why a mirror rather than awaiting the server at every call site: the editor,
 * Plot Inventory, the dashboard and the booking forms all read layouts and
 * projects *synchronously*, inside render and in derived selectors. Making
 * those async would mean restructuring a 1,100-line editor around promises for
 * no user-visible gain.
 *
 * So the shape is: hydrate once when the panel opens, then reads are instant
 * and writes update the mirror immediately and push to the server in the
 * background. Reads stay synchronous; sharing is what changes.
 *
 * The write path is intentionally last-write-wins without a version check.
 * These are whole-document saves of a map an operator is actively dragging —
 * failing a drag because a colleague touched another project's plot would be
 * worse than the race it prevents. `usePersistentList` does use versions,
 * because its edits are discrete record changes.
 */

const mirror = new Map<string, unknown>();
const errors = new Map<string, string>();
let hydrated = false;
/**
 * The in-flight hydration, shared by concurrent callers.
 *
 * React StrictMode invokes the Shell's effect twice in development, and a
 * remounted Shell calls it again — each run re-fetching every document and
 * delaying the gate it is meant to clear. Callers now await the same promise.
 */
let hydrating: Promise<void> | null = null;

export const isHydrated = () => hydrated;

/**
 * Put a value in the mirror WITHOUT saving it.
 *
 * usePersistentList does its own versioned save, but synchronous readers like
 * readProjects() look at the mirror — so without this, adding a project on the
 * Projects screen would not show up in the plot editor's project picker until
 * a reload. This keeps the two paths to the same key in step.
 */
export function primeShared(key: string, value: unknown): void {
  mirror.set(key, value);
}

export function getShared<T>(key: string, fallback: T): T {
  const v = mirror.get(key);
  return v === undefined || v === null ? fallback : (v as T);
}

/** Update the mirror now; persist in the background. */
export function setShared(key: string, value: unknown): void {
  mirror.set(key, value);
  void saveState(key, value).then((res) => {
    if (res.ok) errors.delete(key);
    else errors.set(key, res.error);
  });
}

/** Last save error for a key, so a screen can tell the operator. */
export const sharedError = (key: string): string | null => errors.get(key) ?? null;

export const anySharedError = (): string | null =>
  errors.size > 0 ? [...errors.values()][0]! : null;

async function pull(key: string, fallback: unknown): Promise<void> {
  const got = await loadState(key, fallback);
  mirror.set(key, got.value);
  if (got.error) errors.set(key, got.error);
  else errors.delete(key);
}

/**
 * Load every shared document the panel needs before screens read it.
 *
 * Layouts are keyed per project, so projects are fetched first and their slugs
 * drive the second round. That is an N+1, but N is the number of projects a
 * plotted-development business has — single digits — and it happens once per
 * page load.
 */
export function hydrateSharedState(
  projectsKey: string,
  layoutPrefix: string,
  alsoKeys: string[] = [],
): Promise<void> {
  hydrating ??= runHydration(projectsKey, layoutPrefix, alsoKeys);
  return hydrating;
}

async function runHydration(
  projectsKey: string,
  layoutPrefix: string,
  alsoKeys: string[],
): Promise<void> {
  // Projects first — their slugs decide which layouts to fetch. Everything
  // else is independent, so it rides along in the same round trip.
  await Promise.all([pull(projectsKey, null), ...alsoKeys.map((k) => pull(k, null))]);

  const projects = getShared<{ id?: string; name?: string }[]>(projectsKey, []);
  const slugs = (Array.isArray(projects) ? projects : [])
    .map((p) => p?.id)
    .filter((id): id is string => typeof id === 'string' && id.length > 0);

  await Promise.all(slugs.map((slug) => pull(layoutPrefix + slug, null)));
  hydrated = true;
}

/**
 * Pull one layout on demand — for a project whose slug was not in the list at
 * hydration time (just created, or opened straight from a URL).
 */
export async function ensureShared(key: string): Promise<void> {
  if (mirror.has(key)) return;
  await pull(key, null);
}
