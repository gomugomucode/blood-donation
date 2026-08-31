import axios, { AxiosError } from 'axios';

export const api = axios.create({
  baseURL: '/api/v1',
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
