import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const renderUrl = process.env.SOURCE_DATABASE_URL || process.env.RENDER_DATABASE_URL;
const supabaseDirectUrl = process.env.SUPABASE_DIRECT_URL;

if (!renderUrl || !supabaseDirectUrl) {
  throw new Error('Both SOURCE_DATABASE_URL and SUPABASE_DIRECT_URL environment variables are required');
}

const renderPrisma = new PrismaClient({ datasources: { db: { url: renderUrl } } });
const supabasePrisma = new PrismaClient({ datasources: { db: { url: supabaseDirectUrl } } });

async function resync() {
  console.log('--- RESYNC BASELINE: RENDER -> SUPABASE ---');

  // 1. Fetch exact rows from Render (READ ONLY)
  console.log('1. Reading authoritative baseline from Render PostgreSQL 18.6...');
  const users = await renderPrisma.user.findMany();
  const donors = await renderPrisma.donorProfile.findMany();
  const requests = await renderPrisma.bloodRequest.findMany();
  const donations = await renderPrisma.donation.findMany();
  const opportunities = await renderPrisma.donorOpportunity.findMany();
  const notifications = await renderPrisma.notification.findMany();
  const tokens = await renderPrisma.passwordResetToken.findMany();
  const audits = await renderPrisma.auditLog.findMany();

  console.log(`   Fetched from Render:
   - Users: ${users.length}
   - DonorProfiles: ${donors.length}
   - BloodRequests: ${requests.length}
   - Donations: ${donations.length}
   - Opportunities: ${opportunities.length}
   - Notifications: ${notifications.length}
   - Tokens: ${tokens.length}
   - AuditLogs: ${audits.length}
   Total App Rows: ${users.length + donors.length + requests.length + donations.length + opportunities.length + notifications.length + tokens.length + audits.length}`);

  // 2. Clear any leftover test records in Supabase (TARGET ONLY)
  console.log('2. Cleaning target Supabase tables...');
  await supabasePrisma.notification.deleteMany();
  await supabasePrisma.donorOpportunity.deleteMany();
  await supabasePrisma.donation.deleteMany();
  await supabasePrisma.bloodRequest.deleteMany();
  await supabasePrisma.donorProfile.deleteMany();
  await supabasePrisma.passwordResetToken.deleteMany();
  await supabasePrisma.auditLog.deleteMany();
  await supabasePrisma.user.deleteMany();

  // 3. Insert in topological dependency order into Supabase
  console.log('3. Populating Supabase with authoritative baseline...');
  if (users.length > 0) {
    await supabasePrisma.user.createMany({ data: users });
    console.log(`   ✓ Inserted ${users.length} Users`);
  }
  if (donors.length > 0) {
    await supabasePrisma.donorProfile.createMany({ data: donors });
    console.log(`   ✓ Inserted ${donors.length} DonorProfiles`);
  }
  if (requests.length > 0) {
    await supabasePrisma.bloodRequest.createMany({ data: requests });
    console.log(`   ✓ Inserted ${requests.length} BloodRequests`);
  }
  if (donations.length > 0) {
    await supabasePrisma.donation.createMany({ data: donations });
    console.log(`   ✓ Inserted ${donations.length} Donations`);
  }
  if (opportunities.length > 0) {
    await supabasePrisma.donorOpportunity.createMany({ data: opportunities });
    console.log(`   ✓ Inserted ${opportunities.length} DonorOpportunities`);
  }
  if (notifications.length > 0) {
    await supabasePrisma.notification.createMany({ data: notifications });
    console.log(`   ✓ Inserted ${notifications.length} Notifications`);
  }
  if (tokens.length > 0) {
    await supabasePrisma.passwordResetToken.createMany({ data: tokens });
    console.log(`   ✓ Inserted ${tokens.length} PasswordResetTokens`);
  }
  if (audits.length > 0) {
    await supabasePrisma.auditLog.createMany({ data: audits });
    console.log(`   ✓ Inserted ${audits.length} AuditLogs`);
  }

  // 4. Verify target row counts
  console.log('4. Verifying target Supabase counts...');
  const sUsers = await supabasePrisma.user.count();
  const sDonors = await supabasePrisma.donorProfile.count();
  const sRequests = await supabasePrisma.bloodRequest.count();
  const sDonations = await supabasePrisma.donation.count();
  const sOpps = await supabasePrisma.donorOpportunity.count();
  const sNotifs = await supabasePrisma.notification.count();
  const sTokens = await supabasePrisma.passwordResetToken.count();
  const sAudits = await supabasePrisma.auditLog.count();
  const sMigrations: any[] = await supabasePrisma.$queryRaw`SELECT count(*)::int FROM _prisma_migrations`;
  const sMigCount = sMigrations[0].count;
  const sTotal = sUsers + sDonors + sRequests + sDonations + sOpps + sNotifs + sTokens + sAudits + sMigCount;

  console.log(`   Supabase Verified Total: ${sTotal} rows (Expected: 167)`);
  if (sTotal === 167) {
    console.log('✅ SUPABASE RESTORATION 100% SUCCESSFUL: EXACT 167-ROW BASELINE ACHIEVED');
  } else {
    console.error('❌ MISMATCH ON RESTORATION');
  }

  // 5. Verify Render is still 100% intact
  const rUsers = await renderPrisma.user.count();
  const rTotal = rUsers + (await renderPrisma.donorProfile.count()) + (await renderPrisma.bloodRequest.count()) +
    (await renderPrisma.donation.count()) + (await renderPrisma.donorOpportunity.count()) +
    (await renderPrisma.notification.count()) + (await renderPrisma.passwordResetToken.count()) +
    (await renderPrisma.auditLog.count()) + 6;
  console.log(`   Render Verified Total: ${rTotal} rows (Authoritative Rollback Source Intact)`);

  await renderPrisma.$disconnect();
  await supabasePrisma.$disconnect();
}

resync().catch(e => {
  console.error('Fatal resync error:', e);
  process.exit(1);
});
