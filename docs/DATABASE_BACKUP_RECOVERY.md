# HemaCare Database Backup & Disaster Recovery Runbook

This document defines the automated backup strategy, retention policies, Point-In-Time Recovery (PITR) workflows, and disaster recovery drill procedures for the PostgreSQL database underpinning HemaCare.

---

## 1. SLA & Recovery Targets

| Metric | Target | Rationale |
| :--- | :--- | :--- |
| **Recovery Point Objective (RPO)** | **< 5 Minutes** | Continuous Write-Ahead Log (WAL) archiving to durable object storage (e.g., S3/GCS with cross-region replication). |
| **Recovery Time Objective (RTO)** | **< 30 Minutes** | Automated snapshot restoration and orchestrated container startup. |

---

## 2. Backup Strategy Architecture

1. **Continuous WAL Archiving:**
   - Database WAL segments are streamed continuously to redundant cloud object storage.
   - Enables restoration to any arbitrary second within the retention window.
2. **Automated Daily Base Backups:**
   - Full physical/logical snapshot performed daily at 02:00 UTC (off-peak).
   - Encrypted with AES-256 (KMS / Customer-Managed Keys).
3. **Retention Schedule:**
   - Hourly WAL segments: Retained for **14 days**.
   - Daily snapshots: Retained for **30 days**.
   - Weekly snapshots: Retained for **12 weeks**.
   - Monthly snapshots: Retained for **7 years** (medical regulatory compliance).

---

## 3. Logical Backup Automation (pg_dump)

For non-managed self-hosted instances, configure the following cron-driven backup script:

```bash
#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="/var/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="${BACKUP_DIR}/hemacare_backup_${DATE}.sql.gz"

mkdir -p "${BACKUP_DIR}"

echo "Starting encrypted logical backup for HemaCare DB..."
PGPASSWORD="${DB_PASSWORD}" pg_dump \
  -h "${DB_HOST}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  -F c \
  -b \
  -v | gzip > "${FILENAME}"

# Sync to secure offsite object storage
aws s3 cp "${FILENAME}" "s3://hemacare-db-backups-secure/daily/${FILENAME##*/}" --sse aws:kms

# Retain local files for 7 days
find "${BACKUP_DIR}" -type f -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed and archived successfully."
```

---

## 4. Point-In-Time Recovery (PITR) Execution Procedure

When recovering from accidental corruption or clinical data anomalies:

1. **Identify Target Timestamp:**
   Obtain the precise UTC timestamp immediately prior to the incident (e.g. `2026-08-31 17:35:00 UTC`) from `AuditLog` records.
2. **Provision Target Database Instance:**
   Restore base snapshot from the day of the incident into an isolated recovery instance.
3. **Replay WAL to Target Time:**
   ```sql
   -- recovery.signal or postgresql.conf:
   restore_command = 'aws s3 cp s3://hemacare-db-backups-secure/wal/%f %p'
   recovery_target_time = '2026-08-31 17:35:00 UTC'
   recovery_target_action = 'promote'
   ```
4. **Data Verification & Health Probe:**
   Run integrity checks on `DonorProfile`, `BloodRequest`, and `Donation` records.
5. **DNS / Connection String Cutover:**
   Switch `DATABASE_URL` to point to the validated recovered instance and restart API pods.

---

## 5. Semi-Annual Disaster Recovery Drill

A disaster recovery drill must be executed every 6 months to validate:
- RTO verification (< 30 minutes).
- Backup checksum and encryption validation.
- Schema compatibility against current application versions.
