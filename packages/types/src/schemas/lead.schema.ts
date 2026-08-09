import { z } from 'zod';
import { LeadPriority, LeadSource, LeadStatus } from '../enums';

export const createLeadSchema = z.object({
  name: z.string().min(1).max(160),
  email: z.string().email().optional(),
  phone: z.string().regex(/^\+?[0-9]{7,15}$/, 'Invalid phone number'),
  source: z.nativeEnum(LeadSource).default(LeadSource.WEBSITE),
  priority: z.nativeEnum(LeadPriority).default(LeadPriority.MEDIUM),
  budgetMin: z.number().nonnegative().optional(),
  budgetMax: z.number().nonnegative().optional(),
  message: z.string().max(4000).optional(),
  projectId: z.string().cuid().optional(),
  utmSource: z.string().max(120).optional(),
  utmMedium: z.string().max(120).optional(),
  utmCampaign: z.string().max(120).optional(),
});
export type CreateLeadInput = z.infer<typeof createLeadSchema>;

export const updateLeadSchema = z.object({
  status: z.nativeEnum(LeadStatus).optional(),
  priority: z.nativeEnum(LeadPriority).optional(),
  assigneeId: z.string().cuid().nullable().optional(),
  nextFollowUpAt: z.coerce.date().nullable().optional(),
  lostReason: z.string().max(500).optional(),
});
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;

export const addLeadActivitySchema = z.object({
  type: z.enum(['note', 'call', 'email', 'whatsapp', 'meeting']),
  title: z.string().max(200).optional(),
  body: z.string().max(4000).optional(),
});
export type AddLeadActivityInput = z.infer<typeof addLeadActivitySchema>;
