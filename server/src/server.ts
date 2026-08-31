import { app } from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/db.js';
import { logger } from './utils/logger.js';

const startServer = async () => {
  try {
    // Verify database connection on startup
    await prisma.$connect();
    logger.info('Connected to PostgreSQL database successfully');

    const server = app.listen(Number(env.PORT), '0.0.0.0', () => {
      logger.info(`HemaCare Blood Donation API running at http://localhost:${env.PORT}`, {
        port: env.PORT,
        environment: env.NODE_ENV,
        clientUrl: env.CLIENT_URL,
      });
    });

    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Gracefully shutting down HTTP server...`);
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
