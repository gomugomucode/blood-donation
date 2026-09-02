# HEMACARE — PHASE 20 DATABASE MIGRATION PLAN
## Render PostgreSQL → Supabase PostgreSQL Production Migration

**Document Version:** 1.0.0  
**Status:** READY FOR TARGET PROVISIONING & CUTOVER  
**Created:** 2026-09-02  
**Target:** Production Database Migration with Zero Clinical Data Loss, Preserved Prisma Compatibility, and Reversible Rollback  

---

## 1. Executive Summary & Objective

The HemaCare Blood Donation Management Platform currently hosts its managed PostgreSQL database on Render. The goal of this phase is to execute a controlled, zero-data-loss, and reversible migration to Supabase PostgreSQL.

```text
Current Architecture:
  Frontend (Vercel) ──▶ Backend (Render Web Service) ──▶ Render PostgreSQL (oregon-postgres.render.com)

Target Architecture:
  Frontend (Vercel) ──▶ Backend (Render Web Service) ──▶ Supabase PostgreSQL (aws-0-[region].pooler.supabase.com)
```

**Core Principle:** Same PostgreSQL database contract, new PostgreSQL host.
- No application migration to Supabase Edge Functions.
- No replacement of Prisma ORM with Supabase JS client.
- No database redesign or entity alterations.
- Strict non-negotiable safety rules: No dropping Render databases, no deleting production data, no unverified cutovers.

---

## 2. Infrastructure Inventory & Connection Topologies

### 2.1 Source Database (Render PostgreSQL)
- **Host:** `dpg-daascrbtqb8s73e389b0-a.oregon-postgres.render.com` (External) / `dpg-daascrbtqb8s73e389b0-a` (Internal)
- **Database Name:** `blood_donation_db_l85y`
- **User:** `blood_donation_db_l85y_user`
- **Password:** `[PRESENT / REDACTED]`
- **Engine Version:** `PostgreSQL 18.6 (Debian 18.6-1.pgdg12+2) on x86_64-pc-linux-gnu`
- **Region:** US Oregon (AWS `us-west-2` equivalent)
- **SSL Requirements:** Enforced (`sslmode=require`)
- **Max Connections:** 100
- **Primary Keys:** UUID (`gen_random_uuid()` / Prisma `@default(uuid())`)

### 2.2 Target Database (Supabase PostgreSQL Architecture)
Supabase provides two distinct connection endpoints that must be configured appropriately for Prisma ORM:
1. **Transaction Connection Pooler (Supavisor / PgBouncer - Port 6543)**:
   - Used for runtime application traffic (`DATABASE_URL`).
   - Format: `postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10`
   - Handles multi-instance scaling and prevents connection starvation.
2. **Direct Connection / Session Pooler (Port 5432)**:
   - Used for migrations and administrative schema inspection (`DIRECT_URL`).
   - Format: `postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres` (or direct host `db.[PROJECT_REF].supabase.co:5432`)
   - Required for Prisma migration deploys and advisory locks.

---

## 3. Pre-Migration Baseline & Verified Data Inventory

As of **2026-09-02T15:16:00Z**, the live Render PostgreSQL source database contains:

| Entity / Table | Row Count | Oldest Record (`min(createdAt)`) | Newest Record (`max(createdAt)`) | Clinical & Operational Significance |
| :--- | :---: | :---: | :---: | :--- |
| `User` | **21** | 2026-09-01T10:45:51.389Z | 2026-09-02T09:14:38.202Z | 2 Admin accounts (`ADMIN`), 19 Donor accounts (`DONOR`) |
| `DonorProfile` | **19** | 2026-09-01T11:15:26.472Z | 2026-09-01T14:50:04.139Z | Complete clinical profiles (Blood group, contacts, cooldowns) |
| `BloodRequest` | **22** | 2026-09-01T11:16:17.379Z | 2026-09-01T12:07:34.598Z | 16 Open, 2 Partially Fulfilled, 3 Fulfilled, 1 Cancelled |
| `Donation` | **6** | 2026-09-01T11:15:41.227Z | 2026-09-01T12:07:00.785Z | Clinical completed units and cooldown timestamps |
| `DonorOpportunity` | **2** | 2026-09-01T11:16:17.990Z | 2026-09-01T11:17:11.499Z | Active algorithmic donor-request matches |
| `Notification` | **2** | 2026-09-01T11:16:18.114Z | 2026-09-01T11:17:11.501Z | Idempotent alerts with carrier dispatch states |
| `PasswordResetToken`| **0** | N/A | N/A | Single-use hashed password reset tokens |
| `AuditLog` | **89** | 2026-09-01T11:05:59.580Z | 2026-09-02T09:14:53.969Z | Forensic trail of admin, security, and auth events |
| `_prisma_migrations` | **6** | 2026-09-01T10:45:45.680Z | 2026-09-01T10:45:45.982Z | Exact Prisma migration ledger |
| **TOTAL** | **167** | — | — | **100% of rows must match post-migration** |

---

## 4. Phase-by-Phase Migration Execution Plan

```mermaid
graph TD
    A[Step 1: Forensic Source Discovery] --> B[Step 2: Verified Logical Backup pg_dump]
    B --> C[Step 3: Target Supabase Project Provisioning]
    C --> D[Step 4: Restore Schema & Prisma Migration Ledger]
    D --> E[Step 5: Restore Table Data & Constraints]
    E --> F[Step 6: Data & Relationship Parity Verification]
    F --> G[Step 7: Domain & Regression Tests on Supabase]
    G --> H[Step 8: Render Backend Cutover DATABASE_URL]
    H --> I[Step 9: Post-Cutover Smoke Tests & Health Checks]
    I --> J[Step 10: Retain Source Database During Rollback Window]
```

### Step 1: Pre-Flight Discovery & Schema Forensics (COMPLETED)
- Audited all 9 tables, 10 enums, 9 foreign keys, and 39 indexes.
- Verified absence of PostgreSQL sequence drift (all entities use client/database-generated UUIDs).
- Verified zero untracked manual schema drift from Prisma migrations.

### Step 2: Source Database Backup & Integrity Check (COMPLETED)
- Created full native logical archive: `backups/render_backup_20260902_pre_migration.dump`.
- Size: `43,651 bytes` (43.65 KB).
- Format: PostgreSQL Custom Archive (`pg_dump -Fc` with gzip compression).
- Verified TOC: 81 entries, including all schema definitions, enum types, table data, constraints, and indexes.
- Secured in Git via `.gitignore`.

### Step 3: Target Supabase Database Configuration
- Obtain the Supabase direct connection string (`port 5432`) and pooled connection string (`port 6543`).
- Ensure PostgreSQL extensions match (`plpgsql` standard).

### Step 4: Schema & Data Restoration
- Restore the verified dump directly to the Supabase database using `pg_restore`:
  ```bash
  pg_restore --clean --if-exists --no-owner --no-acl -d "$SUPABASE_DIRECT_URL" backups/render_backup_20260902_pre_migration.dump
  ```
- Run `npx prisma migrate status` against Supabase to verify all 6 migrations are recorded as applied.

### Step 5: Parity & Integrity Verification
- Compare exact row counts across all 9 tables between Render and Supabase (Target difference: 0 rows).
- Verify minimum and maximum `createdAt` timestamps match identically.
- Verify user password hashes and session versions match identically.
- Verify status distributions for `BloodRequest`, `User`, `DonorOpportunity`, and `Notification`.

### Step 6: Application Domain & Security Regression
- Execute automated regression test suite against Supabase:
  - 17 test suites, 155 unit & integration tests.
  - Phase 18/19 invariants: RBAC, IDOR, matching concurrency, notification idempotency, stale suppression.

### Step 7: Production Cutover
- Update `DATABASE_URL` in the Render Web Service dashboard (`hemacare-api`) to point to Supabase Transaction Pooler (`aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true`).
- Trigger blue/green zero-downtime redeployment on Render.
- Verify health endpoints (`/health/live` and `/health/ready`).

### Step 8: Post-Cutover Verification & Rollback Retention
- Test live authentication, donor profile retrieval, coordinator dashboard, and blood request queries.
- Retain Render PostgreSQL in read-only / warm standby state for a minimum 72-hour rollback window.

---

## 5. Rollback Strategy

If any critical failure occurs during cutover:
1. Revert `DATABASE_URL` on the Render backend web service back to the Render PostgreSQL connection string.
2. Trigger immediate redeploy of `hemacare-api`.
3. Verify backend reconnects to Render PostgreSQL via `/health/ready`.
4. Render source database remains completely untouched throughout the entire migration procedure.
