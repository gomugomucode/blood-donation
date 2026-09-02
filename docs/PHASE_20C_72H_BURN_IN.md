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
