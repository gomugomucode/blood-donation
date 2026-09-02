import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Load default environment files
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function verifyTarget() {
  console.log('========================================================================');
  console.log('       DATABASE TARGET RESOLUTION AUDIT (ACTIVE DATABASE_URL)           ');
  console.log('========================================================================\n');

  try {
    const [info] = await prisma.$queryRawUnsafe<Array<{ current_database: string; version: string; host: string }>>(`
      SELECT 
        current_database(),
        version(),
        inet_server_addr()::text as host;
    `);

    const versionStr = info?.version || '';
    const majorVer = versionStr.split(' ')?.[1]?.split('.')?.[0] || 'Unknown';
    const dbName = info?.current_database || 'Unknown';

    // Count tables in public schema
    const tables = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(`
      SELECT count(*) as count FROM information_schema.tables WHERE table_schema = 'public';
    `);
    const tableCount = Number(tables[0]?.count ?? 0);

    // Sum rows across public application tables
    const appTables = [
      'User',
      'DonorProfile',
      'BloodRequest',
      'Donation',
      'DonorOpportunity',
      'Notification',
      'PasswordResetToken',
      'AuditLog',
      '_prisma_migrations',
    ];

    let totalRows = 0;
    for (const t of appTables) {
      try {
        const r = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(`SELECT count(*) as count FROM "${t}";`);
        totalRows += Number(r[0]?.count ?? 0);
      } catch {
        // table might not exist
      }
    }

    let targetPlatform = 'UNKNOWN';
    if (dbName === 'postgres' && (majorVer === '17' || versionStr.includes('17.'))) {
      targetPlatform = 'SUPABASE';
    } else if (dbName.includes('blood_donation_db') && (majorVer === '18' || versionStr.includes('18.'))) {
      targetPlatform = 'RENDER';
    } else if (dbName === 'blood_donation_db' && info?.host === '127.0.0.1') {
      targetPlatform = 'LOCAL_POSTGRES';
    }

    console.log(`  Identified Platform       : ${targetPlatform}`);
    console.log(`  Connected Database Name   : ${dbName}`);
    console.log(`  PostgreSQL Major Version  : ${majorVer}`);
    console.log(`  Server Host Signature     : ${info?.host ? info.host : 'Managed Cloud Network Endpoint'}`);
    console.log(`  Public Table Count        : ${tableCount}`);
    console.log(`  Total Application Rows    : ${totalRows}`);
    console.log('\n========================================================================');
  } catch (error: any) {
    console.error('Connection failed using current DATABASE_URL:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyTarget();
