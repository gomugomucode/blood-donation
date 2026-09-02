import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { prisma } from './config/db.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { requestIdMiddleware } from './middleware/request-id.middleware.js';
import { csrfProtection, isOriginAllowed, getAllowedOrigins } from './middleware/csrf.middleware.js';
import { logger } from './utils/logger.js';

export const createApp = (): Express => {
  const app = express();

  // Trust first proxy (Render / Cloudflare) for accurate client IP resolution in rate limiters
  app.set('trust proxy', 1);

  // 1. Request Correlation ID (X-Request-ID)
  app.use(requestIdMiddleware);

  // 2. Security Headers (Helmet)
  app.use(
    helmet({
      contentSecurityPolicy: false, // SPA client handles CSP or static host
      crossOriginEmbedderPolicy: false,
    })
  );

  // 3. Strict CORS Configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
          callback(null, true);
        } else {
          logger.warn('Blocked request due to CORS origin mismatch', {
            origin,
            allowedOrigins: getAllowedOrigins(),
          });
          callback(null, false);
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
      exposedHeaders: ['X-Request-ID'],
    })
  );

  // 4. CSRF / Origin Verification
  app.use(csrfProtection);

  // 5. Multi-Tier Rate Limiting
  const isTest = env.NODE_ENV === 'test';

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isTest ? 10000 : 30, // 30 requests per 15 min per IP for auth
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isTest,
    message: {
      success: false,
      message: 'Too many authentication attempts. Please try again in 15 minutes.',
    },
  });

  const donorResponseLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isTest ? 10000 : 60, // 60 responses per 15 min per IP for opportunity/notification actions
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isTest,
    message: {
      success: false,
      message: 'Too many opportunity or notification response actions. Please slow down.',
    },
  });

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isTest ? 10000 : 500, // 500 requests per 15 min per IP for general API
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isTest,
    message: {
      success: false,
      message: 'Rate limit exceeded. Please reduce request frequency.',
    },
  });

  app.use('/api/v1/auth/login', authLimiter);
  app.use('/api/v1/auth/register', authLimiter);
  app.use('/api/v1/auth/forgot-password', authLimiter);
  app.use('/api/v1/auth/reset-password', authLimiter);

  // Dedicated donor response endpoints rate limiting (both plural and singular aliases)
  app.use('/api/v1/donors/opportunities/:id/accept', donorResponseLimiter);
  app.use('/api/v1/donor/opportunities/:id/accept', donorResponseLimiter);
  app.use('/api/v1/donors/opportunities/:id/decline', donorResponseLimiter);
  app.use('/api/v1/donor/opportunities/:id/decline', donorResponseLimiter);
  app.use('/api/v1/donors/opportunities/:id/view', donorResponseLimiter);
  app.use('/api/v1/donor/opportunities/:id/view', donorResponseLimiter);
  app.use('/api/v1/donors/notifications/:id/read', donorResponseLimiter);
  app.use('/api/v1/donor/notifications/:id/read', donorResponseLimiter);
  app.use('/api/v1/donors/notifications/read-all', donorResponseLimiter);
  app.use('/api/v1/donor/notifications/read-all', donorResponseLimiter);

  app.use('/api/v1', apiLimiter);

  // 6. General Middlewares
  if (!isTest) {
    app.use(morgan('dev'));
  }
  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // 7. Root & Favicon Handlers
  app.get('/favicon.ico', (_req: Request, res: Response): void => {
    res.status(204).end();
  });

  app.get('/', (req: Request, res: Response): void => {
    res.status(200).json({
      name: 'HemaCare Blood Donation Management API',
      status: 'online',
      version: '1.0.0',
      clientUrl: env.CLIENT_URL || 'http://localhost:5173',
      requestId: req.id,
      endpoints: {
        health: '/health',
        liveness: '/health/live',
        readiness: '/health/ready',
        apiRoot: '/api/v1',
      },
      message: 'Welcome to HemaCare API. Open the frontend at http://localhost:5173 to access the web application.',
    });
  });

  // 8. Health, Liveness & Readiness Handlers
  app.get('/health/live', (req: Request, res: Response): void => {
    res.status(200).json({
      status: 'alive',
      timestamp: new Date().toISOString(),
      service: 'HemaCare Blood Donation API',
      requestId: req.id,
    });
  });

  app.get('/health/ready', async (req: Request, res: Response): Promise<void> => {
    try {
      const [diag] = await prisma.$queryRawUnsafe<Array<{ current_database: string; version: string }>>(
        "SELECT current_database(), split_part(version(), ' ', 2) as version;"
      );
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        service: 'HemaCare Blood Donation API',
        database: 'connected',
        databaseName: diag?.current_database,
        engineVersion: diag?.version,
        version: '1.0.0',
        requestId: req.id,
      });
    } catch (error) {
      res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        service: 'HemaCare Blood Donation API',
        database: 'disconnected',
        error: env.NODE_ENV === 'production' ? 'Database connection error' : (error as Error).message,
        requestId: req.id,
      });
    }
  });

  const healthCheckHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const [diag] = await prisma.$queryRawUnsafe<Array<{ current_database: string; version: string }>>(
        "SELECT current_database(), split_part(version(), ' ', 2) as version;"
      );
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'Blood Donation Management API',
        database: 'connected',
        databaseName: diag?.current_database,
        engineVersion: diag?.version,
        version: '1.0.0',
        requestId: req.id,
      });
    } catch (error) {
      res.status(503).json({
        status: 'degraded',
        timestamp: new Date().toISOString(),
        service: 'Blood Donation Management API',
        database: 'disconnected',
        error: env.NODE_ENV === 'production' ? 'Database connection error' : (error as Error).message,
        requestId: req.id,
      });
    }
  };

  app.get('/health', healthCheckHandler);
  app.get('/api/v1/health', healthCheckHandler);

  // 9. Mount API Routes (Canonical /api/v1 with /api and direct route aliases)
  app.use('/api/v1', routes);
  app.use('/api', routes);
  app.use(routes);

  // 10. 404 and Global Error Handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export const app = createApp();
export default app;
