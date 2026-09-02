import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const renderUrl = process.env.SOURCE_DATABASE_URL || process.env.RENDER_DATABASE_URL;
if (!renderUrl) {
  throw new Error('SOURCE_DATABASE_URL environment variable is required');
}
const prisma = new PrismaClient({ datasources: { db: { url: renderUrl } } });

async function verify() {
  const users = await prisma.user.count();
  const donors = await prisma.donorProfile.count();
  const requests = await prisma.bloodRequest.count();
  const donations = await prisma.donation.count();
  const opportunities = await prisma.donorOpportunity.count();
  const notifications = await prisma.notification.count();
  const tokens = await prisma.passwordResetToken.count();
  const audits = await prisma.auditLog.count();
  const migrations: any[] = await prisma.$queryRaw`SELECT count(*)::int FROM _prisma_migrations`;
  const migCount = migrations[0].count;
  const total = users + donors + requests + donations + opportunities + notifications + tokens + audits + migCount;

  console.log(JSON.stringify({
    users, donors, requests, donations, opportunities, notifications, tokens, audits, migrations: migCount, total
  }, null, 2));

  if (total === 167) {
    console.log('RENDER_ROLLBACK_INTEGRITY=INTACT (167 ROWS)');
  } else {
    console.error('P1_ALERT_RENDER_BASELINE_DRIFT=' + total);
  }
  await prisma.$disconnect();
}
verify().catch(e => { console.error(e); process.exit(1); });
