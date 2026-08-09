import { z } from 'zod';
import { AreaUnit, ProjectStatus, ProjectType } from '../enums';

export const createProjectSchema = z.object({
  name: z.string().min(2).max(160),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Must be a URL-safe slug')
    .optional(),
  tagline: z.string().max(200).optional(),
  description: z.string().max(20000).optional(),
  type: z.nativeEnum(ProjectType),
  status: z.nativeEnum(ProjectStatus).default(ProjectStatus.DRAFT),
  priceStartFrom: z.number().nonnegative().optional(),
  priceEndAt: z.number().nonnegative().optional(),
  areaUnit: z.nativeEnum(AreaUnit).default(AreaUnit.SQ_FT),
  addressLine: z.string().max(300).optional(),
  city: z.string().min(1).max(120),
  state: z.string().min(1).max(120),
  country: z.string().max(120).default('India'),
  pincode: z.string().max(12).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  reraNumber: z.string().max(64).optional(),
  possessionDate: z.coerce.date().optional(),
  launchDate: z.coerce.date().optional(),
  isFeatured: z.boolean().default(false),
  isInvestment: z.boolean().default(false),
  isPublished: z.boolean().default(false),
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(400).optional(),
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = createProjectSchema.partial();
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

/** Public project listing filters. */
export const projectSearchSchema = z.object({
  q: z.string().optional(),
  type: z.nativeEnum(ProjectType).optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
  city: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  isFeatured: z.coerce.boolean().optional(),
  isInvestment: z.coerce.boolean().optional(),
  sort: z.string().optional(),
});
export type ProjectSearch = z.infer<typeof projectSearchSchema>;
