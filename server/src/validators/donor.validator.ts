import { z } from 'zod';
import { NotificationChannel } from '../types/index.js';

export const donorPreferencesSchema = z
  .object({
    allowBloodRequestNotifications: z.boolean().optional(),
    preferredNotificationChannel: z.nativeEnum(NotificationChannel).optional(),
    preferredContactTime: z.enum(['ANYTIME', 'MORNING', 'AFTERNOON', 'EVENING']).optional(),
    locationSharingConsent: z.boolean().optional(),
  })
  .passthrough();

export const updateDonorProfileSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name cannot exceed 100 characters')
    .trim()
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
  preferences: donorPreferencesSchema.optional(),
});

export type DonorPreferencesInput = z.infer<typeof donorPreferencesSchema>;
export type UpdateDonorProfileInput = z.infer<typeof updateDonorProfileSchema>;
