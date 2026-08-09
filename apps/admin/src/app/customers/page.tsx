'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Shell } from '../../components/shell';
import { formatINR } from '../../lib/mock';
import { useLiveData, formatDate, parseDate, type Booking } from '../../lib/live-data';

/**
 * Customers aren't a separate store — a customer *is* whoever appears on a
 * booking. Deriving the directory keeps it permanently in sync instead of
 * needing a parallel list that drifts.
 */
interface Customer {
  name: string;
  bookings: Booking[];
  projects: string[];
  plots: string[];
  total: number;
  latest: string;
  statuses: string[];
}

const statusPill: Record<string, string> = {
  Confirmed: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  Agreement: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
  Reserved: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  Registered: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
};

export default function CustomersPage() {
  const d = useLiveData();
  const [query, setQuery] = useState('');

  const customers = useMemo<Customer[]>(() => {
    const map = new Map<string, Booking[]>();
    for (const b of d.bookings) {
      const key = b.customer.trim();
      if (!key) continue;
      map.set(key, [...(map.get(key) ?? []), b]);
    }
    return [...map.entries()]
      .map(([name, bookings]) => ({
        name,
        bookings,
        projects: [...new Set(bookings.map((b) => b.project).filter(Boolean))],
        plots: [...new Set(bookings.map((b) => b.plot).filter(Boolean))],
        total: bookings.reduce((s, b) => s + (b.amount || 0), 0),
        latest: bookings
          .map((b) => b.date)
          .sort((a, b) => (parseDate(b)?.getTime() ?? 0) - (parseDate(a)?.getTime() ?? 0))[0] ?? '',
        statuses: [...new Set(bookings.map((b) => b.status))],
      }))
      .sort((a, b) => b.total - a.total);
  }, [d.bookings]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.projects.some((p) => p.toLowerCase().includes(q)) ||
        c.plots.some((p) => p.toLowerCase().includes(q)),
    );
  }, [customers, query]);

  const repeat = customers.filter((c) => c.bookings.length > 1).length;
  const totalValue = customers.reduce((s, c) => s + c.total, 0);

  return (
    <Shell title="Customers">
      {d.loading ? (
        <div className="grid min-h-[50vh] place-items-center">
          <span className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : customers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-8 py-16 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-2xl text-primary">
            👥
          </div>
          <h3 className="mt-4 font-semibold">No customers yet</h3>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
            This directory is built from your bookings — add a booking and the customer appears
            here automatically, with their plots and total value.
          </p>
          <Link
            href="/bookings"
            className="mt-5 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Go to Bookings
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-5 grid gap-4 sm:grid-cols-3">
            <Stat label="Customers" value={String(customers.length)} />
            <Stat label="Repeat buyers" value={String(repeat)} hint="More than one booking" />
            <Stat label="Total booked value" value={formatINR(totalValue)} />
          </div>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, project or plot…"
              className="w-64 rounded-xl border border-border bg-background px-3.5 py-2 text-sm outline-none focus:border-primary"
            />
            <p className="text-sm text-muted-foreground">
              Showing <b className="text-foreground">{shown.length}</b> of {customers.length}
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Customer</th>
                    <th className="px-5 py-3 font-medium">Project(s)</th>
                    <th className="px-5 py-3 font-medium">Plot(s)</th>
                    <th className="px-5 py-3 text-right font-medium">Bookings</th>
                    <th className="px-5 py-3 text-right font-medium">Total value</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Latest</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((c) => (
                    <tr key={c.name} className="border-b border-border/60 last:border-0 hover:bg-accent/40">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                            {c.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                          </span>
                          <span className="font-medium">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{c.projects.join(', ') || '—'}</td>
                      <td className="px-5 py-3 text-muted-foreground">{c.plots.join(', ') || '—'}</td>
                      <td className="px-5 py-3 text-right tabular-nums">{c.bookings.length}</td>
                      <td className="px-5 py-3 text-right font-semibold tabular-nums">{formatINR(c.total)}</td>
                      <td className="px-5 py-3">
                        <span className="flex flex-wrap gap-1">
                          {c.statuses.map((s) => (
                            <span key={s} className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusPill[s] ?? 'bg-muted'}`}>
                              {s}
                            </span>
                          ))}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{formatDate(c.latest)}</td>
                    </tr>
                  ))}
                  {shown.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-10 text-center text-sm text-muted-foreground">
                        No customers match that search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </Shell>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      {hint && <div className="mt-1.5 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
