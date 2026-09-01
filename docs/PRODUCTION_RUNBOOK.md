# HEMACARE — PRODUCTION OPERATIONS & RUNBOOK GUIDE

## 1. System Architecture & Sizing Assumptions

HemaCare is a high-reliability, server-authoritative Modular Monolith:
- **Backend:** Node.js (v20+), Express 4, Prisma ORM 6, PostgreSQL 15+, Winston Structured Logger.
- **Frontend:** React 19, Vite, Tailwind CSS, TanStack React Query, Lucide Icons.
- **Worker Subsystem:** In-process database-backed notification worker with exponential backoff and graceful shutdown.
- **Security:** HttpOnly JWT session cookies, CSRF/Origin validation, Role-Based Access Control (`DONOR` / `ADMIN`), rate limiting, parameter bounding.
- **Connection Pool Sizing:**
  - Standard container instance: `connection_limit=20&pool_timeout=10`
  - Max concurrent PostgreSQL connections allocated: 50 (shared across API and background worker).

---

## 2. Standard Production Deployment Procedure

```bash
# 1. Pull verified release branch / tag
git checkout main
git pull origin main

# 2. Clean install dependencies
npm ci

# 3. Apply database migrations (never run migrate dev or db push in prod)
npx prisma migrate deploy --schema=server/prisma/schema.prisma

# 4. Build production bundles
npm run build --workspaces

# 5. Zero-downtime rolling restart (PM2 or container orchestrator)
pm2 reload hemacare-server --update-env
```

---

## 3. Post-Deployment Verification & Smoke Testing

Execute immediately after every production deployment:
1. **Health Verification:**
   ```bash
   curl -s -o /dev/null -w "%{http_code}" https://api.blooddonation.org/health/live # Expect 200
   curl -s -o /dev/null -w "%{http_code}" https://api.blooddonation.org/health/ready # Expect 200
   ```
2. **Coordinator Smoke Test:**
   - Log in with verified admin credentials at `/admin/login`.
   - Verify dashboard metrics load (`GET /api/v1/admin/dashboard`).
3. **Donor Portal Smoke Test:**
   - Log in with synthetic donor test account at `/login`.
   - Verify unread notification count badge loads cleanly.
4. **Audit Log Confirmation:**
   - Verify `ADMIN_LOGIN` event is recorded in `/admin/audit-logs`.

---

## 4. Health, Observability & Diagnostic Endpoints

| Endpoint | Method | Role Required | Intended Consumer | Healthy Response |
|---|---|---|---|---|
| `/health` | `GET` | Public | CDN / Ingress | `200 OK` `{ "status": "healthy" }` |
| `/api/v1/health/live` | `GET` | Public | Container orchestrator (Liveness) | `200 OK` `{ "status": "UP" }` |
| `/api/v1/health/ready` | `GET` | Public | Load balancer (Readiness) | `200 OK` `{ "status": "READY" }` (503 if DB down) |
| `/api/v1/admin/operations/system-status` | `GET` | `ADMIN` | Coordinator Telemetry Dashboard | `200 OK` `{ "success": true, "data": { ... } }` |

---

## 5. Live Monitoring & Alert Thresholds

| Metric | Warning Threshold | Critical Threshold | Action Required |
|---|---|---|---|
| **API Error Rate (5xx)** | > 0.5% over 5m | > 2.0% over 2m | Inspect runtime logs for exceptions; consider rollback |
| **API p95 Latency** | > 250 ms | > 750 ms | Inspect PostgreSQL slow query logs and active connection count |
| **Notification Failure Rate** | > 5% over 15m | > 15% over 15m | Check external carrier status (Resend/SendGrid/Twilio) |
| **PostgreSQL Disk Usage** | > 75% | > 85% | Expand disk volume or purge old telemetry logs |
| **Active DB Connections** | > 70% max pool | > 90% max pool | Check connection leaks; increase pool allocation |

---

## 6. Backup, PITR & Disaster Recovery Procedures

### Automated Backup Architecture
- **Daily Full Snapshot:** Automated `pg_dump` snapshot generated every 24 hours and stored in encrypted S3/GCS bucket with 30-day retention.
- **Continuous WAL Archiving:** Write-Ahead Logging (WAL) enabled on managed database allowing Point-In-Time Recovery (PITR) with RPO < 15 minutes.

### Staging Recovery Drill Procedure
```bash
# 1. Download snapshot from backup vault
aws s3 cp s3://hemacare-backups/prod-latest.dump ./staging-restore.dump

# 2. Restore into isolated staging database
pg_restore -h staging-db-host -U staging_user -d blood_donation_staging -c ./staging-restore.dump

# 3. Run migration verification
npx prisma migrate deploy --schema=server/prisma/schema.prisma

# 4. Start staging application and verify health
curl -s http://staging-api:5000/api/v1/health/ready
```

---

## 7. Operational Incident Playbooks

For detailed playbooks covering Database Outages, API Crash Loops, Notification Vendor Outages, Compromised Credentials, Secret Rotations, and Privacy Exposures, refer directly to [`docs/INCIDENT_RESPONSE.md`](file:///c:/Users/Anupam%20Baral/Desktop/blood-donation/docs/INCIDENT_RESPONSE.md).

For step-by-step application and database migration rollback strategies, refer directly to [`docs/PRODUCTION_ROLLBACK.md`](file:///c:/Users/Anupam%20Baral/Desktop/blood-donation/docs/PRODUCTION_ROLLBACK.md).
