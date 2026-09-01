import axios, { AxiosError } from 'axios';

const getApiBaseUrl = (): string => {
  const envUrl = (import.meta.env.VITE_API_URL || '').trim();
  if (!envUrl) {
    return '/api/v1';
  }
  const clean = envUrl.replace(/\/+$/, '');
  // If the user configured just the origin like "https://blood-donation-6vcp.onrender.com", append "/api/v1"
  if (!clean.endsWith('/api/v1') && !clean.endsWith('/api')) {
    return `${clean}/api/v1`;
  }
  return clean;
};

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});


export const getApiErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; errors?: Array<{ message: string }> }>;
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }
    if (axiosError.response?.data?.errors && axiosError.response.data.errors.length > 0) {
      return axiosError.response.data.errors.map((e) => e.message).join(', ');
    }
    if (axiosError.message) {
      return axiosError.message;
    }
  }
  return error instanceof Error ? error.message : 'An unexpected error occurred';
};
