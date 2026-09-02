# HEMACARE — PHASE 20B: FORENSIC MIGRATION & CUTOVER READINESS REPORT
## Render PostgreSQL 18.6 ➔ Supabase PostgreSQL 17.6

**Document Version:** 1.0.0  
**Phase:** 20B — Controlled Supabase Restore, Forensic Parity & Application Cutover Preparation  
**Execution Timestamp:** 2026-09-02T10:10:46Z  
**Status:** **GREEN — READY FOR PRODUCTION CUTOVER**  
**Source Database (Render):** 167 rows preserved, 100% untouched  
**Target Database (Supabase):** 167 rows restored, 100% forensic parity verified  

---

## 1. Executive Result

| Assessment Category | Result | Summary |
| :--- | :--- | :--- |
| **Executive Migration Outcome** | **PASS** | Complete PostgreSQL database restored and verified with zero drift. |
| **Row Count Parity** | **PASS (167/167)** | Exact row counts match across all 9 tables. |
| **Data Checksum Parity** | **PASS (9/9 Tables)** | Canonical deterministic SHA-256 hashes match identically. |
| **Structural & Schema Parity** | **PASS (100%)** | 9 tables, 10 custom enums (41 values), 9 FKs, 39 indexes, 0 sequences. |
| **Referential Integrity** | **PASS (0 Orphans)** | 0 orphaned records across all 8 relational foreign keys. |
| **Clinical Invariant Parity** | **PASS** | Zero discrepancy across donor identities, blood groups, and units. |
| **Prisma Compatibility** | **PASS** | `npx prisma migrate status` reports "Database schema is up to date". |
| **Application Builds & Tests** | **PASS** | Workspaces typecheck + build clean; 17 test suites (155/155 tests) passing. |
| **Security Regression** | **PASS** | Zero password hash leaks, RBAC intact, CSRF/origin enforcement passing. |
| **Cutover Readiness Decision** | **GREEN** | **READY FOR PRODUCTION CUTOVER** (Pending user authorization). |

---

## 2. Source Database Fingerprint (Render PostgreSQL)

* **Engine:** `PostgreSQL 18.6 (Debian 18.6-1.pgdg12+2) on x86_64-pc-linux-gnu, 64-bit`
* **Host:** `dpg-daascrbtqb8s73e389b0-a.oregon-postgres.render.com`
* **Database Name:** `blood_donation_db_l85y`
* **Current Baseline Row Count:** **167 rows** (Strictly verified intact)
* **Pre-Migration Backup File:** `backups/render_backup_20260902_pre_migration.dump`
* **Backup SHA-256 Checksum:** `DCD2BD6A51C5A231553FA6C56330CB2AF6A0CD2796EB60F58C59A02E1730314C`
* **Backup Size:** 43,651 bytes (81 custom-format TOC items)

---

## 3. Target Database Fingerprint (Supabase PostgreSQL)

* **Engine:** `PostgreSQL 17.6 on aarch64-unknown-linux-gnu, compiled by gcc (GCC) 15.2.0, 64-bit`
* **Host:** `aws-0-ap-southeast-1.pooler.supabase.com`
* **Database Name:** `postgres`
* **Restored Application Row Count:** **167 rows**
* **Direct Session Port (5432):** Active, verified with full DDL/advisory lock capabilities
* **Transaction Pooler Port (6543):** Active, verified with `?pgbouncer=true` support

---

## 4. Structural Parity Forensics

A deep automated comparison executed between the live source and restored target verified:

| Schema Entity | Render Source Baseline | Supabase Restored Target | Status |
| :--- | :--- | :--- | :--- |
| **Public Application Tables** | 9 | 9 | **PASS** |
| **Custom Enums** | 10 enums (41 total labels) | 10 enums (41 total labels) | **PASS** |
| **Foreign Key Constraints** | 9 constraints | 9 constraints | **PASS** |
| **Cascade Actions** | Exact match (CASCADE, RESTRICT, SET NULL) | Exact match | **PASS** |
| **Database Indexes** | 39 indexes | 39 indexes | **PASS** |
| **Primary Keys** | 9 primary keys (all UUID PKs) | 9 primary keys | **PASS** |
| **Unique Constraints** | `User_email_key`, `DonorProfile_userId_key`, `Notification_idempotencyKey_key`, `PasswordResetToken_tokenHash_key` | Identical | **PASS** |
| **Application Sequences** | 0 (UUID architecture) | 0 | **PASS** |
| **Prisma Migrations Ledger** | 6 recorded migrations | 6 recorded migrations | **PASS** |

---

## 5. Table-by-Table Data Checksum Parity

Canonical deterministic SHA-256 hashing was performed on every table. Rows were sorted by Primary Key, serialized into canonical JSON (normalizing BigInts and ISO-8601 timestamps), and hashed independently of database row storage ordering:

| Table Name | Source Rows | Target Rows | Source Checksum (SHA-256) | Target Checksum (SHA-256) | Verification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **User** | 21 | 21 | `d2d2a45d064cfb13...` | `d2d2a45d064cfb13...` | **PASS (100% Match)** |
| **DonorProfile** | 19 | 19 | `46fa01c3bf70fe20...` | `46fa01c3bf70fe20...` | **PASS (100% Match)** |
| **BloodRequest** | 22 | 22 | `b5c1c048bc8f0475...` | `b5c1c048bc8f0475...` | **PASS (100% Match)** |
| **Donation** | 6 | 6 | `f9479bdfbc8a2307...` | `f9479bdfbc8a2307...` | **PASS (100% Match)** |
| **DonorOpportunity** | 2 | 2 | `25287f33d45e54d3...` | `25287f33d45e54d3...` | **PASS (100% Match)** |
| **Notification** | 2 | 2 | `c48fb07d57c2bc33...` | `c48fb07d57c2bc33...` | **PASS (100% Match)** |
| **PasswordResetToken** | 0 | 0 | `e3b0c44298fc1c14...` | `e3b0c44298fc1c14...` | **PASS (Empty Table)** |
| **AuditLog** | 89 | 89 | `8bcad795b8712ecb...` | `8bcad795b8712ecb...` | **PASS (100% Match)** |
| **_prisma_migrations** | 6 | 6 | `6c1097fa318bbad1...` | `6c1097fa318bbad1...` | **PASS (100% Match)** |
| **TOTAL** | **167** | **167** | **ALL 9 TABLES MATCH** | **ALL 9 TABLES MATCH** | **PASS** |

---

## 6. Referential Integrity & Orphan Audit

Every foreign key relationship was verified using `LEFT JOIN ... WHERE foreign_key IS NULL` queries:

| Relation Check | Constraint Name | Orphan Count | Result |
| :--- | :--- | :--- | :--- |
| `DonorProfile ➔ User` | `DonorProfile_userId_fkey` | 0 | **PASS** |
| `Donation ➔ DonorProfile` | `Donation_donorId_fkey` | 0 | **PASS** |
| `Donation ➔ BloodRequest` | `Donation_bloodRequestId_fkey` | 0 | **PASS** |
| `DonorOpportunity ➔ DonorProfile` | `DonorOpportunity_donorId_fkey` | 0 | **PASS** |
| `DonorOpportunity ➔ BloodRequest` | `DonorOpportunity_bloodRequestId_fkey` | 0 | **PASS** |
| `Notification ➔ User` | `Notification_userId_fkey` | 0 | **PASS** |
| `Notification ➔ DonorOpportunity` | `Notification_opportunityId_fkey` | 0 | **PASS** |
| `BloodRequest ➔ User` | `BloodRequest_createdById_fkey` | 0 | **PASS** |
| **Overall Relational Integrity** | — | **0 Orphans** | **PASS** |

---

## 7. Clinical Data Invariant Audit

Safety-critical medical records were inspected for absolute fidelity:

1. **User Role Breakdown:**
   - `DONOR`: 19 users
   - `ADMIN`: 2 users (including verified system administrator `b9013eda-ea0c-42f3-9024-43cf7811e5f6`)
2. **Donor Blood Group Distribution:**
   - `O_POSITIVE`: 13 donors
   - `O_NEGATIVE`: 5 donors
   - `AB_POSITIVE`: 1 donor
3. **Blood Request Lifecycle State:**
   - `OPEN`: 16 requests
   - `PARTIALLY_FULFILLED`: 2 requests
   - `FULFILLED`: 3 requests
   - `CANCELLED`: 1 request
4. **Clinical Volume Units:**
   - `Total Units Required`: 33 units
   - `Total Units Fulfilled`: 5 units (All requests satisfy `unitsFulfilled <= unitsRequired`)
5. **Timestamp Fidelity:**
   - User `min(createdAt)`: `2026-09-01T10:45:51.389Z` (Exact millisecond parity)
   - User `max(createdAt)`: `2026-09-02T09:14:38.202Z` (Exact millisecond parity)

---

## 8. Prisma Migration Ledger & Client Status

Executed against Supabase via direct session connection:
```bash
$env:DATABASE_URL = "$SUPABASE_DIRECT_URL"
npx prisma migrate status --schema=server/prisma/schema.prisma
```
**Output:**
```text
Environment variables loaded from .env
Prisma schema loaded from server\prisma\schema.prisma
Datasource "db": PostgreSQL database "postgres", schema "public" at "aws-0-ap-southeast-1.pooler.supabase.com:5432"

6 migrations found in prisma/migrations
Database schema is up to date!
```
* **Schema Drift:** ZERO drift reported.
* **Migration Ledger:** All 6 migrations (`init`, `add_audit_log`, `add_blood_request`, `add_donor_opportunity_notification`, `add_session_version_and_password_reset`, `add_notification_reliability`) are recognized as successfully applied.

---

## 9. Performance & Latency Telemetry

Measured against Supabase instance (`ap-southeast-1` region) from the application runtime:

| Database Operation | Measured Latency | Assessment |
| :--- | :--- | :--- |
| **Simple SELECT (`ping`)** | 1,204.20 ms (Cold) / 280 ms (Warm) | Normal for cross-region TLS handshake |
| **Donor Profile Lookup (Indexed)** | 630.73 ms | Validated via `DonorProfile_pkey` |
| **Blood Request Filter (`OPEN`)** | 447.08 ms | Validated via `BloodRequest_status_idx` |
| **Matching Opportunities Query** | 444.31 ms | Multi-table relational join |
| **Notification State Query** | 443.58 ms | Validated via `Notification_status_channel_idx` |
| **Admin Dashboard Aggregation** | 1,262.60 ms | 4 parallel queries + aggregations |
| **Interactive Transaction (`$transaction`)** | 412.10 ms | Transaction pooler safely supported |

---

## 10. Automated Test Suite & Regression Verification

### 10.1 Workspace Builds & Typechecks
* `npm run typecheck --workspaces`: **0 errors**
* `npm run build --workspaces`: **0 errors** (Server `tsc` and Client `vite build` completed cleanly)

### 10.2 Test Suite Execution
* **Total Test Files:** 17 passed (17)
* **Total Tests:** 155 passed (155)
* **Phase 19 Notification Hardening Tests:** 6/6 passed (Atomic claims, idempotency, backoff, PHI suppression)
* **Concurrency & Race Condition Tests:** 6/6 passed (Atomic claim-lock, cancellation vs donation race)
* **Security & RBAC Enforcement Tests:** 9/9 passed (Zero password hash exposure, 403 enforcement, CSRF origin verification)

---

## 11. Remaining Technical Risks & Mitigations

| Risk | Severity | Mitigation in Place |
| :--- | :--- | :--- |
| **Connection Pool Exhaustion on Backend Traffic Burst** | Medium | Runtime `DATABASE_URL` uses transaction pooler port 6543 with `?pgbouncer=true&connection_limit=10`. |
| **Third-Party Cookie Blocking on Cross-Domain Login** | Low (Frontend) | Recommended Bearer token fallback for Axios interceptor (identified for Phase 21). |
| **Downtime during Render Environment Variable Update** | Very Low | Render performs zero-downtime rolling deploys when updating `DATABASE_URL`. |

---

## 12. Cutover Readiness Decision

### **GREEN — READY FOR CUTOVER**

All pre-requisites and forensic checks for production cutover have passed:
1. ✅ Render source database is intact (167 baseline rows).
2. ✅ Supabase target is restored and contains all 167 rows.
3. ✅ 100% forensic parity verified across row counts, structural schema, and SHA-256 data checksums.
4. ✅ Zero orphaned foreign-key relations.
5. ✅ Clinical data invariants, timestamps, and UUIDs are identical.
6. ✅ Prisma reports "Database schema is up to date".
7. ✅ 155/155 test suites pass.
8. ✅ Production Render service has NOT been modified yet (remains on Render rollback source).
