import { app } from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/db.js';

const startServer = async () => {
  try {
    // Verify database connection on startup
    await prisma.$connect();
    console.log('✅ Connected to PostgreSQL database successfully.');

    const server = app.listen(Number(env.PORT), '0.0.0.0', () => {
      console.log(`🚀 Blood Donation API server running at http://localhost:${env.PORT}`);
      console.log(`📡 Environment: ${env.NODE_ENV}`);
      console.log(`🔗 Allowed Client URL: ${env.CLIENT_URL}`);
    });

    const shutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}. Gracefully shutting down...`);
      server.close(async () => {
        await prisma.$disconnect();
        console.log('💤 Database disconnected. Server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

startServer();
