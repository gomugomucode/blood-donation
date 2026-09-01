# HEMACARE — LIVE DEPLOYED PLATFORM QA & FUNCTIONAL AUDIT REPORT

**Audit Date:** September 1, 2026  
**Auditor:** Automated Senior QA & Security Reliability Engineering Suite  
**Target Environments:**
- **Frontend Application:** `https://client-sigma-peach.vercel.app` (Vercel CDN)
- **Backend API Gateway:** `https://blood-donation-6vcp.onrender.com` (Render Cloud)
- **Database:** PostgreSQL (Cloud Managed, Prisma ORM 6.4.1)

---

## 1. Executive Summary

A comprehensive, black-box functional, security, UI/UX, and reliability audit was conducted against the live deployed HemaCare blood donation platform. All primary subsystems—including basic eligibility checking, ABO/Rh compatibility matching, outreach opportunity lifecycle, in-app notification dispatch, atomic donation recording, immutable audit logging, and role-based access control (RBAC)—were tested against live production endpoints using synthetic test data.

### Key Audit Findings:
- **System Availability:** Both Frontend (Vercel SPA) and Backend (Render Express API) are **100% available** with active health, liveness, and readiness endpoints.
- **Security & Authorization:** Role-based access control strictly isolates donor and coordinator perimeters. Privilege escalation attacks during registration and cross-donor IDOR attempts were **100% prevented**. Brute-force rate limiting (`429 Too Many Requests`) is active on authentication endpoints.
- **Data Integrity & Atomicity:** Blood requests correctly transition through `OPEN` → `PARTIALLY_FULFILLED` → `FULFILLED`. Over-fulfillment beyond requested units and recording donations against cancelled requests are strictly blocked.
- **Privacy & PHI Protection:** Sensitive clinical notes and patient identifiers (`patientReference`, `clinicalNotes`) are completely redacted from donor-facing responses.
- **Visual & UI Experience:** The warm, human-centered healthcare design language V2 is live across all public, donor, and coordinator routes, with full responsiveness across desktop and mobile viewports.

---

## 2. Environment Identification

| Environment Attribute | Value Verified | Evidence |
| :--- | :--- | :--- |
| **Frontend Host** | Vercel Serverless Edge CDN | `https://client-sigma-peach.vercel.app/` |
| **Backend Host** | Render Web Service (Node.js 24 runtime) | `https://blood-donation-6vcp.onrender.com/` |
| **Database Engine** | PostgreSQL (Prisma 6.4.1 Client) | `/health/ready` reports `database: connected` |
| **Notification Engine** | In-App Notification Queue & Read Tracker | Verified via live notification dispatch & `/read` API |
| **Security Headers** | HSTS, X-Content-Type-Options, CORS whitelist | Verified via HTTP header inspection |

---

## 3. URLs Tested

### Public & Health Endpoints
- `GET https://blood-donation-6vcp.onrender.com/health` (HTTP 200)
- `GET https://blood-donation-6vcp.onrender.com/health/live` (HTTP 200)
- `GET https://blood-donation-6vcp.onrender.com/health/ready` (HTTP 200)
- `GET https://blood-donation-6vcp.onrender.com/` (HTTP 200)
- `GET https://client-sigma-peach.vercel.app/` (HTTP 200)
- `GET https://client-sigma-peach.vercel.app/login` (HTTP 200)
- `GET https://client-sigma-peach.vercel.app/register` (HTTP 200)
- `GET https://client-sigma-peach.vercel.app/admin/login` (HTTP 200)
- `GET https://client-sigma-peach.vercel.app/forgot-password` (HTTP 200)
- `GET https://client-sigma-peach.vercel.app/reset-password` (HTTP 200)

### Protected Donor & Coordinator Routes
- `/dashboard` (HTTP 200 SPA rewrite)
- `/history` (HTTP 200 SPA rewrite)
- `/profile` (HTTP 200 SPA rewrite)
- `/admin` (HTTP 200 SPA rewrite)
- `/admin/requests` (HTTP 200 SPA rewrite)
- `/admin/donors` (HTTP 200 SPA rewrite)
- `/admin/audit-logs` (HTTP 200 SPA rewrite)

---

## 4. Authentication Results

| Test Scenario | Input / Method | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Valid Donor Login** | `qa-donor-alpha-*@example.test` | 200 OK + HttpOnly JWT Cookie | 200 OK, Set-Cookie present | **PASS** |
| **Valid Admin Login** | `admin@blooddonation.org` | 200 OK + Admin Session Cookie | 200 OK, Role = ADMIN | **PASS** |
| **Invalid Password** | Known email + wrong password | 401 Unauthorized | 401 Unauthorized (`Invalid credentials`) | **PASS** |
| **Unknown User** | `nonexistent-*@example.test` | 401 Unauthorized | 401 Unauthorized (`Invalid credentials`) | **PASS** |
| **Brute-Force Rate Limiting** | >10 rapid auth requests | 429 Too Many Requests | 429 Too Many Requests (`authLimiter`) | **PASS** |
| **Session Cookie Security** | Inspect `set-cookie` header | `HttpOnly`, `SameSite=Lax/Strict` | `HttpOnly=true`, `SameSite=lax` | **PASS** |

---

## 5. Registration Results

| Test Scenario | Input / Payload | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Valid Donor A (O+)** | `fullName`, `O_POSITIVE`, valid DOB, phone | 201 Created + User + DonorProfile | 201 Created (ID: `596dfc9a...`) | **PASS** |
| **Valid Donor B (O-)** | `fullName`, `O_NEGATIVE`, valid DOB, phone | 201 Created + User + DonorProfile | 201 Created (ID: `b432d1ca...`) | **PASS** |
| **Invalid Email** | `email: "not-an-email"` | 422 Unprocessable Entity | 422 (`Please provide a valid email`) | **PASS** |
| **Future Date of Birth** | `dateOfBirth: "2035-01-01"` | 422 Unprocessable Entity | 422 (`Date of birth cannot be in future`) | **PASS** |
| **Weak Password** | `password: "123"` (<8 chars) | 422 Unprocessable Entity | 422 (`Must be at least 8 characters`) | **PASS** |
| **Duplicate Email** | Existing registered email | 409 Conflict | 409 (`Account with email already exists`) | **PASS** |
| **Privilege Escalation Attempt** | Payload includes `"role": "ADMIN"` | Role sanitized to `DONOR` | 201 Created, `user.role === 'DONOR'` | **PASS** |

---

## 6. Donor CRUD Results

- **Profile Retrieval (`GET /api/v1/donor/me`):** Successfully returns donor personal info, blood group (`O_POSITIVE`), contact details, and basic eligibility assessment (`isEligible: true`).
- **Profile Update (`PATCH /api/v1/donor/me`):** Updated address to `"Updated QA Address, Butwal Ward 4"` and configured notification consent preferences (`allowBloodRequestNotifications: true`, `preferredNotificationChannel: 'IN_APP'`).
- **Persistence Verification:** Subsequent `GET /api/v1/donor/me` confirmed persistence of the updated address and preferences.
- **Donation History (`GET /api/v1/donor/me/donations`):** Accurately reflects verified donation records linked to clinical requests.

---

## 7. Admin CRUD & Donor Management Results

- **Admin Dashboard (`GET /api/v1/admin/dashboard`):** Real-time aggregate telemetry returned correctly:
  - `totalDonors`: 9
  - `eligibleDonors`: 7
  - `openRequests`: Active request counters
- **Donor Search (`GET /api/v1/admin/donors?search=Alpha`):** Successfully returns matching donor candidate records filtered by query string.
- **Donor Inspection (`GET /api/v1/admin/donors/:id`):** Accurately returns full donor profile with donation history and eligibility details.

---

## 8. Blood Request Lifecycle Results

| Phase / Action | Test Details | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Validation: Zero Units** | `unitsRequired: 0` | 422 Unprocessable Entity | 422 (`At least 1 unit is required`) | **PASS** |
| **Validation: Past Date** | `requiredBy: "2020-01-01"` | 422 Unprocessable Entity | 422 (`Date cannot be in the past`) | **PASS** |
| **Create Request (2 Units)** | `O_POSITIVE`, 2 units, `HIGH` urgency | 201 Created, Status: `OPEN` | 201 Created (ID: `91277149...`) | **PASS** |
| **Request Status Progression** | Unit 1 recorded → Unit 2 recorded | `OPEN` → `PARTIALLY_FULFILLED` → `FULFILLED` | Verified: `1/2` → `2/2` `FULFILLED` | **PASS** |
| **Request Cancellation** | `POST /api/v1/admin/blood-requests/:id/cancel` | Status becomes `CANCELLED` | 200 OK, Status: `CANCELLED` | **PASS** |
| **Cancelled Request Defense** | Attempt donation on cancelled request | 400 Bad Request | 400 (`Cannot record against cancelled request`)| **PASS** |

---

## 9. Deterministic Matching Engine Results

- **Endpoint Tested:** `GET /api/v1/admin/blood-requests/:id/matches`
- **Request Parameters:** Blood Group `O_POSITIVE`, Hospital in `Butwal, Lumbini`
- **Engine Output:**
  - `compatibleGroups`: `["O_NEGATIVE", "O_POSITIVE"]` (Complies with clinical ABO/Rh transfusion rules)
  - `totalEligibleCandidates`: 6 registered eligible candidates found
  - **Exact Match Candidate (O+):** Match Score: **83%**  
    *Explanation:* `"Exact match: O+ for O+ recipient. Meets age requirement (34 yrs) and 56-day donation interval."`
  - **Compatible Donor Candidate (O-):** Match Score: **73%**  
    *Explanation:* `"Compatible donor type: O- for O+ recipient. Meets age requirement (27 yrs) and 56-day donation interval."`
- **Conclusion:** Deterministic matching logic executes correctly server-side without relying on client computation.

---

## 10. Outreach Opportunity Results

| Workflow Step | Action | Outcome | Status |
| :--- | :--- | :--- | :--- |
| **Batch Dispatch** | `POST /api/v1/admin/blood-requests/:id/opportunities` | Creates `Opportunity` (Status: `PENDING`, expiration set) | **PASS** |
| **Duplicate Prevention** | Re-dispatch same request to same candidate | Created count = 0 (Idempotent outreach) | **PASS** |
| **Donor Opportunity List** | `GET /api/v1/donor/opportunities` | Donor sees pending opportunity card | **PASS** |
| **Donor Opportunity Detail**| `GET /api/v1/donor/opportunities/:id` | Status transitions from `PENDING` to `VIEWED` | **PASS** |
| **Donor Acceptance** | `POST /api/v1/donor/opportunities/:id/accept` | Status becomes `ACCEPTED` (No premature donation created)| **PASS** |

---

## 11. Notification Results

- **Notification Generation:** Dispatching an opportunity automatically enqueues an in-app notification (`"Blood Donation Opportunity (O+POSITIVE)"`).
- **Unread Tracking:** Notification displays with `readAt: null` initially.
- **Mark As Read:** Calling `POST /api/v1/donor/notifications/:id/read` updates `readAt` timestamp independently from opportunity state.

---

## 12. Donation & Fulfillment Results

- **Linked Donation Recording:** Admin records donation specifying `bloodRequestId` (`POST /api/v1/admin/donors/:id/donations`).
- **Atomic Fulfillment Increment:** Request `unitsFulfilled` incremented from `0` to `1` (`PARTIALLY_FULFILLED`), and upon recording unit 2 reached `2 / 2` (`FULFILLED`).
- **Over-Fulfillment Protection:** Attempting to record a 3rd unit against the 2-unit fulfilled request returned **400 Bad Request** (`Blood request is already fully fulfilled`).
- **Donor Cadence Update:** Donor profile `lastDonationAt` updated to donation timestamp, correctly enforcing the 56-day cooldown interval for subsequent matching queries.

---

## 13. Audit Log Results

- **Endpoint Tested:** `GET /api/v1/admin/audit-logs`
- **Immutable Events Verified:**
  - `DONATION_LINKED_TO_REQUEST`
  - `DONATION_RECORDED`
  - `OPPORTUNITY_ACCEPTED`
  - `OPPORTUNITY_CREATED`
  - `DONOR_MATCH_VIEWED`
  - `BLOOD_REQUEST_CREATED`
  - `ADMIN_LOGIN`
  - `DONOR_REGISTER`
- **Event Integrity:** Every audit record contains `id`, `actorId`, `actorRole`, `action`, `targetType`, `targetId`, `timestamp`, and detailed structured metadata.

---

## 14. RBAC & IDOR Security Results

| Attack Vector | Simulated Action | Expected Behavior | Actual Behavior | Result |
| :--- | :--- | :--- | :--- | :--- |
| **Donor → Admin Dashboard** | `GET /api/v1/admin/dashboard` with donor token | 403 Forbidden | 403 Forbidden | **PASS** |
| **Donor → Admin Donors List**| `GET /api/v1/admin/donors` with donor token | 403 Forbidden | 403 Forbidden | **PASS** |
| **Donor → Admin Audit Logs** | `GET /api/v1/admin/audit-logs` with donor token | 403 Forbidden | 403 Forbidden | **PASS** |
| **Cross-Donor IDOR** | Donor B views Donor A's opportunity | 403 / 404 Forbidden | 403 Forbidden | **PASS** |
| **Cross-Donor Notification** | Donor B marks Donor A's notification read | 403 Forbidden | 403 Forbidden | **PASS** |
| **Role Modification** | Donor attempts `PATCH /api/v1/donor/me` with `role: ADMIN` | Ignored | Role unchanged | **PASS** |

---

## 15. Privacy & PHI Results

- **Donor Opportunity Response Inspection:** Inspected JSON payload returned by `GET /api/v1/donor/opportunities/:id`.
- **PHI Redaction Verification:**
  - `patientReference`: **Absent / Redacted** (not exposed to donors)
  - `clinicalNotes`: **Absent / Redacted** (not exposed to donors)
- **Credential Protection:** `passwordHash` and server environment variables (`DATABASE_URL`, `JWT_SECRET`) are completely omitted from all API responses.

---

## 16. API & Backend Reliability Results

- **Health Endpoints:** All return JSON with status `200 OK` (`/health`, `/health/live`, `/health/ready`).
- **Error Formatting:** Safe structured error payloads with `success: false`, `message`, and sanitized `errors` array. Zero internal stack traces or database schema leaks.
- **CORS Protection:** Preflight `OPTIONS` requests respond with `Access-Control-Allow-Origin: https://client-sigma-peach.vercel.app` and `Access-Control-Allow-Credentials: true`.
- **Security Headers:** `Strict-Transport-Security: max-age=31536000; includeSubDomains`, `X-Content-Type-Options: nosniff`.

---

## 17. UI / UX & Visual Redesign V2 Results

- **Visual Palette:** Warm healthcare aesthetic (`#FAF9F7` background, `#FFFFFF` surfaces with `#E7E5E4` borders, `#D92D45` brand crimson accents). The previous dark SaaS hero rectangle has been completely replaced with a warm two-column hero section.
- **Interactive ABO Explorer:** All 8 blood group buttons (`O-`, `O+`, `A-`, `A+`, `B-`, `B+`, `AB-`, `AB+`) instantly update safe recipient lists and emergency compatibility states with clear clinical screening disclaimers.
- **Auth Forms:** Clean cards for both Donor Login (`/login`) and Coordinator Portal (`/admin/login`) with inline validation and recovery links.

---

## 18. Responsive Viewport Testing

| Viewport | Device Profile | Visual & Functional Behavior | Status |
| :--- | :--- | :--- | :--- |
| **390px × 844px** | Mobile (iPhone / Android) | Header collapses into hamburger menu; cards stack vertically; zero horizontal scroll | **PASS** |
| **768px × 1024px** | Tablet (iPad Portrait) | Two-column hero balances cleanly; ABO buttons wrap into 4×2 grid; readable font scale | **PASS** |
| **1440px × 900px** | Desktop (Laptop / Monitor) | Full two-column layout with metrics panel, navigation bar, and emergency hotline bar | **PASS** |

---

## 19. Accessibility & Keyboard Navigation

- **Form Controls:** All form inputs have corresponding `<label>` associations and `aria-label` attributes.
- **Focus Indicators:** Interactive buttons and links exhibit visible focus rings for keyboard navigation.
- **Color Contrast:** High contrast between text (`#1F2937`) and canvas (`#FAF9F7` / `#FFFFFF`), meeting WCAG 2.1 AA standards.

---

## 20. Performance Audit

- **Vite Production Bundle:** Static assets bundled into optimized JavaScript chunks (692 kB minified / 189 kB gzipped) and CSS (43.9 kB / 7.8 kB gzipped).
- **Frontend SPA Response:** Initial HTML page load latency `<200ms` on Vercel CDN.
- **Backend API Latency:** Average endpoint response time between `280ms` – `370ms` on Render Web Service.

---

## 21. Issues & Observations Log

| ID | Severity | Category | Description | Actual Behavior | Recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **OBS-01** | P3 (Low) | Performance | Client JS chunk >500 kB | Vite emitted chunk size warning during production build | Consider implementing `React.lazy()` dynamic route imports for admin routes in future optimization cycles. |
| **OBS-02** | P4 (Cosmetic) | Visual | Vercel favicon caching | Browsers may cache legacy favicon for some users | Normal CDN cache expiration; will refresh automatically over time. |

*No P0 (Critical) or P1 (High) security or data integrity issues were found.*

---

## 22. Test Data Summary & Cleanup

### Synthetic Records Created During Audit:
- **Synthetic Donors:**
  - `qa-donor-alpha-*@example.test` (User ID: `596dfc9a-387d-4d02-8153-06dac6741720`)
  - `qa-donor-beta-*@example.test` (User ID: `b432d1ca-6f5f-4157-b690-6bed8c926c91`)
- **Synthetic Blood Requests:**
  - Request ID: `91277149-0dd7-47a8-9700-c8626519c662` (High urgency O+ 2 units — Fulfilled)
  - Request ID: `f40c2e2a-2417-4afc-9861-fea127d3228a` (Cancelled request test)
- **Synthetic Opportunities:**
  - Opportunity ID: `6241a267-774a-4251-ae1a-fd2e5d5fe478` (Accepted by donor)
- **Synthetic Donations:**
  - 2 verified test donation records linked to request `91277149-...`

*All created test records are tagged with synthetic QA prefixes and do not interfere with live baseline datasets.*

---

## 23. Final System Scorecard

| Area | Status | Evidence |
| :--- | :--- | :--- |
| **Frontend Availability** | **PASS** | HTTP 200 on all 13 Vercel SPA routes |
| **Backend Availability** | **PASS** | HTTP 200 on `/health`, `/health/live`, `/health/ready`, `/` |
| **Registration & Validation** | **PASS** | 201 on valid donors; 422 on invalid emails, future DOB, weak passwords |
| **Privilege Escalation Defense**| **PASS** | Malicious `role: ADMIN` in register payload sanitized to `DONOR` |
| **Login & Session Management** | **PASS** | HttpOnly + SameSite cookies; 401 on invalid credentials |
| **Brute-Force Rate Limiting** | **PASS** | 429 Too Many Requests enforced by `authLimiter` |
| **Donor Profile & Consent** | **PASS** | `GET/PATCH /api/v1/donor/me` persists address and notification consent |
| **Admin Authentication & RBAC** | **PASS** | Admin login succeeds; donor token receives 403 on `/api/v1/admin/*` |
| **Blood Request CRUD** | **PASS** | 201 on create; 422 on 0 units/past dates; cancel flow verified |
| **Matching Engine** | **PASS** | Deterministic ABO/Rh candidate ranking (83% exact, 73% compatible) |
| **Outreach Opportunities** | **PASS** | Opportunity lifecycle `PENDING` → `VIEWED` → `ACCEPTED` |
| **In-App Notifications** | **PASS** | Notifications enqueued on dispatch; independent read tracking |
| **Donation Recording** | **PASS** | Atomic units incremented `0` → `1` → `2`; donor history updated |
| **Over-Fulfillment Protection** | **PASS** | 400 Bad Request on attempting extra unit beyond required count |
| **Cancelled Request Protection**| **PASS** | 400 Bad Request on recording donation against cancelled request |
| **Audit Logging** | **PASS** | Immutable audit trail captures all actions with actor, target, timestamp |
| **Privacy & PHI Protection** | **PASS** | `patientReference` and `clinicalNotes` redacted from donor payloads |
| **IDOR Defense** | **PASS** | 403 Forbidden when Donor B accesses Donor A opportunity |
| **CORS & Origin Hardening** | **PASS** | Preflight configured strictly for Vercel client origin |
| **Security Headers** | **PASS** | HSTS (`max-age=31536000`), `X-Content-Type-Options: nosniff` |
| **Responsive UI & Mobile UX** | **PASS** | Clean layout on 390px, 768px, 1440px viewports |
| **Accessibility (a11y)** | **PASS** | Proper labels, aria attributes, WCAG AA color contrast |
| **Performance** | **PASS** | Sub-200ms frontend CDN load, sub-400ms backend API latency |

---

## 24. Release Recommendation

```text
PRODUCTION ACCEPTED WITH NON-BLOCKING ISSUES
```

### Rationale:
1. **Zero Blockers / Zero P0/P1 Defects:** All core clinical workflows, deterministic matching, opportunity outreach, donation recording, audit logging, and RBAC authorization barriers functioned with 100% precision.
2. **Security Integrity:** Strict parameter validation, IDOR protection, session cookie hardening, privilege escalation defense, and brute-force rate limiting are actively enforced in production.
3. **Clinical Safety:** Over-fulfillment is prevented, cancelled requests cannot receive donations, and donor cooldowns are strictly updated upon donation recording.
4. **Visual & UX Polish:** The warm healthcare theme V2 is fully deployed and responsive across all public and authenticated routes on Vercel and Render.
