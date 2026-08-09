'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { pointInPolygon, polygonCentroid, snapToGrid } from '@spb/utils';
import { formatINR } from '../lib/mock';
import { projectSelectOptions, SEED_OPTIONS } from '../lib/projects';
import { LAYOUT_PREFIX, WEBSITE_API, WEBSITE_URL } from '../lib/layouts';
import { diffFields, logActivity } from '../lib/activity';
import { publishError, publishHeaders } from '../lib/publish';

interface Pt {
  x: number;
  y: number;
}
interface EditorPlot {
  id: string;
  points: Pt[];
  number: string;
  area: number;
  dimensions: string;
  /** Base rate before PLC. `price` stays the base so PLC can be re-derived. */
  price: number;
  facing: string;
  status: PlotStatus;
  remarks: string;
  /* ── PLC flags — each adds its percentage of the base price ── */
  parkFacing?: boolean;
  corner?: boolean;
  wideRoad?: boolean;
}
interface LayoutImage {
  src: string;
  width: number;
  height: number;
  name: string;
}

type Tool = 'select' | 'polygon' | 'rect' | 'pan' | 'crop';
const STATUSES: PlotStatus[] = ['AVAILABLE', 'RESERVED', 'BOOKED', 'SOLD', 'BLOCKED'];
const FACINGS = ['East', 'West', 'North', 'South', 'North-East', 'North-West', 'South-East', 'South-West'];
// Storage key + publish endpoint are shared with Plot Inventory (lib/layouts).
const STORAGE_PREFIX = LAYOUT_PREFIX;
const uid = () => `plot_${Math.random().toString(36).slice(2, 9)}`;

// ── PDF / image loading ──────────────────────────────────────────────────────
async function renderPdf(file: File): Promise<LayoutImage> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  const data = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data }).promise;
  const page = await doc.getPage(1);
  const base = page.getViewport({ scale: 1 });
  // Render at high resolution so it stays crisp when zoomed in. Aim for a ~3200px
  // long side, capped at the 4096px canvas limit, never below 2x.
  const MAX = 4096;
  let scale = 3200 / Math.max(base.width, base.height);
  scale = Math.min(scale, MAX / base.width, MAX / base.height);
  scale = Math.max(scale, 2);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport, canvas } as never).promise;
  // PNG keeps thin plan lines & text sharp (no JPEG artifacts).
  return { src: canvas.toDataURL('image/png'), width: canvas.width, height: canvas.height, name: file.name };
}

function loadImageEl(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = reject;
    im.src = src;
  });
}

function readImage(file: File): Promise<LayoutImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const src = reader.result as string;
      const img = new Image();
      img.onload = () => resolve({ src, width: img.naturalWidth || 1600, height: img.naturalHeight || 1000, name: file.name });
      img.onerror = () => resolve({ src, width: 1600, height: 1000, name: file.name });
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}

// ── Component ────────────────────────────────────────────────────────────────
export function LayoutEditor() {
  const [image, setImage] = useState<LayoutImage | null>(null);
  const [plots, setPlots] = useState<EditorPlot[]>([]);
  const [tool, setTool] = useState<Tool>('select');
  const [draft, setDraft] = useState<Pt[]>([]);
  const [rectPreview, setRectPreview] = useState<{ a: Pt; b: Pt } | null>(null);
  const [cropRect, setCropRect] = useState<{ a: Pt; b: Pt } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [view, setView] = useState({ zoom: 1, x: 0, y: 0 });
  const [cursor, setCursor] = useState<Pt | null>(null);
  const [snap, setSnap] = useState(false);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  // Project picker options load from the live Projects store (localStorage) so a
  // newly-added project shows up here. Seed options render first for SSR safety.
  const [projectOptions, setProjectOptions] = useState(SEED_OPTIONS);
  const [project, setProject] = useState(SEED_OPTIONS[0]?.slug ?? '');
  const projectName = projectOptions.find((o) => o.slug === project)?.name ?? project;

  useEffect(() => {
    const load = () => {
      const opts = projectSelectOptions();
      setProjectOptions(opts);
      setProject((prev) => (opts.some((o) => o.slug === prev) ? prev : opts[0]?.slug ?? prev));
    };
    load();
    // Refresh if projects change in another tab or when returning to this tab.
    window.addEventListener('focus', load);
    window.addEventListener('storage', load);
    return () => {
      window.removeEventListener('focus', load);
      window.removeEventListener('storage', load);
    };
  }, []);

  const svgRef = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const drag = useRef<null | {
    mode: 'move' | 'pan' | 'rect' | 'crop';
    startWorld?: Pt;
    startScreen?: Pt;
    orig?: Pt[];
    origView?: { x: number; y: number };
    plotId?: string;
    moved?: boolean;
  }>(null);
  const history = useRef<EditorPlot[][]>([]);
  const future = useRef<EditorPlot[][]>([]);
  const GRID = 20;

  const selected = plots.find((p) => p.id === selectedId) ?? null;
  const counts = useMemo(() => {
    const c: Partial<Record<PlotStatus, number>> = {};
    for (const p of plots) c[p.status] = (c[p.status] ?? 0) + 1;
    return c;
  }, [plots]);

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2800);
  };

  // ── coalesced audit for plot-detail edits ──
  const editAudit = useRef<{ id: string; before: EditorPlot } | null>(null);
  const editTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const plotsRef = useRef(plots);
  const projectNameRef = useRef(projectName);
  useEffect(() => {
    plotsRef.current = plots;
    projectNameRef.current = projectName;
  }, [plots, projectName]);

  const flushEditAudit = useCallback(() => {
    if (editTimer.current) {
      clearTimeout(editTimer.current);
      editTimer.current = null;
    }
    const pending = editAudit.current;
    editAudit.current = null;
    if (!pending) return;
    const after = plotsRef.current.find((p) => p.id === pending.id);
    if (!after) return;
    const changes = diffFields(
      pending.before as unknown as Record<string, unknown>,
      after as unknown as Record<string, unknown>,
      ['id', 'points'],
    );
    if (!changes.length) return;
    logActivity({
      action: 'UPDATE',
      entity: 'Plot',
      entityId: pending.id,
      label: after.number,
      project: projectNameRef.current,
      changes,
    });
  }, []);

  // Flush any in-flight edit when leaving the page.
  useEffect(() => flushEditAudit, [flushEditAudit]);

  // Publish the current layout to the public website (dev shared store).
  const publish = async () => {
    if (!image) {
      flash('Upload a layout first.');
      return;
    }
    setPublishing(true);
    try {
      const res = await fetch(WEBSITE_API, {
        method: 'POST',
        headers: publishHeaders(),
        body: JSON.stringify({ projectId: project, image, plots }),
      });
      if (!res.ok) {
        flash(await publishError(res, WEBSITE_URL));
        return;
      }
      flash(`Published ${plots.length} plots to ${projectName} ✓`);
      logActivity({
        action: 'PUBLISH',
        entity: 'Layout',
        label: projectName,
        project: projectName,
        note: `${plots.length} plots pushed live from the Plot Editor`,
      });
    } catch {
      flash(`Publish failed — is the website running at ${WEBSITE_URL}?`);
    } finally {
      setPublishing(false);
    }
  };

  // ── history ──
  const snapshot = useCallback(() => {
    history.current.push(JSON.parse(JSON.stringify(plots)));
    if (history.current.length > 60) history.current.shift();
    future.current = [];
  }, [plots]);

  const undo = useCallback(() => {
    const prev = history.current.pop();
    if (!prev) return;
    future.current.push(JSON.parse(JSON.stringify(plots)));
    setPlots(prev);
    setSelectedId(null);
  }, [plots]);

  const redo = useCallback(() => {
    const next = future.current.pop();
    if (!next) return;
    history.current.push(JSON.parse(JSON.stringify(plots)));
    setPlots(next);
  }, [plots]);

  // ── persistence (per project) ──
  // Load the selected project's saved layout whenever the project changes.
  useEffect(() => {
    setSelectedId(null);
    setDraft([]);
    history.current = [];
    future.current = [];
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + project);
      const saved = raw ? JSON.parse(raw) : null;
      setImage(saved?.image ?? null);
      setPlots(Array.isArray(saved?.plots) ? saved.plots : []);
    } catch {
      setImage(null);
      setPlots([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project]);

  const persist = useCallback(
    (img: LayoutImage | null, pl: EditorPlot[]) => {
      const key = STORAGE_PREFIX + project;
      try {
        localStorage.setItem(key, JSON.stringify({ image: img, plots: pl }));
      } catch {
        flash('Layout is large — saved plots only (image kept in memory).');
        try {
          localStorage.setItem(key, JSON.stringify({ image: null, plots: pl }));
        } catch {
          /* quota */
        }
      }
    },
    [project],
  );

  // ── coordinate helpers ──
  const toWorld = useCallback(
    (clientX: number, clientY: number): Pt => {
      const rect = svgRef.current!.getBoundingClientRect();
      const sx = clientX - rect.left;
      const sy = clientY - rect.top;
      let wx = (sx - view.x) / view.zoom;
      let wy = (sy - view.y) / view.zoom;
      if (snap) {
        wx = snapToGrid(wx, GRID);
        wy = snapToGrid(wy, GRID);
      }
      return { x: wx, y: wy };
    },
    [view, snap],
  );

  const fitView = useCallback((img: LayoutImage) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const pad = 40;
    const zoom = Math.min((wrap.clientWidth - pad) / img.width, (wrap.clientHeight - pad) / img.height, 1);
    setView({ zoom, x: (wrap.clientWidth - img.width * zoom) / 2, y: (wrap.clientHeight - img.height * zoom) / 2 });
  }, []);

  // ── upload ──
  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
    const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg)$/i.test(file.name);
    if (!isPdf && !isImage) {
      flash(`Unsupported file type: ${file.type || file.name}. Use PNG, JPG, SVG or PDF.`);
      return;
    }
    setBusy(true);
    try {
      const img = isPdf ? await renderPdf(file) : await readImage(file);
      setImage(img);
      setTimeout(() => fitView(img), 30);
      persist(img, plots);
      flash(`Loaded "${img.name}" — now draw your plots.`);
    } catch (e) {
      // Surface the real reason so uploads never fail silently.
      console.error('[LayoutEditor] upload failed:', e);
      const msg = e instanceof Error ? e.message : String(e);
      flash(`Could not read "${file.name}": ${msg}`);
    } finally {
      setBusy(false);
    }
  };

  // ── create plot ──
  const addPlot = (points: Pt[]) => {
    snapshot();
    const n = plots.length + 1;
    const c = polygonCentroid(points);
    const bbox = points.reduce(
      (a, p) => ({ minX: Math.min(a.minX, p.x), maxX: Math.max(a.maxX, p.x), minY: Math.min(a.minY, p.y), maxY: Math.max(a.maxY, p.y) }),
      { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity },
    );
    const wFt = Math.round((bbox.maxX - bbox.minX) / 6);
    const hFt = Math.round((bbox.maxY - bbox.minY) / 6);
    const plot: EditorPlot = {
      id: uid(),
      points,
      number: `P-${String(n).padStart(3, '0')}`,
      area: Math.max(600, wFt * hFt),
      dimensions: `${wFt}x${hFt}`,
      price: 4_500_000,
      facing: 'East',
      status: 'AVAILABLE',
      remarks: '',
      parkFacing: false,
      corner: false,
      wideRoad: false,
    };
    const next = [...plots, plot];
    setPlots(next);
    setSelectedId(plot.id);
    persist(image, next);
    logActivity({
      action: 'CREATE',
      entity: 'Plot',
      entityId: plot.id,
      label: plot.number,
      project: projectName,
      note: `${plot.area} sq.ft · ${plot.dimensions}`,
    });
    void c;
  };

  const updateSelected = (patch: Partial<EditorPlot>) => {
    // Snapshot the pre-edit plot the first time we touch it, then log one
    // coalesced entry once editing settles — otherwise every keystroke in a
    // text field would become its own audit line.
    const current = plots.find((p) => p.id === selectedId);
    if (current && selectedId) {
      if (editAudit.current?.id !== selectedId) {
        flushEditAudit();
        editAudit.current = { id: selectedId, before: { ...current } };
      }
      if (editTimer.current) clearTimeout(editTimer.current);
      editTimer.current = setTimeout(flushEditAudit, 1200);
    }
    setPlots((prev) => {
      const next = prev.map((p) => (p.id === selectedId ? { ...p, ...patch } : p));
      persist(image, next);
      return next;
    });
  };

  const deletePlot = (id: string) => {
    snapshot();
    const gone = plots.find((p) => p.id === id);
    const next = plots.filter((p) => p.id !== id);
    setPlots(next);
    setSelectedId(null);
    persist(image, next);
    if (gone) {
      logActivity({
        action: 'DELETE',
        entity: 'Plot',
        entityId: id,
        label: gone.number,
        project: projectName,
        note: `${gone.area} sq.ft · ${formatINR(gone.price)} base`,
      });
    }
  };

  const duplicatePlot = (id: string) => {
    const src = plots.find((p) => p.id === id);
    if (!src) return;
    snapshot();
    const clone: EditorPlot = {
      ...src,
      id: uid(),
      number: `${src.number}-copy`,
      points: src.points.map((p) => ({ x: p.x + 30, y: p.y + 30 })),
    };
    const next = [...plots, clone];
    setPlots(next);
    setSelectedId(clone.id);
    persist(image, next);
    logActivity({
      action: 'CREATE',
      entity: 'Plot',
      entityId: clone.id,
      label: clone.number,
      project: projectName,
      note: `Duplicated from ${src.number}`,
    });
  };

  // ── crop ──
  const applyCrop = async () => {
    if (!image || !cropRect) return;
    const x = Math.max(0, Math.min(cropRect.a.x, cropRect.b.x));
    const y = Math.max(0, Math.min(cropRect.a.y, cropRect.b.y));
    const w = Math.min(image.width - x, Math.abs(cropRect.a.x - cropRect.b.x));
    const h = Math.min(image.height - y, Math.abs(cropRect.a.y - cropRect.b.y));
    if (w < 12 || h < 12) {
      flash('Crop area is too small.');
      return;
    }
    setBusy(true);
    try {
      const el = await loadImageEl(image.src);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(w);
      canvas.height = Math.round(h);
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(el, x, y, w, h, 0, 0, canvas.width, canvas.height);
      const newImg: LayoutImage = { src: canvas.toDataURL('image/png'), width: canvas.width, height: canvas.height, name: image.name };
      snapshot();
      // shift existing plots so they stay aligned with the cropped image
      const shifted = plots.map((p) => ({ ...p, points: p.points.map((pt) => ({ x: pt.x - x, y: pt.y - y })) }));
      setImage(newImg);
      setPlots(shifted);
      persist(newImg, shifted);
      setCropRect(null);
      setTool('select');
      setTimeout(() => fitView(newImg), 30);
      flash('Layout cropped ✓');
    } catch {
      flash('Crop failed. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const cancelCrop = () => {
    setCropRect(null);
    setTool('select');
  };

  // Clear the crop selection whenever we leave the crop tool.
  useEffect(() => {
    if (tool !== 'crop') setCropRect(null);
  }, [tool]);

  // ── pointer handlers ──
  const onPointerDown = (e: React.PointerEvent) => {
    if (preview) return;
    const w = toWorld(e.clientX, e.clientY);
    svgRef.current?.setPointerCapture(e.pointerId);

    if (tool === 'polygon') {
      if (draft.length >= 3) {
        const first = draft[0]!;
        const d = Math.hypot(w.x - first.x, w.y - first.y);
        if (d < 14 / view.zoom) {
          addPlot(draft);
          setDraft([]);
          return;
        }
      }
      setDraft((d) => [...d, w]);
      return;
    }
    if (tool === 'rect') {
      drag.current = { mode: 'rect', startWorld: w };
      setRectPreview({ a: w, b: w });
      return;
    }
    if (tool === 'crop') {
      drag.current = { mode: 'crop', startWorld: w };
      setCropRect({ a: w, b: w });
      return;
    }
    // select / pan
    const hit = [...plots].reverse().find((p) => pointInPolygon(w, p.points));
    if (tool === 'select' && hit) {
      setSelectedId(hit.id);
      drag.current = { mode: 'move', startWorld: w, orig: hit.points, plotId: hit.id, moved: false };
    } else {
      drag.current = { mode: 'pan', startScreen: { x: e.clientX, y: e.clientY }, origView: { x: view.x, y: view.y } };
      if (tool === 'select' && !hit) setSelectedId(null);
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const w = toWorld(e.clientX, e.clientY);
    setCursor(w);
    const d = drag.current;
    if (!d) return;
    if (d.mode === 'pan') {
      setView((v) => ({ ...v, x: d.origView!.x + (e.clientX - d.startScreen!.x), y: d.origView!.y + (e.clientY - d.startScreen!.y) }));
    } else if (d.mode === 'move' && d.plotId) {
      const dx = w.x - d.startWorld!.x;
      const dy = w.y - d.startWorld!.y;
      d.moved = true;
      setPlots((prev) => prev.map((p) => (p.id === d.plotId ? { ...p, points: d.orig!.map((pt) => ({ x: pt.x + dx, y: pt.y + dy })) } : p)));
    } else if (d.mode === 'rect') {
      setRectPreview({ a: d.startWorld!, b: w });
    } else if (d.mode === 'crop') {
      setCropRect({ a: d.startWorld!, b: w });
    }
  };

  const onPointerUp = () => {
    const d = drag.current;
    if (d?.mode === 'rect' && rectPreview) {
      const { a, b } = rectPreview;
      if (Math.abs(a.x - b.x) > 8 && Math.abs(a.y - b.y) > 8) {
        addPlot([
          { x: a.x, y: a.y },
          { x: b.x, y: a.y },
          { x: b.x, y: b.y },
          { x: a.x, y: b.y },
        ]);
      }
      setRectPreview(null);
    }
    if (d?.mode === 'move' && d.moved) {
      // commit already applied; record history baseline
      history.current.push(d.orig ? [] : []); // no-op; live edits recorded on next mutation
      persist(image, plots);
    }
    drag.current = null;
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const rect = svgRef.current!.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    setView((v) => {
      const zoom = Math.min(8, Math.max(0.15, v.zoom * factor));
      // keep cursor point stationary
      const wx = (sx - v.x) / v.zoom;
      const wy = (sy - v.y) / v.zoom;
      return { zoom, x: sx - wx * zoom, y: sy - wy * zoom };
    });
  };

  // ── keyboard ──
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT') return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.metaKey || e.ctrlKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd' && selectedId) {
        e.preventDefault();
        duplicatePlot(selectedId);
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault();
        deletePlot(selectedId);
      } else if (e.key === 'Enter' && tool === 'polygon' && draft.length >= 3) {
        addPlot(draft);
        setDraft([]);
      } else if (e.key === 'Escape') {
        setDraft([]);
        setRectPreview(null);
        setCropRect(null);
      } else if (e.key === 'v') setTool('select');
      else if (e.key === 'p') setTool('polygon');
      else if (e.key === 'r') setTool('rect');
      else if (e.key === 'c') setTool('crop');
      else if (e.key === 'h') setTool('pan');
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [undo, redo, selectedId, tool, draft]); // eslint-disable-line react-hooks/exhaustive-deps

  const ptsStr = (pts: Pt[]) => pts.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Project</span>
          <select
            value={project}
            onChange={(e) => setProject(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold outline-none focus:border-primary"
          >
            {projectOptions.map((o) => (
              <option key={o.slug} value={o.slug}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mx-1 h-6 w-px bg-border" />
        <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
          {busy ? 'Loading…' : 'Upload layout'}
          <input
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,application/pdf"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
        </label>
        <span className="text-xs text-muted-foreground">PNG · JPG · SVG · PDF</span>

        <div className="mx-1 h-6 w-px bg-border" />

        {!preview && (
          <div className="flex items-center gap-1">
            {(
              [
                ['select', 'Select', 'V'],
                ['polygon', 'Polygon', 'P'],
                ['rect', 'Rect', 'R'],
                ['crop', 'Crop', 'C'],
                ['pan', 'Pan', 'H'],
              ] as [Tool, string, string][]
            ).map(([t, label, key]) => (
              <button
                key={t}
                onClick={() => setTool(t)}
                title={`${label} (${key})`}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  tool === t ? 'bg-foreground text-background' : 'hover:bg-accent'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <div className="mx-1 h-6 w-px bg-border" />
        <button onClick={undo} title="Undo (⌘Z)" className="rounded-lg px-2.5 py-2 text-sm hover:bg-accent">↺</button>
        <button onClick={redo} title="Redo (⌘⇧Z)" className="rounded-lg px-2.5 py-2 text-sm hover:bg-accent">↻</button>

        <div className="flex items-center overflow-hidden rounded-lg border border-border">
          <button onClick={() => setView((v) => ({ ...v, zoom: Math.max(0.15, v.zoom / 1.2) }))} className="px-2.5 py-1.5 hover:bg-accent">−</button>
          <span className="w-12 text-center text-xs tabular-nums">{Math.round(view.zoom * 100)}%</span>
          <button onClick={() => setView((v) => ({ ...v, zoom: Math.min(8, v.zoom * 1.2) }))} className="px-2.5 py-1.5 hover:bg-accent">+</button>
        </div>
        <button onClick={() => image && fitView(image)} className="rounded-lg px-3 py-2 text-sm hover:bg-accent">Fit</button>
        <button
          onClick={() => setSnap((s) => !s)}
          className={`rounded-lg px-3 py-2 text-sm ${snap ? 'bg-accent font-medium' : 'hover:bg-accent'}`}
        >
          Snap
        </button>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setPreview((p) => !p)}
            className={`rounded-lg px-3.5 py-2 text-sm font-semibold ${preview ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-accent'}`}
          >
            {preview ? 'Exit preview' : 'Preview'}
          </button>
          <button
            onClick={publish}
            disabled={publishing}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {publishing && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />}
            Publish to website
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 gap-3">
        {/* Canvas */}
        <div
          ref={wrapRef}
          className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-border bg-[repeating-conic-gradient(hsl(var(--muted))_0%_25%,transparent_0%_50%)] [background-position:0_0] [background-size:24px_24px]"
        >
          {!image && (
            <label className="absolute inset-0 z-10 grid cursor-pointer place-items-center text-center">
              <div className="rounded-2xl border-2 border-dashed border-border bg-card/80 px-10 py-12 backdrop-blur">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-2xl text-primary">⬆</div>
                <p className="mt-4 font-semibold">Upload your plot layout</p>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                  Drop a PNG, JPG, SVG, or PDF of your site plan. Then trace each plot with the polygon tool.
                </p>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,application/pdf"
                  className="hidden"
                  onChange={(e) => onFile(e.target.files?.[0])}
                />
              </div>
            </label>
          )}

          <svg
            ref={svgRef}
            className="h-full w-full touch-none select-none"
            style={{ cursor: tool === 'pan' ? 'grab' : tool === 'select' ? 'default' : 'crosshair' }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onWheel={onWheel}
            onMouseLeave={() => setCursor(null)}
          >
            <g transform={`translate(${view.x} ${view.y}) scale(${view.zoom})`}>
              {image && (
                <image href={image.src} x={0} y={0} width={image.width} height={image.height} />
              )}

              {/* committed plots */}
              {plots.map((p) => {
                const color = PLOT_STATUS_COLOR[p.status];
                const isSel = p.id === selectedId;
                const isHover = p.id === hoverId;
                const c = polygonCentroid(p.points);
                return (
                  <g
                    key={p.id}
                    onPointerEnter={() => setHoverId(p.id)}
                    onPointerLeave={() => setHoverId((h) => (h === p.id ? null : h))}
                  >
                    <polygon
                      points={ptsStr(p.points)}
                      fill={color}
                      fillOpacity={preview ? 0.72 : isSel ? 0.85 : isHover ? 0.7 : 0.5}
                      stroke={isSel ? '#111' : color}
                      strokeWidth={(isSel ? 2.5 : 1.5) / view.zoom}
                    />
                    <text
                      x={c.x}
                      y={c.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={13 / view.zoom}
                      fontWeight={700}
                      fill="#fff"
                      style={{ pointerEvents: 'none', paintOrder: 'stroke' }}
                      stroke="#0006"
                      strokeWidth={3 / view.zoom}
                    >
                      {p.number}
                    </text>
                    {/* vertex handles on selected */}
                    {isSel && !preview &&
                      p.points.map((pt, i) => (
                        <circle key={i} cx={pt.x} cy={pt.y} r={4 / view.zoom} fill="#fff" stroke="#111" strokeWidth={1.5 / view.zoom} />
                      ))}
                  </g>
                );
              })}

              {/* rectangle preview */}
              {rectPreview && (
                <rect
                  x={Math.min(rectPreview.a.x, rectPreview.b.x)}
                  y={Math.min(rectPreview.a.y, rectPreview.b.y)}
                  width={Math.abs(rectPreview.a.x - rectPreview.b.x)}
                  height={Math.abs(rectPreview.a.y - rectPreview.b.y)}
                  fill="#3b82f633"
                  stroke="#3b82f6"
                  strokeWidth={1.5 / view.zoom}
                />
              )}

              {/* crop rectangle */}
              {cropRect && (
                <g>
                  <rect
                    x={Math.min(cropRect.a.x, cropRect.b.x)}
                    y={Math.min(cropRect.a.y, cropRect.b.y)}
                    width={Math.abs(cropRect.a.x - cropRect.b.x)}
                    height={Math.abs(cropRect.a.y - cropRect.b.y)}
                    fill="#00000022"
                    stroke="#fff"
                    strokeWidth={2 / view.zoom}
                    strokeDasharray={`${7 / view.zoom} ${5 / view.zoom}`}
                  />
                  <rect
                    x={Math.min(cropRect.a.x, cropRect.b.x)}
                    y={Math.min(cropRect.a.y, cropRect.b.y)}
                    width={Math.abs(cropRect.a.x - cropRect.b.x)}
                    height={Math.abs(cropRect.a.y - cropRect.b.y)}
                    fill="none"
                    stroke="#111"
                    strokeWidth={1 / view.zoom}
                  />
                </g>
              )}

              {/* precision crosshair at the cursor while drawing */}
              {(tool === 'polygon' || tool === 'rect' || tool === 'crop') && cursor && !preview && (
                <g style={{ pointerEvents: 'none' }}>
                  <line x1={cursor.x - 16 / view.zoom} y1={cursor.y} x2={cursor.x + 16 / view.zoom} y2={cursor.y} stroke="#111" strokeWidth={1 / view.zoom} />
                  <line x1={cursor.x} y1={cursor.y - 16 / view.zoom} x2={cursor.x} y2={cursor.y + 16 / view.zoom} stroke="#111" strokeWidth={1 / view.zoom} />
                  <circle cx={cursor.x} cy={cursor.y} r={2.5 / view.zoom} fill="#3b82f6" stroke="#fff" strokeWidth={1 / view.zoom} />
                </g>
              )}

              {/* polygon draft */}
              {draft.length > 0 && (
                <g>
                  <polyline
                    points={ptsStr(cursor ? [...draft, cursor] : draft)}
                    fill="#3b82f622"
                    stroke="#3b82f6"
                    strokeWidth={1.5 / view.zoom}
                    strokeDasharray={`${4 / view.zoom} ${3 / view.zoom}`}
                  />
                  {draft.map((pt, i) => (
                    <circle key={i} cx={pt.x} cy={pt.y} r={5 / view.zoom} fill={i === 0 ? '#22c55e' : '#3b82f6'} stroke="#fff" strokeWidth={1.5 / view.zoom} />
                  ))}
                </g>
              )}
            </g>
          </svg>

          {/* Preview hover tooltip */}
          {preview && hoverId && cursor && (() => {
            const p = plots.find((x) => x.id === hoverId);
            if (!p) return null;
            const sx = cursor.x * view.zoom + view.x;
            const sy = cursor.y * view.zoom + view.y;
            return (
              <div className="pointer-events-none absolute z-20 w-52 rounded-xl border border-border bg-popover/95 p-3 text-sm shadow-xl backdrop-blur" style={{ left: sx + 14, top: sy + 14 }}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{p.number}</span>
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white" style={{ background: PLOT_STATUS_COLOR[p.status] }}>
                    {PLOT_STATUS_LABEL[p.status]}
                  </span>
                </div>
                <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                  <div>Area: <span className="font-medium text-foreground">{p.area} sq.ft</span></div>
                  <div>Facing: <span className="font-medium text-foreground">{p.facing}</span></div>
                  {plcPercent(p) > 0 && (
                    <div>
                      PLC:{' '}
                      <span className="font-medium text-foreground">
                        {appliedPlc(p).map((c) => c.short).join(' + ')} (+{plcPercent(p)}%)
                      </span>
                    </div>
                  )}
                  <div>Price: <span className="font-semibold text-primary">{formatINR(priceWithPlc(p.price, p))}</span></div>
                </div>
              </div>
            );
          })()}

          {/* Legend */}
          <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-border bg-card/90 px-3 py-2 text-xs backdrop-blur">
            {STATUSES.map((s) => (
              <span key={s} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: PLOT_STATUS_COLOR[s] }} />
                {PLOT_STATUS_LABEL[s]} <b className="tabular-nums">{counts[s] ?? 0}</b>
              </span>
            ))}
          </div>

          {toast && (
            <div className="absolute bottom-3 right-3 z-20 rounded-lg bg-neutral-900 px-3 py-2 text-xs font-medium text-white shadow-lg">
              {toast}
            </div>
          )}

          {tool === 'polygon' && !preview && (
            <div className="absolute left-3 top-3 rounded-lg bg-neutral-900/90 px-3 py-2 text-xs text-white">
              Click to add points · click the green start point or press <b>Enter</b> to finish · <b>Esc</b> cancels
            </div>
          )}

          {tool === 'crop' && !preview && (
            <div className="absolute left-1/2 top-3 flex -translate-x-1/2 items-center gap-2 rounded-xl bg-neutral-900/95 px-3 py-2 text-xs text-white shadow-lg">
              <span className="hidden sm:inline">Drag to select the area to keep</span>
              <button
                onClick={applyCrop}
                disabled={!cropRect || busy}
                className="rounded-md bg-emerald-600 px-3 py-1.5 font-semibold disabled:opacity-40"
              >
                {busy ? 'Cropping…' : 'Apply crop'}
              </button>
              <button onClick={cancelCrop} className="rounded-md bg-white/15 px-3 py-1.5 font-medium hover:bg-white/25">
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Right panel */}
        {!preview && (
          <div className="flex w-80 flex-col gap-3 overflow-y-auto">
            {selected ? (
              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Plot details</h3>
                  <div className="flex gap-1">
                    <button onClick={() => duplicatePlot(selected.id)} title="Duplicate (⌘D)" className="rounded-lg px-2 py-1 text-sm hover:bg-accent">⧉</button>
                    <button onClick={() => deletePlot(selected.id)} title="Delete (⌫)" className="rounded-lg px-2 py-1 text-sm text-destructive hover:bg-destructive/10">🗑</button>
                  </div>
                </div>

                <div className="mt-3 space-y-3 text-sm">
                  <Field label="Plot number">
                    <input value={selected.number} onChange={(e) => updateSelected({ number: e.target.value })} className="fld" />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Area (sq.ft)">
                      <input type="number" value={selected.area} onChange={(e) => updateSelected({ area: Number(e.target.value) })} className="fld" />
                    </Field>
                    <Field label="Dimensions">
                      <input value={selected.dimensions} onChange={(e) => updateSelected({ dimensions: e.target.value })} className="fld" />
                    </Field>
                  </div>
                  <Field label="Base price (₹)">
                    <input type="number" value={selected.price} onChange={(e) => updateSelected({ price: Number(e.target.value) })} className="fld" />
                    <span className="mt-1 block text-xs text-muted-foreground">{formatINR(selected.price)}</span>
                  </Field>

                  {/* ── PLC ── */}
                  <div className="rounded-xl border border-border bg-muted/30 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        PLC
                      </span>
                      {plcPercent(selected) > 0 && (
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[0.65rem] font-bold text-primary">
                          +{plcPercent(selected)}%
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[0.7rem] text-muted-foreground">
                      Preferential Location Charges
                    </p>

                    <div className="mt-2.5 space-y-1.5">
                      {PLC_CHARGES.map((c) => (
                        <label
                          key={c.key}
                          className="flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-accent/60"
                        >
                          <input
                            type="checkbox"
                            checked={!!selected[c.key as PlcKey]}
                            onChange={(e) => updateSelected({ [c.key]: e.target.checked })}
                          />
                          <span className="text-[0.8rem] leading-tight">
                            {c.label}
                            <span className="block text-[0.65rem] text-muted-foreground">
                              {c.note}
                            </span>
                          </span>
                          <span className="ml-auto text-[0.7rem] font-semibold text-primary">
                            +{c.pct}%
                          </span>
                        </label>
                      ))}
                    </div>

                    {/* Price breakdown */}
                    <dl className="mt-3 space-y-1 border-t border-border pt-2.5 text-[0.75rem]">
                      <div className="flex justify-between text-muted-foreground">
                        <dt>Base</dt>
                        <dd className="tabular-nums">{formatINR(selected.price)}</dd>
                      </div>
                      {appliedPlc(selected).map((c) => (
                        <div key={c.key} className="flex justify-between text-muted-foreground">
                          <dt>
                            {c.short} <span className="text-[0.68rem]">(+{c.pct}%)</span>
                          </dt>
                          <dd className="tabular-nums">
                            +{formatINR(Math.round((selected.price * c.pct) / 100))}
                          </dd>
                        </div>
                      ))}
                      <div className="flex justify-between border-t border-border pt-1.5 font-semibold">
                        <dt>Total</dt>
                        <dd className="tabular-nums text-primary">
                          {formatINR(priceWithPlc(selected.price, selected))}
                        </dd>
                      </div>
                    </dl>
                  </div>
                  <Field label="Facing">
                    <select value={selected.facing} onChange={(e) => updateSelected({ facing: e.target.value })} className="fld">
                      {FACINGS.map((f) => <option key={f}>{f}</option>)}
                    </select>
                  </Field>
                  <Field label="Status">
                    <div className="grid grid-cols-5 gap-1">
                      {STATUSES.map((s) => (
                        <button
                          key={s}
                          title={PLOT_STATUS_LABEL[s]}
                          onClick={() => updateSelected({ status: s })}
                          className={`h-8 rounded-md border-2 ${selected.status === s ? 'border-foreground' : 'border-transparent'}`}
                          style={{ background: PLOT_STATUS_COLOR[s] }}
                        />
                      ))}
                    </div>
                    <span className="mt-1 block text-xs text-muted-foreground">{PLOT_STATUS_LABEL[selected.status]}</span>
                  </Field>
                  <Field label="Remarks">
                    <textarea value={selected.remarks} onChange={(e) => updateSelected({ remarks: e.target.value })} rows={2} className="fld resize-none" />
                  </Field>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
                {image ? (
                  <>Pick the <b>Polygon</b> or <b>Rect</b> tool and draw a plot on your layout, or select an existing one.</>
                ) : (
                  <>Upload your layout to begin.</>
                )}
              </div>
            )}

            {/* Plot list */}
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-semibold">Plots</h3>
                <span className="text-xs text-muted-foreground">{plots.length}</span>
              </div>
              <ul className="max-h-60 space-y-1 overflow-y-auto">
                {plots.map((p) => (
                  <li key={p.id}>
                    <button
                      onClick={() => setSelectedId(p.id)}
                      onMouseEnter={() => setHoverId(p.id)}
                      onMouseLeave={() => setHoverId(null)}
                      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm ${p.id === selectedId ? 'bg-accent' : 'hover:bg-accent/50'}`}
                    >
                      <span className="h-3 w-3 rounded-sm" style={{ background: PLOT_STATUS_COLOR[p.status] }} />
                      <span className="font-medium">{p.number}</span>
                      {plcPercent(p) > 0 && (
                        <span
                          title={appliedPlc(p).map((c) => c.label).join(', ')}
                          className="rounded-full bg-primary/15 px-1.5 text-[0.6rem] font-bold text-primary"
                        >
                          +{plcPercent(p)}%
                        </span>
                      )}
                      <span className="ml-auto text-xs text-muted-foreground">{p.area} sq.ft</span>
                    </button>
                  </li>
                ))}
                {plots.length === 0 && <li className="py-4 text-center text-xs text-muted-foreground">No plots yet</li>}
              </ul>
            </div>
          </div>
        )}
      </div>

      <style>{`.fld{width:100%;border:1px solid hsl(var(--input));background:hsl(var(--background));border-radius:0.6rem;padding:0.5rem 0.65rem;font-size:0.85rem;outline:none}.fld:focus{border-color:hsl(var(--primary))}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
