'use client';

import { useCallback, useEffect, useState } from 'react';
import { WEBSITE_URL } from './layouts';
import { publishHeaders } from './publish';

/**
 * Contact-form enquiries.
 *
 * Unlike everything else in the admin, these are NOT an admin-owned working
 * copy pushed to the site — the direction is reversed. The public website
 * receives them and owns the log; the admin only reads it. So there is no
 * localStorage cache here: a stale copy of who called yesterday is worse than
 * a spinner, and the website is always the answer.
 */

export const ENQUIRIES_API = `${WEBSITE_URL}/api/lead`;

export type Enquiry = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  interest?: string;
  message?: string;
  receivedAt: string;
  ip?: string;
  userAgent?: string;
};

type ApiOk = { ok: true; total: number; returned: number; leads: Enquiry[] };
type ApiErr = { ok: false; error?: string };

export type EnquiriesState = {
  enquiries: Enquiry[];
  total: number;
  loaded: boolean;
  error: string | null;
  refresh: () => void;
};

/** Human-readable reason, so the page never shows a bare status code. */
function describe(status: number, body: ApiErr | null): string {
  if (status === 401)
    return 'The website rejected the token — NEXT_PUBLIC_PUBLISH_TOKEN here and PUBLISH_TOKEN on the website must match.';
  if (status === 503)
    return (
      body?.error ??
      'The website will not serve enquiries — PUBLISH_TOKEN is unset or its database is unreachable.'
    );
  return body?.error ?? `${WEBSITE_URL} returned ${status}.`;
}

export function useEnquiries(): EnquiriesState {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [total, setTotal] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setError(null);

    (async () => {
      try {
        const res = await fetch(ENQUIRIES_API, {
          headers: publishHeaders(),
          cache: 'no-store',
        });
        const body = (await res.json().catch(() => null)) as ApiOk | ApiErr | null;
        if (cancelled) return;

        if (!res.ok || !body || body.ok !== true) {
          setError(describe(res.status, body as ApiErr | null));
          setEnquiries([]);
          setTotal(0);
          return;
        }
        setEnquiries(body.leads);
        setTotal(body.total);
      } catch {
        if (!cancelled) {
          // Cross-origin failures land here with no status to report, and the
          // usual cause is ADMIN_ORIGIN not covering this host.
          setError(
            `Could not reach ${WEBSITE_URL}. Check it is running and that ADMIN_ORIGIN on the website allows this admin's origin.`,
          );
          setEnquiries([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tick]);

  return { enquiries, total, loaded, error, refresh };
}

export const formatReceived = (iso: string): string => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata',
      });
};

/** "2 hours ago" — the column an operator actually scans. */
export function relativeReceived(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? '' : 's'} ago`;
  const days = Math.round(hrs / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

/**
 * CSV for Excel / Google Sheets.
 *
 * Every field is quoted and internal quotes doubled — names and messages
 * contain commas and newlines, and a half-escaped export silently shifts
 * columns rather than failing loudly. A leading `'` is added to anything
 * Excel would read as a formula (a phone starting `+91` is exactly that).
 */
export function toCsv(rows: Enquiry[]): string {
  const cols: [string, (e: Enquiry) => string][] = [
    ['Received', (e) => formatReceived(e.receivedAt)],
    ['Name', (e) => e.name],
    ['Phone', (e) => e.phone],
    ['Email', (e) => e.email ?? ''],
    ['Interested in', (e) => e.interest ?? ''],
    ['Message', (e) => e.message ?? ''],
  ];
  const cell = (v: string) => {
    const safe = /^[=+\-@]/.test(v) ? `'${v}` : v;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  return [
    cols.map(([h]) => cell(h)).join(','),
    ...rows.map((r) => cols.map(([, get]) => cell(get(r))).join(',')),
  ].join('\r\n');
}

export function downloadCsv(rows: Enquiry[]): void {
  const blob = new Blob([`﻿${toCsv(rows)}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `royalnest-enquiries-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
