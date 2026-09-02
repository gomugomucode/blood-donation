# HEMACARE — PHASE 20C.3: 72-HOUR BURN-IN ERROR & INCIDENT LOG

**Document Version:** 1.0.0  
**Monitoring Epoch:** 2026-09-02T12:55:20Z through 2026-09-05T12:55:20Z  
**Lead SRE:** Principal SRE & Database Reliability Engineer  

---

## 1. Automated Keyword & Anomaly Surveillance

The following critical system telemetry patterns are continuously monitored across Render application logs and Supabase PostgreSQL metrics:

| Monitored Pattern | Threat Classification | T+0 Status | T+15m Status | Cumulative Incident Count |
| :--- | :--- | :--- | :--- | :--- |
| **`PrismaClientInitializationError`** | P1 (Connection failure) | None detected | None detected | 0 |
| **`PrismaClientRustPanicError`** | P0 (Engine crash) | None detected | None detected | 0 |
| **`PgBouncer` / `Supavisor` syntax** | P1 (Pooler rejection) | None detected | None detected | 0 |
| **`prepared statement "s0" already exists`** | P1 (Pooler conflict) | None detected | None detected | 0 |
| **`pg_advisory_lock` timeout** | P1 (Migration deadlock) | Resolved (Commit `2740b18`) | None detected | 0 |
| **`ECONNRESET` / `ECONNREFUSED`** | P1 (Network drop) | None detected | None detected | 0 |
| **`deadlock detected`** | P1 (Write collision) | None detected | None detected | 0 |
| **`could not serialize access`** | P1 (Transaction conflict) | None detected | None detected | 0 |
| **Worker Crash / Exit** | P1 (Background failure) | None detected | None detected | 0 |
| **Uncaught Exception / Fatal** | P0 (Service outage) | None detected | None detected | 0 |

---

## 2. Quantitative Metric Telemetry Log

| Checkpoint | Timestamp (UTC) | Total Requests Sampled | 2xx Success Rate | 4xx Client Errors | 5xx Server Errors | Database Reconnects | Worker Restarts | Operational Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **T+0** | 2026-09-02 12:55:20 | 12 | 100.0% | 0 | 0 | 0 | 0 | ✅ **GREEN** |
| **T+15m** | 2026-09-02 13:10:20 | 15 | 100.0% | 0 | 0 | 0 | 0 | ✅ **GREEN** |
| **T+30m** | 2026-09-02 13:25:20 | — | — | — | — | — | — | ⏳ SCHEDULED |
| **T+1h** | 2026-09-02 13:55:20 | — | — | — | — | — | — | ⏳ SCHEDULED |
| **T+2h** | 2026-09-02 14:55:20 | — | — | — | — | — | — | ⏳ SCHEDULED |
| **T+6h** | 2026-09-02 18:55:20 | — | — | — | — | — | — | ⏳ SCHEDULED |
| **T+12h** | 2026-09-03 00:55:20 | — | — | — | — | — | — | ⏳ SCHEDULED |
| **T+24h** | 2026-09-03 12:55:20 | — | — | — | — | — | — | ⏳ SCHEDULED |
| **T+48h** | 2026-09-04 12:55:20 | — | — | — | — | — | — | ⏳ SCHEDULED |
| **T+72h** | 2026-09-05 12:55:20 | — | — | — | — | — | — | ⏳ SCHEDULED |

---

## 3. Incident History & Resolution Audit

### Incident 20C.1: Boot-Time Migration Advisory Lock Stall on Transaction Pooler
* **Timestamp:** 2026-09-02T12:05:07Z (Pre-cutover deployment attempt)
* **Severity:** P1 (Deployment Blocked)
* **Symptoms:** Container stalled during `npm start` while executing `execSync('npx prisma migrate deploy')` against port 6543 pooler. Render port-scan timed out after 5 minutes.
* **Root Cause:** Transaction poolers (PgBouncer/Supavisor) do not maintain session state and reject PostgreSQL advisory locks (`pg_advisory_lock`), causing `prisma migrate deploy` to hang.
* **Remediation:** Commit `2740b18` bypassed runtime startup migrations via `RUN_MIGRATIONS_ON_STARTUP` guard. All 6 migrations were already applied and verified on Supabase. Container now boots and binds to `PORT` in under 500ms.
* **Status:** **RESOLVED & VERIFIED.** Zero recurrence post-cutover.

### INCIDENT: 20C.2
* **TYPE:** Production database contamination by local test execution
* **IMPACT:** Supabase production data temporarily deleted
* **SOURCE RENDER DATABASE:** NOT AFFECTED (167 rows preserved)
* **RECOVERY:** Completed from verified Render source
* **CURRENT STATUS:** RESOLVED
* **SUMMARY METRICS:**
  - 1 test-isolation incident occurred.
  - 0 permanent data-loss events occurred.
  - 0 rollback events occurred.
* **Timestamp:** 2026-09-02T13:04:00Z (Post-cutover verification task)
* **Severity:** P0 (Target Data Loss & Auth Failure on Supabase)
* **Symptoms:** Adversarial failure detection probe identified Admin Login failing with `401 Unauthorized`. Querying Supabase revealed `User` table had been cleared down to 1 user.
* **Root Cause:** In Phase 20C.2 Step 27, automated test suite (`npm run test`) was executed locally on the developer machine. Because `server/.env` pointed to the Supabase pooler, integration test fixtures with unconditional `prisma.user.deleteMany()` cleared target tables.
* **Remediation & Hardening:**
  1. **Fail-Closed Safety Validator:** Built `server/src/config/test-database-safety.ts` enforcing an explicit localhost / disposable Docker allowlist, denying remote hosts by default.
  2. **Pre-Setup Kill Switch:** Added `server/tests/pre-setup-safety.ts` at the head of Vitest `setupFiles`, aborting before any test or fixture executes.
  3. **Prisma Client Guard:** Added assertion in `server/src/config/db.ts` to prevent PrismaClient instantiation against remote databases in `test` mode.
  4. **Baseline Re-synchronization:** Executed `scratch/resync_baseline_to_supabase.ts` to restore all 167 rows from the untouched Render PostgreSQL rollback authority.
  5. **Negative Test Suite:** Added 21 automated safety tests in `server/tests/test-database-safety.test.ts` proving remote hosts (Supabase, Render, AWS, Neon, public IPs) are completely blocked.
* **Status:** **RESOLVED & VERIFIED.** Baseline restored to exact 167 rows; test runner permanently guarded.

### Incident 20C.3: Reverse-Proxy Rate-Limiter Header Warning & Body Parser SyntaxError
* **Timestamp:** 2026-09-02T13:09:08Z (Live runtime log inspection)
* **Severity:** P2 (Observability & Client Validation Hardening)
* **Symptoms:**
  1. `ValidationError: The 'X-Forwarded-For' header is set but the Express 'trust proxy' setting is false` emitted by `express-rate-limit`.
  2. Malformed JSON curl request triggered an unhandled 500 server error instead of a 400 Bad Request.
* **Root Cause:**
  1. Express defaults to `trust proxy = false`, causing `express-rate-limit` to warn that Render's proxy IP might be shared across all clients.
  2. `error.middleware.ts` lacked a specific check for `body-parser` JSON syntax errors.
* **Remediation:** (Commit `ca51a40`):
  1. Added `app.set('trust proxy', 1)` in `server/src/app.ts` to allow accurate client IP identification through Render / Cloudflare reverse proxies.
  2. Added `SyntaxError` check in `server/src/middleware/error.middleware.ts` to intercept malformed request bodies and return `HTTP 400 Bad Request`.
* **Status:** **RESOLVED & COMMITTED.**


