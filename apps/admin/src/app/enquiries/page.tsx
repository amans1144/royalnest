'use client';

import { useMemo, useState } from 'react';
import { Shell } from '../../components/shell';
import { Mail, Search, External } from '../../components/icons';
import {
  downloadCsv,
  formatReceived,
  relativeReceived,
  useEnquiries,
  type Enquiry,
} from '../../lib/enquiries';

export default function EnquiriesPage() {
  const { enquiries, total, loaded, error, refresh } = useEnquiries();
  const [query, setQuery] = useState('');
  const [interest, setInterest] = useState('ALL');
  const [open, setOpen] = useState<string | null>(null);

  const interests = useMemo(
    () => [...new Set(enquiries.map((e) => e.interest).filter(Boolean))].sort() as string[],
    [enquiries],
  );

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return enquiries.filter(
      (e) =>
        (interest === 'ALL' || e.interest === interest) &&
        (!q ||
          [e.name, e.phone, e.email, e.message, e.interest]
            .filter(Boolean)
            .some((v) => v!.toLowerCase().includes(q))),
    );
  }, [enquiries, query, interest]);

  return (
    <Shell title="Enquiries">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm sm:max-w-xs">
          <Search />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, phone, email, message"
            className="min-w-0 flex-1 bg-transparent outline-none"
          />
        </label>

        {interests.length > 1 && (
          <select
            value={interest}
            onChange={(e) => setInterest(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="ALL">All interests</option>
            {interests.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        )}

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={refresh}
            className="rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
          >
            Refresh
          </button>
          <button
            onClick={() => downloadCsv(shown)}
            disabled={shown.length === 0}
            className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* ── Count / state line ── */}
      <p className="mt-3 text-sm text-muted-foreground">
        {!loaded
          ? 'Loading enquiries…'
          : error
            ? 'Could not load enquiries.'
            : shown.length === total
              ? `${total} enquir${total === 1 ? 'y' : 'ies'} received`
              : `Showing ${shown.length} of ${total}`}
      </p>

      {error && (
        <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/[0.06] p-4 text-sm">
          <p className="font-medium text-destructive">{error}</p>
          <p className="mt-2 text-muted-foreground">
            Enquiries are never lost while this is failing — the website appends every one to{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              $DATA_DIR/spb-leads.jsonl
            </code>{' '}
            before it tries to email or serve them.
          </p>
        </div>
      )}

      {/* ── Empty ── */}
      {loaded && !error && total === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-border p-12 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Mail />
          </div>
          <h2 className="mt-4 text-lg font-semibold">No enquiries yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Submissions from the website&apos;s Quick Enquiry form appear here as soon as they
            arrive. Nothing needs configuring for that — email notifications are separate.
          </p>
        </div>
      )}

      {/* ── Table (desktop) ── */}
      {shown.length > 0 && (
        <div className="mt-5 hidden overflow-hidden rounded-2xl border border-border md:block">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Received</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Interest</th>
                  <th className="px-4 py-3 font-medium">Message</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((e) => (
                  <tr key={e.id} className="border-t border-border align-top">
                    <td className="whitespace-nowrap px-4 py-3">
                      <div>{formatReceived(e.receivedAt)}</div>
                      <div className="text-xs text-muted-foreground">
                        {relativeReceived(e.receivedAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">{e.name}</td>
                    <td className="px-4 py-3">
                      <Contact enquiry={e} />
                    </td>
                    <td className="px-4 py-3">
                      {e.interest ? (
                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                          {e.interest}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="max-w-md px-4 py-3 text-muted-foreground">
                      <Message
                        text={e.message}
                        expanded={open === e.id}
                        onToggle={() => setOpen(open === e.id ? null : e.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Cards (mobile) ── */}
      {shown.length > 0 && (
        <div className="mt-5 grid gap-3 md:hidden">
          {shown.map((e) => (
            <div key={e.id} className="rounded-2xl border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-medium">{e.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {relativeReceived(e.receivedAt)} · {formatReceived(e.receivedAt)}
                  </div>
                </div>
                {e.interest && (
                  <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    {e.interest}
                  </span>
                )}
              </div>
              <div className="mt-3 text-sm">
                <Contact enquiry={e} />
              </div>
              {e.message && (
                <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
                  {e.message}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {loaded && !error && total > 0 && shown.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Nothing matches that search.
        </div>
      )}
    </Shell>
  );
}

/** Phone and email as actionable links — tapping these is the whole job. */
function Contact({ enquiry }: { enquiry: Enquiry }) {
  const tel = enquiry.phone?.replace(/[^\d+]/g, '');
  return (
    <div className="grid gap-1">
      {tel && (
        <a href={`tel:${tel}`} className="font-medium hover:text-primary">
          {enquiry.phone}
        </a>
      )}
      {enquiry.email ? (
        <a
          href={`mailto:${enquiry.email}`}
          className="inline-flex items-center gap-1.5 break-all text-xs text-muted-foreground hover:text-primary"
        >
          <Mail /> {enquiry.email}
        </a>
      ) : (
        <span className="text-xs text-muted-foreground">No email given</span>
      )}
      {tel && (
        <a
          href={`https://wa.me/${tel.replace(/^\+/, '')}`}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary"
        >
          <External /> WhatsApp
        </a>
      )}
    </div>
  );
}

/** Long messages are clamped — one rambling enquiry shouldn't own the table. */
function Message({
  text,
  expanded,
  onToggle,
}: {
  text?: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  if (!text) return <span>—</span>;
  const long = text.length > 140;
  return (
    <div>
      <p className={expanded ? 'whitespace-pre-wrap' : 'line-clamp-2'}>{text}</p>
      {long && (
        <button
          onClick={onToggle}
          className="mt-1 text-xs font-medium text-primary hover:underline"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
}
