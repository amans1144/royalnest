'use client';

import { useCallback, useEffect, useState } from 'react';
import { getSession } from './auth';

/**
 * Audit trail for the admin console — who did what, to which record, and when.
 *
 * Every create / update / delete flows through `logActivity`, which stamps the
 * signed-in user and an ISO timestamp. Entries are append-only from the UI's
 * point of view (newest first, capped at MAX) and persist in localStorage until
 * the NestJS API provides a server-side audit table.
 */

export const ACTIVITY_KEY = 'rnr_activity';
const MAX = 500;

export const ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'PUBLISH', 'SIGN_IN', 'SIGN_OUT'] as const;
export type ActivityAction = (typeof ACTIONS)[number];

export const ENTITIES = [
  'Project',
  'Plot',
  'Layout',
  'Media',
  'Marketing',
  'Settings',
  'Booking',
  'Lead',
  'Customer',
  'Session',
] as const;
export type ActivityEntity = (typeof ENTITIES)[number];

export interface FieldChange {
  field: string;
  from?: string;
  to?: string;
}

export interface ActivityEntry {
  id: string;
  /** ISO-8601, always UTC. Rendered as both relative and absolute local time. */
  at: string;
  actorName: string;
  actorEmail: string;
  actorRole: string;
  action: ActivityAction;
  entity: ActivityEntity;
  /** Human-readable target, e.g. "P-014" or "Liberty Imperial Greens". */
  label: string;
  entityId?: string;
  /** Project slug this happened under, when applicable. */
  project?: string;
  changes?: FieldChange[];
  note?: string;
}

export const ACTION_STYLE: Record<ActivityAction, { label: string; className: string }> = {
  CREATE: { label: 'Created', className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
  UPDATE: { label: 'Updated', className: 'bg-blue-500/15 text-blue-600 dark:text-blue-400' },
  DELETE: { label: 'Deleted', className: 'bg-red-500/15 text-red-600 dark:text-red-400' },
  PUBLISH: { label: 'Published', className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
  SIGN_IN: { label: 'Signed in', className: 'bg-violet-500/15 text-violet-600 dark:text-violet-400' },
  SIGN_OUT: { label: 'Signed out', className: 'bg-muted text-muted-foreground' },
};

/** Notifies same-tab listeners; `storage` only fires in *other* tabs. */
const CHANNEL = 'rnr:activity';

export function readActivity(): ActivityEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    const list = raw ? (JSON.parse(raw) as ActivityEntry[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export type LogInput = Omit<
  ActivityEntry,
  'id' | 'at' | 'actorName' | 'actorEmail' | 'actorRole'
>;

/** Record one audited action. Safe to call from any client component. */
export function logActivity(input: LogInput): ActivityEntry | null {
  if (typeof window === 'undefined') return null;
  const session = getSession();
  const entry: ActivityEntry = {
    ...input,
    id: `act-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    at: new Date().toISOString(),
    actorName: session?.name ?? 'Unknown user',
    actorEmail: session?.email ?? '—',
    actorRole: session?.role ?? '—',
  };
  try {
    const next = [entry, ...readActivity()].slice(0, MAX);
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(CHANNEL));
  } catch {
    /* storage full — dropping an audit line must never break the action */
  }
  return entry;
}

export function clearActivity(): void {
  try {
    localStorage.removeItem(ACTIVITY_KEY);
    window.dispatchEvent(new CustomEvent(CHANNEL));
  } catch {
    /* ignore */
  }
}

/** Live view of the audit trail, refreshing on writes from this or another tab. */
export function useActivity() {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(() => {
    setEntries(readActivity());
    setLoaded(true);
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(CHANNEL, refresh);
    window.addEventListener('storage', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener(CHANNEL, refresh);
      window.removeEventListener('storage', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [refresh]);

  return { entries, loaded, refresh };
}

/* ── formatting helpers ─────────────────────────────────────────────────── */

const fmt = (v: unknown): string => {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'number') return v.toLocaleString('en-IN');
  return String(v);
};

/** Field labels that read better than the raw property name. */
const FIELD_LABEL: Record<string, string> = {
  parkFacing: 'PLC · Park facing',
  corner: 'PLC · Corner',
  wideRoad: 'PLC · Wide road',
  price: 'Base price',
  number: 'Plot number',
  total: 'Total plots',
  rera: 'RERA no.',
};

export const fieldLabel = (f: string): string =>
  FIELD_LABEL[f] ?? f.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());

/**
 * Diff two records into an auditable change list. Only fields that actually
 * changed are kept, and noisy structural fields are skipped.
 */
export function diffFields<T extends Record<string, unknown>>(
  before: T,
  after: Partial<T>,
  skip: string[] = ['id', 'points'],
): FieldChange[] {
  const out: FieldChange[] = [];
  for (const key of Object.keys(after)) {
    if (skip.includes(key)) continue;
    const from = before[key];
    const to = after[key];
    if (JSON.stringify(from) === JSON.stringify(to)) continue;
    out.push({ field: key, from: fmt(from), to: fmt(to) });
  }
  return out;
}

/** "just now" / "12m ago" / "3h ago" / "2d ago" */
export function relativeTime(iso: string, now: number = Date.now()): string {
  const diff = now - new Date(iso).getTime();
  if (Number.isNaN(diff)) return '—';
  const s = Math.max(0, Math.floor(diff / 1000));
  if (s < 45) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Full local timestamp to the second — the audit-grade rendering. */
export function absoluteTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

/** Group entries under Today / Yesterday / a date, preserving order. */
export function groupByDay(entries: ActivityEntry[]): { day: string; items: ActivityEntry[] }[] {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86_400_000).toDateString();
  const groups: { day: string; items: ActivityEntry[] }[] = [];
  for (const e of entries) {
    const ds = new Date(e.at).toDateString();
    const day =
      ds === today
        ? 'Today'
        : ds === yesterday
          ? 'Yesterday'
          : new Date(e.at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.items.push(e);
    else groups.push({ day, items: [e] });
  }
  return groups;
}
