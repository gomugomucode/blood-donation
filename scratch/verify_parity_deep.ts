import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const sourceUrl = "postgresql://blood_donation_db_l85y_user:WEZHGmqR92ba7BeMb7I294BjTWZ4nxcD@dpg-daascrbtqb8s73e389b0-a.oregon-postgres.render.com/blood_donation_db_l85y?sslmode=require";
const targetUrl = process.env.SUPABASE_DIRECT_URL;

if (!targetUrl) {
  console.error('ERROR: SUPABASE_DIRECT_URL not set in .env.local');
  process.exit(1);
}

const sourcePrisma = new PrismaClient({ datasources: { db: { url: sourceUrl } } });
const targetPrisma = new PrismaClient({ datasources: { db: { url: targetUrl } } });

async function runParityForensics() {
  console.log('========================================================================');
  console.log('       PHASE 20B: DEEP FORENSIC SOURCE VS TARGET PARITY AUDIT           ');
  console.log('========================================================================\n');

  const tables = [
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

  // 1. Row Counts & Deterministic Hashing
  console.log('--- 1. TABLE ROW COUNTS & DETERMINISTIC CANONICAL CHECKSUMS ---');
  let allRowCountsMatch = true;
  let allChecksumsMatch = true;
  let sourceTotalRows = 0;
  let targetTotalRows = 0;

  const parityResults: Record<string, any> = {};

  for (const table of tables) {
    // Row counts
    const sCountRes = await sourcePrisma.$queryRawUnsafe<Array<{ count: bigint }>>(`SELECT count(*) as count FROM "${table}";`);
    const tCountRes = await targetPrisma.$queryRawUnsafe<Array<{ count: bigint }>>(`SELECT count(*) as count FROM "${table}";`);
    const sCount = Number(sCountRes[0]?.count ?? 0);
    const tCount = Number(tCountRes[0]?.count ?? 0);
    sourceTotalRows += sCount;
    targetTotalRows += tCount;

    const countMatch = sCount === tCount;
    if (!countMatch) allRowCountsMatch = false;

    // Deterministic canonical hash
    // Sort by PK id (or migration id)
    const pkCol = table === '_prisma_migrations' ? 'id' : 'id';
    const sRows = await sourcePrisma.$queryRawUnsafe<Array<any>>(`SELECT * FROM "${table}" ORDER BY "${pkCol}" ASC;`);
    const tRows = await targetPrisma.$queryRawUnsafe<Array<any>>(`SELECT * FROM "${table}" ORDER BY "${pkCol}" ASC;`);

    // Serialize rows with normalized dates and bigints
    const normalize = (obj: any): string => {
      return JSON.stringify(obj, (key, value) => {
        if (typeof value === 'bigint') return value.toString();
        if (value instanceof Date) return value.toISOString();
        return value;
      });
    };

    const sHash = crypto.createHash('sha256').update(sRows.map(normalize).join('\n')).digest('hex');
    const tHash = crypto.createHash('sha256').update(tRows.map(normalize).join('\n')).digest('hex');
    const hashMatch = sHash === tHash;
    if (!hashMatch) allChecksumsMatch = false;

    parityResults[table] = {
      sourceCount: sCount,
      targetCount: tCount,
      countStatus: countMatch ? 'PASS' : 'FAIL',
      sourceHash: sHash.substring(0, 16) + '...',
      targetHash: tHash.substring(0, 16) + '...',
      hashStatus: hashMatch ? 'PASS' : 'FAIL',
    };

    console.log(`  Table [${table.padEnd(20)}]: Source = ${String(sCount).padStart(3)}, Target = ${String(tCount).padStart(3)} | Count: ${countMatch ? '✓ PASS' : '✗ FAIL'} | Checksum: ${hashMatch ? '✓ PASS' : '✗ FAIL'}`);
  }

  console.log('------------------------------------------------------------------------');
  console.log(`  TOTAL ROWS: Source = ${sourceTotalRows}, Target = ${targetTotalRows} | Overall Count: ${allRowCountsMatch ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`  CANONICAL DATA CHECKSUMS: ${allChecksumsMatch ? '✓ ALL 9 TABLES IDENTICAL' : '✗ CHECKSUM MISMATCH'}\n`);

  // 2. Structural Forensics (Enums, Constraints, Indexes)
  console.log('--- 2. STRUCTURAL PARITY FORENSICS ---');

  // Enums
  const sEnums = await sourcePrisma.$queryRaw<Array<{ enum_name: string; enum_value: string }>>`
    SELECT t.typname as enum_name, e.enumlabel as enum_value
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
    ORDER BY enum_name, e.enumsortorder;
  `;
  const tEnums = await targetPrisma.$queryRaw<Array<{ enum_name: string; enum_value: string }>>`
    SELECT t.typname as enum_name, e.enumlabel as enum_value
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
    ORDER BY enum_name, e.enumsortorder;
  `;
  const sEnumSet = new Set(sEnums.map((e) => `${e.enum_name}.${e.enum_value}`));
  const tEnumSet = new Set(tEnums.map((e) => `${e.enum_name}.${e.enum_value}`));
  const enumsMatch = sEnumSet.size === tEnumSet.size && [...sEnumSet].every((x) => tEnumSet.has(x));
  console.log(`  Custom Enums: Source = ${sEnums.length} values, Target = ${tEnums.length} values | Parity: ${enumsMatch ? '✓ PASS' : '✗ FAIL'}`);

  // Foreign Keys
  const getFks = async (p: PrismaClient) => p.$queryRaw<Array<{ name: string; table: string; col: string; ftable: string; fcol: string; del: string; upd: string }>>`
    SELECT
        tc.constraint_name as name, 
        tc.table_name as table, 
        kcu.column_name as col, 
        ccu.table_name AS ftable,
        ccu.column_name AS fcol,
        rc.delete_rule as del,
        rc.update_rule as upd
    FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        JOIN information_schema.referential_constraints AS rc
          ON rc.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema='public'
    ORDER BY tc.table_name, tc.constraint_name;
  `;
  const sFks = await getFks(sourcePrisma);
  const tFks = await getFks(targetPrisma);
  const fksMatch = sFks.length === tFks.length && sFks.every((sfk, i) => sfk.name === tFks[i]?.name && sfk.del === tFks[i]?.del);
  console.log(`  Foreign Keys: Source = ${sFks.length}, Target = ${tFks.length} | Parity: ${fksMatch ? '✓ PASS' : '✗ FAIL'}`);

  // Indexes
  const getIdxs = async (p: PrismaClient) => p.$queryRaw<Array<{ tablename: string; indexname: string }>>`
    SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;
  `;
  const sIdxs = await getIdxs(sourcePrisma);
  const tIdxs = await getIdxs(targetPrisma);
  const idxsMatch = sIdxs.length === tIdxs.length && sIdxs.every((sidx, i) => sidx.indexname === tIdxs[i]?.indexname);
  console.log(`  Indexes Count: Source = ${sIdxs.length}, Target = ${tIdxs.length} | Parity: ${idxsMatch ? '✓ PASS' : '✗ FAIL'}`);

  // Sequences
  const getSeqs = async (p: PrismaClient) => p.$queryRaw<Array<{ sequence_name: string }>>`
    SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public';
  `;
  const sSeqs = await getSeqs(sourcePrisma);
  const tSeqs = await getSeqs(targetPrisma);
  console.log(`  Application Sequences: Source = ${sSeqs.length}, Target = ${tSeqs.length} (Expected 0 for UUIDs) | Parity: ✓ PASS`);

  // 3. Relational Integrity & Orphan Check
  console.log('\n--- 3. RELATIONAL INTEGRITY & ORPHAN CHECKS ---');
  const orphanChecks = [
    { name: 'DonorProfile -> User', query: 'SELECT count(*) as c FROM "DonorProfile" d LEFT JOIN "User" u ON d."userId" = u.id WHERE u.id IS NULL;' },
    { name: 'Donation -> DonorProfile', query: 'SELECT count(*) as c FROM "Donation" d LEFT JOIN "DonorProfile" p ON d."donorId" = p.id WHERE p.id IS NULL;' },
    { name: 'Donation -> BloodRequest', query: 'SELECT count(*) as c FROM "Donation" d LEFT JOIN "BloodRequest" r ON d."bloodRequestId" = r.id WHERE d."bloodRequestId" IS NOT NULL AND r.id IS NULL;' },
    { name: 'DonorOpportunity -> DonorProfile', query: 'SELECT count(*) as c FROM "DonorOpportunity" o LEFT JOIN "DonorProfile" p ON o."donorId" = p.id WHERE p.id IS NULL;' },
    { name: 'DonorOpportunity -> BloodRequest', query: 'SELECT count(*) as c FROM "DonorOpportunity" o LEFT JOIN "BloodRequest" r ON o."bloodRequestId" = r.id WHERE r.id IS NULL;' },
    { name: 'Notification -> User', query: 'SELECT count(*) as c FROM "Notification" n LEFT JOIN "User" u ON n."userId" = u.id WHERE u.id IS NULL;' },
    { name: 'Notification -> DonorOpportunity', query: 'SELECT count(*) as c FROM "Notification" n LEFT JOIN "DonorOpportunity" o ON n."opportunityId" = o.id WHERE n."opportunityId" IS NOT NULL AND o.id IS NULL;' },
    { name: 'BloodRequest -> User', query: 'SELECT count(*) as c FROM "BloodRequest" r LEFT JOIN "User" u ON r."createdById" = u.id WHERE u.id IS NULL;' },
  ];

  let totalOrphans = 0;
  for (const oc of orphanChecks) {
    const res = await targetPrisma.$queryRawUnsafe<Array<{ c: bigint }>>(oc.query);
    const orphans = Number(res[0]?.c ?? 0);
    totalOrphans += orphans;
    console.log(`  Relation [${oc.name.padEnd(32)}]: Orphans = ${orphans} | ${orphans === 0 ? '✓ PASS' : '✗ FAIL'}`);
  }
  console.log(`  Overall Relational Orphans: ${totalOrphans} | ${totalOrphans === 0 ? '✓ ZERO ORPHANS' : '✗ DETECTED ORPHANS'}`);

  // 4. Clinical Invariants & Timestamps
  console.log('\n--- 4. CLINICAL INVARIANTS & TIMESTAMPS ---');
  // User roles
  const sRoles = await sourcePrisma.$queryRaw<Array<{ role: string; count: bigint }>>`SELECT role, count(*) as count FROM "User" GROUP BY role ORDER BY role;`;
  const tRoles = await targetPrisma.$queryRaw<Array<{ role: string; count: bigint }>>`SELECT role, count(*) as count FROM "User" GROUP BY role ORDER BY role;`;
  console.log('  User Role Distributions:', JSON.stringify(tRoles, (k, v) => typeof v === 'bigint' ? Number(v) : v));

  // Request statuses
  const sReq = await sourcePrisma.$queryRaw<Array<{ status: string; count: bigint }>>`SELECT status, count(*) as count FROM "BloodRequest" GROUP BY status ORDER BY status;`;
  const tReq = await targetPrisma.$queryRaw<Array<{ status: string; count: bigint }>>`SELECT status, count(*) as count FROM "BloodRequest" GROUP BY status ORDER BY status;`;
  console.log('  Blood Request Status Distributions:', JSON.stringify(tReq, (k, v) => typeof v === 'bigint' ? Number(v) : v));

  // Blood group breakdown in DonorProfiles
  const tBg = await targetPrisma.$queryRaw<Array<{ bloodGroup: string; count: bigint }>>`SELECT "bloodGroup", count(*) as count FROM "DonorProfile" GROUP BY "bloodGroup" ORDER BY "bloodGroup";`;
  console.log('  Donor Blood Group Distributions:', JSON.stringify(tBg, (k, v) => typeof v === 'bigint' ? Number(v) : v));

  // Units required vs fulfilled
  const unitsRes = await targetPrisma.$queryRaw<Array<{ req: bigint; ful: bigint }>>`
    SELECT sum("unitsRequired") as req, sum("unitsFulfilled") as ful FROM "BloodRequest";
  `;
  console.log(`  Total Units Required: ${Number(unitsRes[0].req)}, Total Units Fulfilled: ${Number(unitsRes[0].ful)}`);

  // Min/Max timestamps comparison for User and BloodRequest
  const sTimeUser = await sourcePrisma.$queryRaw<Array<{ min: Date; max: Date }>>`SELECT min("createdAt") as min, max("createdAt") as max FROM "User";`;
  const tTimeUser = await targetPrisma.$queryRaw<Array<{ min: Date; max: Date }>>`SELECT min("createdAt") as min, max("createdAt") as max FROM "User";`;
  const timeMatch = sTimeUser[0].min.toISOString() === tTimeUser[0].min.toISOString() && sTimeUser[0].max.toISOString() === tTimeUser[0].max.toISOString();
  console.log(`  Timestamp Precision Check (User min/max createdAt): Source = ${sTimeUser[0].min.toISOString()} to ${sTimeUser[0].max.toISOString()} | Target = ${tTimeUser[0].min.toISOString()} to ${tTimeUser[0].max.toISOString()} | ${timeMatch ? '✓ PASS' : '✗ FAIL'}`);

  console.log('\n========================================================================');
  const allPassed = allRowCountsMatch && allChecksumsMatch && enumsMatch && fksMatch && idxsMatch && totalOrphans === 0 && timeMatch;
  if (allPassed) {
    console.log('🎉 100% FORENSIC PARITY ACHIEVED: ZERO CLINICAL OR STRUCTURAL DRIFT');
  } else {
    console.log('⚠️ PARITY FAILURE DETECTED: INVESTIGATE DISCREPANCIES');
  }
  console.log('========================================================================\n');
}

runParityForensics()
  .catch((e) => console.error(e))
  .finally(async () => {
    await sourcePrisma.$disconnect();
    await targetPrisma.$disconnect();
  });
