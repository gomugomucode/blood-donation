import { PrismaClient, Role, BloodGroup } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Blood Donation Database Seeding...');

  // Clean existing data in dependency order for deterministic seeding
  await prisma.notification.deleteMany();
  await prisma.donation.deleteMany();
  await prisma.donorOpportunity.deleteMany();
  await prisma.bloodRequest.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.donorProfile.deleteMany();
  await prisma.user.deleteMany();

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@blooddonation.org';
  const adminPassword = process.env.ADMIN_PASSWORD || 'AdminSecurePass123!';
  const defaultDonorPassword = 'DonorPassword123!';

  const adminPasswordHash = await bcrypt.hash(adminPassword, 12);
  const donorPasswordHash = await bcrypt.hash(defaultDonorPassword, 12);

  // 1. Seed Admin Account
  const adminUser = await prisma.user.create({
    data: {
      email: adminEmail.toLowerCase().trim(),
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
    },
  });
  console.log(`✅ Seeded Admin: ${adminUser.email} (Role: ${adminUser.role})`);

  // 2. Seed Realistic Donors
  const donorsData = [
    {
      email: 'sarah.jenkins@example.org',
      fullName: 'Sarah Jenkins',
      dateOfBirth: new Date('1994-04-12'),
      address: '742 Evergreen Terrace, Springfield, IL',
      contactNumber: '+1-555-0192',
      bloodGroup: BloodGroup.O_NEGATIVE, // Universal donor
      donations: [
        { location: 'Central Blood Bank - Downtown', daysAgo: 120, notes: 'Whole blood donation. Vitals stable.' },
        { location: 'Metropolitan Hospital Mobile Drive', daysAgo: 45, notes: 'Whole blood donation. Smooth recovery.' }, // Ineligible (45 < 56)
      ],
    },
    {
      email: 'marcus.vance@example.org',
      fullName: 'Marcus Vance',
      dateOfBirth: new Date('1988-11-23'),
      address: '10880 Wilshire Blvd, Los Angeles, CA',
      contactNumber: '+1-555-0143',
      bloodGroup: BloodGroup.O_POSITIVE,
      donations: [
        { location: 'Red Cross Community Center', daysAgo: 180, notes: 'Whole blood donation.' },
        { location: 'Red Cross Community Center', daysAgo: 90, notes: 'Whole blood donation. Eligible now.' }, // Eligible (90 >= 56)
      ],
    },
    {
      email: 'elena.rostova@example.org',
      fullName: 'Elena Rostova',
      dateOfBirth: new Date('2000-08-15'),
      address: '450 Lexington Ave, New York, NY',
      contactNumber: '+1-555-0177',
      bloodGroup: BloodGroup.A_POSITIVE,
      donations: [
        { location: 'St. Jude Blood Donor Clinic', daysAgo: 65, notes: 'Standard 450ml whole blood collection.' },
      ],
    },
    {
      email: 'david.chen@example.org',
      fullName: 'David Chen',
      dateOfBirth: new Date('1992-03-30'),
      address: '200 University Ave, Palo Alto, CA',
      contactNumber: '+1-555-0188',
      bloodGroup: BloodGroup.A_NEGATIVE,
      donations: [], // First-time donor, eligible
    },
    {
      email: 'amira.khan@example.org',
      fullName: 'Amira Khan',
      dateOfBirth: new Date('1996-07-04'),
      address: '89 Michigan Ave, Chicago, IL',
      contactNumber: '+1-555-0129',
      bloodGroup: BloodGroup.B_POSITIVE,
      donations: [
        { location: 'Northwestern Memorial Drive', daysAgo: 15, notes: 'Recent donation' }, // Ineligible (15 < 56)
      ],
    },
    {
      email: 'liam.oconnor@example.org',
      fullName: 'Liam O’Connor',
      dateOfBirth: new Date('1985-09-18'),
      address: '12 Commonwealth Ave, Boston, MA',
      contactNumber: '+1-555-0164',
      bloodGroup: BloodGroup.B_NEGATIVE,
      donations: [
        { location: 'Mass General Blood Donor Center', daysAgo: 300, notes: 'Annual donation.' },
      ],
    },
    {
      email: 'priya.sharma@example.org',
      fullName: 'Priya Sharma',
      dateOfBirth: new Date('1998-01-22'),
      address: '500 Mercer St, Seattle, WA',
      contactNumber: '+1-555-0111',
      bloodGroup: BloodGroup.AB_POSITIVE, // Universal recipient
      donations: [
        { location: 'Seattle Blood Center', daysAgo: 70, notes: 'Plasma and whole blood.' },
      ],
    },
    {
      email: 'carlos.mendez@example.org',
      fullName: 'Carlos Mendez',
      dateOfBirth: new Date('1990-12-05'),
      address: '300 Biscayne Blvd, Miami, FL',
      contactNumber: '+1-555-0155',
      bloodGroup: BloodGroup.AB_NEGATIVE,
      donations: [],
    },
    {
      email: 'hannah.abbott@example.org',
      fullName: 'Hannah Abbott',
      dateOfBirth: new Date('1993-06-17'),
      address: '1500 Market St, Philadelphia, PA',
      contactNumber: '+1-555-0134',
      bloodGroup: BloodGroup.O_POSITIVE,
      donations: [
        { location: 'Penn Medicine Donor Center', daysAgo: 210, notes: 'Whole blood donation.' },
        { location: 'Penn Medicine Donor Center', daysAgo: 110, notes: 'Whole blood donation.' },
      ],
    },
    {
      email: 'james.wilson@example.org',
      fullName: 'James Wilson',
      dateOfBirth: new Date('1982-02-14'),
      address: '800 Congress Ave, Austin, TX',
      contactNumber: '+1-555-0199',
      bloodGroup: BloodGroup.A_POSITIVE,
      donations: [
        { location: 'Austin Central Health Center', daysAgo: 5, notes: 'Just donated this week.' },
      ],
    },
    {
      email: 'zoya.patel@example.org',
      fullName: 'Zoya Patel',
      dateOfBirth: new Date('1995-10-29'),
      address: '100 Peachtree St, Atlanta, GA',
      contactNumber: '+1-555-0105',
      bloodGroup: BloodGroup.B_POSITIVE,
      donations: [
        { location: 'Emory Blood Donor Drive', daysAgo: 140, notes: 'Regular donor.' },
      ],
    },
    {
      email: 'robert.taylor@example.org',
      fullName: 'Robert Taylor',
      dateOfBirth: new Date('1978-05-19'),
      address: '400 Pine St, Denver, CO',
      contactNumber: '+1-555-0148',
      bloodGroup: BloodGroup.O_NEGATIVE,
      donations: [
        { location: 'Rocky Mountain Blood Bank', daysAgo: 85, notes: 'Whole blood.' },
      ],
    },
    {
      email: 'maya.lin@example.org',
      fullName: 'Maya Lin',
      dateOfBirth: new Date('2001-03-11'),
      address: '77 Massachusetts Ave, Cambridge, MA',
      contactNumber: '+1-555-0182',
      bloodGroup: BloodGroup.A_NEGATIVE,
      donations: [],
    },
    {
      email: 'anthony.gomez@example.org',
      fullName: 'Anthony Gomez',
      dateOfBirth: new Date('1989-08-25'),
      address: '2200 Broadway, San Antonio, TX',
      contactNumber: '+1-555-0167',
      bloodGroup: BloodGroup.O_POSITIVE,
      donations: [
        { location: 'South Texas Blood & Tissue Center', daysAgo: 60, notes: 'Standard donation.' },
      ],
    },
    {
      email: 'deactivated.donor@example.org',
      fullName: 'Former Donor (Deactivated Record)',
      dateOfBirth: new Date('1980-01-01'),
      address: '123 Closed Lane, Inactive, IL',
      contactNumber: '+1-555-0000',
      bloodGroup: BloodGroup.O_POSITIVE,
      deletedAt: new Date(),
      donations: [],
    },
  ];

  const now = new Date();

  for (const item of donorsData) {
    const user = await prisma.user.create({
      data: {
        email: item.email.toLowerCase().trim(),
        passwordHash: donorPasswordHash,
        role: Role.DONOR,
      },
    });

    // Calculate last donation date if any
    let lastDonationDate: Date | null = null;
    if (item.donations.length > 0) {
      // Find the most recent donation (smallest daysAgo)
      const minDaysAgo = Math.min(...item.donations.map((d) => d.daysAgo));
      const mostRecent = new Date(now.getTime() - minDaysAgo * 24 * 60 * 60 * 1000);
      lastDonationDate = mostRecent;
    }

    const donorProfile = await prisma.donorProfile.create({
      data: {
        userId: user.id,
        fullName: item.fullName,
        dateOfBirth: item.dateOfBirth,
        address: item.address,
        contactNumber: item.contactNumber,
        bloodGroup: item.bloodGroup,
        lastDonationAt: lastDonationDate,
        deletedAt: item.deletedAt || null,
        preferences: {
          notificationsEnabled: true,
          preferredDonationType: 'WHOLE_BLOOD',
        },
      },
    });

    // Create donation records
    for (const donation of item.donations) {
      const donatedAt = new Date(now.getTime() - donation.daysAgo * 24 * 60 * 60 * 1000);
      await prisma.donation.create({
        data: {
          donorId: donorProfile.id,
          donatedAt,
          location: donation.location,
          notes: donation.notes,
        },
      });
    }

    console.log(
      `✅ Seeded Donor: ${donorProfile.fullName} (${donorProfile.bloodGroup}) - ${item.donations.length} donation(s)`
    );
  }

  console.log('🎉 Blood Donation Database Seeding Completed Successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
