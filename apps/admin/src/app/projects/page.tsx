'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { PLOT_STATUS_COLOR, PLOT_STATUS_LABEL, type PlotStatus } from '@spb/types';
import { Shell } from '../../components/shell';
import { Modal, Field, fieldCls } from '../../components/modal';
import { Pencil, Trash, Plus } from '../../components/icons';
import { adminProjects, formatINR } from '../../lib/mock';
import { PROJECTS_KEY, slugify } from '../../lib/projects';
import { usePersistentList, genId } from '../../lib/crud';
import { useLiveData } from '../../lib/live-data';

/**
 * A project record only stores its *identity* — name, city, type, status.
 * Plot counts, sold/available and revenue are never typed in: they're derived
 * from the traced layout and real bookings, so a card can't drift from the
 * Plot Inventory or the Dashboard.
 */
type Project = {
  id: string;
  name: string;
  city: string;
  type: string;
  status: string;
  /* Legacy numeric fields are kept on stored records for backwards
     compatibility but are no longer written or displayed. */
  total?: number;
  sold?: number;
  available?: number;
  revenue?: number;
};

const SEED: Project[] = adminProjects.map((p) => ({
  id: slugify(p.name),
  name: p.name,
  city: p.city,
  type: p.type,
  status: p.status,
}));

const TYPES = ['Plotted', 'Villa', 'Residential', 'Commercial'];
const STATUSES = ['Ongoing', 'Ready', 'Upcoming'];
const PLOT_STATUSES: PlotStatus[] = ['AVAILABLE', 'RESERVED', 'BOOKED', 'SOLD', 'BLOCKED'];

const statusPill: Record<string, string> = {
  Ongoing: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  Ready: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  Upcoming: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
};

const empty: Project = { id: '', name: '', city: 'Lucknow', type: 'Plotted', status: 'Upcoming' };

export default function ProjectsPage() {
  const { items, add, update, remove } = usePersistentList<Project>(PROJECTS_KEY, SEED, {
    entity: 'Project',
    label: (p) => p.name,
    skipFields: ['total', 'sold', 'available', 'revenue'],
  });
  const live = useLiveData();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState<Project>(empty);

  /** Derived stats keyed by slug, so each card reads its real numbers. */
  const rollups = useMemo(
    () => new Map(live.projects.map((p) => [p.slug, p])),
    [live.projects],
  );

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (p: Project) => { setEditing(p); setForm(p); setOpen(true); };
  const close = () => { setOpen(false); setEditing(null); setForm(empty); };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      city: form.city.trim(),
      type: form.type,
      status: form.status,
    };
    if (editing) update(editing.id, payload);
    else add({ ...payload, id: genId('prj') });
    close();
  };

  const totalPlots = live.totals.plots;

  return (
    <Shell title="Projects">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {items.length} project{items.length === 1 ? '' : 's'} ·{' '}
          <b className="text-foreground">{totalPlots}</b> plots traced ·{' '}
          <b className="text-foreground">{formatINR(live.totals.inventoryValue)}</b> inventory
        </p>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          <Plus width={16} height={16} /> New Project
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((p) => {
          const r = rollups.get(slugify(p.name));
          const traced = r?.tracedTotal ?? 0;
          const sold = (r?.counts.SOLD ?? 0) + (r?.counts.BOOKED ?? 0);
          const available = r?.counts.AVAILABLE ?? 0;
          const soldPct = traced ? Math.round((sold / traced) * 100) : 0;

          return (
            <div key={p.id} className="flex flex-col rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold">{p.name}</h3>
                  <p className="text-xs text-muted-foreground">{p.city} · {p.type}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${statusPill[p.status] ?? 'bg-muted'}`}>
                  {p.status}
                </span>
              </div>

              {traced === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-5 text-center">
                  <p className="text-sm font-medium">No plots traced</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Trace the layout to see live inventory here.
                  </p>
                  <Link
                    href="/plots/editor"
                    className="mt-3 inline-block rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
                  >
                    Open Plot Editor
                  </Link>
                </div>
              ) : (
                <>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{sold} sold / booked</span>
                      <span>{available} available</span>
                    </div>
                    {/* Segmented bar in real status proportions */}
                    <div className="mt-1.5 flex h-2 overflow-hidden rounded-full bg-muted">
                      {PLOT_STATUSES.map((s) => {
                        const n = r?.counts[s] ?? 0;
                        if (!n) return null;
                        return (
                          <span
                            key={s}
                            title={`${PLOT_STATUS_LABEL[s]}: ${n}`}
                            style={{ width: `${(n / traced) * 100}%`, background: PLOT_STATUS_COLOR[s] }}
                          />
                        );
                      })}
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{traced} plots</span>
                      <span className="font-medium">{soldPct}% sold</span>
                    </div>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-xs text-muted-foreground">Inventory value</dt>
                      <dd className="font-semibold tabular-nums">{formatINR(r?.inventoryValue ?? 0)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Booked revenue</dt>
                      <dd className="font-semibold tabular-nums text-primary">
                        {formatINR(r?.bookedValue ?? 0)}
                      </dd>
                    </div>
                  </dl>
                </>
              )}

              <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-4">
                <span className="text-xs text-muted-foreground">
                  {r?.bookings.length ?? 0} booking{(r?.bookings.length ?? 0) === 1 ? '' : 's'}
                </span>
                <div className="flex gap-2">
                  <Link href="/plots" className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent">
                    Plots
                  </Link>
                  <button
                    onClick={() => openEdit(p)}
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent"
                  >
                    <Pencil width={13} height={13} /> Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${p.name}"? This cannot be undone.`)) remove(p.id);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
                    aria-label="Delete project"
                  >
                    <Trash width={13} height={13} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {items.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-border bg-card px-8 py-16 text-center">
            <h3 className="font-semibold">No projects yet</h3>
            <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
              Add a project, then trace its plot layout — inventory and revenue fill in
              automatically from your real records.
            </p>
          </div>
        )}
      </div>

      <Modal open={open} title={editing ? 'Edit Project' : 'New Project'} onClose={close}>
        <form onSubmit={save} className="grid gap-4">
          <Field label="Project Name">
            <input
              required
              className={fieldCls}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Liberty Imperial Greens"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="City">
              <input
                required
                className={fieldCls}
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </Field>
            <Field label="Type">
              <select className={fieldCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Status">
            <select className={fieldCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>

          <p className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
            Plot counts, availability and revenue aren&apos;t entered here — they&apos;re calculated
            from the traced layout and real bookings, so they always match Plot Inventory and the
            Dashboard.
          </p>

          <div className="mt-2 flex justify-end gap-2">
            <button type="button" onClick={close} className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-accent">
              Cancel
            </button>
            <button type="submit" className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
              {editing ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>
    </Shell>
  );
}
