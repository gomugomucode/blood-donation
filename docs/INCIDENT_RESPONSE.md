# HEMACARE — PRODUCTION INCIDENT RESPONSE & DISASTER RECOVERY PLAYBOOK

This document defines technical response workflows and organizational escalation pathways for operational, security, data integrity, and availability incidents on the HemaCare Blood Donation Management Platform.

---

## 1. Incident Severity Matrix & Response SLAs

| Severity | Definition & Impact | Response SLA | Target Resolution | Escalation Lead |
| :--- | :--- | :--- | :--- | :--- |
| **SEV-1 (Critical)** | Primary database down, API outage, data breach, compromised root secrets | **< 15 mins** | **< 2 hours** | Lead SRE & Security Officer |
| **SEV-2 (High)** | External carrier outage, elevated worker retry failure, matching engine degradation | **< 30 mins** | **< 4 hours** | SRE & Backend Lead |
| **SEV-3 (Medium)** | Non-blocking UI bug, telemetry latency, isolated rate-limit false-positives | **< 2 hours** | **< 24 hours** | Engineering Team |
| **SEV-4 (Low)** | Minor cosmetic or documentation issues | **< 24 hours** | Next Release Cycle | Assigned Developer |

---

## 2. Technical Incident Playbooks

### Playbook 1: Database Outage / Connection Loss
- **Symptoms:** `/api/v1/health/ready` returns `503 Service Unavailable`, logs report connection timeouts.
- **Remediation Steps:**
  1. Inspect managed PostgreSQL instance metrics (active connections, memory, CPU, lock contention).
  2. If primary node failed, initiate automated failover to standby replica.
  3. Verify connection pool settings in `DATABASE_URL` (ensure `connection_limit=20&pool_timeout=10`).
  4. Once restored, verify `GET /api/v1/health/ready` returns `200 OK` (`status: "READY"`).

### Playbook 2: API Service Outage / Crash Loop
- **Symptoms:** `/api/v1/health/live` fails or returns 502/504 at ingress load balancer.
- **Remediation Steps:**
  1. Inspect runtime logs for unhandled exceptions, memory exhaustion (OOM), or port conflicts.
  2. If caused by a recent bad release, execute immediate rollback (`docs/PRODUCTION_ROLLBACK.md`).
  3. Scale container instances or restart application process via PM2 / systemd / container orchestrator.

### Playbook 3: External Notification Provider Downtime
- **Symptoms:** Elevated `FAILED` notification count with error codes `PROVIDER_DOWN` or `UNCONFIGURED_PROVIDER`.
- **Remediation Steps:**
  1. Check provider status pages (Resend, SendGrid, Twilio).
  2. Note: In-app notifications continue functioning normally; donor portal remains 100% operational.
  3. Worker automatically retries recoverable notifications with exponential backoff (1m, 5m, 15m).
  4. Once carrier service is restored, navigate to `/admin/operations` to trigger retry for failed deliveries.

### Playbook 4: Suspected User Account or Session Compromise
- **Symptoms:** Anomalous activity on donor or coordinator account.
- **Remediation Steps:**
  1. Immediately bump the target user's session version to invalidate all active JWTs:
     ```sql
     UPDATE "User" SET "sessionVersion" = "sessionVersion" + 1 WHERE id = '<compromised-user-id>';
     ```
  2. Inspect audit logs for unauthorized actions:
     ```sql
     SELECT * FROM "AuditLog" WHERE "actorUserId" = '<compromised-user-id>' ORDER BY "createdAt" DESC LIMIT 50;
     ```
  3. Issue a password reset request and contact the verified account owner.

### Playbook 5: Production Secret / Key Compromise
- **Symptoms:** Leaked `JWT_SECRET`, database credentials, or provider API keys.
- **Remediation Steps:**
  1. **JWT Secret Rotation:**
     - Generate a new 32+ byte cryptographic secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
     - Update `JWT_SECRET` in secret manager and redeploy API. This invalidates all existing user tokens cleanly.
  2. **Database Credential Rotation:**
     - Create a new PostgreSQL user password on managed database.
     - Update `DATABASE_URL` in environment secrets and trigger zero-downtime rolling restart.
  3. **Provider API Key Rotation:**
     - Revoke compromised keys on Resend / Twilio console; issue and deploy new keys.

### Playbook 6: Privacy / PHI Data Exposure Incident
- **Symptoms:** Accidental disclosure of patient reference, clinical diagnosis, or unmasked PII.
- **Remediation Steps:**
  1. Identify exact affected endpoint, log stream, or response payload.
  2. Deploy hotfix ensuring strict DTO serialization (verifying against `docs/PHASE_15_PRIVACY_AUDIT.md`).
  3. Rotate audit logs or log files containing sensitive exposures.
  4. Execute Organizational & Regulatory Escalation (Section 3 below).

### Playbook 7: Bad Deployment / Immediate Regression
- **Symptoms:** elevated 5xx errors or broken client flows post-release.
- **Remediation Steps:**
  1. Follow the step-by-step procedure in [`docs/PRODUCTION_ROLLBACK.md`](file:///c:/Users/Anupam%20Baral/Desktop/blood-donation/docs/PRODUCTION_ROLLBACK.md).
  2. Revert frontend static assets and backend API to previous release tag.

### Playbook 8: Data Corruption / Transaction Anomaly
- **Symptoms:** Mismatched `unitsFulfilled` or orphaned opportunity states.
- **Remediation Steps:**
  1. Inspect transaction logs and audit entries.
  2. If localized, perform transaction-safe reconciliation queries.
  3. If widespread, execute Point-In-Time Recovery (PITR) from the latest verified pre-corruption WAL snapshot.

---

## 3. Organizational & Regulatory Notification Obligations

In the event of a verified security breach or unauthorized Protected Health Information (PHI) exposure:
1. **Internal Notification (within 1 hour):** Notify Incident Commander, Lead Engineer, Data Protection Officer (DPO), and Legal Counsel.
2. **Impact Assessment (within 24 hours):** Determine exact list of affected records, exposure timeline, and root cause.
3. **Regulatory Notification (within 72 hours):** Comply with statutory reporting deadlines (e.g. GDPR Art. 33, HIPAA breach notification rule, or local health authority guidelines).
4. **Affected Individual Notification:** Notify affected donors or coordinators with transparent guidance on credential updates and remediation steps taken.
5. **Post-Mortem & Blameless RCA:** Publish root-cause analysis within 5 business days detailing timeline, systemic vulnerabilities, and preventive architectural controls.
