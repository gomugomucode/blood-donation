# HEMACARE — INCIDENT RESPONSE PLAYBOOK

This playbook establishes operational response workflows for critical security and availability incidents on the HemaCare Platform.

---

## 1. Incident Severity Matrix

| Severity | Description | Target Response | Target Resolution |
| :--- | :--- | :--- | :--- |
| **SEV-1 (Critical)** | Core database outage, data breach, or broken authentication | $< 15 \text{ mins}$ | $< 2 \text{ hours}$ |
| **SEV-2 (High)** | Notification provider failure or hospital outreach degradation | $< 30 \text{ mins}$ | $< 6 \text{ hours}$ |
| **SEV-3 (Medium)** | Non-blocking UI bug or metric collection degradation | $< 2 \text{ hours}$ | $< 24 \text{ hours}$ |

---

## 2. Playbook: Suspected Account / Token Compromise

1. **Immediate Revocation**:
   Execute session invalidation for the compromised user account:
   ```sql
   UPDATE "User" SET "sessionVersion" = "sessionVersion" + 1 WHERE id = 'compromised-user-id';
   ```
2. **Audit Trail Inspection**:
   Inspect recent actions performed with the user ID on `/admin/audit-logs` or query `AuditLog` table.
3. **Password Reset Dispatch**:
   Trigger secure password reset token generation.

---

## 3. Playbook: Database Connectivity Outage

1. **Check Readiness Endpoint**:
   Inspect `GET /health/ready` response for latency or failure code.
2. **Inspect Connection Pool**:
   Check PostgreSQL cloud metrics (active connections, CPU, memory, IOPS).
3. **Failover Execution**:
   If primary database instance is unresponsive, initiate managed replica promotion.
4. **Update Connection String**:
   Update `DATABASE_URL` in backend environment and trigger restart.
5. **Post-Recovery Verification**:
   Verify `GET /health/ready` returns `200 OK` and run sanity checks on `/admin/operations`.

---

## 4. Playbook: External Notification Provider Downtime

1. **Detection**:
   `/admin/operations` shows elevated `FAILED` notification count and provider error codes.
2. **Containment**:
   - In-app notification delivery continues operating uninterrupted.
   - External messages are stored with `status = 'FAILED'`.
3. **Remediation**:
   - Once the vendor resolves the incident, coordinator uses `/admin/operations` to trigger bulk notification retry.
