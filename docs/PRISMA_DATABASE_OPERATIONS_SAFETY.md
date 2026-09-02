# HEMACARE — PRISMA COMMANDS & DATABASE OPERATIONS SAFETY POLICY

**Document Version:** 1.0.0  
**Authority:** Production SRE & Database Reliability  
**Scope:** All Developers, CI Pipelines, and Production Operations  

---

## 1. Prisma Command Safety Matrix

| Command | Local Dev | CI Pipeline | Staging | Production | Safety Classification & Operational Rules |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`prisma generate`** | ✅ ALLOWED | ✅ ALLOWED | ✅ ALLOWED | ✅ ALLOWED | **SAFE.** Generates TypeScript client types locally; establishes zero database connections. |
| **`prisma migrate status`** | ✅ ALLOWED | ✅ ALLOWED | ✅ ALLOWED | ✅ ALLOWED | **SAFE.** Read-only inspection of the `_prisma_migrations` table; never modifies schemas or records. |
| **`prisma migrate deploy`** | ✅ ALLOWED | ✅ ALLOWED | ✅ ALLOWED | ✅ ALLOWED* | **CONTROLLED.** Non-interactive forward migration applier. *Must strictly target direct port 5432 (`DIRECT_URL`). Never run against transaction pooler (port 6543) due to advisory lock incompatibility. |
| **`prisma migrate dev`** | ✅ ALLOWED | ❌ FORBIDDEN | ❌ FORBIDDEN | ❌ FORBIDDEN | **DEVELOPMENT ONLY.** Interactive migration creator. Can prompt for database reset. Strictly forbidden on any shared or remote database. |
| **`prisma db push`** | ✅ ALLOWED | ❌ FORBIDDEN | ❌ FORBIDDEN | ❌ FORBIDDEN | **HIGH RISK.** Bypasses migration ledger and can drop unmapped columns/indexes without warning. Forbidden in production. |
| **`prisma db seed`** | ✅ ALLOWED | ✅ ALLOWED | ⚠️ CONTROLLED | ❌ FORBIDDEN | **HIGH RISK.** Populates database with synthetic records. Never run against production unless running verified idempotent baseline scripts. |
| **`prisma migrate reset`** | ✅ ALLOWED | ⚠️ DISPOSABLE | ❌ BANNED | ❌ BANNED | **DESTRUCTIVE.** Drops schema, deletes all data, and reruns all migrations from zero. Permanently prohibited on production/remote databases. |

---

## 2. Supabase Port Distinction (Port 6543 vs Port 5432)

Supabase provides two distinct connection endpoints:

```text
1. Transaction Pooler (Supavisor / PgBouncer)
   Port: 6543
   Mode: Transaction Pooling
   Intended For: Application Runtime (Express API, DATABASE_URL)
   Constraint: Advisory locks (pg_advisory_lock) are rejected.

2. Direct Session Connection
   Port: 5432
   Mode: Session Dedicated
   Intended For: Administrative Schema Management (Prisma CLI, DIRECT_URL)
   Capabilities: Supports advisory locks and DDL migrations.
```

### HARD RULE:
* **NEVER** run `prisma migrate deploy` or `prisma migrate dev` against port 6543.
* **NEVER** run startup migrations (`execSync('prisma migrate deploy')`) inside long-running containers connected via port 6543. Migrations must be executed as explicit deployment release commands or pre-deploy hooks targeting port 5432.

---

## 3. Automated Test Runner Isolation Policy

To prevent any possibility of automated tests connecting to remote or production databases:

1. **Fail-Closed Allowlist:** Vitest runs [server/src/config/test-database-safety.ts](file:///c:/Users/Anupam%20Baral/Desktop/blood-donation/server/src/config/test-database-safety.ts) before any test or fixture executes.
2. **Approved Hosts:** Only loopback (`localhost`, `127.0.0.1`, `::1`) and approved Docker container hostnames (`postgres`, `test-db`) are permitted.
3. **Remote Kill Switch:** Any connection URL pointing to `supabase.co`, `render.com`, `aws.com`, or any unapproved host immediately aborts the test suite before Prisma connects.
4. **Dedicated Variable:** Tests prioritize `TEST_DATABASE_URL` over `DATABASE_URL`.
