import { beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/config/db.js';

beforeAll(async () => {
  const dbUrl = process.env.DATABASE_URL || '';
  if (
    (dbUrl.includes('supabase.co') || dbUrl.includes('supabase.com') || dbUrl.includes('render.com')) &&
    process.env.ALLOW_PRODUCTION_TESTING !== 'true'
  ) {
    throw new Error(
      `CRITICAL SAFETY INTERCEPT: Vitest is pointed at a production/remote database host (${dbUrl.split('@')[1] || 'remote'}). ` +
      `Automated tests run destructive cleanup hooks (deleteMany). ` +
      `To protect production data, tests are blocked. ` +
      `Please configure a dedicated local/test database in DATABASE_URL or set ALLOW_PRODUCTION_TESTING=true.`
    );
  }
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

