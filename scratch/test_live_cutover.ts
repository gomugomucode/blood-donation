import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const sourceUrl = "postgresql://blood_donation_db_l85y_user:WEZHGmqR92ba7BeMb7I294BjTWZ4nxcD@dpg-daascrbtqb8s73e389b0-a.oregon-postgres.render.com/blood_donation_db_l85y?sslmode=require";
const targetUrl = process.env.SUPABASE_DIRECT_URL;

if (!targetUrl) {
  console.error('ERROR: SUPABASE_DIRECT_URL missing');
  process.exit(1);
}

const renderPrisma = new PrismaClient({ datasources: { db: { url: sourceUrl } } });
const supabasePrisma = new PrismaClient({ datasources: { db: { url: targetUrl } } });

async function checkTrafficDestination() {
  console.log('========================================================================');
  console.log('    EMPIRICAL WRITE-PATH AUDIT: DETECTING LIVE PRODUCTION DATABASE      ');
  console.log('========================================================================\n');

  // Step 1: Log in to live Render API as Admin
  console.log('1. Attempting login to live API (https://blood-donation-6vcp.onrender.com)...');
  
  // Try admin credentials
  const loginRes = await fetch('https://blood-donation-6vcp.onrender.com/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@blooddonation.org',
      password: 'AdminSecurePass123!',
    }),
  });

  const cookieHeader = loginRes.headers.get('set-cookie');
  const loginData = await loginRes.json();

  if (loginRes.status !== 200 || !cookieHeader) {
    console.log('   Login response status:', loginRes.status, JSON.stringify(loginData));
    console.log('   Trying fallback admin credentials...');
    // try admin@yourdomain.com if applicable
  } else {
    console.log('   ✓ Admin login successful! Token cookie received.');
  }

  const tokenCookie = cookieHeader ? cookieHeader.split(';')[0] : '';
  const token = loginData?.data?.token;

  // Step 2: Create a controlled smoke-test blood request
  const uniqueRef = `CUTOVER-PROBE-${Date.now()}`;
  console.log(`2. Dispatching controlled smoke-test BloodRequest (${uniqueRef})...`);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Origin': 'https://client-sigma-peach.vercel.app',
  };
  if (tokenCookie) headers['Cookie'] = tokenCookie;
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const createRes = await fetch('https://blood-donation-6vcp.onrender.com/api/v1/admin/blood-requests', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      patientReference: uniqueRef,
      bloodGroup: 'O_POSITIVE',
      unitsRequired: 1,
      urgency: 'NORMAL',
      hospitalName: 'Cutover Routing Probe Clinic',
      hospitalAddress: '123 Cloud Way',
      location: 'Downtown Medical Center Ward 3',
      contactName: 'Nurse Jackie',
      contactNumber: '+1-555-0199',
      requiredBy: new Date(Date.now() + 86400000 * 7).toISOString(),
      clinicalNotes: 'Zero-downtime cutover routing verification probe',
    }),
  });

  const createData = await createRes.json();
  console.log(`   Create Request HTTP Status: ${createRes.status}`);
  if (createRes.status !== 201) {
    console.log('   Create response body:', JSON.stringify(createData));
  } else {
    console.log(`   ✓ Request created successfully! ID: ${createData?.data?.bloodRequest?.id}`);
  }

  // Step 3: Query BOTH databases to see where the record landed
  console.log('\n3. Interrogating both databases for record location...');
  const inSupabase = await supabasePrisma.bloodRequest.findFirst({
    where: { patientReference: uniqueRef },
  });
  const inRender = await renderPrisma.bloodRequest.findFirst({
    where: { patientReference: uniqueRef },
  });

  console.log(`   Record in Supabase Database : ${inSupabase ? 'FOUND (✓ PRESENT)' : 'NOT FOUND (✗ ABSENT)'}`);
  console.log(`   Record in Render Database   : ${inRender ? 'FOUND (✓ PRESENT)' : 'NOT FOUND (✗ ABSENT)'}`);

  console.log('\n========================================================================');
  if (inSupabase && !inRender) {
    console.log('🎉 PROOF CONFIRMED: RENDER PRODUCTION BACKEND IS ROUTING TO SUPABASE!');
    console.log('   - Supabase received the live write.');
    console.log('   - Render PostgreSQL source was untouched.');
  } else if (inRender && !inSupabase) {
    console.log('⚠️ LIVE BACKEND IS STILL ROUTING TO RENDER POSTGRESQL.');
    console.log('   - Render deploy may still be in progress or DATABASE_URL needs manual deploy.');
  } else {
    console.log('❓ INCONCLUSIVE: Record not found in either or found in both.');
  }
  console.log('========================================================================\n');

  // Step 4: Clean up test record if created
  if (inSupabase) {
    await supabasePrisma.bloodRequest.delete({ where: { id: inSupabase.id } });
    console.log('   ✓ Cleaned up smoke-test record from Supabase.');
  }
  if (inRender) {
    await renderPrisma.bloodRequest.delete({ where: { id: inRender.id } });
    console.log('   ✓ Cleaned up smoke-test record from Render.');
  }
}

checkTrafficDestination()
  .catch(console.error)
  .finally(async () => {
    await renderPrisma.$disconnect();
    await supabasePrisma.$disconnect();
  });
