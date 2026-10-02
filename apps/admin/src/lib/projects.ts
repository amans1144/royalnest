'use client';

import { adminProjects } from './mock';
import { getShared } from './shared-state';

/** Shared project model + store helpers, used by the Projects page, the plot
 * editor, and the booking/lead forms so a newly-added project shows everywhere. */
export type AdminProject = {
  id: string;
  name: string;
  city: string;
  type: string;
  status: string;
  /** Legacy counters. No longer written — plot counts, availability and revenue
   *  are derived from the traced layout and real bookings (see lib/live-data). */
  total?: number;
  sold?: number;
  available?: number;
  revenue?: number;
};

/** Bumped to _v2 when the demo projects were replaced by Liberty Imperial
 *  Greens — the old key holds a stale seed in already-visited browsers. */
export const PROJECTS_KEY = 'rnr_projects_v2';

export const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Seed used until the user edits the list (ids are stable slugs so seeded
 * projects match the public website's plot-map slugs). */
export const PROJECT_SEED: AdminProject[] = adminProjects.map((p) => ({
  ...p,
  id: slugify(p.name),
}));

/**
 * Read the current projects.
 *
 * Reads the shared mirror (see lib/shared-state), which the Shell hydrates from
 * the website before any screen renders — so this is the same list on every
 * admin's machine. Still synchronous, so every existing call site is unchanged.
 */
export function readProjects(): AdminProject[] {
  if (typeof window === 'undefined') return PROJECT_SEED;
  const list = getShared<AdminProject[] | null>(PROJECTS_KEY, null);
  return Array.isArray(list) && list.length > 0 ? list : PROJECT_SEED;
}

/** {slug, name} options for the plot editor's project picker. */
export function projectSelectOptions(): { slug: string; name: string }[] {
  return readProjects().map((p) => ({ slug: slugify(p.name), name: p.name }));
}

/** Deterministic seed options for SSR / first paint (no localStorage). */
export const SEED_OPTIONS = PROJECT_SEED.map((p) => ({ slug: p.id, name: p.name }));
