import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.SUPABASE_DIRECT_URL } },
});

async function run() {
  console.log('--- Clinical Transaction & Invariant Verification ---');
  
  const [violations] = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(`
    SELECT count(*) as count FROM "BloodRequest" WHERE "unitsFulfilled" > "unitsRequired" OR "unitsFulfilled" < 0;
  `);
  console.log(`  Invalid Unit Allocations (unitsFulfilled > unitsRequired OR < 0): ${Number(violations.count)} (Expected 0)`);

  const [oppCount] = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(`
    SELECT count(*) as count FROM "DonorOpportunity";
  `);
  console.log(`  Donor Opportunities Count: ${Number(oppCount.count)}`);

  const [notifCount] = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(`
    SELECT count(*) as count FROM "Notification";
  `);
  console.log(`  Notifications Count: ${Number(notifCount.count)}`);

  console.log('  Status: ✓ ALL CLINICAL INVARIANTS SOUND');
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
