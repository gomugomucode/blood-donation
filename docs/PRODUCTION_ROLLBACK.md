# HEMACARE — PRODUCTION ROLLBACK & RECOVERY STRATEGY

This document establishes authoritative procedures for rolling back the HemaCare application, database schema migrations, notification workers, and frontend bundles in the event of an operational regression or deployment failure.

---

## 1. Quick Decision Matrix

| Failure Mode | Recommended Rollback Action | Estimated Recovery Time |
|---|---|---|
| **Frontend UI Regression** | Revert frontend static assets to previous build/commit | **< 2 minutes** |
| **API Runtime Crash / 5xx Spike** | Revert backend container image or PM2 process to previous tag | **< 3 minutes** |
| **Database Migration Failure** | Execute down-migration or restore pre-deployment database snapshot | **5 – 15 minutes** |
| **Notification Worker Stall** | Restart worker process with previous release version | **< 2 minutes** |
| **External Provider Failure** | Switch provider configuration fallback (`EMAIL_PROVIDER=mock` or alternative) | **< 2 minutes** |

---

## 2. Database Migration Classification & Handling

Not all database migrations are automatically reversible. HemaCare classifies migrations into three operational categories:

### Category A: Backward-Compatible Migrations (Zero Downtime)
- **Examples:** Adding a new nullable column, adding a non-blocking index, creating a new standalone table (`Notification`, `DonorOpportunity`).
- **Rollback Behavior:** Safe to roll back application code immediately without rolling back the database schema. Old code ignores new columns/tables.

### Category B: Reversible Migrations (With Down-Script)
- **Examples:** Modifying check constraints, adding non-null columns with defaults, dropping unused views.
- **Rollback Behavior:** Run the corresponding `down.sql` script to return schema to exact prior state:
  ```bash
  psql $DATABASE_URL -f server/prisma/migrations/down/<migration_name>_down.sql
  ```

### Category C: Destructive / Forward-Fix Required Migrations
- **Examples:** Column renames, dropping active columns, data type conversions with truncation.
- **Rollback Behavior:** **DO NOT** execute ad-hoc down migrations on active production data. Either:
  1. Deploy a forward-fix hotfix patch if the issue is minor.
  2. Perform Point-In-Time Recovery (PITR) from the automated snapshot created immediately prior to deployment.

---

## 3. Step-by-Step Application Rollback Procedure

### Step 1: Revert Backend API & Workers
1. Identify the previous stable release tag:
   ```bash
   git log --oneline -n 5
   ```
2. Check out the previous stable tag and rebuild/restart:
   ```bash
   git checkout <previous-stable-tag>
   npm run build --workspace=server
   pm2 restart hemacare-server # or container orchestrator rollback
   ```
3. Verify backend health:
   ```bash
   curl -i http://localhost:5000/api/v1/health/live
   curl -i http://localhost:5000/api/v1/health/ready
   ```

### Step 2: Revert Frontend Static Assets
1. On Vercel / Netlify / CDN hosting, promote the previous instantaneous deployment instant-rollback button or redeploy:
   ```bash
   git checkout <previous-stable-tag>
   npm run build --workspace=client
   # Upload dist/ assets to hosting bucket / CDN
   ```
2. Verify SPA routing:
   - Navigate directly to `https://<domain>/dashboard` and `https://<domain>/opportunities` in browser to confirm SPA rewrite rules are functional.

### Step 3: Notification Worker Verification
1. Ensure the background notification worker restarts cleanly under the reverted backend binary:
   - Check worker startup log: `[INFO] 🚀 Notification background worker started.`
   - Verify unread counts on `/api/v1/donors/notifications/unread-count`.

---

## 4. Post-Rollback Verification & Sanity Checklist

Immediately after rollback execution, verify:
- [ ] `GET /health/live` returns `200 OK`
- [ ] `GET /health/ready` returns `200 OK` (active database connectivity)
- [ ] Coordinator login succeeds (`POST /api/v1/auth/login`)
- [ ] Donor login succeeds and session is valid (`GET /api/v1/auth/me`)
- [ ] Blood request list loads without database query errors (`GET /api/v1/admin/blood-requests`)
- [ ] Audit log records the rollback event for compliance tracking
