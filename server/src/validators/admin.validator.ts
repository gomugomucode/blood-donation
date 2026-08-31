import { z } from 'zod';
import { BloodGroup } from '@prisma/client';
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
    .default('10')
    .transform((val) => Math.min(100, Math.max(1, parseInt(val, 10) || 10))),
  search: z.string().trim().optional(),
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
    .transform((val) => (val ? new Date(val) : new Date())),
  notes: z
    .string()
    .max(500, 'Notes cannot exceed 500 characters')
    .trim()
    .optional(),
});

export const donorIdParamSchema = z.object({
  id: z.string().uuid('Invalid donor ID format'),
});

export type AdminDonorQueryInput = z.infer<typeof adminDonorQuerySchema>;
export type AdminUpdateDonorInput = z.infer<typeof adminUpdateDonorSchema>;
export type AdminCreateDonationInput = z.infer<typeof adminCreateDonationSchema>;
