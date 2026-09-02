import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.SUPABASE_DIRECT_URL } },
});

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, passwordHash: true },
  });
  console.log(`Total users in Supabase: ${users.length}`);
  for (const u of users) {
    const isDonorPass = await bcrypt.compare('DonorPassword123!', u.passwordHash);
    const isTestPass = await bcrypt.compare('Password123!', u.passwordHash);
    const isAdminPass = await bcrypt.compare('AdminSecurePass123!', u.passwordHash);
    console.log(`- ${u.email} (${u.role}): DonorPass=${isDonorPass}, TestPass=${isTestPass}, AdminPass=${isAdminPass}`);
  }
  await prisma.$disconnect();
}

main().catch(console.error);
