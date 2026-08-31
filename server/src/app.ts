import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';

export const createApp = (): Express => {
  const app = express();

  // 1. Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Managed separately or for SPA compatibility
      crossOriginEmbedderPolicy: false,
    })
  );

  // 2. Strict CORS Configuration (Never use '*' for authenticated apps)
  const allowedOrigins = [env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'];
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, or same-origin)
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

  // 3. Rate Limiting for Auth Endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Max 100 requests per 15 minutes per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many authentication attempts from this IP, please try again in 15 minutes.',
    },
  });
  app.use('/api/v1/auth', authLimiter);

  // 4. General Middlewares
  if (env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }
  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // 5. Mount API Routes
  app.use('/api/v1', routes);

  // 6. 404 and Global Error Handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export const app = createApp();
export default app;
