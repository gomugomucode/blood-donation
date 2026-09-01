import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/errors.js';
import { sendError } from '../utils/response.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // 1. Custom operational application errors
  if (err instanceof AppError) {
    logger.warn(`Operational error: ${err.message}`, {
      requestId: req.id,
      statusCode: err.statusCode,
      method: req.method,
      path: req.path,
    });
    sendError(res, err.message, err.statusCode, err.errors);
    return;
  }

  // 2. Prisma Database Specific Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint violation (P2002)
    if (err.code === 'P2002') {
      const target = Array.isArray(err.meta?.target) ? (err.meta.target as string[]).join(', ') : 'field';
      logger.warn(`Prisma unique constraint violation on ${target}`, { requestId: req.id });
      sendError(res, `A record with this ${target} already exists.`, 409);
      return;
    }

    // Record not found (P2025)
    if (err.code === 'P2025') {
      logger.warn('Prisma record not found', { requestId: req.id });
      sendError(res, 'The requested record was not found.', 404);
      return;
    }

    // Foreign key constraint failure (P2003)
    if (err.code === 'P2003') {
      logger.warn('Prisma foreign key dependency failed', { requestId: req.id });
      sendError(res, 'Related record dependency failed.', 400);
      return;
    }

    // Transaction serialization conflict / write conflict (P2034)
    if (err.code === 'P2034') {
      logger.warn('Prisma transaction write conflict / serialization deadlock', { requestId: req.id });
      sendError(res, 'The operation could not be completed due to a concurrent conflict. Please retry.', 409);
      return;
    }
  }

  // 3. Log unexpected internal errors server-side (with privacy sanitizer and requestId)
  logger.error(`[Unhandled Server Error]: ${err.message}`, {
    requestId: req.id,
    name: err.name,
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
    method: req.method,
    path: req.path,
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
