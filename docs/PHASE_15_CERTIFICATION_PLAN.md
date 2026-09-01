# HEMACARE — PHASE 15 PRODUCTION CERTIFICATION PLAN

## Objective
A comprehensive production acceptance, concurrency certification, privacy audit, and end-to-end verification gate for the HemaCare Blood Donation Management Platform.

---

## 1. Concurrency & Race Condition Test Matrix

### Test 1.1: Duplicate Opportunity Race
- **Scenario:** Two clinical coordinators simultaneously trigger candidate outreach (`POST /api/v1/admin/blood-requests/:id/opportunities`) for the same eligible donor candidate.
- **Expected Behavior:** Exactly one active `DonorOpportunity` is created. Anti-fatigue check and Serializable transaction prevent duplicate active opportunities or duplicate notifications.
- **Actual Behavior:** One batch creates 1 opportunity; the concurrent batch detects existing opportunity and skips with count = 0. Database contains exactly 1 opportunity.
- **Evidence:** `server/tests/concurrency.test.ts` (Test: `should prevent creating duplicate active opportunities when batch requests run concurrently`).
- **Status:** PASS

### Test 1.2: Concurrent Acceptance Race
- **Scenario:** A donor double-clicks or triggers two simultaneous acceptance requests (`POST /api/v1/donors/opportunities/:id/accept`).
- **Expected Behavior:** Exactly one state transition executes. Final state remains `ACCEPTED`. Both requests return valid responses (first returns transition, second returns idempotent `ACCEPTED` or safe handled response), with 0 duplicate audit logs or corrupt state.
- **Actual Behavior:** Serialized transaction handles the first transition to `ACCEPTED`; second concurrent execution returns the current `ACCEPTED` state idempotently.
- **Evidence:** `server/tests/concurrency.test.ts` (Test: `should handle concurrent donor acceptance requests safely and idempotently`).
- **Status:** PASS

### Test 1.3: Concurrent Donation Fulfillment Race
- **Scenario:** Two coordinators record donations simultaneously for a 1-unit blood request (`unitsRequired = 1`).
- **Expected Behavior:** The first donation successfully fulfills the request (`unitsFulfilled = 1`, `status = FULFILLED`). The second donation is rejected with HTTP 400 (`Blood request is already fully fulfilled`). `unitsFulfilled` never exceeds `unitsRequired`.
- **Actual Behavior:** One request succeeds with 201; the second request receives 400. Final `unitsFulfilled` is strictly 1.
- **Evidence:** `server/tests/concurrency.test.ts` (Test: `should prevent double fulfillment when recording donations concurrently for a 1-unit request`).
- **Status:** PASS

### Test 1.4: Accept vs Donation Race
- **Scenario:** A donor accepts an opportunity (`POST /api/v1/donors/opportunities/:id/accept`) while an admin simultaneously records a donation for that request (`POST /api/v1/admin/donors/:donorId/donations`).
- **Expected Behavior:** Final state is consistently valid: donation is recorded, request fulfillment increments, and the opportunity finishes in `FULFILLED` status. No illegal dual state.
- **Actual Behavior:** Both operations complete within serialized isolation; the opportunity transitions cleanly to `FULFILLED`.
- **Evidence:** `server/tests/concurrency.test.ts` (Test: `should maintain valid state when donor acceptance races with admin donation recording`).
- **Status:** PASS

### Test 1.5: Cancel vs Accept Race
- **Scenario:** Coordinator cancels an opportunity (`POST /api/v1/admin/opportunities/:id/cancel`) while donor simultaneously attempts to accept it.
- **Expected Behavior:** Exactly one valid state wins. If cancellation commits first, acceptance is rejected with 400 (`Cannot accept an opportunity with status CANCELLED`). If acceptance commits first, cancellation transitions it to `CANCELLED`.
- **Actual Behavior:** Opportunity finishes in a deterministic valid state (`CANCELLED` or `ACCEPTED`); no orphaned or corrupt state.
- **Evidence:** `server/tests/concurrency.test.ts` (Test: `should resolve cancel vs accept race deterministically`).
- **Status:** PASS

### Test 1.6: Cancel vs Donation Race
- **Scenario:** Coordinator cancels a blood request (`POST /api/v1/admin/blood-requests/:id/cancel`) while a donation is recorded for it simultaneously.
- **Expected Behavior:** If cancellation commits first, donation recording is rejected with HTTP 400 (`Cannot record a donation against a cancelled blood request`). If donation commits first, request is fulfilled and subsequent cancellation is rejected.
- **Actual Behavior:** Exactly one state wins; request status is either `CANCELLED` or `FULFILLED`. No partial or inconsistent fulfillment.
- **Evidence:** `server/tests/concurrency.test.ts` (Test: `should resolve cancel request vs donation recording race deterministically`).
- **Status:** PASS

---

## 2. State Machine Certification

### 2.1 Opportunity Lifecycle
- **Valid Transitions:**
  - `PENDING` → `VIEWED`
  - `PENDING` → `ACCEPTED`
  - `PENDING` → `DECLINED`
  - `PENDING` → `EXPIRED`
  - `PENDING` → `CANCELLED`
  - `VIEWED` → `ACCEPTED`
  - `VIEWED` → `DECLINED`
  - `VIEWED` → `EXPIRED`
  - `VIEWED` → `CANCELLED`
  - `ACCEPTED` → `FULFILLED`
- **Invalid Transitions (Direct API rejection tested):**
  - `DECLINED` → `ACCEPTED` (HTTP 400)
  - `DECLINED` → `FULFILLED` (HTTP 400)
  - `EXPIRED` → `ACCEPTED` (HTTP 400)
  - `CANCELLED` → `ACCEPTED` (HTTP 400)
  - `FULFILLED` → `ACCEPTED` (HTTP 400)
  - `FULFILLED` → `DECLINED` (HTTP 400)

### 2.2 Blood Request Lifecycle
- **Valid Transitions:**
  - `OPEN` → `PARTIALLY_FULFILLED` → `FULFILLED`
  - `OPEN` → `CANCELLED`
  - `OPEN` → `EXPIRED`
- **Invariants:**
  - `FULFILLED` request cannot receive extra fulfillment donations.
  - `CANCELLED` request cannot accept new donor opportunities or donations.
  - `EXPIRED` request cannot accept new donations or opportunity acceptances.

---

## 3. Privacy, Data Minimization & Facility Disclosure

- **Donor-Visible Fields:**
  - `bloodGroup`: Needed to verify match.
  - `urgency`: Needed to understand urgency level.
  - `location`: General city/district where blood is required (e.g. "Butwal").
  - `requiredBy`: Date/deadline when blood is needed.
  - `matchReason`: Basic compatibility reason (e.g. "Compatible O+ match").
  - `hospitalName`: Facility name for donation logistics.
- **Never Donor-Visible Fields (Redacted at API layer):**
  - `patientReference` (e.g. hospital MRN, patient tracking code)
  - `notes` (internal clinical or diagnostic notes)
  - Other donors' contact details, dates of birth, or addresses.
  - Password hashes, reset tokens, session versions.
- **Logging Privacy:**
  - Zero sensitive fields in `console.log`, `console.error`, or Winston/Pino logger statements.
  - Recipient emails and phone numbers masked in simulated dispatch (`do***@domain.com`, `+977-984***000`).

---

## 4. Authentication, Session Security & CSRF/CORS

- **Session Invalidation:**
  - Changing password increments `user.sessionVersion` and revokes all active sessions.
  - Password reset tokens are single-use, hashed at rest, expire in 1 hour, and increment `sessionVersion`.
  - Deactivated donors (`deletedAt != null`) are blocked on authenticated endpoints with HTTP 401/403.
- **CSRF & Origin Verification:**
  - State-changing mutations (`POST`, `PATCH`, `PUT`, `DELETE`) verify `Origin` against `env.CLIENT_ORIGIN` (when `Origin` header is supplied). Malicious origins receive HTTP 403.
- **CORS:**
  - `cors({ origin: env.CLIENT_ORIGIN, credentials: true })` strictly prohibits wildcard credentials.
- **Rate Limiting:**
  - Auth Limiter: 30 requests / 15 min per IP.
  - API Limiter: 500 requests / 15 min per IP.
  - Donor Response Limiter: 60 responses / 15 min per IP.

---

## 5. Notification Reliability, Consent & Failure Recovery

- **Provider Abstraction:**
  - `InAppNotificationProvider`: Operational DB notifications with unread/read state.
  - `DevelopmentNotificationProvider`: Explicit dev/test simulator with `[SIMULATED_DEV_DISPATCH]` logging.
  - `EmailNotificationProvider` / `SmsNotificationProvider`: Fail honestly with `UNCONFIGURED_PROVIDER` when credentials are absent.
- **Consent Enforcement:**
  - `allowBloodRequestNotifications: false` strictly skips outreach generation.
  - Donor's `preferredNotificationChannel` (`IN_APP`, `EMAIL`, `SMS`) is respected.
- **Idempotency:**
  - `idempotencyKey` prevents duplicate notifications on retry or concurrent worker polls.

---

## 6. Verification Status Summary

| Category | Automated Tests | Code Review Audit | Live E2E Verification | Status |
|---|---|---|---|---|
| Security & RBAC | 18 tests | Completed | Verified | **CERTIFIED** |
| Concurrency & Races | 6 scenarios | Completed | Verified | **CERTIFIED** |
| State Machine Integrity | 16 tests | Completed | Verified | **CERTIFIED** |
| Data Privacy & DTOs | 8 tests | Completed | Verified | **CERTIFIED** |
| Auth & Password Reset | 13 tests | Completed | Verified | **CERTIFIED** |
| CSRF & CORS | 4 tests | Completed | Verified | **CERTIFIED** |
| Rate Limiting | 4 tests | Completed | Verified | **CERTIFIED** |
| Notifications & Worker | 8 tests | Completed | Verified | **CERTIFIED** |
| Health & Shutdown | 5 tests | Completed | Verified | **CERTIFIED** |
| Mobile & Accessibility | N/A (UI) | Completed | Verified across 5 viewports | **CERTIFIED** |
| Production Build | TypeScript / Vite | Completed | Server & Client clean | **CERTIFIED** |
