# HemaCare Data Privacy & Protected Health Information (PHI) Review

This document provides a comprehensive analysis of the privacy defenses, clinical data boundaries, role segregation, and log sanitization safeguards implemented within HemaCare.

---

## 1. Compliance Alignment (HIPAA / GDPR / Medical Regulations)

HemaCare processes donor identifiers, blood groups, donation history, and hospital request metadata. It implements strict **Minimum Necessary Disclosure** and privacy-by-design principles.

### Key Privacy Invariants Enforced:

1. **Role-Based Access Segregation:**
   - Donors can *only* access their own profile, donation history, and received opportunities.
   - Donors never have access to patient identities, diagnosis notes, or other donors' profiles.
   - Coordinators/Admins have access to donor directories and request management, but sensitive actions are immutably logged.
2. **Opportunity & Outreach Data Minimization:**
   - Notifications and opportunities sent to prospective donors contain only the required blood group, hospital location, urgency, and deadline.
   - Internal patient reference IDs, diagnostic notes, or clinical background are **never** forwarded in donor payloads.
3. **Structured Log Sanitization:**
   - The central logger (`server/src/utils/logger.ts`) sanitizes log outputs.
   - Passwords, hashes, tokens, session cookies, and clinical diagnosis keys are automatically redacted to `[REDACTED]`.

---

## 2. PII / PHI Inventory & Field Protections

| Field / Entity | Classification | Storage Protection | Access Controls | Log Policy |
| :--- | :--- | :--- | :--- | :--- |
| `User.passwordHash` | Secret | Bcrypt (cost 12) | Server Auth Only | Redacted |
| `PasswordResetToken.tokenHash` | Secret | SHA-256 | Internal Server | Redacted |
| `DonorProfile.contactNumber` | PII | Encrypted / At-Rest | Donor / Admin | Redacted in General Logs |
| `DonorProfile.bloodGroup` | PHI | At-Rest DB Encryption | Donor / Admin | Allowed in Match Audit |
| `BloodRequest.patientReference` | PHI | At-Rest DB Encryption | Admin Only | Redacted in Logs & Donor APIs |
| `AuditLog.metadata` | Audit | Non-sensitive JSON | Admin Only | Sanitized Payload |

---

## 3. Account Deactivation & Right-To-Erasure (GDPR Art. 17)

- **Soft Deletion (`deletedAt`):** When an account is deactivated, `deletedAt` is populated. The donor is immediately excluded from matching candidate queries, notifications, and active listings.
- **Session Revocation:** Deactivating a donor account or resetting credentials increments `sessionVersion`, immediately invalidating active JWT tokens.
- **Historical Clinical Integrity:** Past recorded donation units remain retained for blood bank inventory auditing and transfusion traceability.
