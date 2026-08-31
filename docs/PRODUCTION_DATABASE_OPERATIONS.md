# HEMACARE — PRODUCTION DATABASE OPERATIONS & BACKUP STRATEGY

This document outlines the database operational policies, backup schedules, recovery point objectives, and disaster recovery restore drill procedures for PostgreSQL on HemaCare.

---

## 1. Service Level Objectives

- **Recovery Point Objective (RPO)**: $\le 1 \text{ hour}$ (Continuous WAL archiving / hourly automated snapshots).
- **Recovery Time Objective (RTO)**: $\le 30 \text{ minutes}$ (Fast point-in-time restore from snapshot).

---

## 2. Backup Schedules & Retention Policy

| Tier | Schedule | Retention | Storage Location |
| :--- | :--- | :--- | :--- |
| **Continuous WAL** | Real-time write-ahead logging | 7 Days | Managed Cloud Storage (Encrypted AES-256) |
| **Daily Snapshot** | 02:00 UTC Daily | 30 Days | Geo-redundant Object Storage |
| **Monthly Archive** | 1st of each month | 1 Year | Cold / Glacier Archive |

---

## 3. Migration Protocol

### Development & Staging
```bash
npx prisma migrate dev --name <descriptive_name> --schema=server/prisma/schema.prisma
```

### Production Release (Zero Downtime)
```bash
# Executed in deployment pipeline before traffic switch
npx prisma migrate deploy --schema=server/prisma/schema.prisma
```
- **Rule**: Never run `prisma migrate reset` or `db push` against production databases.
- **Rule**: Schema migrations must be additive and backward-compatible with running application versions.

---

## 4. Disaster Recovery Restore Drill Procedure

To verify backup integrity without risking production data:

1. **Provision Sandbox Staging Instance**:
   ```bash
   createdb blood_donation_dr_drill
   ```
2. **Restore Snapshot to Sandbox**:
   ```bash
   pg_restore --verbose --clean --no-acl --no-owner -h localhost -U postgres -d blood_donation_dr_drill latest_backup.dump
   ```
3. **Run Schema Validation**:
   ```bash
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/blood_donation_dr_drill" npx prisma migrate status --schema=server/prisma/schema.prisma
   ```
4. **Run Application Smoke Test**:
   Verify count of registered donors, completed donations, and audit log integrity.
5. **Tear Down Sandbox Database**:
   ```bash
   dropdb blood_donation_dr_drill
   ```
