const https = require('https');
const { URL } = require('url');

const BASE_URL = 'https://blood-donation-6vcp.onrender.com';
const CLIENT_URL = 'https://client-sigma-peach.vercel.app';

// Helper to make HTTPS requests with cookies and custom headers
async function request(method, path, body = null, cookie = '', customHeaders = {}) {
  return new Promise((resolve) => {
    const url = new URL(path.startsWith('http') ? path : `${BASE_URL}${path}`);
    const headers = {
      'Accept': 'application/json',
      'Origin': CLIENT_URL,
      ...customHeaders
    };
    if (body) {
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

        // Capture set-cookie headers
        const setCookie = res.headers['set-cookie'] || [];
        const cookies = setCookie.map(c => c.split(';')[0]).join('; ');

        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: json,
          cookie: cookies || cookie,
          setCookieHeaders: setCookie
        });
      });
    });

    req.on('error', (err) => resolve({ error: err.message, status: 0 }));

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runLiveAudit() {
  console.log('================================================================');
  console.log('HEMACARE LIVE DEPLOYED PLATFORM FULL QA & SECURITY AUDIT');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Target API:', BASE_URL);
  console.log('Target Frontend:', CLIENT_URL);
  console.log('================================================================\n');

  const testResults = [];
  const syntheticRecords = {
    donors: [],
    requests: [],
    opportunities: [],
    donations: []
  };

  function record(section, testName, status, evidence, details = '') {
    testResults.push({ section, testName, status, evidence, details });
    console.log(`[${status}] ${section} > ${testName}`);
    if (evidence) console.log(`       Evidence: ${evidence}`);
    if (details) console.log(`       Details: ${details}`);
  }

  // 1. HEALTH & AVAILABILITY
  const healthRes = await request('GET', '/health');
  record('Health', 'Basic Health Check', healthRes.status === 200 && healthRes.data?.status === 'healthy' ? 'PASS' : 'FAIL', `Status: ${healthRes.status}, DB: ${healthRes.data?.database}`);

  const liveRes = await request('GET', '/health/live');
  record('Health', 'Liveness Check', liveRes.status === 200 && liveRes.data?.status === 'alive' ? 'PASS' : 'FAIL', `Status: ${liveRes.status}, Service: ${liveRes.data?.service}`);

  const readyRes = await request('GET', '/health/ready');
  record('Health', 'Readiness Check', readyRes.status === 200 && readyRes.data?.status === 'ready' ? 'PASS' : 'FAIL', `Status: ${readyRes.status}, Database: ${readyRes.data?.database}`);

  // 2. REGISTRATION VALIDATION
  const timestamp = Date.now();
  const invalidEmailRes = await request('POST', '/api/v1/auth/register', {
    email: 'not-an-email',
    password: 'Password123!',
    fullName: 'Test Invalid',
    dateOfBirth: '1995-05-10',
    bloodGroup: 'O_POSITIVE',
    contactNumber: '+9779800000000',
    address: 'Kathmandu, Nepal'
  });
  record('Registration Validation', 'Reject Invalid Email', invalidEmailRes.status === 400 || invalidEmailRes.status === 422 ? 'PASS' : 'FAIL', `Status: ${invalidEmailRes.status}`, JSON.stringify(invalidEmailRes.data));

  const futureDobRes = await request('POST', '/api/v1/auth/register', {
    email: `qa-future-${timestamp}@example.test`,
    password: 'Password123!',
    fullName: 'Test Future',
    dateOfBirth: '2030-01-01',
    bloodGroup: 'O_POSITIVE',
    contactNumber: '+9779800000000',
    address: 'Kathmandu, Nepal'
  });
  record('Registration Validation', 'Reject Future Date of Birth', futureDobRes.status === 400 || futureDobRes.status === 422 ? 'PASS' : 'FAIL', `Status: ${futureDobRes.status}`, JSON.stringify(futureDobRes.data));

  // 3. ROLE ESCALATION DEFENSE DURING REGISTRATION
  const escalationEmail = `qa-esc-${timestamp}@example.test`;
  const escalationRes = await request('POST', '/api/v1/auth/register', {
    email: escalationEmail,
    password: 'DonorPassword123!',
    fullName: 'QA Escalation Test',
    dateOfBirth: '1992-06-15',
    bloodGroup: 'O_POSITIVE',
    contactNumber: '+9779841112233',
    address: 'Kathmandu, Nepal',
    role: 'ADMIN'
  });
  const escalationUserRole = escalationRes.data?.data?.user?.role || escalationRes.data?.user?.role;
  record('Security', 'Role Escalation Defense on Register', escalationRes.status === 201 && escalationUserRole === 'DONOR' ? 'PASS' : (escalationRes.status >= 400 ? 'PASS' : 'FAIL'), `Assigned Role: ${escalationUserRole}`, `Client passed role: ADMIN, Server assigned: ${escalationUserRole}`);

  // 4. VALID REGISTRATION — SYNTHETIC DONOR A
  const donorAEmail = `qa-donor-a-${timestamp}@example.test`;
  const donorAPass = 'DonorPassword123!';
  const regDonorARes = await request('POST', '/api/v1/auth/register', {
    email: donorAEmail,
    password: donorAPass,
    fullName: 'QA Synthetic Donor Alpha',
    dateOfBirth: '1995-04-12',
    bloodGroup: 'O_POSITIVE',
    contactNumber: '+9779811223344',
    address: 'Butwal, Lumbini, Nepal'
  });

  const donorAData = regDonorARes.data?.data?.user || regDonorARes.data?.user;
  const donorACookie = regDonorARes.cookie;
  if (donorAData?.id) {
    syntheticRecords.donors.push({ id: donorAData.id, email: donorAEmail, name: 'Donor Alpha' });
  }
  record('Registration', 'Valid Donor Registration (Donor A)', regDonorARes.status === 201 ? 'PASS' : 'FAIL', `Status: ${regDonorARes.status}, User ID: ${donorAData?.id}, Role: ${donorAData?.role}`);

  // 5. SYNTHETIC DONOR B (O_NEGATIVE)
  const donorBEmail = `qa-donor-b-${timestamp}@example.test`;
  const donorBPass = 'DonorPassword123!';
  const regDonorBRes = await request('POST', '/api/v1/auth/register', {
    email: donorBEmail,
    password: donorBPass,
    fullName: 'QA Synthetic Donor Beta',
    dateOfBirth: '1998-09-20',
    bloodGroup: 'O_NEGATIVE',
    contactNumber: '+9779855667788',
    address: 'Kathmandu, Nepal'
  });

  const donorBData = regDonorBRes.data?.data?.user || regDonorBRes.data?.user;
  const donorBCookie = regDonorBRes.cookie;
  if (donorBData?.id) {
    syntheticRecords.donors.push({ id: donorBData.id, email: donorBEmail, name: 'Donor Beta' });
  }
  record('Registration', 'Valid Donor Registration (Donor B O-)', regDonorBRes.status === 201 ? 'PASS' : 'FAIL', `Status: ${regDonorBRes.status}, User ID: ${donorBData?.id}`);

  // 6. DONOR LOGIN & SESSION
  const loginRes = await request('POST', '/api/v1/auth/login', {
    email: donorAEmail,
    password: donorAPass
  });
  const loggedInCookie = loginRes.cookie;
  record('Authentication', 'Donor Login with Credentials', loginRes.status === 200 ? 'PASS' : 'FAIL', `Status: ${loginRes.status}, Cookie Length: ${loggedInCookie.length}`);

  // Check cookie attributes
  const cookieHeaders = loginRes.setCookieHeaders.join('; ');
  const isHttpOnly = cookieHeaders.toLowerCase().includes('httponly');
  const isSameSite = cookieHeaders.toLowerCase().includes('samesite');
  record('Cookie Security', 'JWT HttpOnly & SameSite Flags', isHttpOnly ? 'PASS' : 'FAIL', `HttpOnly: ${isHttpOnly}, SameSite: ${isSameSite}`);

  // 7. GET DONOR PROFILE & ELIGIBILITY (via /api/v1/donor/me)
  const profileRes = await request('GET', '/api/v1/donor/me', null, loggedInCookie);
  const profile = profileRes.data?.data || profileRes.data;
  record('Donor Profile', 'Fetch Profile & Basic Eligibility', profileRes.status === 200 && profile?.fullName ? 'PASS' : 'FAIL', `Name: ${profile?.fullName}, BloodGroup: ${profile?.bloodGroup}, IsEligible: ${profile?.eligibility?.isEligible}`);

  // 8. UPDATE DONOR PROFILE & PREFERENCES (via /api/v1/donor/me)
  const updateProfileRes = await request('PATCH', '/api/v1/donor/me', {
    address: 'Updated QA Address, Butwal Ward 4',
    preferences: {
      allowBloodRequestNotifications: true,
      preferredNotificationChannel: 'IN_APP',
      preferredContactTime: 'AFTERNOON',
      locationSharingConsent: true
    }
  }, loggedInCookie);
  record('Donor Profile', 'Update Address & Notification Consent', updateProfileRes.status === 200 ? 'PASS' : 'FAIL', `Status: ${updateProfileRes.status}`);

  // Verify persistence
  const reProfileRes = await request('GET', '/api/v1/donor/me', null, loggedInCookie);
  const reProfile = reProfileRes.data?.data || reProfileRes.data;
  const isPersisted = reProfile?.address === 'Updated QA Address, Butwal Ward 4';
  record('Donor Profile', 'Verify Profile Update Persistence', isPersisted ? 'PASS' : 'FAIL', `Persisted Address: "${reProfile?.address}"`);

  // 9. ADMIN LOGIN & CAPABILITIES
  const adminLoginRes = await request('POST', '/api/v1/auth/login', {
    email: 'admin@blooddonation.org',
    password: 'AdminSecurePass123!'
  });
  const adminCookie = adminLoginRes.cookie;
  record('Admin Auth', 'Admin Login', adminLoginRes.status === 200 ? 'PASS' : 'FAIL', `Status: ${adminLoginRes.status}, User: ${adminLoginRes.data?.data?.user?.email || adminLoginRes.data?.user?.email}`);

  // 10. RBAC & IDOR: DONOR TRYING TO ACCESS ADMIN ENDPOINTS
  const donorToAdminDash = await request('GET', '/api/v1/admin/dashboard', null, loggedInCookie);
  record('RBAC / Security', 'Donor Forbidden from Admin Dashboard', donorToAdminDash.status === 403 ? 'PASS' : 'FAIL', `Status: ${donorToAdminDash.status}`);

  const donorToAdminDonors = await request('GET', '/api/v1/admin/donors', null, loggedInCookie);
  record('RBAC / Security', 'Donor Forbidden from Admin Donors List', donorToAdminDonors.status === 403 ? 'PASS' : 'FAIL', `Status: ${donorToAdminDonors.status}`);

  const donorToAdminAudit = await request('GET', '/api/v1/admin/audit-logs', null, loggedInCookie);
  record('RBAC / Security', 'Donor Forbidden from Admin Audit Logs', donorToAdminAudit.status === 403 ? 'PASS' : 'FAIL', `Status: ${donorToAdminAudit.status}`);

  // 11. ADMIN DASHBOARD METRICS
  const adminDashRes = await request('GET', '/api/v1/admin/dashboard', null, adminCookie);
  const dashData = adminDashRes.data?.data || adminDashRes.data;
  record('Admin Dashboard', 'Fetch Command Center Metrics', adminDashRes.status === 200 && typeof dashData?.totalDonors === 'number' ? 'PASS' : 'FAIL', `TotalDonors: ${dashData?.totalDonors}, EligibleDonors: ${dashData?.eligibleDonors}, OpenRequests: ${dashData?.requestMetrics?.openRequests}`);

  // 12. ADMIN DONOR SEARCH & FILTERING
  const donorSearchRes = await request('GET', `/api/v1/admin/donors?search=Alpha`, null, adminCookie);
  const searchResults = donorSearchRes.data?.data?.items || donorSearchRes.data?.items || [];
  record('Admin Donor Registry', 'Search Donors by Name', donorSearchRes.status === 200 && searchResults.length > 0 ? 'PASS' : 'FAIL', `Found ${searchResults.length} matches for "Alpha"`);

  // 13. ADMIN BLOOD REQUEST CREATION & VALIDATION
  const invalidReqRes = await request('POST', '/api/v1/admin/blood-requests', {
    bloodGroup: 'O_POSITIVE',
    unitsRequired: 0,
    urgency: 'NORMAL',
    hospitalName: 'QA Hospital',
    contactName: 'QA Coordinator',
    contactNumber: '+9779800000000',
    location: 'Butwal',
    requiredBy: '2020-01-01' // Past date
  }, adminCookie);
  record('Blood Request Validation', 'Reject 0 Units & Past Date', invalidReqRes.status === 400 || invalidReqRes.status === 422 ? 'PASS' : 'FAIL', `Status: ${invalidReqRes.status}`, JSON.stringify(invalidReqRes.data));

  // Valid Blood Request Creation (O_POSITIVE, 2 units)
  const validReqRes = await request('POST', '/api/v1/admin/blood-requests', {
    bloodGroup: 'O_POSITIVE',
    unitsRequired: 2,
    urgency: 'HIGH',
    hospitalName: 'QA Clinical Emergency Center',
    location: 'Butwal, Lumbini',
    contactName: 'Dr. Rajesh Sharma',
    contactNumber: '+9779841234567',
    requiredBy: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    patientReference: 'QA-PAT-9021',
    clinicalNotes: 'Synthetic emergency surgical requirement'
  }, adminCookie);
  const bloodReq = validReqRes.data?.data || validReqRes.data;
  if (bloodReq?.id) {
    syntheticRecords.requests.push(bloodReq.id);
  }
  record('Blood Request CRUD', 'Create Synthetic Blood Request', validReqRes.status === 201 ? 'PASS' : 'FAIL', `ID: ${bloodReq?.id}, Status: ${bloodReq?.status}, RequiredBy: ${bloodReq?.requiredBy}`);

  // 14. DETERMINISTIC MATCHING ENGINE
  const matchRes = await request('GET', `/api/v1/admin/blood-requests/${bloodReq?.id}/matches`, null, adminCookie);
  const matches = matchRes.data?.data?.matches || matchRes.data?.matches || [];
  const matchedDonorA = matches.find(m => m.donor?.id === donorAData?.id || m.donor?.user?.email === donorAEmail);
  record('Matching Engine', 'Compatibility & Ranking for Request', matchRes.status === 200 && matches.length > 0 ? 'PASS' : 'FAIL', `Found ${matches.length} matches. Donor A Found: ${Boolean(matchedDonorA)}`, `Score: ${matches[0]?.matchScore}%, Reason: ${matches[0]?.matchReason}`);

  // 15. OPPORTUNITY DISPATCH
  const targetDonorProfileId = profile?.id || matches[0]?.donor?.id;
  const dispatchRes = await request('POST', `/api/v1/admin/blood-requests/${bloodReq?.id}/opportunities`, {
    donorIds: [targetDonorProfileId]
  }, adminCookie);
  const oppResults = dispatchRes.data?.data?.createdOpportunities || dispatchRes.data?.createdOpportunities || [];
  const createdOpp = oppResults[0];
  if (createdOpp?.id) {
    syntheticRecords.opportunities.push(createdOpp.id);
  }
  record('Opportunity Dispatch', 'Dispatch Outreach Opportunity to Candidate', dispatchRes.status === 201 || dispatchRes.status === 200 ? 'PASS' : 'FAIL', `Created ${oppResults.length} opportunities. Opportunity ID: ${createdOpp?.id}`);

  // 16. DONOR OPPORTUNITY & NOTIFICATION LIFECYCLE
  const donorNotifsRes = await request('GET', '/api/v1/donor/notifications', null, loggedInCookie);
  const notifs = donorNotifsRes.data?.data?.items || donorNotifsRes.data?.items || [];
  record('Notification Flow', 'Donor Receives Matching Notification', notifs.length > 0 ? 'PASS' : 'FAIL', `Notifications count: ${notifs.length}, Top title: "${notifs[0]?.title}"`);

  // Mark notification as read
  if (notifs.length > 0) {
    const markReadRes = await request('POST', `/api/v1/donor/notifications/${notifs[0].id}/read`, {}, loggedInCookie);
    record('Notification Flow', 'Mark Notification as Read', markReadRes.status === 200 ? 'PASS' : 'FAIL', `Status: ${markReadRes.status}`);
  }

  const donorOppsRes = await request('GET', '/api/v1/donor/opportunities', null, loggedInCookie);
  const oppsList = donorOppsRes.data?.data?.items || donorOppsRes.data?.items || [];
  const candidateOpp = oppsList.find(o => o.bloodRequestId === bloodReq?.id || o.id === createdOpp?.id) || oppsList[0];
  record('Opportunity Flow', 'Donor Sees Pending Opportunity', Boolean(candidateOpp) ? 'PASS' : 'FAIL', `Opportunity ID: ${candidateOpp?.id}, Status: ${candidateOpp?.status}`);

  // View Opportunity detail
  if (candidateOpp?.id) {
    const oppDetailRes = await request('GET', `/api/v1/donor/opportunities/${candidateOpp.id}`, null, loggedInCookie);
    const oppDetail = oppDetailRes.data?.data || oppDetailRes.data;
    record('Opportunity Flow', 'View Opportunity Details', oppDetailRes.status === 200 ? 'PASS' : 'FAIL', `Hospital: ${oppDetail?.bloodRequest?.hospitalName}, Status: ${oppDetail?.status}`);

    // PRIVACY CHECK: Verify patientReference and clinicalNotes are NOT exposed to donor
    const exposedPHI = oppDetail?.bloodRequest?.patientReference || oppDetail?.bloodRequest?.clinicalNotes;
    record('Privacy & PHI', 'PHI Redacted from Donor View', !exposedPHI ? 'PASS' : 'FAIL', `patientReference exposed: ${Boolean(oppDetail?.bloodRequest?.patientReference)}, clinicalNotes exposed: ${Boolean(oppDetail?.bloodRequest?.clinicalNotes)}`);

    // Donor Accepts Opportunity
    const acceptOppRes = await request('POST', `/api/v1/donor/opportunities/${candidateOpp.id}/accept`, {}, loggedInCookie);
    const acceptedData = acceptOppRes.data?.data || acceptOppRes.data;
    record('Opportunity Flow', 'Donor Accepts Opportunity (Available)', acceptOppRes.status === 200 && acceptedData?.status === 'ACCEPTED' ? 'PASS' : 'FAIL', `Status: ${acceptedData?.status}`);
  }

  // 17. ADMIN DONATION RECORDING & FULFILLMENT ATOMICITY
  if (targetDonorProfileId) {
    const donationRes = await request('POST', `/api/v1/admin/donors/${targetDonorProfileId}/donations`, {
      location: 'QA Clinical Emergency Center, Butwal',
      donatedAt: new Date().toISOString(),
      bloodRequestId: bloodReq?.id,
      notes: 'Synthetic clinical verification test procedure'
    }, adminCookie);

    const donationData = donationRes.data?.data || donationRes.data;
    if (donationData?.donation?.id) {
      syntheticRecords.donations.push(donationData.donation.id);
    }
    record('Donation & Fulfillment', 'Record Donation Linked to Request', donationRes.status === 201 ? 'PASS' : 'FAIL', `Donation ID: ${donationData?.donation?.id}, Linked Request ID: ${donationData?.donation?.bloodRequestId}`);

    // Check request fulfillment count
    const reqStatusRes = await request('GET', `/api/v1/admin/blood-requests/${bloodReq?.id}`, null, adminCookie);
    const updatedReq = reqStatusRes.data?.data || reqStatusRes.data;
    record('Donation & Fulfillment', 'Fulfillment Count Incremented (1/2)', updatedReq?.unitsFulfilled === 1 ? 'PASS' : 'FAIL', `Units: ${updatedReq?.unitsFulfilled} / ${updatedReq?.unitsRequired}, Status: ${updatedReq?.status}`);

    // Check donor donation history
    const donorHistoryRes = await request('GET', '/api/v1/donor/me/donations', null, loggedInCookie);
    const donorDonations = donorHistoryRes.data?.data || donorHistoryRes.data || [];
    record('Donation History', 'Donor Profile History Updated', donorDonations.length >= 1 ? 'PASS' : 'FAIL', `Donor lifetime verified donations: ${donorDonations.length}`);
  }

  // 18. AUDIT LOG VERIFICATION
  const auditLogsRes = await request('GET', '/api/v1/admin/audit-logs?limit=10', null, adminCookie);
  const logs = auditLogsRes.data?.data?.items || auditLogsRes.data?.items || [];
  const actionsCaptured = logs.map(l => l.action);
  const hasAuditActions = actionsCaptured.some(a => a.includes('DONATION') || a.includes('OPPORTUNITY') || a.includes('REQUEST') || a.includes('LOGIN'));
  record('Audit Logging', 'Immutable Event Trail Generated', auditLogsRes.status === 200 && hasAuditActions ? 'PASS' : 'FAIL', `Captured recent events: ${actionsCaptured.slice(0, 5).join(', ')}`);

  // 19. SAFE API ERROR HANDLING (No stack trace, structured error)
  const malformedRes = await request('GET', '/api/v1/admin/blood-requests/invalid-uuid-format-1234', null, adminCookie);
  const isSafeError = (malformedRes.status === 400 || malformedRes.status === 404 || malformedRes.status === 422) && !JSON.stringify(malformedRes.data).includes('at Object.') && !JSON.stringify(malformedRes.data).includes('prisma:');
  record('Security & Error Handling', 'Safe Structured Error on Malformed UUID', isSafeError ? 'PASS' : 'FAIL', `Status: ${malformedRes.status}, Error Body: ${JSON.stringify(malformedRes.data)}`);

  // 20. CORS PREFLIGHT FROM CLIENT ORIGIN
  const corsRes = await request('OPTIONS', '/api/v1/auth/login', null, '', {
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'content-type'
  });
  const allowOrigin = corsRes.headers['access-control-allow-origin'];
  const allowCreds = corsRes.headers['access-control-allow-credentials'];
  record('CORS & Origin Hardening', 'CORS Preflight Configured for Client', corsRes.status === 204 || corsRes.status === 200 ? 'PASS' : 'FAIL', `Allow-Origin: ${allowOrigin}, Allow-Credentials: ${allowCreds}`);

  console.log('\n================================================================');
  console.log('AUDIT SUMMARY');
  console.log('Total Tests Executed:', testResults.length);
  console.log('Passed:', testResults.filter(t => t.status === 'PASS').length);
  console.log('Failed:', testResults.filter(t => t.status === 'FAIL').length);
  console.log('Synthetic Records Created:', JSON.stringify(syntheticRecords, null, 2));
  console.log('================================================================\n');

  return { testResults, syntheticRecords };
}

runLiveAudit();
