import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Admin Account Seeding...');

  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@blooddonation.org').toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD || 'AdminSecurePass123!';

  console.log(`ℹ️ Target Admin Email: ${adminEmail}`);

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  let adminUser;
  if (existingUser) {
    adminUser = await prisma.user.update({
      where: { email: adminEmail },
      data: {
        passwordHash,
        role: Role.ADMIN,
      },
    });
    console.log(`✅ Updated existing user to ADMIN role with refreshed password: ${adminUser.email}`);
  } else {
    adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        role: Role.ADMIN,
      },
    });
    console.log(`✅ Successfully created new ADMIN account: ${adminUser.email}`);
  }

  console.log('====================================================');
  console.log('🎉 Admin Seed Completed Successfully!');
  console.log(`   Admin ID:       ${adminUser.id}`);
  console.log(`   Admin Email:    ${adminUser.email}`);
  console.log(`   Admin Role:     ${adminUser.role}`);
  console.log(`   Created At:     ${adminUser.createdAt.toISOString()}`);
  console.log('====================================================');
}

main()
  .catch((e) => {
    console.error('❌ Admin seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
