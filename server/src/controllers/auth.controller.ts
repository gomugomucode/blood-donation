import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import { sendSuccess } from '../utils/response.js';
import { AuthenticatedRequest } from '../types/index.js';
import { env } from '../config/env.js';

const COOKIE_NAME = 'token';

const getCookieOptions = () => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: (env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax' | 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
});

export class AuthController {
  public register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await authService.register(req.body);
      
      // Set secure HttpOnly cookie
      res.cookie(COOKIE_NAME, result.token, getCookieOptions());

      sendSuccess(
        res,
        {
          user: result.user,
          token: result.token, // Also provided in payload for flexible client handling
        },
        'Account registered successfully',
        201
      );
    } catch (error) {
      next(error);
    }
  };

  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await authService.login(req.body);

      // Set secure HttpOnly cookie
      res.cookie(COOKIE_NAME, result.token, getCookieOptions());

      sendSuccess(
        res,
        {
          user: result.user,
          token: result.token,
        },
        'Authenticated successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  public logout = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.clearCookie(COOKIE_NAME, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: (env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax' | 'strict',
        path: '/',
      });

      sendSuccess(res, null, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  };

  public getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }
      const user = await authService.getMe(req.user.id);
      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();
