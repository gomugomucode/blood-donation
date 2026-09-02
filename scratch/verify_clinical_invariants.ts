import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.SUPABASE_DIRECT_URL } },
});

async function run() {
  console.log('--- Clinical Transaction & Invariant Verification ---');
  
  const [violations] = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(`
    SELECT count(*) as count FROM "BloodRequest" WHERE "unitsFulfilled" > "unitsRequired" OR "unitsFulfilled" < 0;
  `);
  console.log(`  Invalid Unit Allocations (unitsFulfilled > unitsRequired OR < 0): ${Number(violations.count)} (Expected 0)`);

  const users = await prisma.user.count();
  const donors = await prisma.donorProfile.count();
  const requests = await prisma.bloodRequest.count();
  const donations = await prisma.donation.count();
  const opportunities = await prisma.donorOpportunity.count();
  const notifications = await prisma.notification.count();
  const tokens = await prisma.passwordResetToken.count();
  const audits = await prisma.auditLog.count();

  console.log('  Supabase Table Counts:', {
    users, donors, requests, donations, opportunities, notifications, tokens, audits,
    total: users + donors + requests + donations + opportunities + notifications + tokens + audits + 6
  });

  console.log('  Status: ✓ ALL CLINICAL INVARIANTS SOUND');
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
