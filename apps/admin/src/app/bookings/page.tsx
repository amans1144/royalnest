'use client';

import { useState, useEffect } from 'react';
import { Shell } from '../../components/shell';
import { Modal, Field, fieldCls } from '../../components/modal';
import { Pencil, Trash, Plus } from '../../components/icons';
import { formatINR } from '../../lib/mock';
import { usePersistentList, genId } from '../../lib/crud';
import { readProjects } from '../../lib/projects';
import { formatDate } from '../../lib/live-data';

type Booking = {
  id: string;
  customer: string;
  project: string;
  plot: string;
  amount: number;
  status: string;
  date: string;
};

const SEED: Booking[] = [];
const STATUSES = ['Reserved', 'Confirmed', 'Agreement', 'Registered'];
const PROJECT_NAMES: string[] = [];

const statusPill: Record<string, string> = {
  Confirmed: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  Agreement: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
  Reserved: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  Registered: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
};

/** ISO yyyy-mm-dd so bookings can be grouped into real months for reporting. */
const todayLabel = () => new Date().toISOString().slice(0, 10);

const nextBookingNo = () =>
  `RNR-${new Date().getFullYear()}-${String(Math.floor(100000 + Math.random() * 899999))}`;

const makeEmpty = (): Booking => ({
  id: '',
  customer: '',
  project: PROJECT_NAMES[0] ?? '',
  plot: '',
  amount: 0,
  status: 'Reserved',
  date: todayLabel(),
});

export default function BookingsPage() {
  const { items, add, update, remove } = usePersistentList<Booking>('rnr_bookings', SEED, {
    entity: 'Booking',
    label: (b) => `${b.id} · ${b.customer}`,
  });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Booking | null>(null);
  const [form, setForm] = useState<Booking>(makeEmpty);
  // Live project names (includes any newly-added projects), seeded for SSR.
  const [projectNames, setProjectNames] = useState<string[]>(PROJECT_NAMES);
  useEffect(() => {
    setProjectNames(readProjects().map((p) => p.name));
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ ...makeEmpty(), id: nextBookingNo() });
    setOpen(true);
  };
  const openEdit = (b: Booking) => {
    setEditing(b);
    setForm(b);
    setOpen(true);
  };
  const close = () => {
    setOpen(false);
    setEditing(null);
    setForm(makeEmpty());
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      update(editing.id, form);
    } else {
      add({ ...form, id: form.id || genId('RNR') });
    }
    close();
  };

  return (
    <Shell title="Bookings">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{items.length} bookings</p>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          <Plus width={16} height={16} /> New Booking
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 font-medium">Booking No.</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Project / Plot</th>
                <th className="px-5 py-3 text-right font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">
                    No bookings yet. Click “New Booking” to add one.
                  </td>
                </tr>
              )}
              {items.map((b) => (
                <tr
                  key={b.id}
                  className="border-b border-border/60 last:border-0 hover:bg-accent/40"
                >
                  <td className="px-5 py-3 font-mono text-xs">{b.id}</td>
                  <td className="px-5 py-3 font-medium">{b.customer}</td>
                  <td className="px-5 py-3">
                    <div>{b.project}</div>
                    <div className="text-xs text-muted-foreground">Plot {b.plot}</div>
                  </td>
                  <td className="px-5 py-3 text-right font-semibold">{formatINR(b.amount)}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusPill[b.status] ?? 'bg-muted'}`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{formatDate(b.date)}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(b)}
                        className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-accent"
                      >
                        <Pencil width={13} height={13} /> Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete booking ${b.id}?`)) remove(b.id);
                        }}
                        className="inline-flex items-center rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
                        aria-label="Delete booking"
                      >
                        <Trash width={13} height={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={open} title={editing ? 'Edit Booking' : 'New Booking'} onClose={close}>
        <form onSubmit={save} className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Booking No.">
              <input
                className={`${fieldCls} font-mono`}
                value={form.id}
                onChange={(e) => setForm({ ...form, id: e.target.value })}
                disabled={!!editing}
              />
            </Field>
            <Field label="Date">
              <input
                type="date"
                className={fieldCls}
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Customer Name">
            <input
              required
              className={fieldCls}
              value={form.customer}
              onChange={(e) => setForm({ ...form, customer: e.target.value })}
              placeholder="e.g. Ananya Reddy"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Project">
              <select
                className={fieldCls}
                value={form.project}
                onChange={(e) => setForm({ ...form, project: e.target.value })}
              >
                {projectNames.map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </Field>
            <Field label="Plot No.">
              <input
                required
                className={fieldCls}
                value={form.plot}
                onChange={(e) => setForm({ ...form, plot: e.target.value })}
                placeholder="A-014"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Amount (₹)">
              <input
                type="number"
                min={0}
                className={fieldCls}
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
              />
            </Field>
            <Field label="Status">
              <select
                className={fieldCls}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={close}
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              {editing ? 'Save Changes' : 'Create Booking'}
            </button>
          </div>
        </form>
      </Modal>
    </Shell>
  );
}
