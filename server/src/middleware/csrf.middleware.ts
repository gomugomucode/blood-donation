import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const DEFAULT_ALLOWED_ORIGINS = [
  env.CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
].filter(Boolean);

/**
 * Strict Origin / CSRF verification middleware for state-changing browser requests.
 */
export const csrfProtection = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // 1. Safe read-only methods are exempt
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  // 2. Health check endpoints are exempt
  if (req.path === '/health' || req.path === '/api/v1/health' || req.path.startsWith('/health/')) {
    return next();
  }

  const origin = req.headers['origin'];
  const referer = req.headers['referer'];

  // If Origin header is present, validate it against allowed origins
  if (typeof origin === 'string') {
    const isAllowed = DEFAULT_ALLOWED_ORIGINS.some((allowed) => {
      try {
        return new URL(origin).origin === new URL(allowed).origin;
      } catch {
        return origin === allowed;
      }
    });

    if (!isAllowed) {
      logger.warn('Blocked request due to CSRF origin mismatch', {
        requestId: req.id,
        method: req.method,
        path: req.path,
        origin,
      });

      res.status(403).json({
        success: false,
        error: {
          code: 'CSRF_ORIGIN_FORBIDDEN',
          message: 'Cross-site request forgery protection blocked this request: invalid Origin.',
          requestId: req.id,
        },
      });
      return;
    }
  } else if (typeof referer === 'string' && env.NODE_ENV === 'production') {
    // In production, verify referer if origin is omitted
    const isAllowedReferer = DEFAULT_ALLOWED_ORIGINS.some((allowed) => {
      try {
        return new URL(referer).origin === new URL(allowed).origin;
      } catch {
        return false;
      }
    });

    if (!isAllowedReferer) {
      logger.warn('Blocked request due to CSRF referer mismatch', {
        requestId: req.id,
        method: req.method,
        path: req.path,
        referer,
      });

      res.status(403).json({
        success: false,
        error: {
          code: 'CSRF_REFERER_FORBIDDEN',
          message: 'Cross-site request forgery protection blocked this request: invalid Referer.',
          requestId: req.id,
        },
      });
      return;
    }
  }

  next();
};
