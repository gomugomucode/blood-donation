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

export const createApp = (): Express => {
  const app = express();

  // 1. Security Headers (Helmet)
  app.use(
    helmet({
      contentSecurityPolicy: false, // SPA client handles CSP or static host
      crossOriginEmbedderPolicy: false,
    })
  );

  // 2. Strict CORS Configuration
  const allowedOrigins = [
    env.CLIENT_URL,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile, curl, or same-origin)
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`CORS Error: Origin ${origin} is not allowed`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // 3. Multi-Tier Rate Limiting
  // Skip rate limiting in automated test runs
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
  app.use('/api/v1', apiLimiter);

  // 4. General Middlewares
  if (!isTest) {
    app.use(morgan('dev'));
  }
  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // 5. Root & Health Check Handlers
  app.get('/favicon.ico', (_req: Request, res: Response): void => {
    res.status(204).end();
  });

  app.get('/', (_req: Request, res: Response): void => {
    res.status(200).json({
      name: 'HemaCare Blood Donation Management API',
      status: 'online',
      version: '1.0.0',
      clientUrl: env.CLIENT_URL || 'http://localhost:5173',
      endpoints: {
        health: '/health',
        apiRoot: '/api/v1',
      },
      message: 'Welcome to HemaCare API. Open the frontend at http://localhost:5173 to access the web application.',
    });
  });

  const healthCheckHandler = async (_req: Request, res: Response): Promise<void> => {
    try {
      // Verify database reachability
      await prisma.$queryRaw`SELECT 1`;
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'Blood Donation Management API',
        database: 'connected',
        version: '1.0.0',
      });
    } catch (error) {
      res.status(503).json({
        status: 'degraded',
        timestamp: new Date().toISOString(),
        service: 'Blood Donation Management API',
        database: 'disconnected',
        error: env.NODE_ENV === 'production' ? 'Database connection error' : (error as Error).message,
      });
    }
  };

  app.get('/health', healthCheckHandler);
  app.get('/api/v1/health', healthCheckHandler);

  // 6. Mount API Routes
  app.use('/api/v1', routes);

  // 7. 404 and Global Error Handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export const app = createApp();
export default app;
