import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.SUPABASE_DIRECT_URL } },
});

async function checkUsers() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, sessionVersion: true },
    orderBy: { createdAt: 'desc' },
  });
  console.log(`Migrated Users in Supabase (${users.length} total):`);
  users.forEach((u) => console.log(` - ${u.email} [${u.role}] (id: ${u.id})`));
}

checkUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
