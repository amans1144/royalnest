'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  PLC_CHARGES,
  PLOT_STATUS_COLOR,
  PLOT_STATUS_LABEL,
  appliedPlc,
  plcPercent,
  priceWithPlc,
  type PlcKey,
  type PlotStatus,
} from '@spb/types';
import { Shell } from '../../components/shell';
import { Modal, Field, fieldCls } from '../../components/modal';
import { Pencil, Trash } from '../../components/icons';
import { formatINR } from '../../lib/mock';
import { projectSelectOptions, SEED_OPTIONS } from '../../lib/projects';
import {
  deletePlot,
  publishLayout,
  readLayout,
  updatePlot,
  type StoredPlot,
} from '../../lib/layouts';
import { diffFields, logActivity } from '../../lib/activity';

const STATUSES: PlotStatus[] = ['AVAILABLE', 'RESERVED', 'BOOKED', 'SOLD', 'BLOCKED'];
const FACINGS = [
  'East',
  'West',
  'North',
  'South',
  'North-East',
  'North-West',
  'South-East',
  'South-West',
];

type SortKey = 'number' | 'area' | 'price' | 'status';

export default function PlotsPage() {
  const [projectOptions, setProjectOptions] = useState(SEED_OPTIONS);
  const [project, setProject] = useState(SEED_OPTIONS[0]?.slug ?? '');
  const [plots, setPlots] = useState<StoredPlot[]>([]);
  const [hasImage, setHasImage] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState<PlotStatus | 'ALL'>('ALL');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'number', dir: 1 });
  const [dirty, setDirty] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const projectName = projectOptions.find((o) => o.slug === project)?.name ?? project;

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 3000);
  };

  // Project list comes from the live Projects store so a newly-added project appears here.
  useEffect(() => {
    const load = () => {
      const opts = projectSelectOptions();
      setProjectOptions(opts);
      setProject((prev) => (opts.some((o) => o.slug === prev) ? prev : (opts[0]?.slug ?? prev)));
    };
    load();
    window.addEventListener('focus', load);
    window.addEventListener('storage', load);
    return () => {
      window.removeEventListener('focus', load);
      window.removeEventListener('storage', load);
    };
  }, []);

  // Load the selected project's traced plots.
  const reload = useCallback(() => {
    const layout = readLayout(project);
    setPlots(layout.plots);
    setHasImage(!!layout.image);
    setLoaded(true);
    setDirty(false);
  }, [project]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Pick up edits made in the plot editor (other tab / after returning).
  useEffect(() => {
    const onFocus = () => !dirty && reload();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [reload, dirty]);

  /* ── edit / delete ── */
  const [editing, setEditing] = useState<StoredPlot | null>(null);
  const [form, setForm] = useState<StoredPlot | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<StoredPlot | null>(null);

  const openEdit = (p: StoredPlot) => {
    setEditing(p);
    setForm({ ...p });
  };
  const closeEdit = () => {
    setEditing(null);
    setForm(null);
  };

  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !form) return;
    const patch: Partial<StoredPlot> = {
      number: form.number.trim() || editing.number,
      area: Number(form.area) || 0,
      dimensions: form.dimensions,
      price: Number(form.price) || 0,
      facing: form.facing,
      status: form.status,
      parkFacing: !!form.parkFacing,
      corner: !!form.corner,
      wideRoad: !!form.wideRoad,
      remarks: form.remarks ?? '',
    };
    const changes = diffFields(
      editing as unknown as Record<string, unknown>,
      patch as Record<string, unknown>,
      ['id', 'points'],
    );
    setPlots(updatePlot(project, editing.id, patch));
    if (changes.length) {
      setDirty(true);
      logActivity({
        action: 'UPDATE',
        entity: 'Plot',
        entityId: editing.id,
        label: patch.number ?? editing.number,
        project: projectName,
        changes,
      });
    }
    closeEdit();
  };

  const removePlot = (p: StoredPlot) => {
    setPlots(deletePlot(project, p.id));
    setDirty(true);
    setConfirmDelete(null);
    logActivity({
      action: 'DELETE',
      entity: 'Plot',
      entityId: p.id,
      label: p.number,
      project: projectName,
      note: `${p.area} sq.ft · ${formatINR(priceWithPlc(p.price, p))} total`,
    });
    flash(`Deleted plot ${p.number} — publish to update the website.`);
  };

  const setStatus = (id: string, status: PlotStatus) => {
    const before = plots.find((p) => p.id === id);
    if (!before || before.status === status) return;
    setPlots(updatePlot(project, id, { status }));
    setDirty(true);
    logActivity({
      action: 'UPDATE',
      entity: 'Plot',
      entityId: id,
      label: before.number,
      project: projectName,
      changes: [
        { field: 'status', from: PLOT_STATUS_LABEL[before.status], to: PLOT_STATUS_LABEL[status] },
      ],
    });
  };

  const publish = async () => {
    setPublishing(true);
    const layout = readLayout(project);
    const res = await publishLayout(project, layout);
    setPublishing(false);
    if (res.ok) {
      setDirty(false);
      flash(`Published ${res.count} plots to the website ✓`);
      logActivity({
        action: 'PUBLISH',
        entity: 'Layout',
        label: projectName,
        project: projectName,
        note: `${res.count} plots pushed live from Plot Inventory`,
      });
    } else {
      flash(res.error ?? 'Publish failed.');
    }
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const p of plots) c[p.status] = (c[p.status] ?? 0) + 1;
    return c;
  }, [plots]);

  const totals = useMemo(
    () => ({
      plots: plots.length,
      area: plots.reduce((s, p) => s + (p.area || 0), 0),
      value: plots.reduce((s, p) => s + priceWithPlc(p.price || 0, p), 0),
    }),
    [plots],
  );

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = plots.filter(
      (p) =>
        (filter === 'ALL' || p.status === filter) &&
        (!q || p.number.toLowerCase().includes(q) || p.facing.toLowerCase().includes(q)),
    );
    const { key, dir } = sort;
    return [...rows].sort((a, b) => {
      if (key === 'number') return a.number.localeCompare(b.number, undefined, { numeric: true }) * dir;
      if (key === 'area') return ((a.area || 0) - (b.area || 0)) * dir;
      if (key === 'price')
        return (priceWithPlc(a.price || 0, a) - priceWithPlc(b.price || 0, b)) * dir;
      return (STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status)) * dir;
    });
  }, [plots, filter, query, sort]);

  const toggleSort = (key: SortKey) =>
    setSort((s) => ({ key, dir: s.key === key && s.dir === 1 ? -1 : 1 }));

  const Th = ({ label, k, right }: { label: string; k?: SortKey; right?: boolean }) => (
    <th className={`px-5 py-3 font-medium ${right ? 'text-right' : ''}`}>
      {k ? (
        <button
          onClick={() => toggleSort(k)}
          // `uppercase` is repeated here: Tailwind's preflight resets
          // text-transform on <button>, so it can't inherit from the row.
          className={`inline-flex items-center gap-1 uppercase tracking-wider hover:text-foreground ${sort.key === k ? 'text-foreground' : ''}`}
        >
          {label}
          <span className="text-[0.6rem]">{sort.key === k ? (sort.dir === 1 ? '▲' : '▼') : '⇅'}</span>
        </button>
      ) : (
        label
      )}
    </th>
  );

  return (
    <Shell title="Plot Inventory">
      {/* Header: project picker + publish */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm">
          <span className="text-muted-foreground">Project</span>
          <select
            value={project}
            onChange={(e) => setProject(e.target.value)}
            className="bg-transparent font-semibold outline-none"
          >
            {projectOptions.map((o) => (
              <option key={o.slug} value={o.slug}>
                {o.name}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-2">
          {dirty && (
            <span className="rounded-full bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
              Unpublished changes
            </span>
          )}
          <button
            onClick={publish}
            disabled={publishing || plots.length === 0}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {publishing && (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            Publish to website
          </button>
          <a
            href="/plots/editor"
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Open Plot Editor
          </a>
        </div>
      </div>

      {/* Empty state — no plots traced for this project yet */}
      {loaded && plots.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-8 py-16 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-2xl text-primary">
            ▦
          </div>
          <h3 className="mt-4 font-semibold">No plots yet for {projectName}</h3>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
            {hasImage
              ? 'A site plan is uploaded but no plots have been traced. Open the editor and draw each plot with the polygon or rect tool.'
              : 'Upload the site plan in the Plot Editor and trace each plot. They will appear here with live, editable status.'}
          </p>
          <a
            href="/plots/editor"
            className="mt-5 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Open Plot Editor
          </a>
        </div>
      ) : (
        <>
          {/* Status summary — real counts, click to filter */}
          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <button
              onClick={() => setFilter('ALL')}
              className={`rounded-2xl border bg-card p-4 text-left transition-colors ${
                filter === 'ALL' ? 'border-foreground' : 'border-border hover:bg-accent/40'
              }`}
            >
              <div className="text-xs text-muted-foreground">All plots</div>
              <div className="mt-1 text-2xl font-semibold">{totals.plots}</div>
            </button>
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setFilter(filter === s ? 'ALL' : s)}
                className={`rounded-2xl border bg-card p-4 text-left transition-colors ${
                  filter === s ? 'border-foreground' : 'border-border hover:bg-accent/40'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: PLOT_STATUS_COLOR[s] }}
                  />
                  <span className="text-xs text-muted-foreground">{PLOT_STATUS_LABEL[s]}</span>
                </div>
                <div className="mt-1 text-2xl font-semibold">{counts[s] ?? 0}</div>
              </button>
            ))}
          </div>

          {/* Search + roll-up */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search plot no. or facing…"
              className="w-56 rounded-xl border border-border bg-background px-3.5 py-2 text-sm outline-none focus:border-primary"
            />
            <p className="text-sm text-muted-foreground">
              Showing <b className="text-foreground">{shown.length}</b> of {totals.plots} ·{' '}
              {totals.area.toLocaleString('en-IN')} sq.ft ·{' '}
              <b className="text-foreground">{formatINR(totals.value)}</b> inventory value
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <Th label="Plot" k="number" />
                    <Th label="Area" k="area" />
                    <Th label="Facing" />
                    <Th label="PLC" />
                    <Th label="Base" right />
                    <Th label="Total" k="price" right />
                    <Th label="Status" k="status" />
                    <Th label="Actions" right />
                  </tr>
                </thead>
                <tbody>
                  {shown.map((r) => (
                    <tr key={r.id} className="border-b border-border/60 last:border-0 hover:bg-accent/40">
                      <td className="px-5 py-2.5 font-medium">{r.number}</td>
                      <td className="px-5 py-2.5">
                        {r.area} sq.ft
                        {r.dimensions && (
                          <span className="ml-1.5 text-xs text-muted-foreground">
                            ({r.dimensions})
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-2.5 text-muted-foreground">{r.facing}</td>
                      <td className="px-5 py-2.5">
                        {plcPercent(r) === 0 ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <span className="flex flex-wrap items-center gap-1">
                            {appliedPlc(r).map((c) => (
                              <span
                                key={c.key}
                                title={`${c.label} — ${c.note} (+${c.pct}%)`}
                                className="rounded-full bg-primary/15 px-2 py-0.5 text-[0.65rem] font-semibold text-primary"
                              >
                                {c.short}
                              </span>
                            ))}
                            <span className="text-[0.7rem] font-bold text-primary">
                              +{plcPercent(r)}%
                            </span>
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-2.5 text-right text-muted-foreground">
                        {formatINR(r.price)}
                      </td>
                      <td className="px-5 py-2.5 text-right font-semibold">
                        {formatINR(priceWithPlc(r.price, r))}
                      </td>
                      <td className="px-5 py-2.5">
                        <select
                          value={r.status}
                          onChange={(e) => setStatus(r.id, e.target.value as PlotStatus)}
                          aria-label={`Status for plot ${r.number}`}
                          className="cursor-pointer rounded-full border-0 py-1 pl-3 pr-7 text-xs font-semibold text-white outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                          style={{ background: PLOT_STATUS_COLOR[r.status] }}
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s} className="bg-background text-foreground">
                              {PLOT_STATUS_LABEL[s]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-2.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEdit(r)}
                            aria-label={`Edit plot ${r.number}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-accent"
                          >
                            <Pencil width={13} height={13} /> Edit
                          </button>
                          <button
                            onClick={() => setConfirmDelete(r)}
                            aria-label={`Delete plot ${r.number}`}
                            className="inline-flex items-center rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
                          >
                            <Trash width={13} height={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {shown.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-5 py-10 text-center text-sm text-muted-foreground">
                        No plots match this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── Edit plot ── */}
      <Modal open={!!editing} title={`Edit plot ${editing?.number ?? ''}`} onClose={closeEdit}>
        {form && (
          <form onSubmit={saveEdit} className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Plot number">
                <input
                  required
                  className={fieldCls}
                  value={form.number}
                  onChange={(e) => setForm({ ...form, number: e.target.value })}
                />
              </Field>
              <Field label="Facing">
                <select
                  className={fieldCls}
                  value={form.facing}
                  onChange={(e) => setForm({ ...form, facing: e.target.value })}
                >
                  {FACINGS.map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Area (sq.ft)">
                <input
                  type="number"
                  min={0}
                  className={fieldCls}
                  value={form.area}
                  onChange={(e) => setForm({ ...form, area: Number(e.target.value) })}
                />
              </Field>
              <Field label="Dimensions">
                <input
                  className={fieldCls}
                  value={form.dimensions}
                  onChange={(e) => setForm({ ...form, dimensions: e.target.value })}
                />
              </Field>
            </div>

            <Field label="Base price (₹)">
              <input
                type="number"
                min={0}
                className={fieldCls}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              />
            </Field>

            {/* PLC */}
            <div className="rounded-xl border border-border bg-muted/30 p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  PLC
                </span>
                {plcPercent(form) > 0 && (
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[0.65rem] font-bold text-primary">
                    +{plcPercent(form)}%
                  </span>
                )}
              </div>
              <div className="mt-2.5 space-y-1.5">
                {PLC_CHARGES.map((c) => (
                  <label
                    key={c.key}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-accent/60"
                  >
                    <input
                      type="checkbox"
                      checked={!!form[c.key as PlcKey]}
                      onChange={(e) => setForm({ ...form, [c.key]: e.target.checked })}
                    />
                    <span className="text-sm leading-tight">
                      {c.label}
                      <span className="block text-[0.68rem] text-muted-foreground">{c.note}</span>
                    </span>
                    <span className="ml-auto text-xs font-semibold text-primary">+{c.pct}%</span>
                  </label>
                ))}
              </div>
              <div className="mt-3 flex justify-between border-t border-border pt-2.5 text-sm font-semibold">
                <span>Total</span>
                <span className="text-primary">{formatINR(priceWithPlc(form.price || 0, form))}</span>
              </div>
            </div>

            <Field label="Status">
              <select
                className={fieldCls}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as PlotStatus })}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {PLOT_STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Remarks">
              <textarea
                rows={2}
                className={`${fieldCls} resize-none`}
                value={form.remarks ?? ''}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              />
            </Field>

            <div className="mt-1 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeEdit}
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-accent"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── Delete confirmation ── */}
      <Modal
        open={!!confirmDelete}
        title="Delete plot"
        onClose={() => setConfirmDelete(null)}
      >
        {confirmDelete && (
          <div>
            <p className="text-sm">
              Delete plot <b>{confirmDelete.number}</b> ({confirmDelete.area} sq.ft ·{' '}
              {formatINR(priceWithPlc(confirmDelete.price, confirmDelete))})? This removes it from
              the layout and cannot be undone.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              The public website keeps showing it until you publish again.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={() => removePlot(confirmDelete)}
                className="rounded-xl bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground hover:opacity-90"
              >
                Delete plot
              </button>
            </div>
          </div>
        )}
      </Modal>

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </Shell>
  );
}
