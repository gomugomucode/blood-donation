import { z } from 'zod';

export const bloodGroups = [
  'A_POSITIVE',
  'A_NEGATIVE',
  'B_POSITIVE',
  'B_NEGATIVE',
  'AB_POSITIVE',
  'AB_NEGATIVE',
  'O_POSITIVE',
  'O_NEGATIVE',
] as const;

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address')
    .trim()
    .toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(2, 'Full name must be at least 2 characters')
      .max(100, 'Full name cannot exceed 100 characters')
      .trim(),
    dateOfBirth: z
      .string()
      .min(1, 'Date of birth is required')
      .refine((val) => {
        const d = new Date(val);
        return !isNaN(d.getTime()) && d < new Date();
      }, 'Please enter a valid past date of birth'),
    bloodGroup: z.enum(bloodGroups, {
      errorMap: () => ({ message: 'Please select a valid blood group' }),
    }),
    contactNumber: z
      .string()
      .min(7, 'Contact number must be at least 7 digits')
      .max(20, 'Contact number cannot exceed 20 characters')
      .regex(/^[+0-9\s\-()]+$/, 'Please enter a valid phone number')
      .trim(),
    address: z
      .string()
      .min(5, 'Address must be at least 5 characters')
      .max(255, 'Address cannot exceed 255 characters')
      .trim(),
    email: z
      .string()
      .min(1, 'Email address is required')
      .email('Please enter a valid email address')
      .trim()
      .toLowerCase(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .max(100, 'Password is too long'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const profileSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name cannot exceed 100 characters')
    .trim(),
  contactNumber: z
    .string()
    .min(7, 'Contact number must be at least 7 digits')
    .max(20, 'Contact number cannot exceed 20 characters')
    .regex(/^[+0-9\s\-()]+$/, 'Please enter a valid phone number')
    .trim(),
  address: z
    .string()
    .min(5, 'Address must be at least 5 characters')
    .max(255, 'Address cannot exceed 255 characters')
    .trim(),
});

export const adminEditDonorSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name cannot exceed 100 characters')
    .trim(),
  dateOfBirth: z
    .string()
    .min(1, 'Date of birth is required'),
  bloodGroup: z.enum(bloodGroups, {
    errorMap: () => ({ message: 'Please select a valid blood group' }),
  }),
  contactNumber: z
    .string()
    .min(7, 'Contact number must be at least 7 digits')
    .max(20, 'Contact number cannot exceed 20 characters')
    .trim(),
  address: z
    .string()
    .min(5, 'Address must be at least 5 characters')
    .max(255, 'Address cannot exceed 255 characters')
    .trim(),
});

export const recordDonationSchema = z.object({
  location: z
    .string()
    .min(2, 'Facility / location is required')
    .max(150, 'Location cannot exceed 150 characters')
    .trim(),
  donatedAt: z.string().optional(),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type ProfileFormValues = z.infer<typeof profileSchema>;
export type AdminEditDonorFormValues = z.infer<typeof adminEditDonorSchema>;
export type RecordDonationFormValues = z.infer<typeof recordDonationSchema>;
