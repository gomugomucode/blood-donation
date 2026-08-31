import { Response } from 'express';
import { ApiResponse } from '../types/index.js';

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200
): Response => {
  const responseBody: ApiResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
  };
  return res.status(statusCode).json(responseBody);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 500,
  errors?: Array<{ field: string; message: string }>
): Response => {
  const responseBody: ApiResponse = {
    success: false,
    message,
    ...(errors && errors.length > 0 && { errors }),
  };
  return res.status(statusCode).json(responseBody);
};
