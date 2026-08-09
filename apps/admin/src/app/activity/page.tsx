'use client';

import { useMemo, useState } from 'react';
import { Shell } from '../../components/shell';
import {
  ACTIONS,
  ACTION_STYLE,
  ENTITIES,
  absoluteTime,
  clearActivity,
  fieldLabel,
  groupByDay,
  relativeTime,
  useActivity,
  type ActivityAction,
  type ActivityEntity,
} from '../../lib/activity';

export default function ActivityPage() {
  const { entries, loaded, refresh } = useActivity();
  const [action, setAction] = useState<ActivityAction | 'ALL'>('ALL');
  const [entity, setEntity] = useState<ActivityEntity | 'ALL'>('ALL');
  const [actor, setActor] = useState<string>('ALL');
  const [query, setQuery] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  const actors = useMemo(
    () => [...new Set(entries.map((e) => e.actorName))].sort(),
    [entries],
  );

  const counts = useMemo(() => {
    const c: Partial<Record<ActivityAction, number>> = {};
    for (const e of entries) c[e.action] = (c[e.action] ?? 0) + 1;
    return c;
  }, [entries]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter(
      (e) =>
        (action === 'ALL' || e.action === action) &&
        (entity === 'ALL' || e.entity === entity) &&
        (actor === 'ALL' || e.actorName === actor) &&
        (!q ||
          e.label.toLowerCase().includes(q) ||
          e.actorName.toLowerCase().includes(q) ||
          e.entity.toLowerCase().includes(q) ||
          (e.note ?? '').toLowerCase().includes(q) ||
          (e.changes ?? []).some((c) => c.field.toLowerCase().includes(q))),
    );
  }, [entries, action, entity, actor, query]);

  const groups = useMemo(() => groupByDay(shown), [shown]);

  const exportCsv = () => {
    const rows = [
      ['Timestamp (ISO)', 'Local time', 'Actor', 'Email', 'Role', 'Action', 'Entity', 'Record', 'Project', 'Changes', 'Note'],
      ...shown.map((e) => [
        e.at,
        absoluteTime(e.at),
        e.actorName,
        e.actorEmail,
        e.actorRole,
        e.action,
        e.entity,
        e.label,
        e.project ?? '',
        (e.changes ?? []).map((c) => `${fieldLabel(c.field)}: ${c.from} -> ${c.to}`).join('; '),
        e.note ?? '',
      ]),
    ];
    const csv = rows
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const pill = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
      active ? 'border-foreground bg-foreground text-background' : 'border-border hover:bg-accent'
    }`;

  return (
    <Shell title="Activity Log">
      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <button onClick={() => setAction('ALL')} className={pill(action === 'ALL')}>
          All ({entries.length})
        </button>
        {ACTIONS.map((a) => (
          <button key={a} onClick={() => setAction(action === a ? 'ALL' : a)} className={pill(action === a)}>
            {ACTION_STYLE[a].label} ({counts[a] ?? 0})
          </button>
        ))}

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search record, user, field…"
            className="w-52 rounded-xl border border-border bg-background px-3.5 py-2 text-sm outline-none focus:border-primary"
          />
          <select
            value={entity}
            onChange={(e) => setEntity(e.target.value as ActivityEntity | 'ALL')}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="ALL">All records</option>
            {ENTITIES.map((en) => (
              <option key={en} value={en}>
                {en}
              </option>
            ))}
          </select>
          <select
            value={actor}
            onChange={(e) => setActor(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="ALL">Everyone</option>
            {actors.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <button onClick={refresh} className="rounded-xl border border-border px-3 py-2 text-sm hover:bg-accent">
            Refresh
          </button>
          <button
            onClick={exportCsv}
            disabled={shown.length === 0}
            className="rounded-xl border border-border px-3 py-2 text-sm hover:bg-accent disabled:opacity-40"
          >
            Export CSV
          </button>
          {confirmClear ? (
            <span className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  clearActivity();
                  setConfirmClear(false);
                }}
                className="rounded-xl bg-destructive px-3 py-2 text-sm font-semibold text-destructive-foreground hover:opacity-90"
              >
                Confirm clear
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="rounded-xl border border-border px-3 py-2 text-sm hover:bg-accent"
              >
                Cancel
              </button>
            </span>
          ) : (
            <button
              onClick={() => setConfirmClear(true)}
              disabled={entries.length === 0}
              className="rounded-xl border border-border px-3 py-2 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-40"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {loaded && entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-8 py-16 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-2xl text-primary">
            ⏱
          </div>
          <h3 className="mt-4 font-semibold">No activity recorded yet</h3>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
            Every create, update and delete across projects, plots, bookings and leads is logged
            here with the user who made it and the exact time.
          </p>
        </div>
      ) : shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-8 py-14 text-center text-sm text-muted-foreground">
          No activity matches these filters.
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <section key={g.day}>
              <div className="mb-2.5 flex items-center gap-3">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {g.day}
                </h2>
                <span className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">{g.items.length}</span>
              </div>

              <ul className="overflow-hidden rounded-2xl border border-border bg-card">
                {g.items.map((e) => {
                  const style = ACTION_STYLE[e.action];
                  return (
                    <li
                      key={e.id}
                      className="flex gap-4 border-b border-border/60 px-5 py-3.5 last:border-0 hover:bg-accent/40"
                    >
                      {/* Actor avatar */}
                      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                        {e.actorName
                          .split(' ')
                          .map((w) => w[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide ${style.className}`}>
                            {style.label}
                          </span>
                          <span className="text-xs font-medium text-muted-foreground">{e.entity}</span>
                          <span className="font-semibold">{e.label}</span>
                          {e.project && (
                            <span className="text-xs text-muted-foreground">· {e.project}</span>
                          )}
                        </div>

                        {e.note && <p className="mt-1 text-xs text-muted-foreground">{e.note}</p>}

                        {!!e.changes?.length && (
                          <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                            {e.changes.map((c) => (
                              <li key={c.field} className="text-xs text-muted-foreground">
                                <span className="font-medium text-foreground">
                                  {fieldLabel(c.field)}
                                </span>{' '}
                                <span className="line-through">{c.from}</span>
                                <span className="px-1">→</span>
                                <span className="font-medium text-foreground">{c.to}</span>
                              </li>
                            ))}
                          </ul>
                        )}

                        <p className="mt-1.5 text-xs text-muted-foreground">
                          by <span className="font-medium text-foreground">{e.actorName}</span>
                          <span className="px-1">·</span>
                          {e.actorEmail}
                        </p>
                      </div>

                      {/* Timing */}
                      <div className="shrink-0 text-right">
                        <div className="text-xs font-medium">{relativeTime(e.at)}</div>
                        <div
                          className="mt-0.5 text-[0.68rem] text-muted-foreground"
                          title={e.at}
                        >
                          {absoluteTime(e.at)}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </Shell>
  );
}
