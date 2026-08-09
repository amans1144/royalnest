'use client';

import type { PlotStatus } from '@spb/types';
import { publishError, publishHeaders } from './publish';

/**
 * The plot-layout store shared by the Plot Editor (which traces plots onto a
 * site plan) and Plot Inventory (which lists and edits them). Layouts live in
 * localStorage per project slug until the NestJS API + Postgres are wired in;
 * "publish" pushes a snapshot to the public website's layout endpoint.
 */

export const LAYOUT_PREFIX = 'spb_layout_';

/** The public site that renders the plot map — the website dev server, not the
 *  admin's own port. Override with NEXT_PUBLIC_WEBSITE_URL. */
export const WEBSITE_URL = process.env.NEXT_PUBLIC_WEBSITE_URL ?? 'http://localhost:3000';
export const WEBSITE_API = `${WEBSITE_URL}/api/layout`;

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

/** Read a project's saved layout. Returns an empty layout if none exists. */
export function readLayout(slug: string): StoredLayout {
  if (typeof window === 'undefined' || !slug) return EMPTY;
  try {
    const raw = localStorage.getItem(LAYOUT_PREFIX + slug);
    if (!raw) return EMPTY;
    const saved = JSON.parse(raw) as Partial<StoredLayout>;
    return {
      image: saved.image ?? null,
      plots: Array.isArray(saved.plots) ? saved.plots : [],
    };
  } catch {
    return EMPTY;
  }
}

/**
 * Persist a layout. Site-plan images are large, so on a quota error we retry
 * without the image rather than losing the plot data.
 */
export function writeLayout(slug: string, layout: StoredLayout): boolean {
  if (typeof window === 'undefined' || !slug) return false;
  const key = LAYOUT_PREFIX + slug;
  try {
    localStorage.setItem(key, JSON.stringify(layout));
    return true;
  } catch {
    try {
      localStorage.setItem(key, JSON.stringify({ image: null, plots: layout.plots }));
    } catch {
      /* quota exhausted */
    }
    return false;
  }
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
      body: JSON.stringify({ projectId: slug, image: layout.image, plots: layout.plots }),
    });
    if (!res.ok) return { ok: false, error: await publishError(res, WEBSITE_URL) };
    const body = (await res.json()) as { count?: number };
    return { ok: true, count: body.count ?? layout.plots.length };
  } catch {
    return { ok: false, error: `Could not reach the website at ${WEBSITE_URL}` };
  }
}
