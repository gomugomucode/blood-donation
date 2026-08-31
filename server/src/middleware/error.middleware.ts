import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/errors.js';
import { sendError } from '../utils/response.js';
import { env } from '../config/env.js';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // 1. Custom operational application errors
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode, err.errors);
    return;
  }

  // 2. Prisma Database Specific Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint violation (P2002)
    if (err.code === 'P2002') {
      const target = Array.isArray(err.meta?.target) ? (err.meta.target as string[]).join(', ') : 'field';
      sendError(res, `A record with this ${target} already exists.`, 409);
      return;
    }

    // Record not found (P2025)
    if (err.code === 'P2025') {
      sendError(res, 'The requested record was not found.', 404);
      return;
    }

    // Foreign key constraint failure (P2003)
    if (err.code === 'P2003') {
      sendError(res, 'Related record dependency failed.', 400);
      return;
    }
  }

  // 3. Log unexpected internal errors server-side (without leaking secrets)
  console.error('[Unhandled Server Error]:', {
    name: err.name,
    message: err.message,
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // 4. Safe sanitized client response
  sendError(
    res,
    env.NODE_ENV === 'production' ? 'Internal server error. Please contact technical support.' : err.message,
    500
  );
};

export const notFoundHandler = (req: Request, res: Response): void => {
  sendError(res, `Endpoint ${req.method} ${req.originalUrl} not found`, 404);
};
