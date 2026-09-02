# HEMACARE — PHASE 20 SOURCE SCHEMA AUDIT
## Live Forensic Inventory of Render PostgreSQL (`blood_donation_db_l85y`)

**Audit Timestamp:** 2026-09-02T15:16:00Z  
**Database Server:** PostgreSQL 18.6 (Debian 18.6-1.pgdg12+2) on x86_64-pc-linux-gnu  
**Database Name:** `blood_donation_db_l85y`  
**Public Tables:** 9  
**Enumerated Types:** 10  
**Foreign Keys:** 9  
**Indexes:** 39  
**Sequences:** 0 (100% UUID-backed primary keys)  
**Triggers:** 0  
**Schema Drift vs Prisma:** **ZERO DRIFT (100% MATCH)**  

---

## 1. Enumerated Types (Enums)

| Enum Type | Allowed Values |
| :--- | :--- |
| `BloodGroup` | `A_POSITIVE`, `A_NEGATIVE`, `B_POSITIVE`, `B_NEGATIVE`, `AB_POSITIVE`, `AB_NEGATIVE`, `O_POSITIVE`, `O_NEGATIVE` |
| `DeclineReason` | `NOT_AVAILABLE`, `CANNOT_TRAVEL`, `RECENTLY_DONATED`, `OTHER` |
| `NotificationChannel` | `IN_APP`, `EMAIL`, `SMS` |
| `NotificationStatus` | `PENDING`, `SENT`, `FAILED`, `READ`, `PROCESSING` |
| `NotificationType` | `OPPORTUNITY_ALERT`, `STATUS_UPDATE`, `GENERAL` |
| `OpportunityStatus` | `PENDING`, `VIEWED`, `ACCEPTED`, `DECLINED`, `EXPIRED`, `CANCELLED`, `FULFILLED` |
| `RequestStatus` | `OPEN`, `PARTIALLY_FULFILLED`, `FULFILLED`, `CANCELLED`, `EXPIRED` |
| `RequestUrgency` | `LOW`, `NORMAL`, `HIGH`, `CRITICAL` |
| `Role` | `DONOR`, `ADMIN` |

---

## 2. Table-by-Table Forensic Inventory

### 2.1 Table: `User`
- **Primary Key:** `id` (text / UUID)
- **Columns:**
  - `id`: `text` (NOT NULL, PK)
  - `email`: `text` (NOT NULL, UNIQUE)
  - `passwordHash`: `text` (NOT NULL)
  - `role`: `Role` (NOT NULL, DEFAULT `'DONOR'::"Role"`)
  - `sessionVersion`: `integer` (NOT NULL, DEFAULT `1`)
  - `createdAt`: `timestamp(3) without time zone` (NOT NULL, DEFAULT `CURRENT_TIMESTAMP`)
  - `updatedAt`: `timestamp(3) without time zone` (NOT NULL)
- **Live Row Count:** 21 (2 `ADMIN`, 19 `DONOR`)
- **Indexes:**
  - `User_pkey` (UNIQUE, btree `id`)
  - `User_email_key` (UNIQUE, btree `email`)
  - `User_email_idx` (btree `email`)

### 2.2 Table: `DonorProfile`
- **Primary Key:** `id` (text / UUID)
- **Foreign Keys:**
  - `DonorProfile_userId_fkey` ──▶ `User(id)` (ON DELETE CASCADE, ON UPDATE CASCADE)
- **Columns:**
  - `id`: `text` (NOT NULL, PK)
  - `userId`: `text` (NOT NULL, UNIQUE)
  - `fullName`: `text` (NOT NULL)
  - `dateOfBirth`: `timestamp(3) without time zone` (NOT NULL)
  - `address`: `text` (NOT NULL)
  - `contactNumber`: `text` (NOT NULL)
  - `bloodGroup`: `BloodGroup` (NOT NULL)
  - `lastDonationAt`: `timestamp(3) without time zone` (NULLABLE)
  - `preferences`: `jsonb` (NULLABLE, DEFAULT `'{}'::jsonb`)
  - `deletedAt`: `timestamp(3) without time zone` (NULLABLE)
  - `createdAt`: `timestamp(3) without time zone` (NOT NULL, DEFAULT `CURRENT_TIMESTAMP`)
  - `updatedAt`: `timestamp(3) without time zone` (NOT NULL)
- **Live Row Count:** 19
- **Indexes:**
  - `DonorProfile_pkey` (UNIQUE, btree `id`)
  - `DonorProfile_userId_key` (UNIQUE, btree `userId`)
  - `DonorProfile_bloodGroup_idx` (btree `bloodGroup`)
  - `DonorProfile_contactNumber_idx` (btree `contactNumber`)
  - `DonorProfile_deletedAt_idx` (btree `deletedAt`)

### 2.3 Table: `BloodRequest`
- **Primary Key:** `id` (text / UUID)
- **Foreign Keys:**
  - `BloodRequest_createdById_fkey` ──▶ `User(id)` (ON DELETE RESTRICT, ON UPDATE CASCADE)
- **Columns:**
  - `id`: `text` (NOT NULL, PK)
  - `createdById`: `text` (NOT NULL)
  - `bloodGroup`: `BloodGroup` (NOT NULL)
  - `unitsRequired`: `integer` (NOT NULL)
  - `unitsFulfilled`: `integer` (NOT NULL, DEFAULT `0`)
  - `urgency`: `RequestUrgency` (NOT NULL, DEFAULT `'NORMAL'::"RequestUrgency"`)
  - `location`: `text` (NOT NULL)
  - `requiredBy`: `timestamp(3) without time zone` (NOT NULL)
  - `patientReference`: `text` (NULLABLE)
  - `hospitalName`: `text` (NOT NULL)
  - `contactName`: `text` (NULLABLE)
  - `contactNumber`: `text` (NULLABLE)
  - `status`: `RequestStatus` (NOT NULL, DEFAULT `'OPEN'::"RequestStatus"`)
  - `notes`: `text` (NULLABLE)
  - `closedAt`: `timestamp(3) without time zone` (NULLABLE)
  - `createdAt`: `timestamp(3) without time zone` (NOT NULL, DEFAULT `CURRENT_TIMESTAMP`)
  - `updatedAt`: `timestamp(3) without time zone` (NOT NULL)
- **Live Row Count:** 22 (16 `OPEN`, 2 `PARTIALLY_FULFILLED`, 3 `FULFILLED`, 1 `CANCELLED`)
- **Indexes:**
  - `BloodRequest_pkey` (UNIQUE, btree `id`)
  - `BloodRequest_bloodGroup_idx` (btree `bloodGroup`)
  - `BloodRequest_status_idx` (btree `status`)
  - `BloodRequest_urgency_idx` (btree `urgency`)
  - `BloodRequest_requiredBy_idx` (btree `requiredBy`)
  - `BloodRequest_createdAt_idx` (btree `createdAt`)

### 2.4 Table: `Donation`
- **Primary Key:** `id` (text / UUID)
- **Foreign Keys:**
  - `Donation_donorId_fkey` ──▶ `DonorProfile(id)` (ON DELETE CASCADE, ON UPDATE CASCADE)
  - `Donation_bloodRequestId_fkey` ──▶ `BloodRequest(id)` (ON DELETE SET NULL, ON UPDATE CASCADE)
- **Columns:**
  - `id`: `text` (NOT NULL, PK)
  - `donorId`: `text` (NOT NULL)
  - `bloodRequestId`: `text` (NULLABLE)
  - `donatedAt`: `timestamp(3) without time zone` (NOT NULL, DEFAULT `CURRENT_TIMESTAMP`)
  - `location`: `text` (NOT NULL)
  - `notes`: `text` (NULLABLE)
  - `createdAt`: `timestamp(3) without time zone` (NOT NULL, DEFAULT `CURRENT_TIMESTAMP`)
- **Live Row Count:** 6
- **Indexes:**
  - `Donation_pkey` (UNIQUE, btree `id`)
  - `Donation_donorId_idx` (btree `donorId`)
  - `Donation_bloodRequestId_idx` (btree `bloodRequestId`)
  - `Donation_donatedAt_idx` (btree `donatedAt`)

### 2.5 Table: `DonorOpportunity`
- **Primary Key:** `id` (text / UUID)
- **Foreign Keys:**
  - `DonorOpportunity_donorId_fkey` ──▶ `DonorProfile(id)` (ON DELETE CASCADE, ON UPDATE CASCADE)
  - `DonorOpportunity_bloodRequestId_fkey` ──▶ `BloodRequest(id)` (ON DELETE CASCADE, ON UPDATE CASCADE)
- **Columns:**
  - `id`: `text` (NOT NULL, PK)
  - `donorId`: `text` (NOT NULL)
  - `bloodRequestId`: `text` (NOT NULL)
  - `matchScore`: `integer` (NOT NULL)
  - `matchReason`: `text` (NOT NULL)
  - `status`: `OpportunityStatus` (NOT NULL, DEFAULT `'PENDING'::"OpportunityStatus"`)
  - `declineReason`: `DeclineReason` (NULLABLE)
  - `declineNotes`: `text` (NULLABLE)
  - `expiresAt`: `timestamp(3) without time zone` (NOT NULL)
  - `viewedAt`: `timestamp(3) without time zone` (NULLABLE)
  - `respondedAt`: `timestamp(3) without time zone` (NULLABLE)
  - `createdAt`: `timestamp(3) without time zone` (NOT NULL, DEFAULT `CURRENT_TIMESTAMP`)
  - `updatedAt`: `timestamp(3) without time zone` (NOT NULL)
- **Live Row Count:** 2
- **Indexes:**
  - `DonorOpportunity_pkey` (UNIQUE, btree `id`)
  - `DonorOpportunity_donorId_status_idx` (btree `donorId`, `status`)
  - `DonorOpportunity_bloodRequestId_status_idx` (btree `bloodRequestId`, `status`)
  - `DonorOpportunity_expiresAt_idx` (btree `expiresAt`)
  - `DonorOpportunity_createdAt_idx` (btree `createdAt`)

### 2.6 Table: `Notification`
- **Primary Key:** `id` (text / UUID)
- **Foreign Keys:**
  - `Notification_userId_fkey` ──▶ `User(id)` (ON DELETE CASCADE, ON UPDATE CASCADE)
  - `Notification_opportunityId_fkey` ──▶ `DonorOpportunity(id)` (ON DELETE SET NULL, ON UPDATE CASCADE)
- **Columns:**
  - `id`: `text` (NOT NULL, PK)
  - `userId`: `text` (NOT NULL)
  - `opportunityId`: `text` (NULLABLE)
  - `channel`: `NotificationChannel` (NOT NULL, DEFAULT `'IN_APP'::"NotificationChannel"`)
  - `type`: `NotificationType` (NOT NULL, DEFAULT `'OPPORTUNITY_ALERT'::"NotificationType"`)
  - `status`: `NotificationStatus` (NOT NULL, DEFAULT `'PENDING'::"NotificationStatus"`)
  - `title`: `text` (NOT NULL)
  - `message`: `text` (NOT NULL)
  - `attemptCount`: `integer` (NOT NULL, DEFAULT `0`)
  - `lastAttemptAt`: `timestamp(3) without time zone` (NULLABLE)
  - `failedAt`: `timestamp(3) without time zone` (NULLABLE)
  - `errorCode`: `text` (NULLABLE)
  - `providerMessageId`: `text` (NULLABLE)
  - `idempotencyKey`: `text` (NULLABLE, UNIQUE)
  - `sentAt`: `timestamp(3) without time zone` (NULLABLE)
  - `readAt`: `timestamp(3) without time zone` (NULLABLE)
  - `createdAt`: `timestamp(3) without time zone` (NOT NULL, DEFAULT `CURRENT_TIMESTAMP`)
  - `updatedAt`: `timestamp(3) without time zone` (NOT NULL, DEFAULT `CURRENT_TIMESTAMP`)
- **Live Row Count:** 2
- **Indexes:**
  - `Notification_pkey` (UNIQUE, btree `id`)
  - `Notification_idempotencyKey_key` (UNIQUE, btree `idempotencyKey`)
  - `Notification_userId_status_idx` (btree `userId`, `status`)
  - `Notification_status_channel_idx` (btree `status`, `channel`)
  - `Notification_opportunityId_idx` (btree `opportunityId`)
  - `Notification_createdAt_idx` (btree `createdAt`)

### 2.7 Table: `PasswordResetToken`
- **Primary Key:** `id` (text / UUID)
- **Foreign Keys:**
  - `PasswordResetToken_userId_fkey` ──▶ `User(id)` (ON DELETE CASCADE, ON UPDATE CASCADE)
- **Columns:**
  - `id`: `text` (NOT NULL, PK)
  - `userId`: `text` (NOT NULL)
  - `tokenHash`: `text` (NOT NULL, UNIQUE)
  - `expiresAt`: `timestamp(3) without time zone` (NOT NULL)
  - `usedAt`: `timestamp(3) without time zone` (NULLABLE)
  - `createdAt`: `timestamp(3) without time zone` (NOT NULL, DEFAULT `CURRENT_TIMESTAMP`)
- **Live Row Count:** 0
- **Indexes:**
  - `PasswordResetToken_pkey` (UNIQUE, btree `id`)
  - `PasswordResetToken_tokenHash_key` (UNIQUE, btree `tokenHash`)
  - `PasswordResetToken_userId_idx` (btree `userId`)
  - `PasswordResetToken_expiresAt_idx` (btree `expiresAt`)

### 2.8 Table: `AuditLog`
- **Primary Key:** `id` (text / UUID)
- **Columns:**
  - `id`: `text` (NOT NULL, PK)
  - `actorUserId`: `text` (NULLABLE)
  - `action`: `text` (NOT NULL)
  - `targetType`: `text` (NOT NULL)
  - `targetId`: `text` (NULLABLE)
  - `metadata`: `jsonb` (NULLABLE, DEFAULT `'{}'::jsonb`)
  - `ipAddress`: `text` (NULLABLE)
  - `userAgent`: `text` (NULLABLE)
  - `createdAt`: `timestamp(3) without time zone` (NOT NULL, DEFAULT `CURRENT_TIMESTAMP`)
- **Live Row Count:** 89
- **Indexes:**
  - `AuditLog_pkey` (UNIQUE, btree `id`)
  - `AuditLog_actorUserId_idx` (btree `actorUserId`)
  - `AuditLog_action_idx` (btree `action`)
  - `AuditLog_targetType_targetId_idx` (btree `targetType`, `targetId`)
  - `AuditLog_createdAt_idx` (btree `createdAt`)

### 2.9 Table: `_prisma_migrations`
- **Columns:** `id`, `checksum`, `finished_at`, `migration_name`, `logs`, `rolled_back_at`, `started_at`, `applied_steps_count`
- **Applied Migrations (6/6):**
  1. `20260831131526_init`
  2. `20260831141027_add_audit_log`
  3. `20260831142148_add_blood_request`
  4. `20260831143414_add_donor_opportunity_notification`
  5. `20260831173841_add_session_version_and_password_reset`
  6. `20260901003115_add_notification_reliability`

---

## 3. Schema Drift & Constraint Integrity Verification

- **Comparison Result:** Every single table, column, default value, foreign key constraint, cascade rule, and index in the live Render PostgreSQL database EXACTLY matches `server/prisma/schema.prisma` and the 6 migration files.
- **Orphaned Records:** 0. All foreign keys are strictly satisfied.
- **PostgreSQL Sequences:** 0. No auto-increment ID risk exists; all entity IDs are generated as UUIDs.
