import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Returns all normalized allowed origins, parsing comma-separated URLs and trimming trailing slashes.
 */
export const getAllowedOrigins = (): string[] => {
  const configured = (env.CLIENT_URL || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const defaults = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'http://localhost:5000',
    'http://127.0.0.1:5000',
    'https://client-sigma-peach.vercel.app',
    'https://client-sigma-peach.vercel.app'
  ];

  const unique = new Set<string>();
  for (const item of [...configured, ...defaults]) {
    try {
      unique.add(new URL(item).origin);
    } catch {
      unique.add(item.replace(/\/+$/, ''));
    }
  }
  return Array.from(unique);
};

/**
 * Verifies if an incoming Origin or Referer header matches the allowed list.
 */
export const isOriginAllowed = (origin: string | undefined): boolean => {
  if (!origin) return true; // same-origin or curl/mobile
  const allowed = getAllowedOrigins();
  try {
    const originUrl = new URL(origin).origin;
    return allowed.some((allowedOrigin) => {
      try {
        return new URL(allowedOrigin).origin === originUrl;
      } catch {
        return allowedOrigin === originUrl;
      }
    });
  } catch {
    const cleaned = origin.replace(/\/+$/, '');
    return allowed.includes(cleaned);
  }
};

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
    if (!isOriginAllowed(origin)) {
      logger.warn('Blocked request due to CSRF origin mismatch', {
        requestId: req.id,
        method: req.method,
        path: req.path,
        origin,
        allowedOrigins: getAllowedOrigins(),
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
    if (!isOriginAllowed(referer)) {
      logger.warn('Blocked request due to CSRF referer mismatch', {
        requestId: req.id,
        method: req.method,
        path: req.path,
        referer,
        allowedOrigins: getAllowedOrigins(),
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
