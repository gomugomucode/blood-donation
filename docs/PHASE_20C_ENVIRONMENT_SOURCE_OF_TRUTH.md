# HEMACARE — PHASE 20C.1: DATABASE URL SOURCE-OF-TRUTH & ENVIRONMENT NORMALIZATION SPECIFICATION

**Document Version:** 1.0.0  
**Phase:** 20C.1 — Safe Environment Normalization & Source-of-Truth Audit  
**Status:** COMPLETE — ZERO SECRETS COMMITTED — ZERO PRODUCTION IMPACT  

---

## 1. System Inventory of Environment Files

| File Path | Tracked in Git? | Status & Purpose |
| :--- | :--- | :--- |
| **`.env`** (Root) | ❌ **No** (Ignored via `.gitignore:7`) | Normalized local development & validation environment |
| **`.env.local`** (Root) | ❌ **No** (Ignored via `.gitignore:8`) | Supabase connection references (`DIRECT` & `DATABASE` URLs) |
| **`.env.example`** (Root) | ✅ **Yes** | Public non-sensitive template for team onboarding |
| **`server/.env`** | ❌ **No** (Ignored via `.gitignore:7`) | Express server backend runtime environment |
| **`server/.env.example`** | ✅ **Yes** | Server-specific non-sensitive template |
| **`render.yaml`** | ✅ **Yes** | Production cloud deployment specification (Render Blueprint) |

---

## 2. Environment Variable Precedence & Prisma Loading Behavior

### 2.1 The "Environment variables loaded from .env" Explanation
When running any Prisma CLI command (`npx prisma migrate status`, `npx prisma db ...`):
1. **Process Environment Highest Precedence:** If `$env:DATABASE_URL` is exported in the active shell (e.g. via PowerShell `$env:DATABASE_URL = "..."`), Node.js populates `process.env.DATABASE_URL` before any file is read.
2. **Prisma Internal Dotenv Loader:** Prisma CLI executes its internal `dotenv` loader, searching for `.env` at the project root or adjacent to `schema.prisma`. It prints:
   ```text
   Environment variables loaded from .env
   ```
   **Crucial Architectural Rule:** In standard Node.js `dotenv`, existing `process.env` keys are **never overwritten** by file contents. Therefore, if a shell variable was previously exported, Prisma uses that exported value regardless of what is in `.env`.
3. **Absence of `.env.local` Support in Prisma CLI:** Prisma CLI natively only looks for `.env`. It does **not** read `.env.local` unless explicitly specified.

---

## 3. Explicit Variable Roles & Normalized Architecture

To eliminate ambiguity across all execution contexts, the following explicit roles are established:

```text
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                HEMACARE ENVIRONMENT ROLES                               │
├────────────────────────┬─────────────┬──────────────────────────┬───────────────────────┤
│ Environment Variable   │ Port Mode   │ Primary Purpose          │ Workload / Tools      │
├────────────────────────┼─────────────┼──────────────────────────┼───────────────────────┤
│ SUPABASE_DIRECT_URL    │ 5432        │ Administrative / DDL     │ • pg_restore          │
│                        │ (Session)   │ Session-level operations │ • prisma migrate ...  │
│                        │             │ Advisory locks           │ • Schema inspection   │
├────────────────────────┼─────────────┼──────────────────────────┼───────────────────────┤
│ SUPABASE_DATABASE_URL  │ 6543        │ Application Runtime      │ • Express API server  │
│                        │ (Pooler)    │ Transaction pooling      │ • Notification worker │
│                        │             │ ?pgbouncer=true          │ • High-concurrency    │
├────────────────────────┼─────────────┼──────────────────────────┼───────────────────────┤
│ DATABASE_URL           │ Dynamic     │ Active Runtime           │ Resolves to active    │
│                        │             │ Datasource               │ target for Prisma     │
└────────────────────────┴─────────────┴──────────────────────────┴───────────────────────┘
```

### 3.1 Why Port 6543 vs Port 5432 Must Be Segregated
* **Port 5432 (Session Mode):** Supports PostgreSQL session state, prepared statements, and **advisory locks (`pg_advisory_lock`)**. Prisma CLI migration engine requires advisory locks to coordinate schema deployments across concurrent instances. Running `prisma migrate status` against port 6543 will stall because transaction poolers reject advisory locking.
* **Port 6543 (Transaction Mode):** Designed for high-throughput HTTP applications. Discards session state between transactions to allow hundreds of connections over a small connection pool. Must include `?pgbouncer=true&connection_limit=10` to instruct Prisma's query engine not to use named prepared statements.

---

## 4. Current Target Audit & Verification Results

### 4.1 Local Runtime Verification (`scratch/verify_database_target.ts`)
Executed using the application's default `DATABASE_URL` resolution without shell overrides:
```text
Identified Platform       : SUPABASE
Connected Database Name   : postgres
PostgreSQL Major Version  : 17
Server Host Signature     : Managed Cloud Network Endpoint
Public Table Count        : 9
Total Application Rows    : 167
```
**Outcome:** Local validation environment resolves cleanly to Supabase with all 167 rows active.

### 4.2 Production Render Runtime (Untouched)
* **Active Status:** Render production backend (`blood-donation-6vcp.onrender.com`) **remains 100% connected to Render PostgreSQL (`blood_donation_db_l85y`)**.
* **Rollback Authority:** Intact. The Render PostgreSQL database has NOT been modified or decommissioned.
* **Cutover Status:** **NOT PERFORMED.** The production environment variable change will only occur during the controlled Phase 20C cutover.

---

## 5. Secret Management & Git Hygiene

* **Git Status:** 100% clean.
* **Tracked Secrets:** `0`.
* All files containing live credentials (`.env`, `.env.local`, `server/.env`) are strictly ignored by `.gitignore`.
* Zero connection strings or passwords appear in repository commit history or documentation.
