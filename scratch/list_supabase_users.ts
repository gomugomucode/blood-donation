import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.SUPABASE_DIRECT_URL } },
});

async function main() {
  const users = await prisma.user.findMany({
    include: { donorProfile: true },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`=== SUPABASE USER AUDIT: EXACTLY ${users.length} USERS FOUND ===`);
  users.forEach((u, idx) => {
    const bg = u.donorProfile?.bloodGroup || 'N/A';
    const address = u.donorProfile?.address || 'N/A';
    const name = u.donorProfile?.fullName || 'Administrator';
    console.log(`${idx + 1}. [${u.role}] ${u.email} | Name: ${name} | Blood: ${bg} | Address: ${address}`);
  });

  const donorProfiles = await prisma.donorProfile.count();
  const bloodRequests = await prisma.bloodRequest.count();
  const donations = await prisma.donation.count();
  const opportunities = await prisma.donorOpportunity.count();
  const notifications = await prisma.notification.count();
  const auditLogs = await prisma.auditLog.count();

  console.log('\n=== COMPLETE SUPABASE DATA REGISTRY ===');
  console.log(`Users:               ${users.length}`);
  console.log(`Donor Profiles:      ${donorProfiles}`);
  console.log(`Blood Requests:      ${bloodRequests}`);
  console.log(`Donations:           ${donations}`);
  console.log(`Donor Opportunities: ${opportunities}`);
  console.log(`Notifications:       ${notifications}`);
  console.log(`Audit Logs:          ${auditLogs}`);
  console.log(`Total Records:       ${users.length + donorProfiles + bloodRequests + donations + opportunities + notifications + auditLogs + 6}`);

  await prisma.$disconnect();
}

main().catch(console.error);
