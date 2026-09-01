import { execSync } from 'child_process';
import bcrypt from 'bcryptjs';
import { app } from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/db.js';
import { logger } from './utils/logger.js';
import { notificationWorker } from './workers/notification.worker.js';

const runMigrations = async () => {
  if (env.NODE_ENV === 'test') return;
  try {
    logger.info('Applying database migrations (npx prisma migrate deploy)...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    logger.info('Database migrations applied successfully');
  } catch (error) {
    logger.warn('Database migration check on startup encountered a warning or error', {
      error: (error as Error).message,
    });
  }
};

const ensureAdminUser = async () => {
  try {
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    if (adminCount === 0) {
      const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 12);
      await prisma.user.create({
        data: {
          email: env.ADMIN_EMAIL.toLowerCase().trim(),
          passwordHash,
          role: 'ADMIN',
        },
      });
      logger.info(`Bootstrapped initial admin user (${env.ADMIN_EMAIL}) successfully`);
    }
  } catch (error) {
    logger.warn('Could not verify/bootstrap admin user on startup', {
      error: (error as Error).message,
    });
  }
};

const startServer = async () => {
  try {
    // 1. Run database migrations on startup if needed
    await runMigrations();

    // 2. Verify database connection on startup
    await prisma.$connect();
    logger.info('Connected to PostgreSQL database successfully');

    // 3. Ensure initial admin user exists
    await ensureAdminUser();

    // 3. Start asynchronous notification worker (non-test environments)
    if (env.NODE_ENV !== 'test') {
      notificationWorker.start();
    }

    const server = app.listen(Number(env.PORT), '0.0.0.0', () => {
      logger.info(`HemaCare Blood Donation API running at http://localhost:${env.PORT}`, {
        port: env.PORT,
        environment: env.NODE_ENV,
        clientUrl: env.CLIENT_URL,
      });
    });

    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Gracefully shutting down HTTP server & worker...`);

      // Stop background worker polling
      notificationWorker.stop();

      server.close(async () => {
        try {
          await prisma.$disconnect();
          logger.info('Database pool disconnected. Graceful shutdown complete.');
          process.exit(0);
        } catch (err) {
          logger.error('Error during database disconnect', { error: (err as Error).message });
          process.exit(1);
        }
      });

      // Force shutdown after 10s if connections fail to drain
      setTimeout(() => {
        logger.error('Forced shutdown: active connections failed to close in time.');
        process.exit(1);
      }, 10000).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start HemaCare API server', { error: (error as Error).message });
    await prisma.$disconnect();
    process.exit(1);
  }
};

startServer();
