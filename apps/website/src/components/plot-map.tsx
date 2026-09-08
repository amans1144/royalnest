'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PLOT_STATUS_COLOR,
  PLOT_STATUS_LABEL,
  appliedPlc,
  plcPercent,
  type PlotStatus,
} from '@spb/types';
import { pointInPolygon, polygonCentroid } from '@spb/utils';
import { projects } from '../lib/mock-data';
import { BRAND } from '../lib/site-data';
import { useMapStore } from '../lib/map-store';
import { SectionHeading } from './section-heading';
import { ParallaxScene, AmenitiesScene } from './parallax';
import { Search, WhatsApp, Phone } from './icons';

interface Pt {
  x: number;
  y: number;
}
interface ViewPlot {
  id: string;
  number: string;
  points: Pt[];
  area: number;
  /** Base price — PLC is added on top, matching the admin's plot editor. */
  price: number;
  facing: string;
  status: PlotStatus;
  /* PLC flags published from the admin */
  parkFacing?: boolean;
  corner?: boolean;
  wideRoad?: boolean;
}
interface Published {
  image: { src: string; width: number; height: number } | null;
  plots: ViewPlot[];
  updatedAt: string | null;
}

// ── Demo fallback grid (shown until a project's layout is published) ─────────
const COLS = 12;
const ROWS = 6;
const CW = 74;
const CH = 86;
const GAP = 10;
const ROAD = 34;
const FACINGS = ['East', 'West', 'North', 'South', 'North-East', 'South-West'];
const CYCLE: PlotStatus[] = ['AVAILABLE', 'AVAILABLE', 'AVAILABLE', 'RESERVED', 'BOOKED', 'SOLD', 'BLOCKED'];
const DEMO_W = 60 * 2 + COLS * (CW + GAP) + ROAD;
const DEMO_H = 50 * 2 + ROWS * (CH + GAP) + ROAD;

function demoPlots(): ViewPlot[] {
  const out: ViewPlot[] = [];
  let n = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      n += 1;
      const x = 60 + c * (CW + GAP) + (c >= 6 ? ROAD : 0);
      const y = 50 + r * (CH + GAP) + (r >= 3 ? ROAD : 0);
      out.push({
        id: `d${n}`,
        number: `${String.fromCharCode(65 + r)}-${String(c + 1).padStart(2, '0')}`,
        points: [
          { x, y },
          { x: x + CW, y },
          { x: x + CW, y: y + CH },
          { x, y: y + CH },
        ],
        area: 1200 + ((n * 60) % 900),
        price: 4_500_000 + ((n * 137_000) % 6_000_000),
        facing: FACINGS[n % FACINGS.length]!,
        corner: c === 0 || c === COLS - 1 || r === 0 || r === ROWS - 1,
        parkFacing: n % 5 === 0,
        wideRoad: n % 3 === 0,
        status: CYCLE[(n * 3) % CYCLE.length]!,
      });
    }
  }
  return out;
}

export function PlotMap() {
  const slug = useMapStore((s) => s.slug);
  const setSlug = useMapStore((s) => s.setSlug);
  const projectName = projects.find((p) => p.slug === slug)?.name ?? 'Project';

  const [published, setPublished] = useState<Published | null>(null);
  const [demo] = useState<ViewPlot[]>(() => demoPlots());
  const [hovered, setHovered] = useState<ViewPlot | null>(null);
  const [selected, setSelected] = useState<ViewPlot | null>(null);
  const [filter, setFilter] = useState<PlotStatus | 'ALL'>('ALL');
  const [query, setQuery] = useState('');
  const [view, setView] = useState({ zoom: 1, x: 0, y: 0 });
  const [tip, setTip] = useState<{ x: number; y: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pan = useRef<null | { sx: number; sy: number; ox: number; oy: number; moved: boolean }>(null);

  // Fetch the selected project's layout (and poll for live updates).
  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/layout?project=${encodeURIComponent(slug)}`, { cache: 'no-store' });
      setPublished((await res.json()) as Published);
    } catch {
      setPublished(null);
    }
  }, [slug]);

  useEffect(() => {
    setSelected(null);
    load();
    const id = setInterval(load, 6000);
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, [load]);

  const isLive = !!(published && published.image && published.plots.length > 0);
  const plots: ViewPlot[] = isLive ? published!.plots : demo;
  const viewW = isLive ? published!.image!.width : DEMO_W;
  const viewH = isLive ? published!.image!.height : DEMO_H;

  const counts = useMemo(() => {
    const c: Partial<Record<PlotStatus, number>> = {};
    for (const p of plots) c[p.status] = (c[p.status] ?? 0) + 1;
    return c;
  }, [plots]);

  const statuses: PlotStatus[] = ['AVAILABLE', 'RESERVED', 'BOOKED', 'SOLD', 'BLOCKED'];
  const matches = (p: ViewPlot) => !query || p.number.toLowerCase().includes(query.toLowerCase());
  const filtering = filter !== 'ALL' || query.trim() !== '';
  const isMatch = (p: ViewPlot) => (filter === 'ALL' || p.status === filter) && matches(p);
  const ptsStr = (pts: Pt[]) => pts.map((p) => `${p.x},${p.y}`).join(' ');

  const renderPlot = (p: ViewPlot, bright: boolean) => {
    const color = PLOT_STATUS_COLOR[p.status];
    const isSel = selected?.id === p.id;
    const c = polygonCentroid(p.points);
    return (
      <g key={`${bright ? 'hi' : 'lo'}-${p.id}`} onMouseEnter={() => setHovered(p)} style={{ cursor: 'pointer' }}>
        <polygon
          points={ptsStr(p.points)}
          fill={color}
          fillOpacity={hovered?.id === p.id || isSel ? 0.95 : bright ? 0.92 : isLive ? 0.5 : 0.68}
          stroke={isSel ? '#111' : color}
          strokeWidth={(isSel ? 3 : 1) / view.zoom}
        />
        {(bright || !filtering) && (
          <text x={c.x} y={c.y} textAnchor="middle" dominantBaseline="middle" fontSize={13 / view.zoom} fontWeight={700} fill="#fff" stroke="#0006" strokeWidth={3 / view.zoom} style={{ paintOrder: 'stroke', pointerEvents: 'none' }}>
            {p.number}
          </text>
        )}
      </g>
    );
  };

  // ── zoom / pan ──
  const clampZoom = (z: number) => Math.min(8, Math.max(0.2, z));

  const fit = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const pad = 24;
    const zoom = clampZoom(Math.min((el.clientWidth - pad) / viewW, (el.clientHeight - pad) / viewH));
    setView({ zoom, x: (el.clientWidth - viewW * zoom) / 2, y: (el.clientHeight - viewH * zoom) / 2 });
  }, [viewW, viewH]);

  useEffect(() => {
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [fit, isLive]);

  const zoomAt = (clientX: number, clientY: number, factor: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;
    setView((v) => {
      const zoom = clampZoom(v.zoom * factor);
      const wx = (sx - v.x) / v.zoom;
      const wy = (sy - v.y) / v.zoom;
      return { zoom, x: sx - wx * zoom, y: sy - wy * zoom };
    });
  };

  const zoomCenter = (factor: number) => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    zoomAt(r.left + r.width / 2, r.top + r.height / 2, factor);
  };

  const toWorld = (clientX: number, clientY: number): Pt => {
    const rect = svgRef.current!.getBoundingClientRect();
    return { x: (clientX - rect.left - view.x) / view.zoom, y: (clientY - rect.top - view.y) / view.zoom };
  };

  // Native, non-passive wheel handler so scroll-to-zoom doesn't scroll the page.
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.12 : 1 / 1.12);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Until a real layout is published from the admin, the section shows a
   * "coming soon" panel rather than the demo grid.
   *
   * The demo rendered invented Available / Reserved / Booked / Sold counts in
   * the same UI the live map uses. A visitor cannot tell seeded numbers from
   * real stock, so it read as live availability for plots that do not exist.
   * A small "Sample layout" chip is not enough of a correction for that.
   */
  if (!isLive) {
    return (
      <ParallaxScene
        id="availability"
        className="bg-gradient-to-b from-[hsl(var(--secondary))] via-background to-[hsl(var(--secondary))] py-24"
      >
        <AmenitiesScene />
        <div className="container-x relative">
          <SectionHeading
            eyebrow="Live Availability"
            title="Interactive Plot Map"
            subtitle="Plot-by-plot availability for this project is being finalised. Speak to an advisor for current availability and pricing."
          />

          <div className="surface mt-10 px-6 py-14 text-center sm:px-10 sm:py-20">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Search width={28} height={28} />
            </div>
            <h3 className="mt-5 font-display text-2xl font-semibold sm:text-3xl">
              Interactive Plot Map — Coming Soon
            </h3>
            <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
              Live plot availability for {projectName} will appear here once the layout is
              released. In the meantime our team can share current availability, sizes and
              pricing directly.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <a
                href="#contact"
                className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5"
              >
                Enquire About Availability
              </a>
              <a
                href={BRAND.whatsapp}
                target="_blank"
                rel="noreferrer noopener"
                className="rounded-xl border border-primary/40 px-5 py-3 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:bg-primary/[0.06]"
              >
                Ask on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </ParallaxScene>
    );
  }

  return (
    <ParallaxScene
      id="availability"
      className="bg-gradient-to-b from-[hsl(var(--secondary))] via-background to-[hsl(var(--secondary))] py-24"
    >
      <AmenitiesScene />
      {/* `relative` is required: AmenitiesScene is absolutely positioned, and a
          positioned element paints above static content regardless of DOM order
          — without this the whole map UI renders underneath the scenery. */}
      <div className="container-x relative">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Live Availability"
            title="Interactive Plot Map"
            subtitle={`Explore ${projectName}’s site layout — hover to preview, click for details, book instantly.`}
          />
          <label className="flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2.5 text-sm font-medium">
            <span className="text-muted-foreground">Project</span>
            <select value={slug} onChange={(e) => setSlug(e.target.value)} className="bg-transparent font-semibold outline-none">
              {projects.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium" style={{ background: isLive ? 'rgb(16 185 129 / 0.15)' : 'rgb(148 163 184 / 0.18)' }}>
          <span className={`relative flex h-2 w-2`}>
            {isLive && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />}
            <span className={`relative inline-flex h-2 w-2 rounded-full ${isLive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
          </span>
          <span className={isLive ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}>
            {isLive ? `Live layout · ${plots.length} plots` : 'Sample layout'}
          </span>
        </div>

        {/* Controls */}
        <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <Chip active={filter === 'ALL'} onClick={() => setFilter('ALL')} label={`All (${plots.length})`} />
            {statuses.map((s) => (
              <Chip key={s} active={filter === s} onClick={() => setFilter(s)} label={`${PLOT_STATUS_LABEL[s]} (${counts[s] ?? 0})`} color={PLOT_STATUS_COLOR[s]} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm">
              <Search width={16} height={16} className="text-muted-foreground" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search plot no." className="w-32 bg-transparent outline-none" />
            </label>
            <div className="flex items-center overflow-hidden rounded-full border border-border">
              <button className="px-3 py-2 hover:bg-accent" onClick={() => zoomCenter(1 / 1.2)} aria-label="Zoom out">−</button>
              <span className="w-12 text-center text-sm tabular-nums">{Math.round(view.zoom * 100)}%</span>
              <button className="px-3 py-2 hover:bg-accent" onClick={() => zoomCenter(1.2)} aria-label="Zoom in">+</button>
            </div>
            <button onClick={fit} className="rounded-full border border-border px-3 py-2 text-sm hover:bg-accent">Fit</button>
          </div>
        </div>

        {/* Map + panel */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
          <div
            ref={wrapRef}
            className="relative h-[440px] overflow-hidden rounded-3xl border border-border/60 bg-card shadow-inner sm:h-[560px]"
            onMouseLeave={() => { setHovered(null); setTip(null); }}
          >
            <svg
              ref={svgRef}
              /* `touch-pan-y`, not `touch-none`: the map is 440px tall on a
                 phone, so swallowing vertical touch would trap the reader
                 inside it with no way to scroll past. The browser keeps page
                 scroll; horizontal drag still reaches the pan handlers, and
                 the zoom buttons + Fit cover what pinch would have done. */
              className="block h-full w-full touch-pan-y select-none"
              style={{ cursor: pan.current ? 'grabbing' : 'grab' }}
              onPointerDown={(e) => {
                svgRef.current?.setPointerCapture(e.pointerId);
                pan.current = { sx: e.clientX, sy: e.clientY, ox: view.x, oy: view.y, moved: false };
              }}
              onPointerMove={(e) => {
                const rect = wrapRef.current?.getBoundingClientRect();
                if (rect) setTip({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                const pn = pan.current;
                if (!pn) return;
                const dx = e.clientX - pn.sx;
                const dy = e.clientY - pn.sy;
                if (Math.abs(dx) + Math.abs(dy) > 3) pn.moved = true;
                setView((v) => ({ ...v, x: pn.ox + dx, y: pn.oy + dy }));
              }}
              onPointerUp={(e) => {
                const pn = pan.current;
                pan.current = null;
                if (pn && !pn.moved) {
                  const w = toWorld(e.clientX, e.clientY);
                  const cands = filtering ? plots.filter(isMatch) : plots;
                  const hit = [...cands].reverse().find((p) => pointInPolygon(w, p.points));
                  setSelected(hit ?? null);
                }
              }}
            >
              <g transform={`translate(${view.x} ${view.y}) scale(${view.zoom})`}>
                {isLive && published!.image && (
                  <image href={published!.image.src} x={0} y={0} width={viewW} height={viewH} />
                )}
                {/* base layer — under the dark overlay when filtering */}
                {(filtering ? plots.filter((p) => !isMatch(p)) : plots).map((p) => renderPlot(p, false))}

                {/* dim the ENTIRE map (image + non-matching plots) when a filter is active */}
                {filtering && <rect x={0} y={0} width={viewW} height={viewH} fill="#05070d" fillOpacity={0.7} />}

                {/* highlighted layer — only the filtered plots, drawn bright on top */}
                {filtering && plots.filter(isMatch).map((p) => renderPlot(p, true))}
              </g>
            </svg>

            <div className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-neutral-900/70 px-3 py-1 text-xs font-medium text-white">
              Scroll to zoom · drag to pan · click a plot
            </div>

            <AnimatePresence>
              {hovered && tip && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}
                  style={{ left: Math.min(tip.x + 16, (wrapRef.current?.clientWidth ?? 400) - 220), top: tip.y + 16 }}
                  className="pointer-events-none absolute z-20 w-52 rounded-xl border border-border bg-card/95 p-3 text-sm shadow-xl backdrop-blur"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Plot {hovered.number}</span>
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white" style={{ background: PLOT_STATUS_COLOR[hovered.status] }}>
                      {PLOT_STATUS_LABEL[hovered.status]}
                    </span>
                  </div>
                  <dl className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <div className="flex justify-between"><dt>Area</dt><dd className="font-medium text-foreground">{hovered.area} sq.ft</dd></div>
                    <div className="flex justify-between"><dt>Facing</dt><dd className="font-medium text-foreground">{hovered.facing}</dd></div>
                    {plcPercent(hovered) > 0 && (
                      <div className="flex justify-between gap-2">
                        <dt>PLC</dt>
                        <dd className="text-right font-medium text-foreground">
                          {appliedPlc(hovered).map((c) => c.short).join(' + ')}
                          <span className="text-primary"> +{plcPercent(hovered)}%</span>
                        </dd>
                      </div>
                    )}
                  </dl>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="rounded-3xl border border-border/60 bg-card p-6">
            {selected ? (
              <div className="animate-fade-up">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">Selected plot</div>
                    <div className="font-display text-3xl font-semibold">{selected.number}</div>
                  </div>
                  <button onClick={() => setSelected(null)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-accent">✕</button>
                </div>
                <span className="mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ background: PLOT_STATUS_COLOR[selected.status] }}>
                  {PLOT_STATUS_LABEL[selected.status]}
                </span>
                <dl className="mt-5 space-y-3 text-sm">
                  <Row label="Area" value={`${selected.area} sq.ft`} />
                  <Row label="Facing" value={selected.facing} />
                  {appliedPlc(selected).map((c) => (
                    <Row key={c.key} label={c.label} value={`+${c.pct}%`} />
                  ))}
                  {/* No rupee figure is published for a plot — the applicable
                      rate is confirmed by an advisor on enquiry. */}
                  <Row label="Rate" value="On request" highlight />
                </dl>
                <div className="mt-6 space-y-2">
                  <a
                    href={`${BRAND.whatsapp}?text=${encodeURIComponent(`Hi, I'd like details for plot ${selected.number} at ${projectName}.`)}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    <WhatsApp width={16} height={16} /> Enquire on WhatsApp
                  </a>
                  <a
                    href={BRAND.phoneHref}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary/40 py-3 text-sm font-medium transition-colors hover:bg-primary/[0.06]"
                  >
                    <Phone width={16} height={16} /> Call {BRAND.phone}
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center py-10 text-center">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Search width={22} height={22} />
                </div>
                <p className="mt-4 font-medium">Select a plot</p>
                <p className="mt-1 text-sm text-muted-foreground">Click any plot on the map to see its size, facing and enquiry options.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ParallaxScene>
  );
}

function Chip({ active, onClick, label, color }: { active: boolean; onClick: () => void; label: string; color?: string }) {
  return (
    <button onClick={onClick} className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${active ? 'border-foreground bg-foreground text-background' : 'border-border hover:bg-accent'}`}>
      {color && <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />}
      {label}
    </button>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={highlight ? 'font-display text-lg font-semibold text-primary' : 'font-medium'}>{value}</dd>
    </div>
  );
}
