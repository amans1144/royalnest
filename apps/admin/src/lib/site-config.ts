/**
 * Where the public website lives.
 *
 * Its own module so the data layer does not have to import it from
 * lib/layouts: layouts now reads shared state, shared state uses remote-store,
 * and remote-store needs this URL — importing it from layouts closed that into
 * a cycle (layouts → shared-state → remote-store → layouts).
 *
 * Baked in at admin build time, so changing it needs a rebuild, not a restart.
 */
export const WEBSITE_URL = process.env.NEXT_PUBLIC_WEBSITE_URL ?? 'http://localhost:3000';
