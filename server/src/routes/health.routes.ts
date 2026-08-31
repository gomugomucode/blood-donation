import { Router, Request, Response } from 'express';
import { prisma } from '../config/db.js';
import { notificationWorker } from '../workers/notification.worker.js';
import { env } from '../config/env.js';

const router = Router();

/**
 * Liveness probe: Confirms that the process is running and accepting events.
 */
router.get('/live', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    memoryUsageMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
  });
});

/**
 * Readiness probe: Confirms that dependencies (Database, Worker) are operational.
 */
router.get('/ready', async (_req: Request, res: Response) => {
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatencyMs = Date.now() - dbStart;

    const workerStatus = notificationWorker.getStatus();

    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      services: {
        database: {
          status: 'healthy',
          latencyMs: dbLatencyMs,
        },
        notificationWorker: {
          status: workerStatus.isRunning ? 'running' : 'idle',
        },
      },
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connectivity probe failed',
    });
  }
});

/**
 * Backward-compatible root health check.
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
    });
  } catch {
    res.status(503).json({
      status: 'error',
      message: 'Service degraded',
    });
  }
});

export default router;
