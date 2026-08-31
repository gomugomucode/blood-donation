import { z } from 'zod';
import { OpportunityStatus, DeclineReason } from '../types/index.js';

export const createOpportunitiesBatchSchema = z.object({
  donorIds: z
    .array(z.string().uuid({ message: 'Each donor ID must be a valid UUID.' }))
    .min(1, { message: 'At least one candidate donor must be selected.' })
    .max(10, { message: 'A maximum of 10 candidate donors can be notified per batch.' }),
});

export const declineOpportunitySchema = z.object({
  reason: z.nativeEnum(DeclineReason).optional(),
  notes: z.string().trim().max(300, { message: 'Notes cannot exceed 300 characters.' }).optional(),
});

export const cancelOpportunitySchema = z.object({
  reason: z.string().trim().max(300, { message: 'Cancellation reason cannot exceed 300 characters.' }).optional(),
});

export const opportunityIdParamSchema = z.object({
  id: z.string().uuid({ message: 'Opportunity ID must be a valid UUID.' }),
});

export const notificationIdParamSchema = z.object({
  id: z.string().uuid({ message: 'Notification ID must be a valid UUID.' }),
});

export const opportunityQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z.nativeEnum(OpportunityStatus).optional(),
});

export const notificationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  unreadOnly: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val === 'true'),
});

export type CreateOpportunitiesBatchInput = z.infer<typeof createOpportunitiesBatchSchema>;
export type DeclineOpportunityInput = z.infer<typeof declineOpportunitySchema>;
export type CancelOpportunityInput = z.infer<typeof cancelOpportunitySchema>;
export type OpportunityQueryInput = z.infer<typeof opportunityQuerySchema>;
export type NotificationQueryInput = z.infer<typeof notificationQuerySchema>;
