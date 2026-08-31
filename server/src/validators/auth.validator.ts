import { z } from 'zod';
import { BloodGroup } from '@prisma/client';

export const bloodGroupEnum = z.nativeEnum(BloodGroup, {
  errorMap: () => ({ message: 'Invalid blood group. Must be one of: A+, A-, B+, B-, AB+, AB-, O+, O- format' }),
});

export const registerSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Please provide a valid email address')
    .max(255, 'Email cannot exceed 255 characters')
    .trim()
    .toLowerCase(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password cannot exceed 128 characters'),
  fullName: z
    .string({ required_error: 'Full name is required' })
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name cannot exceed 100 characters')
    .trim(),
  dateOfBirth: z
    .string({ required_error: 'Date of birth is required' })
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid date of birth format. Must be an ISO date string (YYYY-MM-DD)',
    })
    .transform((val) => new Date(val))
    .refine((dob) => dob <= new Date(), {
      message: 'Date of birth cannot be in the future',
    })
    .refine((dob) => dob.getFullYear() > 1900, {
      message: 'Date of birth must be after year 1900',
    }),
  address: z
    .string({ required_error: 'Address is required' })
    .min(5, 'Address must be at least 5 characters')
    .max(255, 'Address cannot exceed 255 characters')
    .trim(),
  contactNumber: z
    .string({ required_error: 'Contact number is required' })
    .min(7, 'Contact number must be at least 7 digits')
    .max(20, 'Contact number cannot exceed 20 characters')
    .regex(/^[+0-9\s\-()]+$/, 'Contact number contains invalid characters')
    .trim(),
  bloodGroup: bloodGroupEnum,
  preferences: z.record(z.any()).optional().default({}),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Please provide a valid email address')
    .max(255, 'Email cannot exceed 255 characters')
    .trim()
    .toLowerCase(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required')
    .max(128, 'Password cannot exceed 128 characters'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
