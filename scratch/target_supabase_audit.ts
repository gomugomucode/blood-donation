import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Load .env and .env.local if present
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const directUrl = process.env.SUPABASE_DIRECT_URL;
const pooledUrl = process.env.SUPABASE_DATABASE_URL;

const targetUrl = directUrl || pooledUrl;

if (!targetUrl) {
  console.log('STATUS: PENDING_CREDENTIALS');
  console.log('No SUPABASE_DIRECT_URL or SUPABASE_DATABASE_URL found in environment.');
  console.log('To provide target configuration safely without exposing passwords:');
  console.log('  1. Add to your local git-ignored .env.local:');
  console.log('     SUPABASE_DIRECT_URL="postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:5432/postgres"');
  console.log('     SUPABASE_DATABASE_URL="postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"');
  console.log('  2. OR set in your environment:');
  console.log('     $env:SUPABASE_DIRECT_URL="..."');
  console.log('     $env:SUPABASE_DATABASE_URL="..."');
  process.exit(2);
}

// Ensure sslmode=require for Supabase
let connectionUrl = targetUrl;
if (!connectionUrl.includes('sslmode=')) {
  connectionUrl += connectionUrl.includes('?') ? '&sslmode=require' : '?sslmode=require';
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: connectionUrl,
    },
  },
});

async function runTargetAudit() {
  console.log('--- Connecting to Target Supabase Database for Pre-Flight Inspection ---');

  // 1. Version & Server metadata
  const versionRes = await prisma.$queryRaw<Array<{ version: string }>>`SELECT version();`;
  const currentDbRes = await prisma.$queryRaw<Array<{ current_database: string }>>`SELECT current_database();`;
  const currentUserRes = await prisma.$queryRaw<Array<{ current_user: string }>>`SELECT current_user;`;
  const maxConnRes = await prisma.$queryRaw<Array<{ setting: string }>>`SELECT setting FROM pg_settings WHERE name = 'max_connections';`;

  console.log('Target PostgreSQL Version:', versionRes[0]?.version);
  console.log('Target Database Name:', currentDbRes[0]?.current_database);
  console.log('Target Current User:', currentUserRes[0]?.current_user);
  console.log('Target Max Connections:', maxConnRes[0]?.setting);

  // 2. Installed Extensions
  const extRes = await prisma.$queryRaw<Array<{ extname: string; extversion: string }>>`
    SELECT extname, extversion FROM pg_extension ORDER BY extname;
  `;
  console.log('\nTarget Installed Extensions:', JSON.stringify(extRes, null, 2));

  // 3. Existing Public Tables
  const tablesRes = await prisma.$queryRaw<Array<{ table_name: string }>>`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `;
  console.log('\nTarget Existing Tables in public schema count:', tablesRes.length);

  let totalRows = 0;
  const tableSummary: Record<string, number> = {};
  for (const t of tablesRes) {
    const tableName = t.table_name;
    const countRes = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(`SELECT count(*) as count FROM "${tableName}";`);
    const count = Number(countRes[0]?.count ?? 0);
    tableSummary[tableName] = count;
    totalRows += count;
  }
  console.log('Target Table Inventory:', JSON.stringify(tableSummary, null, 2));
  console.log('Target Total Public Rows:', totalRows);

  // 4. Existing Enums
  const enumRes = await prisma.$queryRaw<Array<{ enum_name: string; enum_value: string }>>`
    SELECT t.typname as enum_name, e.enumlabel as enum_value
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
    ORDER BY enum_name, e.enumsortorder;
  `;
  console.log('\nTarget Existing Public Enums count:', enumRes.length);

  // 5. Existing Constraints
  const constrRes = await prisma.$queryRaw<Array<{ constraint_name: string; table_name: string; constraint_type: string }>>`
    SELECT constraint_name, table_name, constraint_type
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
    ORDER BY table_name, constraint_name;
  `;
  console.log('\nTarget Existing Public Constraints count:', constrRes.length);

  // 6. Existing Indexes
  const idxRes = await prisma.$queryRaw<Array<{ tablename: string; indexname: string }>>`
    SELECT tablename, indexname
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname;
  `;
  console.log('\nTarget Existing Public Indexes count:', idxRes.length);

  if (tablesRes.length === 0) {
    console.log('\n✅ TARGET STATE: CLEAN & EMPTY (Ready for initial schema and data restoration)');
  } else {
    console.log('\n⚠️ TARGET STATE: NOT EMPTY! Contains existing tables. STOPPING per safety rule.');
  }
}

runTargetAudit()
  .catch((e) => {
    console.error('Target audit error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
