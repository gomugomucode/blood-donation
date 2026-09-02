# HEMACARE — PHASE 20C: EMERGENCY ROLLBACK PROTOCOL & OPERATIONAL RUNBOOK

**Document Version:** 1.0.0  
**Phase:** 20C — Production Application Cutover  
**Authority:** Principal SRE & Migration Engineer  
**Status:** ACTIVE — ZERO DOWNTIME ROLLBACK CAPABILITY PRESERVED  

---

## 1. Rollback Authority & Trigger Matrix

A rollback to the Render PostgreSQL source instance is triggered if ANY of the following conditions occur:

| Severity | Failure Condition | Mandatory Action | Recovery Target |
| :--- | :--- | :--- | :--- |
| **P0 (Critical)** | Clinical data corruption or missing pre-cutover records | **IMMEDIATE ROLLBACK** | Render PostgreSQL (Untouched 167 rows) |
| **P0 (Critical)** | Duplicate clinical blood request fulfillment | **IMMEDIATE ROLLBACK** | Render PostgreSQL |
| **P0 (Critical)** | Authentication failure affecting valid clinical users | **IMMEDIATE ROLLBACK** | Render PostgreSQL |
| **P0 (Critical)** | Authorization bypass / Cross-tenant access | **IMMEDIATE ROLLBACK** | Render PostgreSQL |
| **P0 (Critical)** | PHI leakage in outbound logs or payloads | **IMMEDIATE ROLLBACK** | Render PostgreSQL |
| **P1 (High)** | Sustained database connectivity drop (> 2 min) | **ROLLBACK EVALUATION** | Render PostgreSQL |
| **P1 (High)** | Sustained 5xx API rate > 2% over 5-minute window | **ROLLBACK EVALUATION** | Render PostgreSQL |
| **P1 (High)** | Background notification worker continuous crash | **ROLLBACK EVALUATION** | Render PostgreSQL |

---

## 2. Five-Minute Emergency Rollback Runbook

### Step 1: Access Render Service Dashboard
1. Navigate to the Render Dashboard: `https://dashboard.render.com/`
2. Select the backend web service: **`hemacare-api`** (or `blood-donation-6vcp`).

### Step 2: Revert Database Connection String
1. Click **Environment** in the left sidebar.
2. Locate the **`DATABASE_URL`** environment variable.
3. Update the value back to the Render PostgreSQL instance:
   * Internal URL (if within Render network): `postgresql://blood_donation_db_l85y_user:[PASSWORD]@dpg-daascrbtqb8s73e389b0-a/blood_donation_db_l85y`
   * External URL (fallback): `postgresql://blood_donation_db_l85y_user:[PASSWORD]@dpg-daascrbtqb8s73e389b0-a.oregon-postgres.render.com/blood_donation_db_l85y?sslmode=require`
4. Click **Save Changes**.

### Step 3: Verify Zero-Downtime Rolling Redeploy
1. Render automatically triggers a zero-downtime rolling redeploy.
2. In the deployment logs, verify:
   ```text
   Connected to database
   Notification background worker started
   Server listening on port 5000
   ```

### Step 4: Validate Database Identity Recovery
Execute live diagnostic verification:
```bash
curl -s "https://blood-donation-6vcp.onrender.com/health/ready"
```
**Expected Response:**
```json
{
  "status": "ready",
  "database": "connected",
  "databaseName": "blood_donation_db_l85y",
  "engineVersion": "18.6"
}
```

### Step 5: Post-Rollback Data Preservation
* **Do NOT drop or destroy the Supabase database.**
* Keep the Supabase database online in read-only mode to capture forensic query logs and diagnose the root cause of the rollback.
