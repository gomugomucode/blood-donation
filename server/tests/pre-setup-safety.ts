/**
 * Pre-Setup Database Safety Gate (Layer 1)
 * 
 * Executed as the very first setup file in Vitest BEFORE any other setup files,
 * BEFORE any test files, and BEFORE PrismaClient is imported.
 */

import { assertTestDatabaseSafe, validateTestDatabaseTarget } from '../src/config/test-database-safety.js';

// 1. Enforce NODE_ENV = 'test'
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'test';
}

// 2. Prioritize TEST_DATABASE_URL over DATABASE_URL if available
if (process.env.TEST_DATABASE_URL && process.env.TEST_DATABASE_URL.trim() !== '') {
  const testValidation = validateTestDatabaseTarget({
    url: process.env.TEST_DATABASE_URL,
    nodeEnv: process.env.NODE_ENV,
  });

  if (testValidation.safe) {
    // Safely route Prisma to the designated disposable test database
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  }
}

// 3. Assert fail-closed safety. If unsafe, terminates Vitest immediately.
assertTestDatabaseSafe();
