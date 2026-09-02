# HEMACARE — PHASE 20C: PRE-CUTOVER FORENSIC SNAPSHOT

**Timestamp:** 2026-09-02T10:13:29.424Z
**Source Database:** Render PostgreSQL 18.6 (`blood_donation_db_l85y`)
**Target Database:** Supabase PostgreSQL 17.6 (`postgres` on AWS ap-southeast-1)
**Cutover Gate Assessment:** ✅ PASS — SAFE FOR CUTOVER

## 1. Engine & Instance Telemetry

* **Source Engine:** `PostgreSQL 18.6 (Debian 18.6-1.pgdg12+2) on x86_64-pc-linux-gnu, compiled by gcc (Debian 12.2.0-14+deb12u1) 12.2.0, 64-bit`
* **Target Engine:** `PostgreSQL 17.6 on aarch64-unknown-linux-gnu, compiled by gcc (GCC) 15.2.0, 64-bit`

## 2. Table-by-Table Forensic Row & Checksum Parity

| Table Name | Source Rows | Target Rows | Source SHA-256 Checksum | Target SHA-256 Checksum | Parity Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **User** | 21 | 21 | `066f7c04287a7779...` | `066f7c04287a7779...` | ✅ MATCH |
| **DonorProfile** | 19 | 19 | `1625b21cfa97fd79...` | `1625b21cfa97fd79...` | ✅ MATCH |
| **BloodRequest** | 22 | 22 | `8067f830745efa37...` | `8067f830745efa37...` | ✅ MATCH |
| **Donation** | 6 | 6 | `0558e45f52fe39e1...` | `0558e45f52fe39e1...` | ✅ MATCH |
| **DonorOpportunity** | 2 | 2 | `01e21f3d236cb31e...` | `01e21f3d236cb31e...` | ✅ MATCH |
| **Notification** | 2 | 2 | `9437507e611753a9...` | `9437507e611753a9...` | ✅ MATCH |
| **PasswordResetToken** | 0 | 0 | `e3b0c44298fc1c14...` | `e3b0c44298fc1c14...` | ✅ MATCH |
| **AuditLog** | 89 | 89 | `9894ad5e1d132989...` | `9894ad5e1d132989...` | ✅ MATCH |
| **_prisma_migrations** | 6 | 6 | `74c2a043433b7d7e...` | `74c2a043433b7d7e...` | ✅ MATCH |
| **TOTAL** | **167** | **167** | **ALL 9 TABLES HASHED** | **ALL 9 TABLES HASHED** | **✅ 100% IDENTICAL** |

## 3. Structural Object Inventory

| Structural Entity | Render Source | Supabase Target | Match Status |
| :--- | :--- | :--- | :--- |
| **Public Application Tables** | 9 | 9 | ✅ MATCH |
| **Custom Enum Values** | 41 (across 10 types) | 41 (across 10 types) | ✅ MATCH |
| **Foreign Key Constraints** | 9 | 9 | ✅ MATCH |
| **Database Indexes** | 39 | 39 | ✅ MATCH |
| **Application Sequences** | 0 | 0 | ✅ MATCH (0 sequences) |
| **Prisma Migrations Ledger** | 6 | 6 | ✅ MATCH |

## 4. Pre-Cutover Invariant Conclusion

Both databases are synchronized with zero drift. Render remains untouched at 167 rows. Supabase is forensically identical. The pre-cutover gate has officially PASSED.
