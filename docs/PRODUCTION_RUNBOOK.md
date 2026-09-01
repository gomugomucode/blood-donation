# HEMACARE — PRODUCTION OPERATIONS RUNBOOK

## 1. System Architecture Overview

HemaCare is a robust, server-authoritative Modular Monolith built on:
- **Backend:** Node.js (v20+), Express, Prisma ORM, PostgreSQL (v15+), Winston Structured Logger.
- **Frontend:** React 19, Vite, Tailwind CSS, TanStack React Query, Lucide Icons.
- **Worker Infrastructure:** In-process database-backed notification worker with exponential backoff and graceful shutdown.
- **Security:** HttpOnly JWT session cookies, CSRF Origin validation, Role-Based Access Control (`DONOR` / `ADMIN`), response-level rate limiters.

---

## 2. Deployment Procedures

### Standard Production Deployment
```bash
# 1. Pull latest verified release
git checkout main
git pull origin main

# 2. Install dependencies
npm ci

# 3. Apply database migrations
npm run prisma:deploy --workspace=server

# 4. Build backend and frontend
npm run build --workspaces

# 5. Restart application process via PM2 or systemd
pm2 reload hemacare-server
```

---

## 3. Database Operations & Migration Safety

### Applying Migrations
- Always run `npm run prisma:deploy --workspace=server` during deployment.
- Never run `prisma migrate reset` or `prisma migrate dev` on production.

### Rollback Strategy
1. If a migration failure occurs:
   - Identify the failed migration SQL.
   - Execute the corresponding rollback script from `prisma/migrations/down/`.
   - Restore database from pre-deployment snapshot if necessary.
2. Revert application code:
   ```bash
   git checkout <previous-stable-tag>
   npm run build --workspaces
   pm2 restart hemacare-server
   ```

---

## 4. Health & Observability Endpoints

| Endpoint | Method | Purpose | Healthy Response |
|---|---|---|---|
| `/health` | `GET` | Basic service ping | `200 OK` `{ "status": "healthy" }` |
| `/api/v1/health/live` | `GET` | Kubernetes Liveness probe | `200 OK` `{ "status": "UP" }` |
| `/api/v1/health/ready` | `GET` | Kubernetes Readiness probe (checks DB connectivity) | `200 OK` `{ "status": "READY" }` (returns `503` if DB down) |
| `/api/v1/admin/operations/system-status` | `GET` | Admin deep diagnostic telemetry | `200 OK` (Admin role required) |

---

## 5. Incident Response & Outage Playbooks

### Outage Scenario 1: Database Connection Loss
- **Symptoms:** `/api/v1/health/ready` returns `503 Service Unavailable`, logs report connection timeouts.
- **Action:**
  1. Check PostgreSQL instance status: `systemctl status postgresql` or cloud console.
  2. Verify connection pool limits in `DATABASE_URL` (recommended: `connection_limit=20&pool_timeout=10`).
  3. Restart PostgreSQL if unresponsive.
  4. Application will automatically reconnect upon DB restoration.

### Outage Scenario 2: External Email/SMS Provider Outage
- **Symptoms:** Notifications enter `FAILED` status with `errorCode: PROVIDER_DOWN` or `UNCONFIGURED_PROVIDER`.
- **Action:**
  1. Inspect `/api/v1/admin/operations/system-status` for notification failure rates.
  2. Check status page of Resend/SendGrid/Twilio.
  3. The notification worker will retry recoverable failed notifications up to 3 times with exponential backoff.
  4. If provider outage is prolonged, temporarily set `EMAIL_PROVIDER=mock` or `SMS_PROVIDER=mock` to prevent queue accumulation while in-app notifications continue normally.

---

## 6. Backup & Recovery Policy

- **Backup Schedule:** Daily automated PostgreSQL pg_dump snapshots stored in encrypted object storage.
- **Recovery Point Objective (RPO):** Maximum 1 hour (via WAL archiving) or 24 hours (via daily snapshot).
- **Recovery Time Objective (RTO):** Under 30 minutes for database restore and application restart.
- **Restore Command:**
  ```bash
  pg_restore -h <db-host> -U <db-user> -d blood_donation_db -c /path/to/backup.dump
  ```
