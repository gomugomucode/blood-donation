import { PrismaClient } from '@prisma/client';

const sourceUrl = process.env.SOURCE_DATABASE_URL || "postgresql://blood_donation_db_l85y_user:WEZHGmqR92ba7BeMb7I294BjTWZ4nxcD@dpg-daascrbtqb8s73e389b0-a.oregon-postgres.render.com/blood_donation_db_l85y?sslmode=require";

const prisma = new PrismaClient({
  datasources: { db: { url: sourceUrl } },
});

async function main() {
  const tables = [
    'AuditLog',
    'BloodRequest',
    'Donation',
    'DonorOpportunity',
    'DonorProfile',
    'Notification',
    'PasswordResetToken',
    'User',
    '_prisma_migrations',
  ];

  let total = 0;
  console.log('--- Current Render Source Baseline Row Check ---');
  for (const t of tables) {
    const res = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(`SELECT count(*) as count FROM "${t}";`);
    const c = Number(res[0]?.count ?? 0);
    total += c;
    console.log(`  ${t.padEnd(20)}: ${c}`);
  }
  console.log('------------------------------------------------');
  console.log(`  TOTAL ROWS          : ${total}`);
  console.log('------------------------------------------------');
  if (total === 167) {
    console.log('✅ BASELINE PRESERVED: Exactly 167 rows in source Render database.');
  } else {
    console.error(`⚠️ BASELINE DRIFT: Found ${total} rows, expected 167.`);
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
