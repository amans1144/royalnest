/**
 * Shared formatting helpers for the admin console.
 *
 * The demo datasets that used to live here (KPIs, sales trend, seeded
 * bookings/leads/projects) have been removed — every screen now derives its
 * numbers from real stores via `lib/live-data`. A fresh install starts empty.
 */

export const formatINR = (n: number): string => {
  if (!Number.isFinite(n)) return '₹0';
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2).replace(/\.00$/, '')} Cr`;
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(1).replace(/\.0$/, '')} L`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
};

/** Compact number for axis ticks — 12.5L, 3.2Cr, 8400. */
export const formatCompactINR = (n: number): string => {
  if (n >= 1_00_00_000) return `${(n / 1_00_00_000).toFixed(1)}Cr`;
  if (n >= 1_00_000) return `${(n / 1_00_000).toFixed(1)}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
  return String(Math.round(n));
};

/** The one project the admin ships configured for. Users can add more. */
export const adminProjects = [
  {
    name: 'Liberty Imperial Greens',
    city: 'Lucknow',
    type: 'Plotted',
    total: 0,
    sold: 0,
    available: 0,
    revenue: 0,
    status: 'Ongoing',
  },
];
