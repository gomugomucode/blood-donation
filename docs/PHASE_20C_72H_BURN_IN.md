# HEMACARE — PHASE 20C: 72-HOUR POST-CUTOVER BURN-IN PROTOCOL

**Document Version:** 1.0.0  
**Phase:** 20C — Production Application Cutover  
**Target Duration:** 72 Hours Post-Cutover  
**Authority:** Production SRE & Platform Reliability  

---

## 1. Burn-In Monitoring Checkpoints

To ensure complete operational confidence, telemetry will be reviewed at the following strict intervals:

| Checkpoint | Elapsed Time | Primary Audit Focus | Verification Command / Target |
| :--- | :--- | :--- | :--- |
| **T+0** | Immediate | Health probes, live identity proof (`postgres`), process boot | `GET /health/ready` |
| **T+15m** | 15 Minutes | Connection pool stability, worker initial loop | Render runtime logs |
| **T+30m** | 30 Minutes | Admin & donor authentication, zero 5xx errors | `POST /api/v1/auth/login` |
| **T+1h** | 1 Hour | Clinical write paths (Blood Request lifecycle, Donation matching) | Supabase query log |
| **T+2h** | 2 Hours | Notification worker idempotency & carrier simulation | Audit log inspection |
| **T+6h** | 6 Hours | Active connection baseline under moderate traffic | Supabase Connection Dashboard |
| **T+12h** | 12 Hours | Half-day stability review, memory leak inspection | Render RSS memory graph |
| **T+24h** | 24 Hours | 24-Hour parity & orphan integrity audit | Forensic parity script |
| **T+48h** | 48 Hours | Weekend / extended load cycle verification | Audit log integrity |
| **T+72h** | 72 Hours | Final decommissioning review of Render PostgreSQL | Formal sign-off meeting |

---

## 2. Checkpoint Telemetry Metric Log

At every milestone, the SRE team records:

1. **HTTP Status Rates:**
   - 2xx Success Rate: Target `> 99.8%`
   - 4xx Client Error Rate: Target `< 0.2%`
   - 5xx Server Error Rate: Target `0.0%`
2. **Database Metrics:**
   - Active Connections: Target `<= 15` (within 60 max cap)
   - Transaction Rollback Rate: Target `0`
   - Deadlocks / Lock Timeouts: Target `0`
3. **Notification Background Worker:**
   - Processing Loop State: `ACTIVE`
   - Unclaimed Stale Notifications: `0`
   - Duplicate Dispatches: `0`

---

## 3. Render Database Retention Policy

* **Mandatory Preservation Window:** 72 hours minimum.
* **Auto-Decommissioning Forbidden:** The Render PostgreSQL database `blood_donation_db_l85y` must NOT be deleted or shut down automatically at T+72h.
* **Formal Decommissioning Gate:** Render PostgreSQL may only be terminated after:
  1. 72 hours of uninterrupted green operations on Supabase.
  2. A fresh native backup of Supabase is verified and stored in offsite cold storage.
  3. Sign-off is obtained from the Clinical and Engineering leads.

---

## 4. Live Burn-In Checkpoint Execution Log

| Checkpoint | Timestamp (UTC) | Health | Status Summary | SRE Sign-off |
| :--- | :--- | :--- | :--- | :--- |
| **T+0** | 2026-09-02 12:55:20 | ✅ 200 OK | Database identity proven (`postgres`, `17.6`). 5/5 probes succeeded. Live write routing verified. 0 errors. | **VERIFIED — GREEN** |
| **T+15m** | 2026-09-02 13:10:20 | ✅ 200 OK | Adversarial probe caught test isolation leak. Test guard added to `tests/setup.ts`, baseline resynced to 167 rows, Admin & Donor logins verified 200 OK. | **VERIFIED — GREEN** |
| **T+30m** | 2026-09-02 13:25:20 | ⏳ PENDING | Scheduled auth and error rate verification. | Scheduled |
| **T+1h** | 2026-09-02 13:55:20 | ⏳ PENDING | Scheduled clinical write path audit. | Scheduled |
| **T+2h** | 2026-09-02 14:55:20 | ⏳ PENDING | Scheduled notification worker audit. | Scheduled |
| **T+6h** | 2026-09-02 18:55:20 | ⏳ PENDING | Scheduled connection baseline audit. | Scheduled |
| **T+12h** | 2026-09-03 00:55:20 | ⏳ PENDING | Scheduled half-day stability review. | Scheduled |
| **T+24h** | 2026-09-03 12:55:20 | ⏳ PENDING | Scheduled 24-hour forensic parity audit. | Scheduled |
| **T+48h** | 2026-09-04 12:55:20 | ⏳ PENDING | Scheduled 48-hour extended load cycle review. | Scheduled |
| **T+72h** | 2026-09-05 12:55:20 | ⏳ PENDING | Final decommissioning review of legacy Render PostgreSQL. | Scheduled |

---

## 5. Checkpoint Telemetry Audit Logs

### Checkpoint T+0 (Immediate Post-Cutover)
* **Timestamp:** 2026-09-02T12:55:20.073Z
* **Application health:** `healthy` / `alive` / `ready` (HTTP 200)
* **Database health:** Connected (`databaseName = postgres`, `engineVersion = 17.6`)
* **Connection pool:** Stable, Supavisor transaction pooler port 6543
* **5xx:** 0
* **Database errors:** 0
* **Latency:** ~280ms backend probe
* **Worker:** Active (`SANDBOX / SIMULATED`)
* **Clinical invariants:** `0 <= unitsFulfilled <= unitsRequired` verified (0 violations)
* **Security:** Admin login verified, unauthenticated requests rejected (401)
* **Notification pipeline:** Database records intact (2 notifications), carrier in mock mode
* **Incidents:** 0
* **Assessment:** **GREEN**

### Checkpoint T+15m (15 Minutes Post-Cutover)
* **Timestamp:** 2026-09-02T13:10:20Z
* **Application health:** `healthy` / `alive` / `ready` (HTTP 200)
* **Database health:** Connected (`databaseName = postgres`, `engineVersion = 17.6`)
* **Connection pool:** Stable, zero pool exhaustion, zero connection dropouts
* **5xx:** 0
* **Database errors:** 0
* **Latency:** ~295ms indexed queries, ~485ms aggregation queries
* **Worker:** Active (`SANDBOX / SIMULATED`)
* **Clinical invariants:** Verified; 22 requests, 19 donors, 6 donations intact
* **Security:** Admin login (`admin@blooddonation.org`) verified 200 OK; Donor login verified 200 OK; Donor access to admin dashboard barred 403 Forbidden; Anonymous access barred 401 Unauthorized
* **Notification pipeline:** Idempotent, carrier in sandbox mode
* **Incidents:** Incident 20C.2 resolved (local test suite runner environment isolation added; baseline re-synced to exact 167 rows; Render rollback source verified 167 rows untouched)
* **Assessment:** **GREEN**


