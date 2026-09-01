const https = require('https');
const { URL } = require('url');

const BASE_URL = 'https://blood-donation-6vcp.onrender.com';
const CLIENT_URL = 'https://client-sigma-peach.vercel.app';

// Comprehensive HTTP request helper
async function request(method, path, body = null, cookie = '', customHeaders = {}) {
  const start = Date.now();
  return new Promise((resolve) => {
    const url = new URL(path.startsWith('http') ? path : `${BASE_URL}${path}`);
    const headers = {
      'Accept': 'application/json',
      'Origin': CLIENT_URL,
      ...customHeaders
    };
    if (body && typeof body !== 'string') {
      headers['Content-Type'] = 'application/json';
    } else if (body && typeof body === 'string' && !customHeaders['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    if (cookie) {
      headers['Cookie'] = cookie;
    }

    const req = https.request(url, {
      method,
      headers
    }, (res) => {
      let rawData = '';
      res.on('data', chunk => rawData += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(rawData);
        } catch (e) {
          json = rawData;
        }

        const setCookie = res.headers['set-cookie'] || [];
        const cookies = setCookie.map(c => c.split(';')[0]).join('; ');

        resolve({
          status: res.statusCode,
          latencyMs: Date.now() - start,
          headers: res.headers,
          data: json,
          cookie: cookies || cookie,
          setCookieHeaders: setCookie
        });
      });
    });

    req.on('error', (err) => resolve({ error: err.message, status: 0, latencyMs: Date.now() - start }));

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runDeepAdversarialSuite() {
  console.log('================================================================');
  console.log('PHASE 18: DEEP ADVERSARIAL ATTACK & AUDIT SUITE');
  console.log('Target API:', BASE_URL);
  console.log('Target Frontend:', CLIENT_URL);
  console.log('Timestamp:', new Date().toISOString());
  console.log('================================================================\n');

  const results = {};

  // 1. DEPLOYMENT IDENTITY & HEALTH
  console.log('--- 1. DEPLOYMENT IDENTITY & HEALTH ---');
  const rootRes = await request('GET', '/');
  const liveRes = await request('GET', '/health/live');
  const readyRes = await request('GET', '/health/ready');
  results.deployment = {
    rootStatus: rootRes.status,
    rootData: rootRes.data,
    liveStatus: liveRes.status,
    liveData: liveRes.data,
    readyStatus: readyRes.status,
    readyData: readyRes.data,
    latency: { root: rootRes.latencyMs, live: liveRes.latencyMs, ready: readyRes.latencyMs }
  };
  console.log('API Root:', rootRes.status, rootRes.data);
  console.log('Readiness Probe:', readyRes.status, readyRes.data);

  // 2. AUTHENTICATION ATTACKS
  console.log('\n--- 2. AUTHENTICATION ADVERSARIAL ATTACKS ---');
  const ts = Date.now();

  // 2a. Malformed Email
  const malformedEmailRes = await request('POST', '/api/v1/auth/register', {
    email: 'not-an-email',
    password: 'Password123!',
    fullName: 'Malformed Tester',
    dateOfBirth: '1995-01-01',
    bloodGroup: 'O_POSITIVE',
    contactNumber: '+9779800000000',
    address: 'Kathmandu'
  });
  console.log('2a. Malformed Email Status:', malformedEmailRes.status);

  // 2b. Underage DOB (16 years old)
  const underageDobRes = await request('POST', '/api/v1/auth/register', {
    email: `underage-${ts}@example.test`,
    password: 'Password123!',
    fullName: 'Underage Tester',
    dateOfBirth: new Date(Date.now() - 16 * 365.25 * 24 * 3600 * 1000).toISOString().split('T')[0],
    bloodGroup: 'O_POSITIVE',
    contactNumber: '+9779800000000',
    address: 'Kathmandu'
  });
  console.log('2b. Underage Registration Status:', underageDobRes.status, underageDobRes.data?.data?.donorProfile?.isEligible);

  // 2c. Privilege Escalation Injection in Register Body
  const privEscRegRes = await request('POST', '/api/v1/auth/register', {
    email: `priv-esc-${ts}@example.test`,
    password: 'Password123!',
    fullName: 'Privilege Escalation Tester',
    dateOfBirth: '1995-01-01',
    bloodGroup: 'O_POSITIVE',
    contactNumber: '+9779800000000',
    address: 'Kathmandu',
    role: 'ADMIN',
    isAdmin: true,
    permissions: ['ALL_PRIVILEGES'],
    status: 'VERIFIED'
  });
  console.log('2c. Privilege Escalation Registration Status:', privEscRegRes.status, 'Assigned Role:', privEscRegRes.data?.data?.user?.role || privEscRegRes.data?.user?.role);

  // 2d. Case Insensitivity & Whitespace
  const caseEmail = `donor-case-${ts}@example.test`;
  const regCaseRes = await request('POST', '/api/v1/auth/register', {
    email: `  ${caseEmail}  `,
    password: 'Password123!',
    fullName: 'Whitespace Case Tester',
    dateOfBirth: '1990-05-15',
    bloodGroup: 'A_POSITIVE',
    contactNumber: '+9779811112222',
    address: 'Pokhara'
  });
  const upperLoginRes = await request('POST', '/api/v1/auth/login', {
    email: caseEmail.toUpperCase(),
    password: 'Password123!'
  });
  console.log('2d. Whitespace Trim + Case Normalization Login Status:', upperLoginRes.status);

  // 3. AUTHORIZATION & IDOR MATRIX
  console.log('\n--- 3. AUTHORIZATION & IDOR ATTACK MATRIX ---');
  // Register Donor A and Donor B
  const donorAEmail = `donor-a-${ts}@example.test`;
  const donorBEmail = `donor-b-${ts}@example.test`;
  const regARes = await request('POST', '/api/v1/auth/register', {
    email: donorAEmail,
    password: 'Password123!',
    fullName: 'Donor Alpha',
    dateOfBirth: '1992-03-10',
    bloodGroup: 'O_POSITIVE',
    contactNumber: '+9779822223333',
    address: 'Lalitpur'
  });
  const regBRes = await request('POST', '/api/v1/auth/register', {
    email: donorBEmail,
    password: 'Password123!',
    fullName: 'Donor Beta',
    dateOfBirth: '1994-07-20',
    bloodGroup: 'O_NEGATIVE',
    contactNumber: '+9779833334444',
    address: 'Bhaktapur'
  });

  const cookieA = regARes.cookie;
  const cookieB = regBRes.cookie;
  const donorAId = regARes.data?.data?.user?.id;
  const donorBId = regBRes.data?.data?.user?.id;

  // Admin login
  const adminLoginRes = await request('POST', '/api/v1/auth/login', {
    email: 'admin@blooddonation.org',
    password: 'AdminSecurePass123!'
  });
  const adminCookie = adminLoginRes.cookie;

  // Donor A attempts to access admin endpoints
  const donorToAdminOps = await request('GET', '/api/v1/admin/operations/system-status', null, cookieA);
  const donorToAdminDonors = await request('GET', '/api/v1/admin/donors', null, cookieA);
  const donorToAdminReqs = await request('GET', '/api/v1/admin/blood-requests', null, cookieA);
  const donorToAdminAudit = await request('GET', '/api/v1/admin/audit-logs', null, cookieA);

  console.log('3a. Donor A -> Admin Operations:', donorToAdminOps.status);
  console.log('3b. Donor A -> Admin Donors List:', donorToAdminDonors.status);
  console.log('3c. Donor A -> Admin Blood Requests:', donorToAdminReqs.status);
  console.log('3d. Donor A -> Admin Audit Logs:', donorToAdminAudit.status);

  // Donor A attempts to escalate role via PATCH /donor/me
  const patchRoleRes = await request('PATCH', '/api/v1/donor/me', {
    role: 'ADMIN',
    isAdmin: true,
    address: 'Updated Address A'
  }, cookieA);
  const verifyProfileRes = await request('GET', '/api/v1/donor/me', null, cookieA);
  console.log('3e. Donor A Profile Role Escalation via PATCH:', patchRoleRes.status, 'Preserved Role:', verifyProfileRes.data?.data?.user?.role);

  // 4. MATCHING ENGINE 8-GROUP CLINICAL REVERSE-ENGINEERING
  console.log('\n--- 4. DETERMINISTIC MATCHING ENGINE 8-GROUP AUDIT ---');
  const expectedCompatibility = {
    'O_NEGATIVE': ['O_NEGATIVE'],
    'O_POSITIVE': ['O_NEGATIVE', 'O_POSITIVE'],
    'A_NEGATIVE': ['O_NEGATIVE', 'A_NEGATIVE'],
    'A_POSITIVE': ['O_NEGATIVE', 'O_POSITIVE', 'A_NEGATIVE', 'A_POSITIVE'],
    'B_NEGATIVE': ['O_NEGATIVE', 'B_NEGATIVE'],
    'B_POSITIVE': ['O_NEGATIVE', 'O_POSITIVE', 'B_NEGATIVE', 'B_POSITIVE'],
    'AB_NEGATIVE': ['O_NEGATIVE', 'A_NEGATIVE', 'B_NEGATIVE', 'AB_NEGATIVE'],
    'AB_POSITIVE': ['O_NEGATIVE', 'O_POSITIVE', 'A_NEGATIVE', 'A_POSITIVE', 'B_NEGATIVE', 'B_POSITIVE', 'AB_NEGATIVE', 'AB_POSITIVE']
  };

  const matchingAuditResults = {};
  for (const [recipientGroup, expectedGroups] of Object.entries(expectedCompatibility)) {
    const reqCreate = await request('POST', '/api/v1/admin/blood-requests', {
      bloodGroup: recipientGroup,
      unitsRequired: 2,
      urgency: 'HIGH',
      hospitalName: `Transfusion Center ${recipientGroup}`,
      location: 'Kathmandu',
      contactName: 'Transfusion Lead',
      contactNumber: '+9779800000000',
      requiredBy: new Date(Date.now() + 48 * 3600 * 1000).toISOString()
    }, adminCookie);

    const reqId = reqCreate.data?.data?.id;
    if (reqId) {
      const matchRes = await request('GET', `/api/v1/admin/blood-requests/${reqId}/matches`, null, adminCookie);
      const compatibleGroups = matchRes.data?.data?.compatibleGroups || [];
      const pass = expectedGroups.every(g => compatibleGroups.includes(g)) && compatibleGroups.length === expectedGroups.length;
      matchingAuditResults[recipientGroup] = { pass, compatibleGroups, expectedGroups, candidateCount: matchRes.data?.data?.candidates?.length || 0 };
    }
  }
  console.log('4a. 8-Group Matching Accuracy:');
  for (const [grp, res] of Object.entries(matchingAuditResults)) {
    console.log(`    ${grp.padEnd(12)} -> Match: ${res.pass ? 'PASS' : 'FAIL'} | Compatible: [${res.compatibleGroups.join(', ')}]`);
  }

  // 5. STATE MACHINE & ILLEGAL TRANSITIONS
  console.log('\n--- 5. BLOOD REQUEST STATE MACHINE & ILLEGAL TRANSITIONS ---');
  // Create a request to test cancellation and illegal state changes
  const smReqCreate = await request('POST', '/api/v1/admin/blood-requests', {
    bloodGroup: 'A_POSITIVE',
    unitsRequired: 1,
    urgency: 'NORMAL',
    hospitalName: 'State Machine Testing Clinic',
    location: 'Kathmandu',
    contactName: 'SM Coordinator',
    contactNumber: '+9779800000000',
    requiredBy: new Date(Date.now() + 24 * 3600 * 1000).toISOString()
  }, adminCookie);

  const smReqId = smReqCreate.data?.data?.id;
  // Cancel request
  const cancelRes = await request('PATCH', `/api/v1/admin/blood-requests/${smReqId}/cancel`, null, adminCookie);
  console.log('5a. Cancel Request Status:', cancelRes.status);

  // Attempt donation recording on CANCELLED request
  const donorsListRes = await request('GET', '/api/v1/admin/donors?limit=1', null, adminCookie);
  const donorProfileId = donorsListRes.data?.data?.items?.[0]?.id;

  const donationOnCancelledRes = await request('POST', `/api/v1/admin/donors/${donorProfileId}/donations`, {
    location: 'Hospital Clinic',
    donatedAt: new Date().toISOString(),
    bloodRequestId: smReqId
  }, adminCookie);
  console.log('5b. Donation on Cancelled Request Status:', donationOnCancelledRes.status, 'Message:', donationOnCancelledRes.data?.message || donationOnCancelledRes.data?.error);

  // 6. CONCURRENCY & RACE-CONDITION FULFILLMENT
  console.log('\n--- 6. CONCURRENCY RACE-CONDITION TESTING ---');
  const raceReqCreate = await request('POST', '/api/v1/admin/blood-requests', {
    bloodGroup: 'AB_POSITIVE',
    unitsRequired: 1,
    urgency: 'CRITICAL',
    hospitalName: 'Adversarial Concurrency Lab',
    location: 'Kathmandu',
    contactName: 'Concurrency Investigator',
    contactNumber: '+9779800000000',
    requiredBy: new Date(Date.now() + 24 * 3600 * 1000).toISOString()
  }, adminCookie);

  const raceReqId = raceReqCreate.data?.data?.id;
  const simultaneousRequests = await Promise.all([
    request('POST', `/api/v1/admin/donors/${donorProfileId}/donations`, { location: 'Lab 1', donatedAt: new Date().toISOString(), bloodRequestId: raceReqId }, adminCookie),
    request('POST', `/api/v1/admin/donors/${donorProfileId}/donations`, { location: 'Lab 2', donatedAt: new Date().toISOString(), bloodRequestId: raceReqId }, adminCookie),
    request('POST', `/api/v1/admin/donors/${donorProfileId}/donations`, { location: 'Lab 3', donatedAt: new Date().toISOString(), bloodRequestId: raceReqId }, adminCookie),
    request('POST', `/api/v1/admin/donors/${donorProfileId}/donations`, { location: 'Lab 4', donatedAt: new Date().toISOString(), bloodRequestId: raceReqId }, adminCookie),
  ]);

  const verifyRaceReq = await request('GET', `/api/v1/admin/blood-requests/${raceReqId}`, null, adminCookie);
  const raceReqData = verifyRaceReq.data?.data;
  console.log('6a. Simultaneous Dispatches Results:', simultaneousRequests.map(r => r.status));
  console.log(`6b. Final State: unitsFulfilled = ${raceReqData?.unitsFulfilled} / ${raceReqData?.unitsRequired}, status = ${raceReqData?.status}`);

  // 7. CORS ORIGIN ENFORCEMENT & SECURITY HEADERS
  console.log('\n--- 7. CORS ORIGIN ENFORCEMENT & SECURITY HEADERS ---');
  const unauthorizedOriginRes = await request('OPTIONS', '/api/v1/auth/login', null, '', {
    'Origin': 'https://unauthorized-attacker.evil.com',
    'Access-Control-Request-Method': 'POST'
  });
  console.log('7a. Unauthorized CORS Preflight Response Status:', unauthorizedOriginRes.status);
  console.log('7b. Access-Control-Allow-Origin Header:', unauthorizedOriginRes.headers['access-control-allow-origin']);
  console.log('7c. Strict-Transport-Security Header:', rootRes.headers['strict-transport-security']);
  console.log('7d. X-Content-Type-Options Header:', rootRes.headers['x-content-type-options']);

  // 8. PHI REDACTION AUDIT
  console.log('\n--- 8. PHI REDACTION AUDIT ---');
  const donorOppsRes = await request('GET', '/api/v1/donor/opportunities', null, cookieA);
  const donorNotifsRes = await request('GET', '/api/v1/donor/notifications', null, cookieA);
  const donorMeRes = await request('GET', '/api/v1/donor/me', null, cookieA);

  const fullDonorPayload = JSON.stringify({
    opps: donorOppsRes.data,
    notifs: donorNotifsRes.data,
    me: donorMeRes.data
  });

  const containsPatientRef = fullDonorPayload.includes('patientReference');
  const containsClinicalNotes = fullDonorPayload.includes('clinicalNotes');
  const containsPasswordHash = fullDonorPayload.includes('passwordHash');

  console.log('8a. Contains patientReference:', containsPatientRef);
  console.log('8b. Contains clinicalNotes:', containsClinicalNotes);
  console.log('8c. Contains passwordHash:', containsPasswordHash);

  console.log('\n================================================================');
  console.log('PHASE 18 DEEP ADVERSARIAL AUDIT COMPLETE');
  console.log('================================================================');
}

runDeepAdversarialSuite();
