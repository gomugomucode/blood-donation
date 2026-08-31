import { z } from 'zod';
import { BloodGroup, RequestStatus, RequestUrgency } from '@prisma/client';

export const createBloodRequestSchema = z.object({
  bloodGroup: z.nativeEnum(BloodGroup, {
    errorMap: () => ({ message: 'A valid ABO/Rh blood group is required.' }),
  }),
  unitsRequired: z
    .number({ invalid_type_error: 'Units required must be a number.' })
    .int('Units required must be an integer.')
    .min(1, 'At least 1 unit of blood is required.')
    .max(50, 'Units required cannot exceed 50 units per request.'),
  urgency: z
    .nativeEnum(RequestUrgency, {
      errorMap: () => ({ message: 'Urgency must be LOW, NORMAL, HIGH, or CRITICAL.' }),
    })
    .default(RequestUrgency.NORMAL),
  location: z
    .string()
    .trim()
    .min(2, 'Location must be at least 2 characters.')
    .max(120, 'Location cannot exceed 120 characters.'),
  requiredBy: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Required by date must be a valid ISO date string.',
    })
    .refine(
      (val) => {
        const d = new Date(val);
        // Allow within current day / future
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return d >= now;
      },
      {
        message: 'Required by date cannot be in the past.',
      }
    ),
  hospitalName: z
    .string()
    .trim()
    .min(2, 'Hospital/facility name must be at least 2 characters.')
    .max(150, 'Hospital/facility name cannot exceed 150 characters.'),
  contactName: z
    .string()
    .trim()
    .min(2, 'Contact person name must be at least 2 characters.')
    .max(100, 'Contact person name cannot exceed 100 characters.'),
  contactNumber: z
    .string()
    .trim()
    .min(6, 'Contact number must be at least 6 digits.')
    .max(25, 'Contact number cannot exceed 25 characters.'),
  patientReference: z
    .string()
    .trim()
    .max(50, 'Patient reference code cannot exceed 50 characters.')
    .optional()
    .nullable(),
  notes: z
    .string()
    .trim()
    .max(500, 'Clinical notes cannot exceed 500 characters.')
    .optional()
    .nullable(),
});

export const updateBloodRequestSchema = z.object({
  bloodGroup: z.nativeEnum(BloodGroup).optional(),
  unitsRequired: z.number().int().min(1).max(50).optional(),
  urgency: z.nativeEnum(RequestUrgency).optional(),
  location: z.string().trim().min(2).max(120).optional(),
  requiredBy: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Required by date must be a valid ISO date string.',
    })
    .optional(),
  hospitalName: z.string().trim().min(2).max(150).optional(),
  contactName: z.string().trim().min(2).max(100).optional(),
  contactNumber: z.string().trim().min(6).max(25).optional(),
  patientReference: z.string().trim().max(50).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
});

export const cancelBloodRequestSchema = z.object({
  reason: z.string().trim().max(250, 'Cancellation reason cannot exceed 250 characters.').optional(),
});

export const bloodRequestQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(RequestStatus).optional(),
  bloodGroup: z.nativeEnum(BloodGroup).optional(),
  urgency: z.nativeEnum(RequestUrgency).optional(),
  search: z.string().trim().max(100, 'Search query cannot exceed 100 characters.').optional(),
});

export const notifyDonorCandidateSchema = z.object({
  donorId: z.string().uuid('Donor ID must be a valid UUID.'),
  channel: z.enum(['SMS', 'EMAIL', 'IN_APP']).default('IN_APP'),
  message: z.string().trim().max(300, 'Message cannot exceed 300 characters.').optional(),
});

export const bloodRequestIdParamSchema = z.object({
  id: z.string().uuid('Blood request ID must be a valid UUID.'),
});

export type CreateBloodRequestInput = z.infer<typeof createBloodRequestSchema>;
export type UpdateBloodRequestInput = z.infer<typeof updateBloodRequestSchema>;
export type CancelBloodRequestInput = z.infer<typeof cancelBloodRequestSchema>;
export type BloodRequestQueryInput = z.infer<typeof bloodRequestQuerySchema>;
export type NotifyDonorCandidateInput = z.infer<typeof notifyDonorCandidateSchema>;
