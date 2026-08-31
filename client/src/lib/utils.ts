import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { BloodGroup } from '../types/index.js';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const BLOOD_GROUP_MAP: Record<BloodGroup, string> = {
  A_POSITIVE: 'A+',
  A_NEGATIVE: 'A-',
  B_POSITIVE: 'B+',
  B_NEGATIVE: 'B-',
  AB_POSITIVE: 'AB+',
  AB_NEGATIVE: 'AB-',
  O_POSITIVE: 'O+',
  O_NEGATIVE: 'O-',
};

export function formatBloodGroup(bloodGroup?: BloodGroup | string | null): string {
  if (!bloodGroup) return '—';
  return BLOOD_GROUP_MAP[bloodGroup as BloodGroup] || bloodGroup;
}

export function formatDate(dateInput?: string | Date | null): string {
  if (!dateInput) return 'Never';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return 'Invalid date';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

export function formatDateTime(dateInput?: string | Date | null): string {
  if (!dateInput) return '—';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return 'Invalid date';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function calculateAge(dateOfBirth?: string | Date | null): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}
