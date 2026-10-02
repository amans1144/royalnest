'use client';

import type { PlotStatus } from '@spb/types';
import { publishError, publishHeaders } from './publish';
import { getShared, setShared } from './shared-state';

/**
 * The plot-layout store shared by the Plot Editor (which traces plots onto a
 * site plan) and Plot Inventory (which lists and edits them).
 *
 * Layouts are held on the website, one document per project slug, and mirrored
 * in memory so these reads can stay synchronous (see lib/shared-state). That is
 * what makes a map traced on one laptop appear on every other.
 *
 * "Publish" is still a separate, deliberate act: saving shares the layout with
 * other admins, publishing pushes a snapshot to the public site for buyers.
 */

export const LAYOUT_PREFIX = 'spb_layout_';

/** Re-exported so the many existing importers of `WEBSITE_URL` from this
 *  module keep working; the value itself lives in lib/site-config to avoid an
 *  import cycle through the shared-state layer. */
export { WEBSITE_URL } from './site-config';
import { WEBSITE_URL as SITE } from './site-config';
export const WEBSITE_API = `${SITE}/api/layout`;

export interface Pt {
  x: number;
  y: number;
}

export interface LayoutImage {
  src: string;
  width: number;
  height: number;
  name?: string;
}

export interface StoredPlot {
  id: string;
  points: Pt[];
  number: string;
  area: number;
  dimensions: string;
  /** Base rate before PLC. PLC is always re-derived, never baked in. */
  price: number;
  facing: string;
  status: PlotStatus;
  remarks: string;
  /* PLC flags */
  parkFacing?: boolean;
  corner?: boolean;
  wideRoad?: boolean;
}

export interface StoredLayout {
  image: LayoutImage | null;
  plots: StoredPlot[];
}

const EMPTY: StoredLayout = { image: null, plots: [] };

/* ══ Resolution-independent coordinates ══════════════════════════════════════

   Plot polygons used to be STORED in the pixel space of whatever site-plan
   image was uploaded. Replace that image — even with the same plan re-exported
   at a different size — and every polygon landed somewhere wrong, so the whole
   township had to be traced again.

   Storage is now fractions of the image's width and height (0–1), which no
   longer depend on pixel dimensions at all. The editor still works in pixels,
   because that is what its hit-testing, dragging and SVG rendering need; the
   conversion happens here, at the boundary, so nothing upstream changed.
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * Fractions are <= 1 by definition; pixel coordinates on any real site plan
 * are in the hundreds. A small tolerance above 1 allows for a point nudged
 * just outside the image edge.
 */
export const looksNormalized = (points: Pt[]): boolean =>
  points.length > 0 && points.every((p) => Math.abs(p.x) <= 1.5 && Math.abs(p.y) <= 1.5);

const toFractions = (points: Pt[], img: LayoutImage): Pt[] =>
  points.map((p) => ({ x: p.x / img.width, y: p.y / img.height }));

const toPixels = (points: Pt[], img: LayoutImage): Pt[] =>
  points.map((p) => ({ x: p.x * img.width, y: p.y * img.height }));

/** Stored form -> the pixel space the editor and inventory work in. */
function hydratePlots(plots: StoredPlot[], img: LayoutImage | null): StoredPlot[] {
  if (!img) return plots;
  return plots.map((p) =>
    // Layouts traced before this change are already pixels: leave them, and
    // the next save converts them. Nobody has to re-trace anything.
    looksNormalized(p.points) ? { ...p, points: toPixels(p.points, img) } : p,
  );
}

/** Editor pixel space -> the resolution-independent stored form. */
function dehydratePlots(plots: StoredPlot[], img: LayoutImage | null): StoredPlot[] {
  if (!img) return plots;
  return plots.map((p) =>
    looksNormalized(p.points) ? p : { ...p, points: toFractions(p.points, img) },
  );
}

/**
 * Map every plot from one image's framing onto another's.
 *
 * Two landmarks the operator can identify on both maps (a plot corner, the
 * entrance gate) define a similarity transform — uniform scale, rotation and
 * translation — which is exactly the class of difference between two renders of
 * the same site: re-exported larger, cropped tighter, or rotated to portrait.
 * Both inputs and outputs are fractions, so this is independent of pixel size.
 */
export function realignPoints(
  points: Pt[],
  from: [Pt, Pt],
  to: [Pt, Pt],
): Pt[] {
  const fdx = from[1].x - from[0].x;
  const fdy = from[1].y - from[0].y;
  const tdx = to[1].x - to[0].x;
  const tdy = to[1].y - to[0].y;

  const fromLen = Math.hypot(fdx, fdy);
  // Degenerate input — the two landmarks are the same point. Treat it as a
  // pure translation rather than dividing by zero and producing NaN polygons.
  if (fromLen < 1e-9) {
    const dx = to[0].x - from[0].x;
    const dy = to[0].y - from[0].y;
    return points.map((p) => ({ x: p.x + dx, y: p.y + dy }));
  }

  const scale = Math.hypot(tdx, tdy) / fromLen;
  const rot = Math.atan2(tdy, tdx) - Math.atan2(fdy, fdx);
  const cos = Math.cos(rot) * scale;
  const sin = Math.sin(rot) * scale;

  return points.map((p) => {
    const ox = p.x - from[0].x;
    const oy = p.y - from[0].y;
    return {
      x: to[0].x + ox * cos - oy * sin,
      y: to[0].y + ox * sin + oy * cos,
    };
  });
}

/** Read a project's saved layout. Returns an empty layout if none exists. */
export function readLayout(slug: string): StoredLayout {
  if (typeof window === 'undefined' || !slug) return EMPTY;
  const saved = getShared<Partial<StoredLayout> | null>(LAYOUT_PREFIX + slug, null);
  if (!saved) return EMPTY;
  const image = saved.image ?? null;
  const plots = Array.isArray(saved.plots) ? saved.plots : [];
  // Stored as fractions; callers work in the image's pixel space.
  return { image, plots: hydratePlots(plots, image) };
}

/**
 * Persist a layout for every admin.
 *
 * The old localStorage quota dance is gone — the website stores these, and its
 * limit is a 24 MB request body rather than a ~5 MB per-origin budget. Failures
 * now surface through sharedError() instead of silently dropping the image.
 */
export function writeLayout(slug: string, layout: StoredLayout): boolean {
  if (typeof window === 'undefined' || !slug) return false;
  setShared(LAYOUT_PREFIX + slug, {
    ...layout,
    plots: dehydratePlots(layout.plots, layout.image),
  });
  return true;
}

/** Patch one plot in place and persist. Returns the updated plot list. */
export function updatePlot(
  slug: string,
  plotId: string,
  patch: Partial<StoredPlot>,
): StoredPlot[] {
  const layout = readLayout(slug);
  const plots = layout.plots.map((p) => (p.id === plotId ? { ...p, ...patch } : p));
  writeLayout(slug, { ...layout, plots });
  return plots;
}

/** Remove a plot and persist. Returns the remaining plots. */
export function deletePlot(slug: string, plotId: string): StoredPlot[] {
  const layout = readLayout(slug);
  const plots = layout.plots.filter((p) => p.id !== plotId);
  writeLayout(slug, { ...layout, plots });
  return plots;
}

/** Push the layout to the public website so buyers see the change. */
export async function publishLayout(
  slug: string,
  layout: StoredLayout,
): Promise<{ ok: boolean; count?: number; error?: string }> {
  try {
    const res = await fetch(WEBSITE_API, {
      method: 'POST',
      headers: publishHeaders(),
      // Published in the same resolution-independent form, so the public map
      // keeps working when the site plan is re-exported at another size.
      body: JSON.stringify({
        projectId: slug,
        image: layout.image,
        plots: dehydratePlots(layout.plots, layout.image),
      }),
    });
    if (!res.ok) return { ok: false, error: await publishError(res, SITE) };
    const body = (await res.json()) as { count?: number };
    return { ok: true, count: body.count ?? layout.plots.length };
  } catch {
    return { ok: false, error: `Could not reach the website at ${SITE}` };
  }
}
