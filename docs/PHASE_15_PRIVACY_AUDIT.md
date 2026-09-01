# HEMACARE — PHASE 15 PRIVACY & DATA MINIMIZATION AUDIT

## 1. Field-by-Field DTO Classification Matrix

Every data entity and JSON response surface across HemaCare has been audited against privacy and data-minimization requirements:

### Entity 1: `BloodRequest`

| Field | Classification | Donor DTO (`/donor/opportunities/*`) | Admin DTO (`/admin/blood-requests/*`) | Justification & Safeguards |
|---|---|---|---|---|
| `id` | Standard Identifier | Visible (UUID) | Visible (UUID) | Necessary for routing & referencing |
| `bloodGroup` | Clinical Requirement | **Visible** | **Visible** | Essential for donor match verification |
| `unitsRequired` | Operational Metric | Redacted | **Visible** | Donors do not need total request target |
| `unitsFulfilled` | Operational Metric | Redacted | **Visible** | Internal tracking metric only |
| `urgency` | Operational Priority | **Visible** | **Visible** | Informs donor of emergency level |
| `location` | Operational Logistics | **Visible** (City/District) | **Visible** | Informs donor of travel requirement |
| `hospitalName` | Facility Information | **Visible** | **Visible** | Informs donor where blood is needed |
| `requiredBy` | Operational Deadline | **Visible** | **Visible** | Deadline for potential collection |
| `status` | Request Status | Redacted (uses opp status) | **Visible** | Admin lifecycle management |
| `contactName` | Internal Contact | Redacted | **Visible** | Prevents direct donor harassment |
| `contactNumber` | Internal Contact | Redacted | **Visible** | Coordinator contact only |
| `patientReference` | Patient Clinical MRN | **NEVER VISIBLE** (Stripped) | **Visible** | Protected Health Information (PHI) |
| `notes` | Confidential Clinical Notes | **NEVER VISIBLE** (Stripped) | **Visible** | Contains diagnosis / bed info |
| `createdById` | Audit Actor ID | **NEVER VISIBLE** | **Visible** | Internal audit reference |

---

### Entity 2: `DonorOpportunity`

| Field | Classification | Donor DTO (`/donor/opportunities/*`) | Admin DTO (`/admin/blood-requests/:id/opportunities`) | Justification & Safeguards |
|---|---|---|---|---|
| `id` | Identifier | **Visible** | **Visible** | Opportunity reference |
| `donorId` | Foreign Key | Redacted (derived from session) | **Visible** | Used by coordinator |
| `bloodRequestId` | Foreign Key | Redacted (nested DTO provided) | **Visible** | Request linking |
| `matchScore` | Match Metric | **Visible** (Normalized) | **Visible** | Informs operational compatibility |
| `matchReason` | Match Explanation | **Visible** (Basic Screening Match) | **Visible** | Non-clinical screening reason |
| `status` | State Machine | **Visible** | **Visible** | Opportunity lifecycle state |
| `declineReason` | Donor Feedback | **Visible** (to owning donor) | **Visible** (aggregate/breakdown) | Operational feedback |
| `declineNotes` | Donor Feedback | **Visible** (to owning donor) | **Visible** | Operational feedback |
| `expiresAt` | Expiration Timestamp | **Visible** | **Visible** | Acceptance window |
| `viewedAt` | Interaction Timestamp | **Visible** | **Visible** | Response tracking |
| `respondedAt` | Interaction Timestamp | **Visible** | **Visible** | Response tracking |

---

### Entity 3: `Notification`

| Field | Classification | Donor DTO (`/donor/notifications/*`) | Admin DTO | Justification & Safeguards |
|---|---|---|---|---|
| `id` | Identifier | **Visible** | **Visible** | Notification reference |
| `userId` | User ID | Redacted (derived from JWT) | **Visible** | Ownership |
| `opportunityId` | Foreign Key | **Visible** (nullable) | **Visible** | Deep-link to opportunity |
| `channel` | Channel Enum | **Visible** | **Visible** | Communication channel |
| `type` | Notification Type | **Visible** | **Visible** | Alert categorization |
| `status` | Delivery Status | **Visible** | **Visible** | Read / unread status |
| `title` | Presentation | **Visible** | **Visible** | Privacy-sanitized alert title |
| `message` | Presentation | **Visible** | **Visible** | Privacy-sanitized alert message |
| `errorCode` | Provider Debug | Redacted | **Visible** (telemetry) | System diagnostics |
| `providerMessageId` | External Reference | Redacted | **Visible** (telemetry) | Carrier debugging |
| `idempotencyKey` | Internal Key | Redacted | **Visible** (telemetry) | Duplicate prevention |
| `sentAt` | Timestamp | **Visible** | **Visible** | Delivery timestamp |
| `readAt` | Timestamp | **Visible** | **Visible** | Read receipt timestamp |

---

### Entity 4: `DonorProfile` & `User`

| Field | Classification | Donor Self-View (`/donors/me`) | Admin View (`/admin/donors/*`) | Other Donors |
|---|---|---|---|---|
| `fullName` | Identity | **Visible** | **Visible** | **NEVER VISIBLE** |
| `dateOfBirth` | Identity / Screening | **Visible** | **Visible** | **NEVER VISIBLE** |
| `bloodGroup` | Clinical Identifier | **Visible** | **Visible** | **NEVER VISIBLE** |
| `contactNumber` | PII | **Visible** | **Visible** | **NEVER VISIBLE** |
| `address` | PII | **Visible** | **Visible** | **NEVER VISIBLE** |
| `passwordHash` | Secret | **NEVER VISIBLE** | **NEVER VISIBLE** | **NEVER VISIBLE** |
| `sessionVersion` | Auth Security | **NEVER VISIBLE** | **NEVER VISIBLE** | **NEVER VISIBLE** |
| `resetTokenHash` | Secret | **NEVER VISIBLE** | **NEVER VISIBLE** | **NEVER VISIBLE** |

---

## 2. Hospital & Facility Disclosure Review

### Evaluation:
- **Field:** `bloodRequest.hospitalName` (e.g. "Lumbini Zonal Hospital")
- **Operational Necessity:** High. When an emergency transfusion request arises, donors must know which specific medical facility or blood bank to report to if they accept the opportunity.
- **Privacy Safeguards:**
  - `hospitalName` is disclosed ONLY in conjunction with general blood group and urgency.
  - No patient identifiers, room/bed numbers, or clinical conditions are attached to the facility disclosure.
  - In notifications, the facility city/area is highlighted first to preserve initial privacy.

---

## 3. Logging Privacy Audit

A complete audit of all logging mechanisms across `server/src/` was executed:
1. **Winston / Pino Structured Logger (`logger.ts`):**
   - Implements strict metadata sanitization.
   - Automatically redacts headers: `cookie`, `authorization`, `x-csrf-token`.
   - Strips sensitive payload keys: `password`, `passwordHash`, `token`, `resetToken`, `patientReference`, `notes`.
2. **Simulated Development Dispatch (`development.provider.ts`):**
   - Recipient emails are masked: `do***@test.org`
   - Recipient phone numbers are masked: `+977-984***000`
   - Never outputs raw personal contact information to console.
3. **HTTP Access Logging (`morgan`):**
   - Logs only HTTP method, sanitized path, status code, response time, and correlation `requestId`.
   - Never logs request body or cookie values.
