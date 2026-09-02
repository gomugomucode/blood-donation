import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testPooler() {
  console.log('--- Testing Transaction Pooler (Port 6543) ---');
  const poolerUrl = process.env.SUPABASE_DATABASE_URL;
  if (!poolerUrl) {
    console.error('No pooler URL found');
    return;
  }

  const prisma = new PrismaClient({
    datasources: { db: { url: poolerUrl } },
  });

  try {
    const res = await prisma.$queryRaw<Array<{ now: Date }>>`SELECT NOW() as now;`;
    console.log('✅ Port 6543 (Transaction Pooler) Connection Success! Server time:', res[0].now);
  } catch (err: any) {
    console.error('❌ Port 6543 Connection Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

testPooler();
