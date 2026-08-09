'use client';

import { useState } from 'react';
import { Shell } from '../../components/shell';
import { Modal, Field, fieldCls } from '../../components/modal';
import { Pencil, Trash, Plus } from '../../components/icons';
import { usePersistentList, genId } from '../../lib/crud';
import { formatDate } from '../../lib/live-data';

type Lead = {
  id: string;
  name: string;
  phone: string;
  source: string;
  budget: string;
  status: string;
  priority: string;
  assignee: string;
  date: string;
};

const SEED: Lead[] = [];

const SOURCES = ['Website', 'WhatsApp', 'Google Ads', 'Facebook', 'Referral', 'Walk-in'];
const STATUSES = ['New', 'Contacted', 'Qualified', 'Site Visit', 'Negotiation'];
const PRIORITIES = ['Urgent', 'High', 'Medium', 'Low'];
const BUDGETS = ['Under ₹50L', '₹50L–1Cr', '₹1–3Cr', '₹3Cr+'];

const statusPill: Record<string, string> = {
  New: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  Contacted: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
  Qualified: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
  'Site Visit': 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  Negotiation: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
};
const priPill: Record<string, string> = {
  Urgent: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
  High: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  Medium: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  Low: 'bg-muted text-muted-foreground',
};

const todayLabel = () => new Date().toISOString().slice(0, 10);

const makeEmpty = (): Lead => ({
  id: '',
  name: '',
  phone: '',
  source: 'Website',
  budget: '₹50L–1Cr',
  status: 'New',
  priority: 'Medium',
  assignee: 'Unassigned',
  date: todayLabel(),
});

export default function LeadsPage() {
  const { items, add, update, remove } = usePersistentList<Lead>('rnr_leads', SEED, {
    entity: 'Lead',
    label: (l) => l.name,
  });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [form, setForm] = useState<Lead>(makeEmpty);

  const openNew = () => {
    setEditing(null);
    setForm(makeEmpty());
    setOpen(true);
  };
  const openEdit = (l: Lead) => {
    setEditing(l);
    setForm(l);
    setOpen(true);
  };
  const close = () => {
    setOpen(false);
    setEditing(null);
    setForm(makeEmpty());
  };
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) update(editing.id, form);
    else add({ ...form, id: genId('lead') });
    close();
  };

  return (
    <Shell title="Leads / CRM">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{items.length} leads in pipeline</p>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          <Plus width={16} height={16} /> Add Lead
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 font-medium">Lead</th>
                <th className="px-5 py-3 font-medium">Source</th>
                <th className="px-5 py-3 font-medium">Budget</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Priority</th>
                <th className="px-5 py-3 font-medium">Assignee</th>
                <th className="px-5 py-3 font-medium">Added</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-muted-foreground">
                    No leads yet. Click “Add Lead” to create one.
                  </td>
                </tr>
              )}
              {items.map((l) => (
                <tr key={l.id} className="border-b border-border/60 last:border-0 hover:bg-accent/40">
                  <td className="px-5 py-3">
                    <div className="font-medium">{l.name}</div>
                    <div className="text-xs text-muted-foreground">{l.phone}</div>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{l.source}</td>
                  <td className="px-5 py-3">{l.budget}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusPill[l.status] ?? 'bg-muted'}`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${priPill[l.priority] ?? 'bg-muted'}`}>
                      {l.priority}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{l.assignee}</td>
                  <td className="px-5 py-3 text-muted-foreground">{formatDate(l.date)}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(l)}
                        className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-accent"
                      >
                        <Pencil width={13} height={13} /> Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete lead "${l.name}"?`)) remove(l.id);
                        }}
                        className="inline-flex items-center rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
                        aria-label="Delete lead"
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

      <Modal open={open} title={editing ? 'Edit Lead' : 'Add Lead'} onClose={close}>
        <form onSubmit={save} className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name">
              <input
                required
                className={fieldCls}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Full name"
              />
            </Field>
            <Field label="Phone">
              <input
                required
                className={fieldCls}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 ..."
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Source">
              <select
                className={fieldCls}
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
              >
                {SOURCES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Budget">
              <select
                className={fieldCls}
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
              >
                {BUDGETS.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
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
            <Field label="Priority">
              <select
                className={fieldCls}
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                {PRIORITIES.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Assignee">
            <input
              className={fieldCls}
              value={form.assignee}
              onChange={(e) => setForm({ ...form, assignee: e.target.value })}
              placeholder="Sales executive"
            />
          </Field>
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
              {editing ? 'Save Changes' : 'Add Lead'}
            </button>
          </div>
        </form>
      </Modal>
    </Shell>
  );
}
