import { beforeAll, afterAll } from 'vitest';
import { assertTestDatabaseSafe } from '../src/config/test-database-safety.js';
import { prisma } from '../src/config/db.js';

beforeAll(async () => {
  // 1. Mandatory fail-closed safety gate. If unsafe, THROWS FATALLY.
  assertTestDatabaseSafe();

  // 2. Attempt connection to approved local test database
  try {
    await prisma.$connect();
  } catch (err: any) {
    // Allows pure unit tests to execute even if local test PostgreSQL is offline
    console.warn(`[Test Setup Notice]: Local test database not reachable (${err.message}). Unit tests will continue; database-dependent integration tests will fail individually.`);
  }
});

afterAll(async () => {
  try {
    await prisma.$disconnect();
  } catch {
    // Ignore disconnect errors if never connected
  }
});

