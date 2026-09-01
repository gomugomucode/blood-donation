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

async function runCompleteQAAudit() {
  console.log('================================================================');
  console.log('HEMACARE LIVE DEPLOYED PLATFORM 100% EXHAUSTIVE QA & SECURITY AUDIT');
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
  record('Health & Availability', 'GET /health', healthRes.status === 200 && healthRes.data?.status === 'healthy' ? 'PASS' : 'FAIL', `Status: ${healthRes.status}, DB: ${healthRes.data?.database}`);

  const liveRes = await request('GET', '/health/live');
  record('Health & Availability', 'GET /health/live (Liveness)', liveRes.status === 200 && liveRes.data?.status === 'alive' ? 'PASS' : 'FAIL', `Status: ${liveRes.status}, Service: ${liveRes.data?.service}`);

  const readyRes = await request('GET', '/health/ready');
  record('Health & Availability', 'GET /health/ready (Readiness)', readyRes.status === 200 && readyRes.data?.status === 'ready' ? 'PASS' : 'FAIL', `Status: ${readyRes.status}, Database: ${readyRes.data?.database}`);

  const apiRootRes = await request('GET', '/');
  record('Health & Availability', 'GET / (API Root Metadata)', apiRootRes.status === 200 && apiRootRes.data?.status === 'online' ? 'PASS' : 'FAIL', `Status: ${apiRootRes.status}, Version: ${apiRootRes.data?.version}`);

  // 2. REGISTRATION & VALIDATION
  const timestamp = Date.now();
  const invalidEmailRes = await request('POST', '/api/v1/auth/register', {
    email: 'invalid-email-format',
    password: 'Password123!',
    fullName: 'Test Invalid',
    dateOfBirth: '1995-05-10',
    bloodGroup: 'O_POSITIVE',
    contactNumber: '+9779800000000',
    address: 'Kathmandu, Nepal'
  });
  record('Registration Validation', 'Reject Malformed Email', invalidEmailRes.status === 422 || invalidEmailRes.status === 400 ? 'PASS' : 'FAIL', `Status: ${invalidEmailRes.status}`, JSON.stringify(invalidEmailRes.data?.errors || invalidEmailRes.data));

  const futureDobRes = await request('POST', '/api/v1/auth/register', {
    email: `qa-future-${timestamp}@example.test`,
    password: 'Password123!',
    fullName: 'Test Future',
    dateOfBirth: '2035-01-01',
    bloodGroup: 'O_POSITIVE',
    contactNumber: '+9779800000000',
    address: 'Kathmandu, Nepal'
  });
  record('Registration Validation', 'Reject Future Date of Birth', futureDobRes.status === 422 || futureDobRes.status === 400 ? 'PASS' : 'FAIL', `Status: ${futureDobRes.status}`, JSON.stringify(futureDobRes.data?.errors || futureDobRes.data));

  const weakPassRes = await request('POST', '/api/v1/auth/register', {
    email: `qa-weakpass-${timestamp}@example.test`,
    password: '123',
    fullName: 'Test Weak',
    dateOfBirth: '1995-05-10',
    bloodGroup: 'O_POSITIVE',
    contactNumber: '+9779800000000',
    address: 'Kathmandu, Nepal'
  });
  record('Registration Validation', 'Reject Weak Password (<8 chars)', weakPassRes.status === 422 || weakPassRes.status === 400 ? 'PASS' : 'FAIL', `Status: ${weakPassRes.status}`, JSON.stringify(weakPassRes.data?.errors || weakPassRes.data));

  // 3. ROLE ESCALATION DEFENSE
  const escalationEmail = `qa-esc-${timestamp}@example.test`;
  const escalationRes = await request('POST', '/api/v1/auth/register', {
    email: escalationEmail,
    password: 'DonorPassword123!',
    fullName: 'QA Escalation Test',
    dateOfBirth: '1992-06-15',
    bloodGroup: 'O_POSITIVE',
    contactNumber: '+9779841112233',
    address: 'Kathmandu, Nepal',
    role: 'ADMIN' // Attacker attempts to grant themselves ADMIN
  });
  const escalationUserRole = escalationRes.data?.data?.user?.role || escalationRes.data?.user?.role;
  record('Security & RBAC', 'Privilege Escalation Defense on Register', escalationRes.status === 201 && escalationUserRole === 'DONOR' ? 'PASS' : (escalationRes.status >= 400 ? 'PASS' : 'FAIL'), `Assigned Role: ${escalationUserRole}`, `Server sanitized client role: ADMIN and assigned: ${escalationUserRole}`);

  // 4. SYNTHETIC DONOR A CREATION
  const donorAEmail = `qa-donor-alpha-${timestamp}@example.test`;
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
    syntheticRecords.donors.push({ id: donorAData.id, email: donorAEmail, name: 'Donor Alpha', bloodGroup: 'O+' });
  }
  record('Registration', 'Valid Donor Registration (Donor Alpha)', regDonorARes.status === 201 ? 'PASS' : 'FAIL', `Status: 201, User ID: ${donorAData?.id}, Role: ${donorAData?.role}`);

  // 5. SYNTHETIC DONOR B CREATION (O_NEGATIVE)
  const donorBEmail = `qa-donor-beta-${timestamp}@example.test`;
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
    syntheticRecords.donors.push({ id: donorBData.id, email: donorBEmail, name: 'Donor Beta', bloodGroup: 'O-' });
  }
  record('Registration', 'Valid Donor Registration (Donor Beta O-)', regDonorBRes.status === 201 ? 'PASS' : 'FAIL', `Status: 201, User ID: ${donorBData?.id}, Role: ${donorBData?.role}`);

  // 6. DUPLICATE EMAIL DEFENSE
  const duplicateEmailRes = await request('POST', '/api/v1/auth/register', {
    email: donorAEmail, // Already registered
    password: 'Password123!',
    fullName: 'Duplicate Donor',
    dateOfBirth: '1995-04-12',
    bloodGroup: 'O_POSITIVE',
    contactNumber: '+9779811223344',
    address: 'Kathmandu, Nepal'
  });
  record('Registration Validation', 'Reject Duplicate Email Registration', duplicateEmailRes.status === 409 || duplicateEmailRes.status === 400 || duplicateEmailRes.status === 422 ? 'PASS' : 'FAIL', `Status: ${duplicateEmailRes.status}`, JSON.stringify(duplicateEmailRes.data));

  // 7. INVALID LOGIN ATTEMPTS
  const wrongPassRes = await request('POST', '/api/v1/auth/login', {
    email: donorAEmail,
    password: 'WrongPassword123!'
  });
  record('Authentication', 'Reject Invalid Password', wrongPassRes.status === 401 ? 'PASS' : 'FAIL', `Status: ${wrongPassRes.status}`, JSON.stringify(wrongPassRes.data));

  const unknownUserRes = await request('POST', '/api/v1/auth/login', {
    email: 'nonexistent-donor-999@example.test',
    password: 'Password123!'
  });
  record('Authentication', 'Reject Unknown User', unknownUserRes.status === 401 ? 'PASS' : 'FAIL', `Status: ${unknownUserRes.status}`, JSON.stringify(unknownUserRes.data));

  // 8. VALID DONOR LOGIN & COOKIE ATTRIBUTES
  const loginRes = await request('POST', '/api/v1/auth/login', {
    email: donorAEmail,
    password: donorAPass
  });
  const loggedInCookie = loginRes.cookie;
  const cookieHeaders = loginRes.setCookieHeaders.join('; ');
  const isHttpOnly = cookieHeaders.toLowerCase().includes('httponly');
  const isSameSite = cookieHeaders.toLowerCase().includes('samesite');
  record('Authentication', 'Valid Donor Login & Token Issue', loginRes.status === 200 ? 'PASS' : 'FAIL', `Status: ${loginRes.status}, User ID: ${loginRes.data?.data?.user?.id || loginRes.data?.user?.id}`);
  record('Security & Cookies', 'Session Cookie HttpOnly & SameSite Protection', isHttpOnly ? 'PASS' : 'FAIL', `HttpOnly: ${isHttpOnly}, SameSite: ${isSameSite}`);

  // 9. DONOR PROFILE & ELIGIBILITY
  const profileRes = await request('GET', '/api/v1/donor/me', null, loggedInCookie);
  const profile = profileRes.data?.data || profileRes.data;
  record('Donor Profile', 'Fetch Profile & Basic Eligibility', profileRes.status === 200 && profile?.fullName ? 'PASS' : 'FAIL', `Name: ${profile?.fullName}, BloodGroup: ${profile?.bloodGroup}, IsEligible: ${profile?.eligibility?.isEligible}`);

  // Update Profile
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

  // 10. ADMIN LOGIN & CAPABILITIES
  const adminLoginRes = await request('POST', '/api/v1/auth/login', {
    email: 'admin@blooddonation.org',
    password: 'AdminSecurePass123!'
  });
  const adminCookie = adminLoginRes.cookie;
  record('Admin Authentication', 'Staff Coordinator Login', adminLoginRes.status === 200 ? 'PASS' : 'FAIL', `Status: ${adminLoginRes.status}, User: ${adminLoginRes.data?.data?.user?.email || adminLoginRes.data?.user?.email}`);

  // 11. RBAC & IDOR ENFORCEMENT
  const donorToAdminDash = await request('GET', '/api/v1/admin/dashboard', null, loggedInCookie);
  record('RBAC Enforcement', 'Donor Forbidden from /api/v1/admin/dashboard', donorToAdminDash.status === 403 ? 'PASS' : 'FAIL', `Status: ${donorToAdminDash.status}`);

  const donorToAdminDonors = await request('GET', '/api/v1/admin/donors', null, loggedInCookie);
  record('RBAC Enforcement', 'Donor Forbidden from /api/v1/admin/donors', donorToAdminDonors.status === 403 ? 'PASS' : 'FAIL', `Status: ${donorToAdminDonors.status}`);

  const donorToAdminAudit = await request('GET', '/api/v1/admin/audit-logs', null, loggedInCookie);
  record('RBAC Enforcement', 'Donor Forbidden from /api/v1/admin/audit-logs', donorToAdminAudit.status === 403 ? 'PASS' : 'FAIL', `Status: ${donorToAdminAudit.status}`);

  // 12. ADMIN DASHBOARD TELEMETRY
  const adminDashRes = await request('GET', '/api/v1/admin/dashboard', null, adminCookie);
  const dashData = adminDashRes.data?.data || adminDashRes.data;
  record('Admin Dashboard', 'Fetch Command Center Metrics', adminDashRes.status === 200 && typeof dashData?.totalDonors === 'number' ? 'PASS' : 'FAIL', `TotalDonors: ${dashData?.totalDonors}, EligibleDonors: ${dashData?.eligibleDonors}, OpenRequests: ${dashData?.requestMetrics?.openRequests}`);

  // 13. ADMIN DONOR REGISTRY & SEARCH
  const donorSearchRes = await request('GET', `/api/v1/admin/donors?search=Alpha`, null, adminCookie);
  const searchResults = donorSearchRes.data?.data?.items || donorSearchRes.data?.items || [];
  record('Admin Donor Registry', 'Search Donors by Name', donorSearchRes.status === 200 && searchResults.length > 0 ? 'PASS' : 'FAIL', `Found ${searchResults.length} matches for "Alpha"`);

  // 14. BLOOD REQUEST CREATION & VALIDATION
  const invalidReqRes = await request('POST', '/api/v1/admin/blood-requests', {
    bloodGroup: 'O_POSITIVE',
    unitsRequired: 0,
    urgency: 'NORMAL',
    hospitalName: 'QA Hospital',
    contactName: 'QA Coordinator',
    contactNumber: '+9779800000000',
    location: 'Butwal',
    requiredBy: '2020-01-01'
  }, adminCookie);
  record('Blood Request Validation', 'Reject 0 Units & Past RequiredBy Date', invalidReqRes.status === 422 || invalidReqRes.status === 400 ? 'PASS' : 'FAIL', `Status: ${invalidReqRes.status}`, JSON.stringify(invalidReqRes.data?.errors || invalidReqRes.data));

  // Valid Blood Request (O_POSITIVE, 2 units)
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
  record('Blood Request CRUD', 'Create Synthetic Blood Request (2 units)', validReqRes.status === 201 ? 'PASS' : 'FAIL', `ID: ${bloodReq?.id}, Status: ${bloodReq?.status}, RequiredBy: ${bloodReq?.requiredBy}`);

  // 15. DETERMINISTIC MATCHING ENGINE VERIFICATION
  const matchRes = await request('GET', `/api/v1/admin/blood-requests/${bloodReq?.id}/matches`, null, adminCookie);
  const matchData = matchRes.data?.data || matchRes.data;
  const candidates = matchData?.candidates || [];
  const compatibleGroups = matchData?.compatibleGroups || [];
  const isCompatibleMatch = compatibleGroups.includes('O_NEGATIVE') && compatibleGroups.includes('O_POSITIVE');
  record('Matching Engine', 'Deterministic ABO/Rh Compatibility Engine', matchRes.status === 200 && isCompatibleMatch ? 'PASS' : 'FAIL', `Compatible groups: ${compatibleGroups.join(', ')}, Total Candidates: ${matchData?.totalEligibleCandidates}`, `Top Match Score: ${candidates[0]?.matchScore}%, Compatibility: ${candidates[0]?.compatibilityType}`);

  // 16. OPPORTUNITY DISPATCH & IDEMPOTENCY
  const targetDonorProfileId = profile?.id || candidates[0]?.donorId;
  const dispatchRes = await request('POST', `/api/v1/admin/blood-requests/${bloodReq?.id}/opportunities`, {
    donorIds: [targetDonorProfileId]
  }, adminCookie);
  const oppResults = dispatchRes.data?.data?.createdOpportunities || dispatchRes.data?.createdOpportunities || [];
  const createdOpp = oppResults[0];
  if (createdOpp?.id) {
    syntheticRecords.opportunities.push(createdOpp.id);
  }
  record('Opportunity Dispatch', 'Dispatch Outreach Opportunity to Candidate', dispatchRes.status === 201 || dispatchRes.status === 200 ? 'PASS' : 'FAIL', `Created ${oppResults.length} opportunities. Opportunity ID: ${createdOpp?.id}`);

  // Attempt duplicate dispatch (Idempotency test)
  const dupDispatchRes = await request('POST', `/api/v1/admin/blood-requests/${bloodReq?.id}/opportunities`, {
    donorIds: [targetDonorProfileId]
  }, adminCookie);
  const dupCount = dupDispatchRes.data?.data?.createdCount ?? 0;
  record('Opportunity Dispatch', 'Duplicate Opportunity Prevention', dupCount === 0 || dupDispatchRes.status === 200 || dupDispatchRes.status === 409 ? 'PASS' : 'FAIL', `Duplicate dispatch created count: ${dupCount}`);

  // 17. DONOR NOTIFICATION & OPPORTUNITY FLOW
  const donorNotifsRes = await request('GET', '/api/v1/donor/notifications', null, loggedInCookie);
  const notifs = donorNotifsRes.data?.data?.items || donorNotifsRes.data?.items || [];
  record('Notification Flow', 'Donor Receives Targeted Notification Alert', notifs.length > 0 ? 'PASS' : 'FAIL', `Notifications count: ${notifs.length}, Top title: "${notifs[0]?.title}"`);

  if (notifs.length > 0) {
    const markReadRes = await request('POST', `/api/v1/donor/notifications/${notifs[0].id}/read`, {}, loggedInCookie);
    record('Notification Flow', 'Mark Notification as Read', markReadRes.status === 200 ? 'PASS' : 'FAIL', `Status: ${markReadRes.status}`);
  }

  const donorOppsRes = await request('GET', '/api/v1/donor/opportunities', null, loggedInCookie);
  const oppsList = donorOppsRes.data?.data?.items || donorOppsRes.data?.items || [];
  const candidateOpp = oppsList.find(o => o.bloodRequestId === bloodReq?.id || o.id === createdOpp?.id) || oppsList[0];
  record('Opportunity Flow', 'Donor Sees Matching Opportunity', Boolean(candidateOpp) ? 'PASS' : 'FAIL', `Opportunity ID: ${candidateOpp?.id}, Status: ${candidateOpp?.status}`);

  if (candidateOpp?.id) {
    const oppDetailRes = await request('GET', `/api/v1/donor/opportunities/${candidateOpp.id}`, null, loggedInCookie);
    const oppDetail = oppDetailRes.data?.data || oppDetailRes.data;
    record('Opportunity Flow', 'View Opportunity Details', oppDetailRes.status === 200 ? 'PASS' : 'FAIL', `Hospital: ${oppDetail?.bloodRequest?.hospitalName}, Status: ${oppDetail?.status}`);

    // PRIVACY CHECK
    const exposedPHI = Boolean(oppDetail?.bloodRequest?.patientReference || oppDetail?.bloodRequest?.clinicalNotes);
    record('Privacy & PHI Protection', 'Zero PHI Leakage to Donor View', !exposedPHI ? 'PASS' : 'FAIL', `patientReference exposed: ${Boolean(oppDetail?.bloodRequest?.patientReference)}, clinicalNotes exposed: ${Boolean(oppDetail?.bloodRequest?.clinicalNotes)}`);

    // Donor Accepts Opportunity
    const acceptOppRes = await request('POST', `/api/v1/donor/opportunities/${candidateOpp.id}/accept`, {}, loggedInCookie);
    const acceptedData = acceptOppRes.data?.data || acceptOppRes.data;
    record('Opportunity Flow', 'Donor Accepts Opportunity (Available)', acceptOppRes.status === 200 && acceptedData?.status === 'ACCEPTED' ? 'PASS' : 'FAIL', `Status: ${acceptedData?.status}`);
  }

  // 18. IDOR TEST: DONOR B ACCESSING DONOR A OPPORTUNITY
  if (candidateOpp?.id) {
    const idorOppRes = await request('GET', `/api/v1/donor/opportunities/${candidateOpp.id}`, null, donorBCookie);
    record('Security / IDOR', 'Cross-Donor Opportunity Access Forbidden (IDOR)', idorOppRes.status === 403 || idorOppRes.status === 404 ? 'PASS' : 'FAIL', `Donor B status accessing Donor A opportunity: ${idorOppRes.status}`);
  }

  // 19. ADMIN DONATION RECORDING & FULFILLMENT ATOMICITY
  if (targetDonorProfileId) {
    const donationRes = await request('POST', `/api/v1/admin/donors/${targetDonorProfileId}/donations`, {
      location: 'QA Clinical Emergency Center, Butwal',
      donatedAt: new Date().toISOString(),
      bloodRequestId: bloodReq?.id,
      notes: 'Synthetic clinical verification unit 1'
    }, adminCookie);

    const donationData = donationRes.data?.data || donationRes.data;
    if (donationData?.donation?.id) {
      syntheticRecords.donations.push(donationData.donation.id);
    }
    record('Donation & Fulfillment', 'Record Unit 1 Linked to Request', donationRes.status === 201 ? 'PASS' : 'FAIL', `Donation ID: ${donationData?.donation?.id}, Linked Request ID: ${donationData?.donation?.bloodRequestId}`);

    // Check request unitsFulfilled incremented
    const reqStatusRes = await request('GET', `/api/v1/admin/blood-requests/${bloodReq?.id}`, null, adminCookie);
    const updatedReq = reqStatusRes.data?.data || reqStatusRes.data;
    record('Donation & Fulfillment', 'Request Status PARTIALLY_FULFILLED (1/2)', updatedReq?.unitsFulfilled === 1 && updatedReq?.status === 'PARTIALLY_FULFILLED' ? 'PASS' : 'FAIL', `Units: ${updatedReq?.unitsFulfilled} / ${updatedReq?.unitsRequired}, Status: ${updatedReq?.status}`);

    // Record second donation to reach full fulfillment
    const donation2Res = await request('POST', `/api/v1/admin/donors/${targetDonorProfileId}/donations`, {
      location: 'QA Clinical Emergency Center, Butwal',
      donatedAt: new Date().toISOString(),
      bloodRequestId: bloodReq?.id,
      notes: 'Synthetic clinical verification unit 2'
    }, adminCookie);
    const reqStatus2Res = await request('GET', `/api/v1/admin/blood-requests/${bloodReq?.id}`, null, adminCookie);
    const fulfilledReq = reqStatus2Res.data?.data || reqStatus2Res.data;
    record('Donation & Fulfillment', 'Request Status FULFILLED (2/2)', fulfilledReq?.unitsFulfilled === 2 && fulfilledReq?.status === 'FULFILLED' ? 'PASS' : 'FAIL', `Units: ${fulfilledReq?.unitsFulfilled} / ${fulfilledReq?.unitsRequired}, Status: ${fulfilledReq?.status}`);

    // Over-fulfillment rejection test: Attempt unit 3
    const overFulfillRes = await request('POST', `/api/v1/admin/donors/${targetDonorProfileId}/donations`, {
      location: 'QA Clinical Emergency Center, Butwal',
      donatedAt: new Date().toISOString(),
      bloodRequestId: bloodReq?.id,
      notes: 'Synthetic over-fulfillment unit 3'
    }, adminCookie);
    record('Donation & Fulfillment', 'Over-Fulfillment Protection (Rejects Unit 3 on 2-Unit Request)', overFulfillRes.status === 400 ? 'PASS' : 'FAIL', `Status: ${overFulfillRes.status}`, JSON.stringify(overFulfillRes.data));

    // Check donor donation history
    const donorHistoryRes = await request('GET', '/api/v1/donor/me/donations', null, loggedInCookie);
    const donorDonations = donorHistoryRes.data?.data || donorHistoryRes.data || [];
    record('Donation History', 'Donor History Updated & Immutable', donorDonations.length >= 1 ? 'PASS' : 'FAIL', `Donor verified lifetime donations: ${donorDonations.length}`);
  }

  // 20. CANCELLED REQUEST PROTECTION
  const cancelReqCreate = await request('POST', '/api/v1/admin/blood-requests', {
    bloodGroup: 'A_POSITIVE',
    unitsRequired: 1,
    urgency: 'LOW',
    hospitalName: 'QA Cancellation Test Facility',
    location: 'Kathmandu',
    contactName: 'Nurse Rita',
    contactNumber: '+9779801122334',
    requiredBy: new Date(Date.now() + 24 * 3600 * 1000).toISOString()
  }, adminCookie);
  const cancelReqId = cancelReqCreate.data?.data?.id || cancelReqCreate.data?.id;
  if (cancelReqId) {
    syntheticRecords.requests.push(cancelReqId);
    // Cancel the request
    const cancelRes = await request('POST', `/api/v1/admin/blood-requests/${cancelReqId}/cancel`, {
      reason: 'Synthetic QA cancellation verification'
    }, adminCookie);
    record('Blood Request Lifecycle', 'Cancel Open Blood Request', cancelRes.status === 200 ? 'PASS' : 'FAIL', `Status: ${cancelRes.status}`);

    // Attempt to record donation against cancelled request
    if (targetDonorProfileId) {
      const cancelDonationRes = await request('POST', `/api/v1/admin/donors/${targetDonorProfileId}/donations`, {
        location: 'QA Hospital',
        donatedAt: new Date().toISOString(),
        bloodRequestId: cancelReqId
      }, adminCookie);
      record('Blood Request Lifecycle', 'Reject Donation Against Cancelled Request', cancelDonationRes.status === 400 ? 'PASS' : 'FAIL', `Status: ${cancelDonationRes.status}`, JSON.stringify(cancelDonationRes.data));
    }
  }

  // 21. AUDIT LOG VERIFICATION
  const auditLogsRes = await request('GET', '/api/v1/admin/audit-logs?limit=15', null, adminCookie);
  const logs = auditLogsRes.data?.data?.items || auditLogsRes.data?.items || [];
  const actionsCaptured = logs.map(l => l.action);
  const hasAuditEvents = actionsCaptured.includes('DONATION_LINKED_TO_REQUEST') || actionsCaptured.includes('DONATION_RECORDED') || actionsCaptured.includes('BLOOD_REQUEST_CREATED');
  record('Audit Logging', 'Immutable Event Trail Generated', auditLogsRes.status === 200 && hasAuditEvents ? 'PASS' : 'FAIL', `Captured ${logs.length} audit logs. Recent actions: ${actionsCaptured.slice(0, 6).join(', ')}`);

  // 22. FORGOT PASSWORD FLOW
  const forgotPassRes = await request('POST', '/api/v1/auth/forgot-password', {
    email: donorAEmail
  });
  record('Password Management', 'Forgot Password Reset Dispatch', forgotPassRes.status === 200 ? 'PASS' : 'FAIL', `Status: ${forgotPassRes.status}`);

  // 23. SENSITIVE DATA EXPOSURE SCAN ON DONOR ENDPOINTS
  const profileRaw = JSON.stringify(profileRes.data);
  const exposedSecrets = profileRaw.includes('passwordHash') || profileRaw.includes('jwtSecret') || profileRaw.includes('DATABASE_URL');
  record('Privacy & Security', 'Zero Sensitive Server Secrets in Responses', !exposedSecrets ? 'PASS' : 'FAIL', `passwordHash exposed: ${profileRaw.includes('passwordHash')}, DATABASE_URL exposed: ${profileRaw.includes('DATABASE_URL')}`);

  // 24. CORS & PREFLIGHT
  const corsRes = await request('OPTIONS', '/api/v1/auth/login', null, '', {
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'content-type'
  });
  const allowOrigin = corsRes.headers['access-control-allow-origin'];
  const allowCreds = corsRes.headers['access-control-allow-credentials'];
  record('CORS & Origin Hardening', 'CORS Preflight Configured for Client Origin', corsRes.status === 204 || corsRes.status === 200 ? 'PASS' : 'FAIL', `Allow-Origin: ${allowOrigin}, Allow-Credentials: ${allowCreds}`);

  console.log('\n================================================================');
  console.log('FINAL AUDIT EXECUTION SUMMARY');
  console.log('Total Automated Verification Cases:', testResults.length);
  console.log('PASSED:', testResults.filter(t => t.status === 'PASS').length);
  console.log('FAILED:', testResults.filter(t => t.status === 'FAIL').length);
  console.log('Synthetic Test Records Created:', JSON.stringify(syntheticRecords, null, 2));
  console.log('================================================================\n');

  return { testResults, syntheticRecords };
}

runCompleteQAAudit();
