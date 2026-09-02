import { PrismaClient } from '@prisma/client';
import { assertTestDatabaseSafe } from './test-database-safety.js';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// In test environment, enforce strict database target safety before instantiating PrismaClient
if (process.env.NODE_ENV === 'test') {
  assertTestDatabaseSafe();
}

// Prevent multiple instances of Prisma Client in development
export const prisma =
  global.__prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

export default prisma;
