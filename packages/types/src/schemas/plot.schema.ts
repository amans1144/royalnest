import { z } from 'zod';
import { AreaUnit, PlotFacing, PlotStatus } from '../enums';

/** A single polygon vertex in layout pixel space. */
export const pointSchema = z.object({
  x: z.number(),
  y: z.number(),
});
export type Point = z.infer<typeof pointSchema>;

/** Plot polygon — min 3 vertices to form an area. */
export const polygonSchema = z.array(pointSchema).min(3, 'A plot needs at least 3 vertices');
export type Polygon = z.infer<typeof polygonSchema>;

export const createPlotSchema = z.object({
  plotNumber: z.string().min(1).max(32),
  block: z.string().max(32).optional(),
  sector: z.string().max(32).optional(),
  phase: z.string().max(32).optional(),
  area: z.number().positive(),
  areaUnit: z.nativeEnum(AreaUnit).default(AreaUnit.SQ_FT),
  dimensions: z.string().max(32).optional(),
  facing: z.nativeEnum(PlotFacing).optional(),
  roadWidthFt: z.number().nonnegative().optional(),
  isCorner: z.boolean().default(false),
  basePrice: z.number().nonnegative(),
  pricePerUnit: z.number().nonnegative().optional(),
  plcCharges: z.number().nonnegative().optional(),
  plcType: z.string().max(48).optional(),
  status: z.nativeEnum(PlotStatus).default(PlotStatus.AVAILABLE),
  colorOverride: z
    .string()
    .regex(/^#([0-9a-fA-F]{6})$/, 'Must be a #RRGGBB hex color')
    .optional(),
  polygon: polygonSchema,
  rotation: z.number().default(0),
  zIndex: z.number().int().default(0),
  remarks: z.string().max(2000).optional(),
});
export type CreatePlotInput = z.infer<typeof createPlotSchema>;

export const updatePlotSchema = createPlotSchema.partial();
export type UpdatePlotInput = z.infer<typeof updatePlotSchema>;

/** Editor "save" payload — bulk upsert of polygons for a layout. */
export const bulkUpsertPlotsSchema = z.object({
  layoutVersion: z.number().int().nonnegative(), // optimistic concurrency guard
  upserts: z.array(createPlotSchema.extend({ id: z.string().cuid().optional() })),
  deletes: z.array(z.string().cuid()).default([]),
});
export type BulkUpsertPlotsInput = z.infer<typeof bulkUpsertPlotsSchema>;

export const changePlotStatusSchema = z.object({
  status: z.nativeEnum(PlotStatus),
  reason: z.string().max(500).optional(),
});
export type ChangePlotStatusInput = z.infer<typeof changePlotStatusSchema>;

export const changePlotPriceSchema = z.object({
  basePrice: z.number().nonnegative(),
  note: z.string().max(500).optional(),
});
export type ChangePlotPriceInput = z.infer<typeof changePlotPriceSchema>;

/** Public/admin plot search filters. */
export const plotSearchSchema = z.object({
  q: z.string().optional(), // plot number contains
  status: z.nativeEnum(PlotStatus).optional(),
  facing: z.nativeEnum(PlotFacing).optional(),
  isCorner: z.coerce.boolean().optional(),
  minArea: z.coerce.number().optional(),
  maxArea: z.coerce.number().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  minRoadWidth: z.coerce.number().optional(),
  sort: z.string().optional(), // e.g. "-basePrice", "area"
});
export type PlotSearch = z.infer<typeof plotSearchSchema>;

/** Realtime payload emitted on `plot.updated`. */
export interface PlotUpdatedEvent {
  id: string;
  projectId: string;
  status: PlotStatus;
  color: string;
  totalPrice?: number | null;
}
