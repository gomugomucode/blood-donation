import { z } from 'zod';
import { bloodGroupEnum } from './auth.validator.js';

export const adminDonorQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => Math.max(1, parseInt(val, 10) || 1)),
  limit: z
    .string()
    .optional()
    .default('20')
    .transform((val) => Math.min(100, Math.max(1, parseInt(val, 10) || 20))),
  search: z
    .string()
    .trim()
    .max(100, 'Search query cannot exceed 100 characters')
    .optional(),
  bloodGroup: bloodGroupEnum.optional(),
  includeDeactivated: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
});

export const adminUpdateDonorSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name cannot exceed 100 characters')
    .trim()
    .optional(),
  dateOfBirth: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid date of birth format. Must be an ISO date string (YYYY-MM-DD)',
    })
    .transform((val) => new Date(val))
    .refine((dob) => dob <= new Date(), {
      message: 'Date of birth cannot be in the future',
    })
    .refine((dob) => dob.getFullYear() > 1900, {
      message: 'Date of birth must be after year 1900',
    })
    .optional(),
  address: z
    .string()
    .min(5, 'Address must be at least 5 characters')
    .max(255, 'Address cannot exceed 255 characters')
    .trim()
    .optional(),
  contactNumber: z
    .string()
    .min(7, 'Contact number must be at least 7 digits')
    .max(20, 'Contact number cannot exceed 20 characters')
    .regex(/^[+0-9\s\-()]+$/, 'Contact number contains invalid characters')
    .trim()
    .optional(),
  bloodGroup: bloodGroupEnum.optional(),
  preferences: z.record(z.any()).optional(),
});

export const adminCreateDonationSchema = z.object({
  location: z
    .string({ required_error: 'Donation location or facility name is required' })
    .min(2, 'Location must be at least 2 characters')
    .max(150, 'Location cannot exceed 150 characters')
    .trim(),
  donatedAt: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Invalid donation date format. Must be an ISO date string',
    })
    .transform((val) => (val ? new Date(val) : new Date()))
    .refine((d) => d <= new Date(Date.now() + 24 * 60 * 60 * 1000), {
      message: 'Donation date cannot be in the future',
    }),
  notes: z
    .string()
    .max(500, 'Clinical notes cannot exceed 500 characters')
    .trim()
    .optional(),
  bloodRequestId: z
    .string()
    .uuid('Invalid blood request ID format: must be a valid UUID')
    .optional()
    .nullable(),
});

export const donorIdParamSchema = z.object({
  id: z.string().uuid('Invalid donor ID format: must be a valid UUID'),
});

export const auditLogQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => Math.max(1, parseInt(val, 10) || 1)),
  limit: z
    .string()
    .optional()
    .default('20')
    .transform((val) => Math.min(100, Math.max(1, parseInt(val, 10) || 20))),
  action: z.string().max(50).optional(),
  targetType: z.string().max(50).optional(),
});

export type AdminDonorQueryInput = z.infer<typeof adminDonorQuerySchema>;
export type AdminUpdateDonorInput = z.infer<typeof adminUpdateDonorSchema>;
export type AdminCreateDonationInput = z.infer<typeof adminCreateDonationSchema>;
