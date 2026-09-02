# HEMACARE — PHASE 20C: LIVE SMOKE TEST & WRITE-PATH AUDIT RUNBOOK

**Document Version:** 1.0.0  
**Phase:** 20C — Production Application Cutover  
**Scope:** Real Production API Smoke Testing across Vercel / Render / Supabase  

---

## 1. Authentication Smoke Test Matrix

| Test ID | User Role | Action | Endpoint | Expected Status | Security Assertion |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **AUTH-01** | Admin | Login with valid credentials | `POST /api/v1/auth/login` | `200 OK` | HttpOnly cookie issued; `role: ADMIN` |
| **AUTH-02** | Donor | Login with valid credentials | `POST /api/v1/auth/login` | `200 OK` | HttpOnly cookie issued; `role: DONOR` |
| **AUTH-03** | Anonymous | Login with bad password | `POST /api/v1/auth/login` | `401 Unauthorized` | "Invalid email or password"; generic message |
| **AUTH-04** | Donor | Session validation | `GET /api/v1/auth/me` | `200 OK` | Returns sanitized user + profile |
| **AUTH-05** | Donor | Logout | `POST /api/v1/auth/logout` | `200 OK` | Session cookie cleared |

---

## 2. Authorization & RBAC Boundary Enforcement

| Test ID | Acting Role | Target Endpoint | Method | Expected Status | Security Invariant |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RBAC-01** | DONOR | `/api/v1/admin/donors` | `GET` | `403 Forbidden` | Donors cannot view full registry |
| **RBAC-02** | DONOR | `/api/v1/admin/blood-requests` | `POST` | `403 Forbidden` | Donors cannot create hospital requests |
| **RBAC-03** | DONOR | `/api/v1/admin/audit-logs` | `GET` | `403 Forbidden` | Donors cannot inspect audit logs |
| **RBAC-04** | DONOR | `/api/v1/donors/:otherId` | `GET` | `403 Forbidden` | IDOR prevention (no cross-donor viewing) |

---

## 3. Mandatory Write-Path Lifecycle Verification (Blood Request)

To prove complete read-write functionality against Supabase without corrupting clinical invariants:

### Step 1: Create Controlled Test Blood Request
* **Endpoint:** `POST /api/v1/admin/blood-requests`
* **Payload:**
  ```json
  {
    "patientReference": "MIGRATION-SMOKE-20C",
    "bloodGroup": "O_POSITIVE",
    "unitsRequired": 1,
    "urgency": "NORMAL",
    "hospitalName": "HemaCare Migration Verification Lab",
    "hospitalAddress": "Smoke Test Lane",
    "contactNumber": "+1-555-0199",
    "requiredBy": "2026-09-10T00:00:00.000Z",
    "clinicalNotes": "Controlled write test record for Phase 20C cutover"
  }
  ```
* **Expected Result:** `201 Created`, record persisted with status `OPEN`.

### Step 2: Query Created Record in Supabase
* **Verification:** `prisma.bloodRequest.findUnique({ where: { patientReference: "MIGRATION-SMOKE-20C" } })`
* **Assertion:** Record exists in Supabase.

### Step 3: Update Request Details
* **Endpoint:** `PATCH /api/v1/admin/blood-requests/:id`
* **Payload:** `{"urgency": "HIGH"}`
* **Expected Result:** `200 OK`, `urgency` updated to `HIGH`.

### Step 4: Cancel Controlled Request
* **Endpoint:** `PATCH /api/v1/admin/blood-requests/:id/cancel`
* **Payload:** `{"reason": "Migration verification complete"}`
* **Expected Result:** `200 OK`, status transitioned to `CANCELLED`.

### Step 5: Verify Audit Log Integrity
* **Verification:** `SELECT * FROM "AuditLog" WHERE "targetType" = 'BloodRequest' AND "metadata"->>'patientReference' = 'MIGRATION-SMOKE-20C';`
* **Assertion:** Audit trail records `CREATE`, `UPDATE`, and `CANCEL` actions with timestamp and actor ID.
