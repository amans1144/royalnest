'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PLOT_STATUS_COLOR, PLOT_STATUS_LABEL, appliedPlc, plcPercent, priceWithPlc, type PlotStatus } from '@spb/types';
import { Shell } from '../../components/shell';
import { formatINR, formatCompactINR } from '../../lib/mock';
import { useLiveData, formatDate, parseDate } from '../../lib/live-data';

const STATUSES: PlotStatus[] = ['AVAILABLE', 'RESERVED', 'BOOKED', 'SOLD', 'BLOCKED'];

type Range = '3m' | '6m' | '12m' | 'all';
const RANGES: { key: Range; label: string; months: number | null }[] = [
  { key: '3m', label: 'Last 3 months', months: 3 },
  { key: '6m', label: 'Last 6 months', months: 6 },
  { key: '12m', label: 'Last 12 months', months: 12 },
  { key: 'all', label: 'All time', months: null },
];

export default function ReportsPage() {
  const d = useLiveData();
  const [range, setRange] = useState<Range>('6m');
  const [project, setProject] = useState('ALL');

  const since = useMemo(() => {
    const m = RANGES.find((r) => r.key === range)?.months;
    if (!m) return null;
    const dt = new Date();
    dt.setMonth(dt.getMonth() - m);
    return dt;
  }, [range]);

  const bookings = useMemo(
    () =>
      d.bookings.filter((b) => {
        if (project !== 'ALL' && b.project !== project) return false;
        if (!since) return true;
        const dt = parseDate(b.date);
        return !!dt && dt >= since;
      }),
    [d.bookings, project, since],
  );

  const leads = useMemo(
    () =>
      d.leads.filter((l) => {
        if (!since) return true;
        const dt = parseDate(l.date);
        return !!dt && dt >= since;
      }),
    [d.leads, since],
  );

  const projectsShown = project === 'ALL' ? d.projects : d.projects.filter((p) => p.name === project);

  const revenue = bookings
    .filter((b) => b.status !== 'Reserved')
    .reduce((s, b) => s + (b.amount || 0), 0);
  const avgTicket = bookings.length ? revenue / bookings.filter((b) => b.status !== 'Reserved').length || 0 : 0;

  const monthly = useMemo(() => {
    const months = RANGES.find((r) => r.key === range)?.months ?? 12;
    return d.monthly.slice(-Math.min(months, d.monthly.length));
  }, [d.monthly, range]);

  // Inventory value per project, split sold vs remaining.
  const byProject = projectsShown.map((p) => ({
    name: p.name.length > 22 ? `${p.name.slice(0, 21)}…` : p.name,
    sold: p.soldValue,
    available: Math.max(0, p.inventoryValue - p.soldValue),
    plots: p.tracedTotal,
  }));

  const plots = projectsShown.flatMap((p) => p.plots);
  const plcPlots = plots.filter((p) => plcPercent(p) > 0);
  const plcUplift = plcPlots.reduce((s, p) => s + (priceWithPlc(p.price, p) - p.price), 0);

  const funnel = [
    { stage: 'Leads', value: leads.length },
    { stage: 'Qualified', value: leads.filter((l) => ['Qualified', 'Site Visit', 'Negotiation'].includes(l.status)).length },
    { stage: 'Site Visits', value: leads.filter((l) => ['Site Visit', 'Negotiation'].includes(l.status)).length },
    { stage: 'Bookings', value: bookings.length },
    { stage: 'Registered', value: bookings.filter((b) => b.status === 'Registered').length },
  ];

  const exportCsv = (name: string, rows: (string | number)[][]) => {
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportInventory = () =>
    exportCsv('plot-inventory', [
      ['Project', 'Plot', 'Area (sq.ft)', 'Facing', 'PLC', 'PLC %', 'Base (₹)', 'Total (₹)', 'Status'],
      ...projectsShown.flatMap((p) =>
        p.plots.map((x) => [
          p.name, x.number, x.area, x.facing,
          appliedPlc(x).map((c) => c.short).join(' + ') || '—',
          plcPercent(x), x.price, priceWithPlc(x.price, x), PLOT_STATUS_LABEL[x.status],
        ]),
      ),
    ]);

  const exportBookings = () =>
    exportCsv('bookings', [
      ['Booking', 'Date', 'Customer', 'Project', 'Plot', 'Amount (₹)', 'Status'],
      ...bookings.map((b) => [b.id, formatDate(b.date), b.customer, b.project, b.plot, b.amount, b.status]),
    ]);

  const exportLeads = () =>
    exportCsv('leads', [
      ['Name', 'Phone', 'Source', 'Budget', 'Status', 'Priority', 'Assignee', 'Date'],
      ...leads.map((l) => [l.name, l.phone, l.source, l.budget, l.status, l.priority, l.assignee, formatDate(l.date)]),
    ]);

  const pill = (active: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
      active ? 'border-foreground bg-foreground text-background' : 'border-border hover:bg-accent'
    }`;

  return (
    <Shell title="Reports">
      {d.loading ? (
        <div className="grid min-h-[50vh] place-items-center">
          <span className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="mb-5 flex flex-wrap items-center gap-2">
            {RANGES.map((r) => (
              <button key={r.key} onClick={() => setRange(r.key)} className={pill(range === r.key)}>
                {r.label}
              </button>
            ))}
            <select
              value={project}
              onChange={(e) => setProject(e.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="ALL">All projects</option>
              {d.projects.map((p) => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
            <div className="ml-auto flex flex-wrap gap-2">
              <button onClick={exportInventory} disabled={!plots.length} className="rounded-xl border border-border px-3 py-2 text-sm hover:bg-accent disabled:opacity-40">
                Export inventory
              </button>
              <button onClick={exportBookings} disabled={!bookings.length} className="rounded-xl border border-border px-3 py-2 text-sm hover:bg-accent disabled:opacity-40">
                Export bookings
              </button>
              <button onClick={exportLeads} disabled={!leads.length} className="rounded-xl border border-border px-3 py-2 text-sm hover:bg-accent disabled:opacity-40">
                Export leads
              </button>
            </div>
          </div>

          {!d.hasAnyData && (
            <div className="mb-5 rounded-2xl border border-dashed border-border bg-card px-6 py-8 text-center">
              <h2 className="font-semibold">Nothing to report yet</h2>
              <p className="mx-auto mt-1.5 max-w-lg text-sm text-muted-foreground">
                These reports read your live records only. Trace plots in the{' '}
                <Link href="/plots/editor" className="font-medium text-primary hover:underline">Plot Editor</Link>{' '}
                and add bookings and leads — every figure here updates automatically.
              </p>
            </div>
          )}

          {/* Summary */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Revenue" value={formatINR(revenue)} hint={`${bookings.length} bookings in range`} />
            <Stat label="Avg. booking value" value={formatINR(avgTicket || 0)} hint="Excludes reserved" />
            <Stat label="Inventory value" value={formatINR(projectsShown.reduce((s, p) => s + p.inventoryValue, 0))} hint={`${plots.length} plots · ${plots.reduce((s, p) => s + (p.area || 0), 0).toLocaleString('en-IN')} sq.ft`} />
            <Stat label="PLC uplift" value={formatINR(plcUplift)} hint={`${plcPlots.length} of ${plots.length} plots carry PLC`} />
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <Card title="Revenue trend" note={RANGES.find((r) => r.key === range)?.label}>
              {monthly.some((m) => m.revenue > 0) ? (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={monthly} margin={{ left: -10, right: 8, top: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => formatCompactINR(Number(v))} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatINR(Number(v))} />
                    <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <Empty>No revenue in this range.</Empty>}
            </Card>

            <Card title="Leads vs bookings" note="Monthly">
              {monthly.some((m) => m.leads > 0 || m.bookings > 0) ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={monthly} margin={{ left: -20, right: 8, top: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="leads" name="Leads" fill="hsl(var(--muted-foreground))" radius={[5, 5, 0, 0]} />
                    <Bar dataKey="bookings" name="Bookings" fill="hsl(var(--primary))" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <Empty>No leads or bookings in this range.</Empty>}
            </Card>

            <Card title="Inventory value by project" note="Sold vs remaining">
              {byProject.some((p) => p.sold + p.available > 0) ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={byProject} layout="vertical" margin={{ left: 10, right: 12, top: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => formatCompactINR(Number(v))} />
                    <YAxis type="category" dataKey="name" width={130} stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatINR(Number(v))} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="sold" name="Sold / booked" stackId="a" fill={PLOT_STATUS_COLOR.SOLD} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="available" name="Remaining" stackId="a" fill={PLOT_STATUS_COLOR.AVAILABLE} radius={[0, 5, 5, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <Empty>No plots traced yet.</Empty>}
            </Card>

            <Card title="Sales funnel" note="Leads through to registry">
              {(funnel[0]?.value ?? 0) || (funnel[3]?.value ?? 0) ? (
                <ul className="grid gap-3 py-2">
                  {funnel.map((f, i) => {
                    const max = Math.max(...funnel.map((x) => x.value), 1);
                    const prev = i > 0 ? funnel[i - 1]!.value : null;
                    const rate = prev && prev > 0 ? Math.round((f.value / prev) * 100) : null;
                    return (
                      <li key={f.stage}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{f.stage}</span>
                          <span className="tabular-nums">
                            {f.value}
                            {rate !== null && <span className="ml-2 text-xs text-muted-foreground">{rate}%</span>}
                          </span>
                        </div>
                        <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(f.value / max) * 100}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : <Empty>No leads or bookings yet.</Empty>}
            </Card>
          </div>

          {/* Per-project table */}
          <Card className="mt-5" title="Project performance" note={`${projectsShown.length} project${projectsShown.length === 1 ? '' : 's'}`}>
            {projectsShown.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="py-2.5 pr-4 font-medium">Project</th>
                      <th className="py-2.5 pr-4 text-right font-medium">Plots</th>
                      {STATUSES.map((s) => (
                        <th key={s} className="py-2.5 pr-4 text-right font-medium">{PLOT_STATUS_LABEL[s]}</th>
                      ))}
                      <th className="py-2.5 pr-4 text-right font-medium">Inventory</th>
                      <th className="py-2.5 text-right font-medium">Booked</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectsShown.map((p) => (
                      <tr key={p.id} className="border-b border-border/60 last:border-0">
                        <td className="py-2.5 pr-4 font-medium">{p.name}</td>
                        <td className="py-2.5 pr-4 text-right tabular-nums">{p.tracedTotal}</td>
                        {STATUSES.map((s) => (
                          <td key={s} className="py-2.5 pr-4 text-right tabular-nums text-muted-foreground">{p.counts[s]}</td>
                        ))}
                        <td className="py-2.5 pr-4 text-right font-semibold tabular-nums">{formatINR(p.inventoryValue)}</td>
                        <td className="py-2.5 text-right tabular-nums">{formatINR(p.bookedValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <Empty>No projects yet.</Empty>}
          </Card>
        </>
      )}
    </Shell>
  );
}

const tooltipStyle = {
  background: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 12,
  fontSize: 13,
  color: 'hsl(var(--foreground))',
};

function Card({ title, note, children, className = '' }: { title: string; note?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-5 ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
        {note && <span className="text-xs text-muted-foreground">{note}</span>}
      </div>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-[200px] place-items-center px-4 text-center text-sm text-muted-foreground">
      <p>{children}</p>
    </div>
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
