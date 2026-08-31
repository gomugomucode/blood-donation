# Security Policy & Architecture Guide

## 1. Security Architecture & Threat Model

The HemaCare Blood Donation Management Platform enforces security in depth across all application tiers.

```
       ┌─────────────────────────────────────────────────────────┐
       │                   Web Client (React 19)                 │
       │  - Zero HTML injection (dangerouslySetInnerHTML absent) │
       │  - Client-side Zod input validation                     │
       │  - HttpOnly SameSite JWT Cookie session credentials     │
       └───────────────────────────┬─────────────────────────────┘
                                   │ HTTPS / CORS Restricted
                                   ▼
       ┌─────────────────────────────────────────────────────────┐
       │               Express API Gateway & Security            │
       │  - Helmet Security Headers                              │
       │  - Multi-Tier Rate Limiting (Auth & API Tiers)          │
       │  - JSON Web Token (HS256 with standard subject claims)  │
       │  - Role-Based Access Control (DONOR / ADMIN)            │
       │  - Mass-Assignment Protection via Explicit DTO Mapping  │
       │  - Input Sanitation & Parameter Validation              │
       │  - Global Error Masking (No stack traces or SQL leaks)  │
       └───────────────────────────┬─────────────────────────────┘
                                   │ Parameterized Prisma Queries
                                   ▼
       ┌─────────────────────────────────────────────────────────┐
       │                  PostgreSQL Database                    │
       │  - Relational Schema with Foreign Key Constraints       │
       │  - Performance Indexes                                  │
       │  - Non-destructive Soft Deletions (deletedAt)           │
       │  - Atomic Transactions for Clinical Procedure Logging   │
       │  - AuditLog Table for Administrative & Security Events  │
       └─────────────────────────────────────────────────────────┘
```

---

## 2. Authentication & Session Security

- **Password Storage:** Passwords hashed with `bcryptjs` using a salt work factor of 12 rounds. Plaintext passwords and hashes are never exposed in responses or written to system logs.
- **Session Tokens:** JSON Web Tokens signed explicitly with `algorithm: 'HS256'`. Payloads contain minimal standard claims (`sub: userId, role: role`) and avoid storing sensitive personal medical information.
- **Cookie Security:**
  - `httpOnly: true` (prevents JavaScript/XSS extraction)
  - `sameSite: 'lax'` (defends against Cross-Site Request Forgery)
  - `secure: true` in production (enforces HTTPS transport)
  - `path: '/'` with bounded expiration (7 days)

---

## 3. Authorization & RBAC Matrix

| Endpoint Group | Allowed Roles | Authorization Mechanism |
|---|---|---|
| `/api/v1/auth/register`, `/login` | Public | Open, Rate Limited |
| `/api/v1/auth/me`, `/logout` | Authenticated | JWT Verification against Database User Record |
| `/api/v1/donors/me/*` | `DONOR`, `ADMIN` | Resolved via authenticated `req.user.id` (Prevents IDOR) |
| `/api/v1/admin/*` | `ADMIN` Only | `requireRole(Role.ADMIN)` Server Middleware |
| `/api/v1/admin/audit-logs` | `ADMIN` Only | `requireRole(Role.ADMIN)` Server Middleware |

### Defenses against Common Vulnerabilities:
1. **Privilege Escalation:** Public registration ignores client-supplied `role` arguments and strictly forces `role: DONOR` on the server.
2. **Insecure Direct Object References (IDOR):** Donor endpoints do not accept a `donorId` in route parameters; operations are scoped strictly to `req.user.id`.
3. **Mass Assignment:** All controller updates explicitly extract and map validated DTO fields to Prisma models, rejecting unpermitted database columns.

---

## 4. Sensitive Data Inventory & Privacy Handling

| Data Field | Purpose | Access Scope | Retention & Logging Rules |
|---|---|---|---|
| `email` | Identity & Authentication | Donor (Self), Admin | Indexed, never logged in plaintext audit payloads |
| `passwordHash` | Credential Verification | System Auth only | Excluded from all query return models |
| `dateOfBirth` | Dynamic Age & Eligibility | Donor (Self), Admin | Immutable in donor portal; validated (no future dates) |
| `bloodGroup` | Clinical Matching & Drives | Donor (Self), Admin | Indexed enum (`A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`) |
| `contactNumber`, `address` | Donor Outreach | Donor (Self), Admin | Editable by donor; validated character bounds |
| `donations.notes` | Clinical Session Notes | Admin Only | Bounded (`max: 500`), never logged in application logs |

---

## 5. Audit Logging & Compliance

All administrative and security actions are recorded in the `AuditLog` table:
- `ADMIN_LOGIN` — Staff login event
- `DONOR_REGISTER` — Voluntary registration
- `DONOR_MODIFIED` — Profile updates by administrators
- `DONOR_DEACTIVATED` — Archival of donor accounts
- `DONATION_RECORDED` — Verified donation collection entry

Audit logs do not store credentials, JWT tokens, or full clinical text.

---

## 6. Reporting a Vulnerability

If you discover a security vulnerability within HemaCare, please follow responsible disclosure guidelines:
1. Do not open public GitHub issues for security vulnerabilities.
2. Email security findings to `security@blooddonation.org`.
3. Include details of the vulnerability, reproduction steps, and potential impact.
4. Security patches will be prioritized and verified against the automated test suite before release.
