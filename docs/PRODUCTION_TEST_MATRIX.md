# HEMACARE — PRODUCTION MASTER TEST MATRIX

**Audit Date:** September 1, 2026  
**Auditor:** Production QA & Reliability Engineering Suite  
**Target Environments:**
- Frontend: `https://client-sigma-peach.vercel.app`
- Backend: `https://blood-donation-6vcp.onrender.com`

---

## Master Test Execution Matrix

| Test ID | Area | Test Description | Expected Behavior | Actual Behavior | Status | Evidence |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **AVAIL-001** | Availability | Frontend Root (`/`) | HTTP 200, SPA root mounts | 200 OK, latency `<200ms` | ✅ **PASS** | `client-sigma-peach.vercel.app/` |
| **AVAIL-002** | Availability | Backend Health (`/health`) | HTTP 200, status `healthy` | 200 OK, `database: connected` | ✅ **PASS** | `blood-donation-6vcp.onrender.com/health` |
| **AVAIL-003** | Availability | Backend Liveness (`/health/live`) | HTTP 200, status `alive` | 200 OK, service alive | ✅ **PASS** | `/health/live` returns JSON |
| **AVAIL-004** | Availability | Backend Readiness (`/health/ready`)| HTTP 200, DB connected | 200 OK, database ready | ✅ **PASS** | `/health/ready` returns JSON |
| **AVAIL-005** | Availability | API Root (`/`) | HTTP 200, API metadata | 200 OK, version 1.0.0 | ✅ **PASS** | `name: HemaCare API` |
| **PUB-001** | Public UI | Homepage Two-Column Hero | Warm healthcare hero, no black box | Verified `#FFF7F8` theme | ✅ **PASS** | Browser visual audit |
| **PUB-002** | Public UI | ABO Compatibility Explorer | Interactive 8 buttons update list | O+, O-, A+, AB- verified | ✅ **PASS** | Interactive state audit |
| **PUB-003** | Public UI | Clinical Disclaimer Visibility | Clear disclaimer displayed | Displayed below explorer | ✅ **PASS** | Text visible on page |
| **PUB-004** | Public UI | How It Works 4-Step Sequence | 01 Register -> 04 Donate | 4 cards cleanly rendered | ✅ **PASS** | UI audit |
| **PUB-005** | Public UI | Active Requests Preview | Live progress bars displayed | Requests rendered cleanly | ✅ **PASS** | UI audit |
| **AUTH-001** | Auth | Valid Donor Registration | 201 Created + User + DonorProfile | 201 Created, Role: DONOR | ✅ **PASS** | Synthetic Donor Alpha |
| **AUTH-002** | Auth | Duplicate Email Registration | 409 Conflict | 409 (`Account already exists`) | ✅ **PASS** | Duplicate email rejected |
| **AUTH-003** | Auth | Malformed Email Validation | 422 Unprocessable Entity | 422 (`Valid email required`) | ✅ **PASS** | Zod schema validation |
| **AUTH-004** | Auth | Future Date of Birth | 422 Unprocessable Entity | 422 (`Cannot be in future`) | ✅ **PASS** | Zod schema validation |
| **AUTH-005** | Auth | Weak Password (<8 chars) | 422 Unprocessable Entity | 422 (`Min 8 chars required`)| ✅ **PASS** | Zod schema validation |
| **AUTH-006** | Auth | Role Escalation Attempt | Server sanitizes `role: ADMIN` | User assigned `DONOR` | ✅ **PASS** | Role escalation prevented |
| **AUTH-007** | Auth | Valid Donor Login | 200 OK + HttpOnly JWT Cookie | 200 OK, Set-Cookie returned| ✅ **PASS** | Donor session established |
| **AUTH-008** | Auth | Valid Admin Login | 200 OK + Admin Cookie | 200 OK, Role: ADMIN | ✅ **PASS** | Admin session established |
| **AUTH-009** | Auth | Invalid Password Login | 401 Unauthorized | 401 (`Invalid credentials`) | ✅ **PASS** | Safe error returned |
| **AUTH-010** | Auth | Unknown User Login | 401 Unauthorized | 401 (`Invalid credentials`) | ✅ **PASS** | Safe error returned |
| **AUTH-011** | Auth | Brute-Force Rate Limiting | 429 Too Many Requests | 429 after >10 attempts | ✅ **PASS** | `authLimiter` active |
| **AUTH-012** | Auth | Session Cookie Attributes | `HttpOnly=true`, `SameSite=lax` | Verified in response headers| ✅ **PASS** | Header inspection |
| **AUTH-013** | Auth | Logout Flow | Clears session cookie | Cookie cleared, redirect | ✅ **PASS** | `/api/v1/auth/logout` |
| **DONOR-001** | Donor | Fetch Profile (`/donor/me`) | 200 OK + Profile + Eligibility | 200 OK, `isEligible: true` | ✅ **PASS** | Full profile retrieved |
| **DONOR-002** | Donor | Update Profile (`/donor/me`) | 200 OK + Updated Address | 200 OK, Address updated | ✅ **PASS** | Address mutated |
| **DONOR-003** | Donor | Profile Persistence | Persists across hard reload | Verified in database | ✅ **PASS** | Subsquent GET verified |
| **DONOR-004** | Donor | Notification Consents | Persists channel & time prefs | 200 OK, Consents saved | ✅ **PASS** | Preference payload |
| **DONOR-005** | Donor | View Donation History | Displays verified timeline | 200 OK, Timeline array | ✅ **PASS** | `/donor/me/donations` |
| **REQ-001** | Request | Create Request Validation (0 units)| 422 Unprocessable Entity | 422 (`At least 1 unit`) | ✅ **PASS** | Validation rejected |
| **REQ-002** | Request | Create Request Validation (Past date)| 422 Unprocessable Entity | 422 (`Cannot be past`) | ✅ **PASS** | Validation rejected |
| **REQ-003** | Request | Create Valid Blood Request (2 units)| 201 Created, Status: `OPEN` | 201 Created, Status: OPEN | ✅ **PASS** | Request ID created |
| **REQ-004** | Request | Cancel Blood Request | Status transitions to `CANCELLED` | 200 OK, Status: CANCELLED | ✅ **PASS** | Cancel lifecycle |
| **REQ-005** | Request | Protect Cancelled Request | Rejects donation on cancelled req| 400 Bad Request | ✅ **PASS** | Donation rejected |
| **MATCH-001** | Matching | Deterministic Compatibility | Compatible groups evaluated | `O_NEGATIVE`, `O_POSITIVE` | ✅ **PASS** | Compatibility map |
| **MATCH-002** | Matching | Multi-Factor Ranking Score | Exact: 83%, Compatible: 73% | 83% & 73% scores verified | ✅ **PASS** | Matching service query |
| **MATCH-003** | Matching | Ineligible Donor Exclusion | Excludes cooldown & age donors | Excluded from candidates | ✅ **PASS** | Interval filtering |
| **NOTIF-001** | Notification | In-App Notification Generation | Notification enqueued on outreach| Verified in donor queue | ✅ **PASS** | Notification created |
| **NOTIF-002** | Notification | Unread Count Polling | Client polls every 30s | 200 OK, Unread count | ✅ **PASS** | 30s poll interval |
| **NOTIF-003** | Notification | Mark As Read | Updates `readAt` timestamp | 200 OK, Read timestamp set | ✅ **PASS** | Independent read state |
| **OPP-001** | Opportunity | Dispatch Opportunity Batch | Creates `Opportunity` (`PENDING`) | 201 Created | ✅ **PASS** | Opportunity created |
| **OPP-002** | Opportunity | Duplicate Opportunity Defense | Idempotent dispatch (0 duplicate)| Created count: 0 | ✅ **PASS** | Duplicate prevented |
| **OPP-003** | Opportunity | Donor View Opportunity Detail | Status transitions to `VIEWED` | 200 OK, Auto-viewed | ✅ **PASS** | State transition |
| **OPP-004** | Opportunity | Donor Accept Opportunity | Status transitions to `ACCEPTED`| 200 OK, Status: ACCEPTED | ✅ **PASS** | No premature donation |
| **DON-001** | Donation | Record Linked Donation (Unit 1) | Increments units (`1/2`), `PARTIAL`| `unitsFulfilled: 1/2` | ✅ **PASS** | Partial fulfillment |
| **DON-002** | Donation | Record Linked Donation (Unit 2) | Increments units (`2/2`), `FULFILLED`| `unitsFulfilled: 2/2` | ✅ **PASS** | Full fulfillment |
| **DON-003** | Donation | Over-Fulfillment Protection | Rejects unit 3 on 2-unit request | 400 Bad Request | ✅ **PASS** | Over-fulfillment blocked |
| **DON-004** | Donation | Donor Cooldown Cadence Update | Sets `lastDonationAt` timestamp | Enforces 56-day cooldown | ✅ **PASS** | Cadence updated |
| **AUDIT-001** | Audit | Immutable Audit Log Trail | Captures actor, target, timestamp| Verified in audit query | ✅ **PASS** | Recent events logged |
| **AUDIT-002** | Audit | Donor Blocked from Audit Logs | 403 Forbidden on donor session | 403 Forbidden | ✅ **PASS** | Audit isolation |
| **SEC-001** | Security | Donor Blocked from Admin Dashboard| 403 Forbidden | 403 Forbidden | ✅ **PASS** | RBAC perimeter |
| **SEC-002** | Security | Cross-Donor Opportunity IDOR | 403 Forbidden on Donor B | 403 Forbidden | ✅ **PASS** | IDOR prevented |
| **SEC-003** | Security | PHI Redaction in Donor Payloads | `patientReference` & notes absent| Redacted in donor response | ✅ **PASS** | Zero PHI leak |
| **SEC-004** | Security | Server Secrets Redaction | `passwordHash`, DB URL absent | Verified absent in JSON | ✅ **PASS** | Zero secret leak |
| **SEC-005** | Security | CORS Origin Enforcement | Whitelists Vercel domain only | Preflight headers verified | ✅ **PASS** | Preflight 204/200 |
| **SEC-006** | Security | Security Headers | HSTS, nosniff headers present | Verified in response | ✅ **PASS** | HSTS max-age 31536000 |
| **ERR-001** | Resilience | Malformed Route UUID Param | Safe 422 / 400 error | No stack trace, safe JSON | ✅ **PASS** | Structured error |
| **ERR-002** | Resilience | Stale Chunk Recovery (`lazyRetry`)| Automatic single-reload recovery| Verified in error handler | ✅ **PASS** | Chunk recovery utility |
| **PERF-001** | Performance | Entry Bundle Size | Main JS chunk `<250 kB` | `221.68 kB` (-68%) | ✅ **PASS** | Phase 17 optimization |
| **PERF-002** | Performance | Vite Chunk Warnings | Zero chunks `>500 kB` | 0 warnings | ✅ **PASS** | Production build |
| **MOB-001** | Responsive | Mobile 390px Viewport | Clean stack, no horizontal scroll| Verified on 390px view | ✅ **PASS** | Mobile audit |
| **MOB-002** | Responsive | Tablet 768px Viewport | Clean grid, readable text | Verified on 768px view | ✅ **PASS** | Tablet audit |
