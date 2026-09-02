# HEMACARE — PHASE 20C.3: 72-HOUR BURN-IN T+0 BASELINE SPECIFICATION

**Document Version:** 1.0.0  
**Phase:** 20C.3 — 72-Hour Production Burn-In & Adversarial Monitoring  
**Cutover Epoch (T+0):** 2026-09-02T12:55:20.073Z  
**Lead SRE & Database Reliability Engineer:** Principal Production SRE  
**Service Endpoint:** `https://blood-donation-6vcp.onrender.com`  

---

## 1. Production Deployment & Architecture Baseline

* **Production Service Name:** `hemacare-api` (`blood-donation-6vcp.onrender.com`)
* **Live Deployment Git Commit:** `2740b18` (`fix(server): skip startup migrations on transaction pooler to allow immediate port binding`)
* **Documentation Tracking Commit:** `c0b085e`
* **Node.js Environment:** `v22.x` on Render Native Linux Container
* **Database Driver / Client:** Prisma Client `v6.4.1` with PostgreSQL engine

### 1.1 Active Database Identity Telemetry
Fetched live via `GET https://blood-donation-6vcp.onrender.com/health/ready`:
* **Database Name (`current_database()`):** `postgres`
* **PostgreSQL Engine (`split_part(version(), ' ', 2)`):** `17.6`
* **Connection Architecture:** Express API $\rightarrow$ Supabase Transaction Pooler (`aws-0-ap-southeast-1.pooler.supabase.com:6543`) $\rightarrow$ Supabase PostgreSQL 17.6
* **PgBouncer Parameters:** `?pgbouncer=true&connection_limit=10`
* **Advisory Lock Segregation:** Direct port 5432 reserved exclusively for administrative schema management (`SUPABASE_DIRECT_URL`)

---

## 2. Pre-Cutover vs Target Data Baseline

| Table Name | Immutable Pre-Cutover Baseline (Render 18.6) | Initial Migrated State (Supabase 17.6) | Referential Integrity | Checksum Match |
| :--- | :--- | :--- | :--- | :--- |
| **`User`** | 21 | 21 | 0 orphans | ✅ PASS |
| **`DonorProfile`** | 19 | 19 | 0 orphans | ✅ PASS |
| **`BloodRequest`** | 22 | 22 | 0 orphans | ✅ PASS |
| **`Donation`** | 6 | 6 | 0 orphans | ✅ PASS |
| **`DonorOpportunity`** | 2 | 2 | 0 orphans | ✅ PASS |
| **`Notification`** | 2 | 2 | 0 orphans | ✅ PASS |
| **`PasswordResetToken`** | 0 | 0 | 0 orphans | ✅ PASS |
| **`AuditLog`** | 89 | 89 | 0 orphans | ✅ PASS |
| **`_prisma_migrations`** | 6 | 6 | 0 orphans | ✅ PASS |
| **TOTALS** | **167 rows** | **167 rows** | **0 orphans** | ✅ **100% IDENTICAL** |

---

## 3. Rollback Source Immutable Protection

* **Rollback Target Database:** Render PostgreSQL 18.6 (`blood_donation_db_l85y`)
* **Rollback Database Location:** `dpg-daascrbtqb8s73e389b0-a.oregon-postgres.render.com`
* **Retention Invariant:** The source Render database is **frozen as the immutable rollback authority**.
* **Integrity Audit:** Verified at cutover; total row count remains exactly **167 rows**. Zero migration or write traffic has touched the rollback source post-cutover.
* **Decommissioning Gate:** Must remain active and online for a minimum of 72 hours (until 2026-09-05T12:55:20Z).

---

## 4. T+0 Operational Health & Telemetry

* **Readiness Probe (`/health/ready`):** `200 OK` (Database connected, latency ~280ms)
* **Liveness Probe (`/health/live`):** `200 OK` (Node.js runtime active)
* **General Health (`/health`):** `200 OK` (System healthy)
* **Authentication:** Live Admin login verified via `/api/v1/auth/login`.
* **Authorization / RBAC:** Verified; unauthenticated requests to `/admin/*` rejected with `401 Unauthorized`.
* **Clinical Invariants:** Verified; `0 <= unitsFulfilled <= unitsRequired` with 0 violations.
* **Notification Worker:** Initialized and running; carrier delivery configured as `SANDBOX / SIMULATED`.
* **Initial 5xx Error Rate:** `0.0%`
* **Initial Connection Drop Rate:** `0.0%`
