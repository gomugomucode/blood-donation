import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const sourceUrl = process.env.SOURCE_DATABASE_URL || process.env.DATABASE_URL;

if (!sourceUrl) {
  console.error('ERROR: No database URL provided in SOURCE_DATABASE_URL or DATABASE_URL');
  process.exit(1);
}

// Ensure sslmode=require for Render external connection if not already present
let connectionUrl = sourceUrl;
if (!connectionUrl.includes('sslmode=') && connectionUrl.includes('oregon-postgres.render.com')) {
  connectionUrl += connectionUrl.includes('?') ? '&sslmode=require' : '?sslmode=require';
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: connectionUrl,
    },
  },
});

async function runAudit() {
  console.log('--- Connecting to Source Database for Discovery Audit ---');

  // 1. Version & Server metadata
  const versionRes = await prisma.$queryRaw<Array<{ version: string }>>`SELECT version();`;
  const currentDbRes = await prisma.$queryRaw<Array<{ current_database: string }>>`SELECT current_database();`;
  const currentUserRes = await prisma.$queryRaw<Array<{ current_user: string }>>`SELECT current_user;`;
  const maxConnRes = await prisma.$queryRaw<Array<{ setting: string }>>`SELECT setting FROM pg_settings WHERE name = 'max_connections';`;

  console.log('PostgreSQL Version:', versionRes[0]?.version);
  console.log('Database Name:', currentDbRes[0]?.current_database);
  console.log('Current User:', currentUserRes[0]?.current_user);
  console.log('Max Connections:', maxConnRes[0]?.setting);

  // 2. Extensions
  const extRes = await prisma.$queryRaw<Array<{ extname: string; extversion: string }>>`
    SELECT extname, extversion FROM pg_extension ORDER BY extname;
  `;
  console.log('\nInstalled Extensions:', JSON.stringify(extRes, null, 2));

  // 3. Enums
  const enumRes = await prisma.$queryRaw<Array<{ enum_name: string; enum_value: string }>>`
    SELECT t.typname as enum_name, e.enumlabel as enum_value
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
    ORDER BY enum_name, e.enumsortorder;
  `;
  console.log('\nEnums:', JSON.stringify(enumRes, null, 2));

  // 4. Tables and Row Counts
  const tablesRes = await prisma.$queryRaw<Array<{ table_name: string }>>`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `;
  console.log('\nTables in public schema:');
  const tableStats: Record<string, any> = {};

  for (const t of tablesRes) {
    const tableName = t.table_name;
    const countRes = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(`SELECT count(*) as count FROM "${tableName}";`);
    const count = Number(countRes[0]?.count ?? 0);
    tableStats[tableName] = { rowCount: count };

    // Check if createdAt exists
    const colRes = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = ${tableName} AND column_name = 'createdAt';
    `;
    if (colRes.length > 0) {
      const timeRes = await prisma.$queryRawUnsafe<Array<{ min_created: Date | null; max_created: Date | null }>>(`
        SELECT min("createdAt") as min_created, max("createdAt") as max_created FROM "${tableName}";
      `);
      tableStats[tableName].minCreatedAt = timeRes[0]?.min_created?.toISOString() ?? null;
      tableStats[tableName].maxCreatedAt = timeRes[0]?.max_created?.toISOString() ?? null;
    }
  }
  console.log(JSON.stringify(tableStats, null, 2));

  // 5. Prisma Migrations History
  try {
    const migRes = await prisma.$queryRaw<Array<any>>`
      SELECT id, migration_name, finished_at, applied_steps_count, rolled_back_at 
      FROM "_prisma_migrations" 
      ORDER BY finished_at ASC;
    `;
    console.log('\nPrisma Migrations History:', JSON.stringify(migRes, null, 2));
  } catch (e: any) {
    console.log('\nPrisma migrations check error:', e.message);
  }

  // 6. Foreign Keys & Cascade Behavior
  const fkRes = await prisma.$queryRaw<Array<{
    constraint_name: string;
    table_name: string;
    column_name: string;
    foreign_table_name: string;
    foreign_column_name: string;
    delete_rule: string;
    update_rule: string;
  }>>`
    SELECT
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.delete_rule,
        rc.update_rule
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
  console.log('\nForeign Keys Count:', fkRes.length);
  console.log(JSON.stringify(fkRes, null, 2));

  // 7. Indexes
  const idxRes = await prisma.$queryRaw<Array<{ tablename: string; indexname: string; indexdef: string }>>`
    SELECT tablename, indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname;
  `;
  console.log('\nIndexes Count:', idxRes.length);
  console.log(JSON.stringify(idxRes, null, 2));

  // 8. Sequences
  const seqRes = await prisma.$queryRaw<Array<{ sequence_name: string }>>`
    SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public';
  `;
  console.log('\nSequences:', JSON.stringify(seqRes, null, 2));

  // 9. Triggers
  const trgRes = await prisma.$queryRaw<Array<{ trigger_name: string; event_object_table: string }>>`
    SELECT trigger_name, event_object_table 
    FROM information_schema.triggers 
    WHERE trigger_schema = 'public';
  `;
  console.log('\nTriggers:', JSON.stringify(trgRes, null, 2));

  // 10. Role / User Breakdown
  const userRoles = await prisma.$queryRaw<Array<{ role: string; count: bigint }>>`
    SELECT role, count(*) as count FROM "User" GROUP BY role;
  `;
  console.log('\nUser Breakdown by Role:', JSON.stringify(userRoles, (key, value) => typeof value === 'bigint' ? Number(value) : value, 2));

  // 11. BloodRequest status breakdown
  const reqStatus = await prisma.$queryRaw<Array<{ status: string; count: bigint }>>`
    SELECT status, count(*) as count FROM "BloodRequest" GROUP BY status;
  `;
  console.log('\nBloodRequest Breakdown by Status:', JSON.stringify(reqStatus, (key, value) => typeof value === 'bigint' ? Number(value) : value, 2));
}

runAudit()
  .catch((e) => {
    console.error('Audit failed:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
