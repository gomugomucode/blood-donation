import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../config/db.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';
import { AuthenticatedRequest, Role, AuthUser } from '../types/index.js';

interface JwtPayload {
  sub?: string;
  userId?: string;
  role: Role;
  iat?: number;
  exp?: number;
}

export const authenticate = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // Check HttpOnly Cookie first
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    // Fallback to Bearer token in Authorization header
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new UnauthorizedError('Authentication required. Please log in.');
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET, {
        algorithms: ['HS256'],
      }) as JwtPayload;
    } catch {
      throw new UnauthorizedError('Invalid or expired authentication session. Please log in again.');
    }

    const targetUserId = decoded.sub || decoded.userId;
    if (!targetUserId) {
      throw new UnauthorizedError('Malformed session token subject.');
    }

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        donorProfile: {
          select: {
            id: true,
            deletedAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedError('User account not found or session revoked.');
    }

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      donorProfileId: user.donorProfile?.id,
    };

    req.user = authUser;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireRole = (...allowedRoles: Role[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError('You do not have permission to perform this action')
      );
    }

    next();
  };
};
