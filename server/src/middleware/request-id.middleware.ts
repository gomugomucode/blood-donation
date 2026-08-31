import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

/**
 * Attaches a unique X-Request-ID to incoming requests and sets the response header.
 * Allows safe incoming request IDs (UUID / alphanumeric) or generates a fresh v4 UUID.
 */
export const requestIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const incomingId = req.headers['x-request-id'];
  let requestId: string;

  if (
    typeof incomingId === 'string' &&
    incomingId.length > 0 &&
    incomingId.length <= 64 &&
    /^[a-zA-Z0-9_-]+$/.test(incomingId)
  ) {
    requestId = incomingId;
  } else {
    requestId = randomUUID();
  }

  req.id = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
};
