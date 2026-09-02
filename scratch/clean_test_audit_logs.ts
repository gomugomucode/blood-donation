import { PrismaClient } from '@prisma/client';

const sourceUrl = "postgresql://blood_donation_db_l85y_user:WEZHGmqR92ba7BeMb7I294BjTWZ4nxcD@dpg-daascrbtqb8s73e389b0-a.oregon-postgres.render.com/blood_donation_db_l85y?sslmode=require";
const prisma = new PrismaClient({ datasources: { db: { url: sourceUrl } } });

async function run() {
  const cutoff = new Date('2026-09-02T10:40:00.000Z');
  const res = await prisma.auditLog.deleteMany({
    where: { createdAt: { gte: cutoff } },
  });
  console.log(`Deleted ${res.count} test audit logs.`);
  const total = await prisma.auditLog.count();
  console.log(`Current AuditLog count on Render: ${total}`);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
