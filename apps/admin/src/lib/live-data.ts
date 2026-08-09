'use client';

import { useCallback, useEffect, useState } from 'react';
import { priceWithPlc, type PlotStatus } from '@spb/types';
import { readLayout, type StoredPlot } from './layouts';
import { readProjects, slugify, type AdminProject } from './projects';
import { readActivity, type ActivityEntry } from './activity';

/**
 * Everything the Dashboard and Reports render is derived here from the same
 * stores the rest of the admin writes to — projects, traced plot layouts,
 * bookings and leads. Nothing is mocked: an empty admin produces zeroes, and
 * the moment a plot is traced or a booking added the numbers move.
 */

export const BOOKINGS_KEY = 'rnr_bookings';
export const LEADS_KEY = 'rnr_leads';

export interface Booking {
  id: string;
  customer: string;
  project: string;
  plot: string;
  amount: number;
  status: string;
  /** ISO yyyy-mm-dd. Legacy rows may hold a display label; see parseDate. */
  date: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  source: string;
  budget: string;
  status: string;
  priority: string;
  assignee: string;
  date: string;
}

export const BOOKING_STATUSES = ['Reserved', 'Confirmed', 'Agreement', 'Registered'];
export const LEAD_STATUSES = ['New', 'Contacted', 'Qualified', 'Site Visit', 'Negotiation'];
export const LEAD_SOURCES = ['Website', 'WhatsApp', 'Google Ads', 'Facebook', 'Referral', 'Walk-in'];

/** Statuses that represent money actually committed. */
const REVENUE_STATUSES = new Set(['Confirmed', 'Agreement', 'Registered']);

export const todayISO = () => new Date().toISOString().slice(0, 10);

/** Tolerates ISO dates and the older "Jul 21" display labels. */
export function parseDate(v: string): Date | null {
  if (!v) return null;
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T00:00:00` : v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export const formatDate = (v: string): string => {
  const d = parseDate(v);
  return d ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : v;
};

function readList<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    const list = raw ? (JSON.parse(raw) as T[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export interface ProjectRollup extends AdminProject {
  slug: string;
  /** Plots actually traced in the layout editor for this project. */
  plots: StoredPlot[];
  counts: Record<PlotStatus, number>;
  tracedTotal: number;
  /** Sum of base + PLC across every traced plot. */
  inventoryValue: number;
  soldValue: number;
  areaSqFt: number;
  bookings: Booking[];
  bookedValue: number;
}

export interface LiveData {
  loading: boolean;
  projects: ProjectRollup[];
  plots: StoredPlot[];
  bookings: Booking[];
  leads: Lead[];
  activity: ActivityEntry[];
  counts: Record<PlotStatus, number>;
  totals: {
    revenue: number;
    bookings: number;
    plots: number;
    available: number;
    sold: number;
    inventoryValue: number;
    areaSqFt: number;
    leads: number;
    conversion: number;
  };
  deltas: { revenue: number | null; bookings: number | null; leads: number | null };
  monthly: { month: string; revenue: number; bookings: number; leads: number }[];
  leadsBySource: { source: string; count: number }[];
  leadsByStatus: { status: string; count: number }[];
  bookingsByStatus: { status: string; count: number; value: number }[];
  recentBookings: Booking[];
  hasAnyData: boolean;
}

const ZERO_COUNTS: Record<PlotStatus, number> = {
  AVAILABLE: 0,
  RESERVED: 0,
  BOOKED: 0,
  SOLD: 0,
  BLOCKED: 0,
};

/** Last `n` calendar months, oldest first. */
function monthBuckets(n = 7) {
  const out: { key: string; month: string; start: Date; end: Date }[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    out.push({
      key: `${start.getFullYear()}-${start.getMonth()}`,
      month: start.toLocaleDateString('en-IN', { month: 'short' }),
      start,
      end,
    });
  }
  return out;
}

/** null = no meaningful comparison (nothing last month to measure against). */
const pctChange = (curr: number, prev: number): number | null => {
  if (prev === 0) return null;
  return Number((((curr - prev) / prev) * 100).toFixed(1));
};

export function computeLiveData(): Omit<LiveData, 'loading'> {
  const rawProjects = readProjects();
  const bookings = readList<Booking>(BOOKINGS_KEY);
  const leads = readList<Lead>(LEADS_KEY);
  const activity = readActivity();

  const projects: ProjectRollup[] = rawProjects.map((p) => {
    const slug = slugify(p.name);
    const plots = readLayout(slug).plots;
    const counts = { ...ZERO_COUNTS };
    let inventoryValue = 0;
    let soldValue = 0;
    let areaSqFt = 0;
    for (const plot of plots) {
      counts[plot.status] = (counts[plot.status] ?? 0) + 1;
      const value = priceWithPlc(plot.price || 0, plot);
      inventoryValue += value;
      areaSqFt += plot.area || 0;
      if (plot.status === 'SOLD' || plot.status === 'BOOKED') soldValue += value;
    }
    const projectBookings = bookings.filter((b) => b.project === p.name);
    return {
      ...p,
      slug,
      plots,
      counts,
      tracedTotal: plots.length,
      inventoryValue,
      soldValue,
      areaSqFt,
      bookings: projectBookings,
      bookedValue: projectBookings.reduce((s, b) => s + (b.amount || 0), 0),
    };
  });

  const plots = projects.flatMap((p) => p.plots);
  const counts = projects.reduce(
    (acc, p) => {
      for (const k of Object.keys(acc) as PlotStatus[]) acc[k] += p.counts[k];
      return acc;
    },
    { ...ZERO_COUNTS },
  );

  const revenue = bookings
    .filter((b) => REVENUE_STATUSES.has(b.status))
    .reduce((s, b) => s + (b.amount || 0), 0);

  const inventoryValue = projects.reduce((s, p) => s + p.inventoryValue, 0);
  const areaSqFt = projects.reduce((s, p) => s + p.areaSqFt, 0);

  // ── time series ──
  const buckets = monthBuckets(7);
  const inBucket = (v: string, b: { start: Date; end: Date }) => {
    const d = parseDate(v);
    return !!d && d >= b.start && d < b.end;
  };
  const monthly = buckets.map((b) => ({
    month: b.month,
    revenue: bookings
      .filter((x) => REVENUE_STATUSES.has(x.status) && inBucket(x.date, b))
      .reduce((s, x) => s + (x.amount || 0), 0),
    bookings: bookings.filter((x) => inBucket(x.date, b)).length,
    leads: leads.filter((x) => inBucket(x.date, b)).length,
  }));

  const thisMonth = monthly[monthly.length - 1];
  const lastMonth = monthly[monthly.length - 2];
  const deltas = {
    revenue: thisMonth && lastMonth ? pctChange(thisMonth.revenue, lastMonth.revenue) : null,
    bookings: thisMonth && lastMonth ? pctChange(thisMonth.bookings, lastMonth.bookings) : null,
    leads: thisMonth && lastMonth ? pctChange(thisMonth.leads, lastMonth.leads) : null,
  };

  const tally = <T,>(rows: T[], pick: (r: T) => string, keys: string[]) => {
    const m = new Map<string, number>();
    for (const r of rows) {
      const k = pick(r);
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    // known keys first (stable ordering), then anything unexpected
    const extra = [...m.keys()].filter((k) => !keys.includes(k));
    return [...keys, ...extra].map((k) => ({ key: k, count: m.get(k) ?? 0 }));
  };

  const leadsBySource = tally(leads, (l) => l.source, LEAD_SOURCES).map((r) => ({
    source: r.key,
    count: r.count,
  }));
  const leadsByStatus = tally(leads, (l) => l.status, LEAD_STATUSES).map((r) => ({
    status: r.key,
    count: r.count,
  }));
  const bookingsByStatus = tally(bookings, (b) => b.status, BOOKING_STATUSES).map((r) => ({
    status: r.key,
    count: r.count,
    value: bookings.filter((b) => b.status === r.key).reduce((s, b) => s + (b.amount || 0), 0),
  }));

  const recentBookings = [...bookings]
    .sort((a, b) => (parseDate(b.date)?.getTime() ?? 0) - (parseDate(a.date)?.getTime() ?? 0))
    .slice(0, 6);

  return {
    projects,
    plots,
    bookings,
    leads,
    activity,
    counts,
    totals: {
      revenue,
      bookings: bookings.length,
      plots: plots.length,
      available: counts.AVAILABLE,
      sold: counts.SOLD,
      inventoryValue,
      areaSqFt,
      leads: leads.length,
      conversion: leads.length ? Number(((bookings.length / leads.length) * 100).toFixed(1)) : 0,
    },
    deltas,
    monthly,
    leadsBySource,
    leadsByStatus,
    bookingsByStatus,
    recentBookings,
    hasAnyData: plots.length > 0 || bookings.length > 0 || leads.length > 0,
  };
}

const EMPTY = (): Omit<LiveData, 'loading'> => ({
  projects: [],
  plots: [],
  bookings: [],
  leads: [],
  activity: [],
  counts: { ...ZERO_COUNTS },
  totals: {
    revenue: 0, bookings: 0, plots: 0, available: 0, sold: 0,
    inventoryValue: 0, areaSqFt: 0, leads: 0, conversion: 0,
  },
  deltas: { revenue: null, bookings: null, leads: null },
  monthly: monthBuckets(7).map((b) => ({ month: b.month, revenue: 0, bookings: 0, leads: 0 })),
  leadsBySource: LEAD_SOURCES.map((source) => ({ source, count: 0 })),
  leadsByStatus: LEAD_STATUSES.map((status) => ({ status, count: 0 })),
  bookingsByStatus: BOOKING_STATUSES.map((status) => ({ status, count: 0, value: 0 })),
  recentBookings: [],
  hasAnyData: false,
});

/**
 * Live view of every derived metric. Recomputes when another tab writes, when
 * this tab regains focus, and on a slow interval so a second window editing
 * plots shows up here without a manual refresh.
 */
export function useLiveData(pollMs = 5000): LiveData {
  const [data, setData] = useState<Omit<LiveData, 'loading'>>(EMPTY);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setData(computeLiveData());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, pollMs);
    window.addEventListener('focus', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      clearInterval(id);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [refresh, pollMs]);

  return { ...data, loading };
}
