# HEMACARE — PHASE 20: SUPABASE TARGET READINESS & PRE-FLIGHT COMPATIBILITY REPORT

**Document Version:** 1.0.0  
**Phase:** 20A — Target Discovery & Compatibility Validation Only  
**Status:** VALIDATION COMPLETE — READY FOR CONTROLLED PHASE 20B RESTORE  
**Source Baseline:** PostgreSQL 18.6 (Render) — 167 rows strictly preserved  
**Target Platform:** Supabase Managed PostgreSQL (AWS / Supavisor)  

---

## 1. Application & Environment Architecture Inspection

An in-depth inspection of the HemaCare codebase and deployment configuration reveals the following technical parameters:

### 1.1 Runtime & Dependencies
- **Node.js Runtime:** `v24.15.0` (Engine target: `^20.0.0 || ^22.0.0 || ^24.0.0`)
- **TypeScript:** `5.9.3` / `5.7.3`
- **Prisma CLI:** `6.19.3`
- **Prisma Client (`@prisma/client`):** `6.19.3`
- **Database Driver:** `@prisma/client` utilizing Prisma Query Engine (`libquery-engine-windows.dll.node` in local dev, Linux binary in Docker/Render).

### 1.2 Prisma Schema & Datasource Configuration
- **Prisma Schema Location:** [server/prisma/schema.prisma](file:///c:/Users/Anupam%20Baral/Desktop/blood-donation/server/prisma/schema.prisma)
- **Current Datasource Declaration:**
  ```prisma
  datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
  }
  ```
- **Connection Mode in Production:** Currently a direct connection (`DATABASE_URL` pointing directly to Render PostgreSQL on port 5432).
- **Prisma Migration History:** 6 completed migrations recorded in `_prisma_migrations`:
  1. `20260831131526_init` (Core User, DonorProfile, BloodGroup)
  2. `20260831141027_add_audit_log` (Audit trail ledger)
  3. `20260831142148_add_blood_request` (Clinical blood requests)
  4. `20260831143414_add_donor_opportunity_notification` (Matching engine & alerts)
  5. `20260831173841_add_session_version_and_password_reset` (Session revocation & password recovery)
  6. `20260901003115_add_notification_reliability` (Idempotency, processing state machine, retry bounds)

### 1.3 Backend Connection Handling (`Express`)
- **Singleton Pattern:** Managed in [server/src/config/db.ts](file:///c:/Users/Anupam%20Baral/Desktop/blood-donation/server/src/config/db.ts) via `global.__prisma`.
- **Connection Pooling:** Default connection pool managed by Prisma engine (typically `num_physical_cpus * 2 + 1`).
- **Connection Lifecycle:** Cleanly connects on server startup in [server/src/server.ts](file:///c:/Users/Anupam%20Baral/Desktop/blood-donation/server/src/server.ts) via `await prisma.$connect()`, with graceful shutdown on `SIGTERM` / `SIGINT` via `await prisma.$disconnect()`.

---

## 2. Source Database Fingerprint (Render PostgreSQL)

- **PostgreSQL Engine:** `PostgreSQL 18.6 (Debian 18.6-1.pgdg12+2) on x86_64-pc-linux-gnu, 64-bit`
- **Host:** `dpg-daascrbtqb8s73e389b0-a.oregon-postgres.render.com`
- **Database Name:** `blood_donation_db_l85y`
- **Max Connections:** 100
- **Extensions Installed:** `plpgsql` (1.0)
- **Custom Enumerations (10):**
  - `BloodGroup` (8 labels)
  - `Role` (2 labels: `DONOR`, `ADMIN`)
  - `RequestStatus` (5 labels: `OPEN`, `PARTIALLY_FULFILLED`, `FULFILLED`, `CANCELLED`, `EXPIRED`)
  - `RequestUrgency` (4 labels: `LOW`, `NORMAL`, `HIGH`, `CRITICAL`)
  - `OpportunityStatus` (7 labels: `PENDING`, `VIEWED`, `ACCEPTED`, `DECLINED`, `EXPIRED`, `CANCELLED`, `FULFILLED`)
  - `DeclineReason` (4 labels: `NOT_AVAILABLE`, `CANNOT_TRAVEL`, `RECENTLY_DONATED`, `OTHER`)
  - `NotificationChannel` (3 labels: `IN_APP`, `EMAIL`, `SMS`)
  - `NotificationType` (3 labels: `OPPORTUNITY_ALERT`, `STATUS_UPDATE`, `GENERAL`)
  - `NotificationStatus` (5 labels: `PENDING`, `SENT`, `FAILED`, `READ`, `PROCESSING`)
- **Public Tables (9):** `User`, `DonorProfile`, `BloodRequest`, `Donation`, `DonorOpportunity`, `Notification`, `PasswordResetToken`, `AuditLog`, `_prisma_migrations`
- **Foreign Keys (9):**
  - `BloodRequest(createdById)` ──▶ `User(id)` [RESTRICT / CASCADE]
  - `Donation(donorId)` ──▶ `DonorProfile(id)` [CASCADE / CASCADE]
  - `Donation(bloodRequestId)` ──▶ `BloodRequest(id)` [SET NULL / CASCADE]
  - `DonorOpportunity(donorId)` ──▶ `DonorProfile(id)` [CASCADE / CASCADE]
  - `DonorOpportunity(bloodRequestId)` ──▶ `BloodRequest(id)` [CASCADE / CASCADE]
  - `DonorProfile(userId)` ──▶ `User(id)` [CASCADE / CASCADE]
  - `Notification(userId)` ──▶ `User(id)` [CASCADE / CASCADE]
  - `Notification(opportunityId)` ──▶ `DonorOpportunity(id)` [SET NULL / CASCADE]
  - `PasswordResetToken(userId)` ──▶ `User(id)` [CASCADE / CASCADE]
- **Indexes (39):** All btree indexes including compound indexes (`Notification_status_channel_idx`, `DonorOpportunity_donorId_status_idx`, `AuditLog_targetType_targetId_idx`).
- **Sequences:** `0` (Zero auto-incrementing integers; all models use client/database-generated UUIDs).
- **Triggers:** `0`.
- **Live Baseline Data Inventory (Strictly Verified at 167 rows):**
  - `AuditLog`: 89
  - `BloodRequest`: 22
  - `Donation`: 6
  - `DonorOpportunity`: 2
  - `DonorProfile`: 19
  - `Notification`: 2
  - `PasswordResetToken`: 0
  - `User`: 21 (2 Admin, 19 Donor)
  - `_prisma_migrations`: 6

---

## 3. Target Database Fingerprint & Pre-Flight Validation (Supabase PostgreSQL)

A non-destructive pre-flight audit executed via [scratch/target_supabase_audit.ts](file:///c:/Users/Anupam%20Baral/Desktop/blood-donation/scratch/target_supabase_audit.ts) confirmed:

- **PostgreSQL Engine:** `PostgreSQL 17.6 on aarch64-unknown-linux-gnu, compiled by gcc (GCC) 15.2.0, 64-bit`
- **Database Name:** `postgres`
- **Current Database User:** `postgres`
- **Max Connections:** `60`
- **Extensions Available:** `plpgsql` (1.0), `pgcrypto` (1.3), `uuid-ossp` (1.1), `pg_stat_statements` (1.11), `supabase_vault` (0.3.1)
- **Existing Public Schema Tables:** `0` (Completely empty)
- **Existing Custom Enums in Public:** `0`
- **Existing Constraints in Public:** `0`
- **Existing Indexes in Public:** `0`
- **Total Existing Rows in Public:** `0`
- **Target Safety Gate Status:** **PASS — CLEAN & EMPTY TARGET (Zero collision risk)**
- **Port 5432 (Session Mode) Connectivity:** **VERIFIED**
- **Port 6543 (Transaction Pooler Mode with `?pgbouncer=true`) Connectivity:** **VERIFIED**

---

## 4. PostgreSQL Compatibility & Feature Assessment

| Feature / Data Type | Render Source (PostgreSQL 18.6) | Supabase Target (PostgreSQL 17.6) | Compatibility Assessment |
| :--- | :--- | :--- | :--- |
| **Prisma 6.19.3 Support** | Full support | Full support | **PASS** — Prisma officially supports PostgreSQL 12 through 18. |
| **UUID Primary Keys** | Text / `gen_random_uuid()` | Native UUID / `gen_random_uuid()` | **PASS** — Text UUIDs are 100% portable and require no extension dependencies. |
| **Custom Enums** | Native PostgreSQL `pg_type` | Native PostgreSQL `pg_type` | **PASS** — Identical behavior across all PostgreSQL versions. |
| **Timestamps** | `timestamp(3) without time zone` | `timestamp(3) without time zone` | **PASS** — Sub-millisecond precision is preserved identically. |
| **JSON / JSONB** | `jsonb` (`preferences`, `metadata`) | `jsonb` | **PASS** — Identical JSONB serialization and indexing. |
| **Foreign Keys & Cascades** | 9 constraints (RESTRICT, CASCADE, SET NULL) | Standard referential constraints | **PASS** — All cascade rules are ANSI standard PostgreSQL. |
| **Compound Indexes** | B-Tree | B-Tree | **PASS** — 100% equivalent execution planner optimization. |
| **Advisory Locks** | Used by Prisma migrations | Supported on Direct Connection (Port 5432) | **PASS** — Direct port 5432 supports `pg_advisory_lock`. |

---

## 5. Connection Strategy Analysis (Supabase Architecture)

Supabase utilizes **Supavisor** (modern connection pooler replacing PgBouncer) alongside direct PostgreSQL connections. Choosing the correct connection mode for each workload is critical:

```text
                                    ┌────────────────────────────────────────────────────────┐
                                    │               SUPABASE INFRASTRUCTURE                  │
                                    │                                                        │
                                    │  ┌───────────────────────┐   ┌──────────────────────┐  │
[Render Web Service] (Runtime) ───▶ │  │ Supavisor Pooler      │──▶│ PostgreSQL Engine    │  │
 (Port 6543, pgbouncer=true)        │  │ Transaction Mode      │   │ (Database: postgres) │  │
                                    │  └───────────────────────┘   └──────────────────────┘  │
                                    │                                         ▲               │
[Prisma CLI / pg_restore] ─────────▶│  │ Session / Direct Mode │──────────────┘               │
 (Port 5432)                        │  │ (Full protocol/locks) │                              │
                                    │  └───────────────────────┘                              │
                                    └────────────────────────────────────────────────────────┘
```

### 5.1 Connection Role A: Schema / Data Migration & Administration (`SUPABASE_DIRECT_URL`)
* **Endpoint:** Port `5432` (Session Pooler Mode or Direct DB host `aws-0-[region].pooler.supabase.com:5432` / `db.[ref].supabase.co:5432`).
* **Protocol:** Full standard PostgreSQL protocol.
* **Why required:**
  - `pg_restore` requires full DDL execution, schema recreation, and constraint creation.
  - Prisma CLI (`npx prisma migrate deploy` / `status`) requires PostgreSQL **advisory locks** (`pg_advisory_lock`) to coordinate schema state.
* **Format:**
  ```text
  postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
  ```

### 5.2 Connection Role B: Production Prisma Application Runtime (`SUPABASE_DATABASE_URL`)
* **Endpoint:** Port `6543` (Transaction Pooler Mode).
* **Protocol:** Transaction-level connection pooling.
* **Prisma Parameter Required:** `?pgbouncer=true&connection_limit=10`
* **Why required:**
  - Prevents backend connection pool exhaustion as traffic grows.
  - Tells Prisma Query Engine to avoid preparing named server-side prepared statements that fail in transaction pooling mode.
* **Format:**
  ```text
  postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10
  ```

---

## 6. Detected Technical Risks & Mitigation Controls

| Identified Risk | Impact | Automated Mitigation Control |
| :--- | :--- | :--- |
| **Accidental Overwrite of Target Data** | Data destruction on target | Pre-flight script checks `information_schema.tables`. If target contains tables, halts immediately. |
| **Source Data Loss / Corruption** | Clinical data loss | Source Render database is strictly isolated in READ-ONLY mode; verified `.dump` file archived. |
| **Prisma Migration Desynchronization** | Prisma fails future deployments | The `_prisma_migrations` table is dumped and restored 1:1, ensuring Prisma sees zero pending/failed migrations. |
| **Advisory Lock Failure on Port 6543** | Migrations fail with pooler error | Migrations and `pg_restore` are strictly mapped to direct port `5432`. |
| **Prepared Statement Collision** | Runtime 500 errors | App runtime URL enforces `?pgbouncer=true` parameter. |
| **Credential Exposure in Git / Logs** | Security breach | All commands read from `$env:SUPABASE_DIRECT_URL` / `$env:SUPABASE_DATABASE_URL` without printing secrets. `.gitignore` forbids `.dump` and `.env*`. |

---

## 7. Exact Migration Commands Planned for Phase 20B (Controlled Restore)

These commands will be executed in **Phase 20B** only after target database credentials are provided and target emptiness is verified:

```bash
# 1. Non-Destructive Connectivity & Emptiness Verification on Target
npx tsx scratch/target_supabase_audit.ts

# 2. Controlled Schema & Data Restoration from Verified Backup
pg_restore --clean --if-exists --no-owner --no-acl --verbose \
  -d "$SUPABASE_DIRECT_URL" \
  backups/render_backup_20260902_pre_migration.dump

# 3. Prisma Migration Status Confirmation on Target
DATABASE_URL="$SUPABASE_DIRECT_URL" npx prisma migrate status --schema=server/prisma/schema.prisma

# 4. Strict Row Count & Checksum Parity Verification (Render vs Supabase)
npx tsx scratch/verify_parity.ts

# 5. Automated Domain Regression Test Suite Execution against Supabase
DATABASE_URL="$SUPABASE_DIRECT_URL" npm run test --workspace=server
```

---

## 8. Rollback Protocol

If any parity discrepancy or regression occurs during Phase 20B or production cutover:
1. Render backend (`hemacare-api`) environment variable `DATABASE_URL` remains set to Render PostgreSQL.
2. Render PostgreSQL continues serving live traffic with its untouched **167 baseline rows**.
3. Zero customer downtime or clinical record rollback is incurred.
4. Render PostgreSQL remains active for a mandatory 72-hour burn-in window post-migration.
