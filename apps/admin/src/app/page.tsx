'use client';

import Link from 'next/link';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PLOT_STATUS_COLOR, PLOT_STATUS_LABEL, type PlotStatus } from '@spb/types';
import { Shell } from '../components/shell';
import { Up, Down } from '../components/icons';
import { formatINR, formatCompactINR } from '../lib/mock';
import { useLiveData, formatDate } from '../lib/live-data';
import { ACTION_STYLE, relativeTime } from '../lib/activity';

const STATUSES: PlotStatus[] = ['AVAILABLE', 'RESERVED', 'BOOKED', 'SOLD', 'BLOCKED'];

const statusPill: Record<string, string> = {
  Confirmed: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  Agreement: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
  Reserved: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  Registered: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
};

export default function DashboardPage() {
  const d = useLiveData();

  const pieData = STATUSES.map((s) => ({
    name: PLOT_STATUS_LABEL[s],
    value: d.counts[s],
    color: PLOT_STATUS_COLOR[s],
  })).filter((x) => x.value > 0);

  const hasLeads = d.leadsBySource.some((s) => s.count > 0);
  const hasTrend = d.monthly.some((m) => m.revenue > 0 || m.bookings > 0);

  return (
    <Shell title="Dashboard">
      {d.loading ? (
        <div className="grid min-h-[50vh] place-items-center">
          <span className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <>
          {!d.hasAnyData && (
            <div className="mb-5 rounded-2xl border border-dashed border-border bg-card px-6 py-8 text-center">
              <h2 className="font-semibold">No data yet</h2>
              <p className="mx-auto mt-1.5 max-w-lg text-sm text-muted-foreground">
                Every figure below is calculated from your real records — there is no sample data.
                Trace plots in the{' '}
                <Link href="/plots/editor" className="font-medium text-primary hover:underline">
                  Plot Editor
                </Link>
                , then add{' '}
                <Link href="/leads" className="font-medium text-primary hover:underline">
                  leads
                </Link>{' '}
                and{' '}
                <Link href="/bookings" className="font-medium text-primary hover:underline">
                  bookings
                </Link>{' '}
                to bring this dashboard to life.
              </p>
            </div>
          )}

          {/* KPI row */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi
              label="Booked Revenue"
              value={formatINR(d.totals.revenue)}
              delta={d.deltas.revenue}
              hint="Confirmed, agreement & registered"
            />
            <Kpi
              label="Bookings"
              value={String(d.totals.bookings)}
              delta={d.deltas.bookings}
              hint="All statuses"
            />
            <Kpi
              label="Available Plots"
              value={String(d.totals.available)}
              hint={`of ${d.totals.plots} traced`}
            />
            <Kpi
              label="Lead → Booking"
              value={`${d.totals.conversion}%`}
              delta={d.deltas.leads}
              hint={`${d.totals.leads} leads captured`}
            />
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-3">
            {/* Trend */}
            <Card className="lg:col-span-2" title="Revenue & Bookings" note="Last 7 months">
              {hasTrend ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={d.monthly} margin={{ left: -12, right: 8, top: 8 }}>
                    <defs>
                      <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => formatCompactINR(Number(v))} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v, n) => (n === 'revenue' ? [formatINR(Number(v)), 'Revenue'] : [v, 'Bookings'])}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#gRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <Empty>No bookings recorded yet — the trend fills in as bookings are added.</Empty>
              )}
            </Card>

            {/* Plot status */}
            <Card title="Plot Status" note={`${d.totals.plots} plots`}>
              {pieData.length ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82} paddingAngle={2}>
                        {pieData.map((e) => <Cell key={e.name} fill={e.color} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                  <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                    {STATUSES.map((s) => (
                      <li key={s} className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: PLOT_STATUS_COLOR[s] }} />
                        <span className="text-muted-foreground">{PLOT_STATUS_LABEL[s]}</span>
                        <span className="ml-auto font-semibold tabular-nums">{d.counts[s]}</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <Empty>
                  No plots traced yet.{' '}
                  <Link href="/plots/editor" className="font-medium text-primary hover:underline">
                    Open the Plot Editor
                  </Link>
                </Empty>
              )}
            </Card>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-3">
            {/* Recent bookings */}
            <Card className="lg:col-span-2" title="Recent Bookings" note={`${d.totals.bookings} total`}>
              {d.recentBookings.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                        <th className="py-2.5 pr-4 font-medium">Booking</th>
                        <th className="py-2.5 pr-4 font-medium">Customer</th>
                        <th className="py-2.5 pr-4 font-medium">Plot</th>
                        <th className="py-2.5 pr-4 text-right font-medium">Amount</th>
                        <th className="py-2.5 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.recentBookings.map((b) => (
                        <tr key={b.id} className="border-b border-border/60 last:border-0">
                          <td className="py-2.5 pr-4">
                            <div className="font-medium">{b.id}</div>
                            <div className="text-xs text-muted-foreground">{formatDate(b.date)}</div>
                          </td>
                          <td className="py-2.5 pr-4">
                            <div className="font-medium">{b.customer}</div>
                            <div className="text-xs text-muted-foreground">{b.project}</div>
                          </td>
                          <td className="py-2.5 pr-4 text-muted-foreground">{b.plot || '—'}</td>
                          <td className="py-2.5 pr-4 text-right font-semibold">{formatINR(b.amount)}</td>
                          <td className="py-2.5">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusPill[b.status] ?? 'bg-muted'}`}>
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty>
                  No bookings yet.{' '}
                  <Link href="/bookings" className="font-medium text-primary hover:underline">
                    Add the first one
                  </Link>
                </Empty>
              )}
            </Card>

            {/* Leads by source */}
            <Card title="Leads by Source" note={`${d.totals.leads} leads`}>
              {hasLeads ? (
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={d.leadsBySource} margin={{ left: -20, right: 8, top: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="source" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} interval={0} angle={-25} textAnchor="end" height={60} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Empty>
                  No leads captured yet.{' '}
                  <Link href="/leads" className="font-medium text-primary hover:underline">
                    Add a lead
                  </Link>
                </Empty>
              )}
            </Card>
          </div>

          {/* Activity */}
          <Card className="mt-5" title="Latest Activity" note="Live audit trail">
            {d.activity.length ? (
              <ul className="grid gap-2.5">
                {d.activity.slice(0, 6).map((a) => {
                  const s = ACTION_STYLE[a.action];
                  return (
                    <li key={a.id} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                      <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase ${s.className}`}>
                        {s.label}
                      </span>
                      <span className="text-xs text-muted-foreground">{a.entity}</span>
                      <span className="font-medium">{a.label}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {a.actorName} · {relativeTime(a.at)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <Empty>No activity recorded yet.</Empty>
            )}
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

function Card({
  title, note, children, className = '',
}: { title: string; note?: string; children: React.ReactNode; className?: string }) {
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
    <div className="grid min-h-[180px] place-items-center px-4 text-center text-sm text-muted-foreground">
      <p>{children}</p>
    </div>
  );
}

function Kpi({
  label, value, delta, hint,
}: { label: string; value: string; delta?: number | null; hint?: string }) {
  const up = (delta ?? 0) >= 0;
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 text-3xl font-semibold tabular-nums">{value}</div>
      <div className="mt-1.5 flex items-center gap-1.5 text-xs">
        {delta === null || delta === undefined ? (
          <span className="text-muted-foreground">{hint}</span>
        ) : (
          <>
            <span className={`inline-flex items-center gap-0.5 font-medium ${up ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {up ? <Up width={12} height={12} /> : <Down width={12} height={12} />}
              {Math.abs(delta)}%
            </span>
            <span className="text-muted-foreground">vs last month</span>
          </>
        )}
      </div>
    </div>
  );
}
