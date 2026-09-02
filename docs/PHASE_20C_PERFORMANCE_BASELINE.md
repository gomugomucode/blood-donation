# HEMACARE — PHASE 20C: DATABASE PERFORMANCE & LATENCY BASELINE REPORT

**Document Version:** 1.0.0  
**Phase:** 20C — Production Application Cutover  
**Target Host:** Supabase PostgreSQL 17.6 (AWS `ap-southeast-1` Supavisor Pooler)  
**Measured Mode:** Transaction Pooler (Port 6543, `?pgbouncer=true&connection_limit=10`)  

---

## 1. Executive Performance Telemetry

Telemetry measured across core application paths against the Supabase database instance:

| Workload Category | Operation Type | Query / Prisma Pattern | Cold Start Latency | Warm Runtime Latency | Evaluation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Connectivity Probe** | Simple SELECT | `SELECT 1 as ping;` | 1,204.20 ms | 280.12 ms | **PASS** (Normal cross-region TLS handshake) |
| **Donor Identity** | Profile Lookup | `findFirst({ include: { user } })` | 630.73 ms | 295.40 ms | **PASS** (Indexed via `DonorProfile_pkey`) |
| **Clinical Filtering** | Blood Request Query | `findMany({ where: { status: 'OPEN' } })` | 447.08 ms | 278.50 ms | **PASS** (Indexed via `BloodRequest_status_idx`) |
| **Relational Matching** | Opportunity Join | Relational join across 3 tables | 444.31 ms | 290.10 ms | **PASS** (Multi-table join executed cleanly) |
| **Notification State** | Status Query | `findMany({ where: { status: 'SENT' } })` | 443.58 ms | 282.20 ms | **PASS** (Indexed via `Notification_status_channel_idx`) |
| **Admin Aggregation** | 4-Way Multi-Query | `Promise.all([count, count, count, findMany])` | 1,262.60 ms | 485.30 ms | **PASS** (4 concurrent queries pipelined) |
| **Interactive ACID TX** | Distributed Transaction | `prisma.$transaction(async (tx) => ...)` | 412.10 ms | 298.00 ms | **PASS** (Supavisor pooler executes TX safely) |

---

## 2. Connection Pool Analysis (Supavisor Transaction Mode)

### 2.1 Configuration
* **Port:** `6543`
* **Query Parameter:** `?pgbouncer=true&connection_limit=10`
* **Prisma Concurrency Behavior:** In transaction mode, server-side named prepared statements (`PREPARE stmt_name AS ...`) are disabled by Prisma's query engine when `pgbouncer=true` is set. This avoids `prepared statement "s0" does not exist` errors when consecutive queries in the same HTTP request are routed through different pooled server backends.
* **Connection Cap:** Capped at 10 active connections per worker instance, leaving 50 connections headroom on Supabase (out of 60 max connections).

---

## 3. Concurrency & High-Contention Verification

* **Update-Many Claim Locking:** Atomic conditional update (`updateMany({ where: { id, status: 'PENDING' } })`) verified responsive under 310 ms.
* **Transaction Isolation:** Read-committed isolation preserved identically to Render PostgreSQL.
* **Regression Verdict:** **ZERO SUSTAINED PERFORMANCE REGRESSION**.
