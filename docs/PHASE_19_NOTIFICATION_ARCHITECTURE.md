# PHASE 19 — PRODUCTION NOTIFICATION ARCHITECTURE

**Audit & Implementation Date:** September 1, 2026  
**Engineering Suite:** Production Notification Reliability, Carrier Integration & Hardening  

---

## 1. Overview & Architectural Goals

The HemaCare notification architecture decouples internal clinical events from external carrier dispatch, enforcing **strict idempotency**, **atomic worker locking**, **stale request suppression**, and **privacy preservation**.

```text
+-------------------------------------------------------------------------+
|                           CLINICAL BUSINESS EVENT                       |
|           (Opportunity Outreach / Emergency Blood Request)              |
+-------------------------------------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                         NOTIFICATION SERVICE                            |
|  - Idempotency Key Generation (`opp-${opp.id}-${channel}`)              |
|  - Donor Consent & Channel Filter (`preferredNotificationChannel`)      |
|  - PHI Sanitization (Redacts patientReference, clinicalNotes)           |
+-------------------------------------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                         POSTGRESQL DATABASE                             |
|  - In-App: `status: SENT`, `channel: IN_APP`, instant UI availability   |
|  - External: `status: PENDING`, `channel: SMS/EMAIL`, queue ready       |
+-------------------------------------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                  NOTIFICATION BACKGROUND WORKER                         |
|  1. Optimistic Concurrency Lock (`updateMany` with attemptCount)        |
|  2. Stale Request Guard (Checks if BloodRequest is CANCELLED/FULFILLED) |
|  3. Exponential Backoff Scheduler (30s -> 2m -> Terminal max 3 attempts)|
+-------------------------------------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                      PROVIDER ABSTRACTION LAYER                         |
|  +---------------------------+  +------------------------------------+  |
|  | TwilioNotificationProvider|  | SendGrid / Resend Provider         |  |
|  | - 10s AbortSignal timeout |  | - 10s AbortSignal timeout          |  |
|  | - Retry error mapping     |  | - Sanitized HTML/Text formatting   |  |
|  +---------------------------+  +------------------------------------+  |
|  +-------------------------------------------------------------------+  |
|  | DevelopmentNotificationProvider (Simulated Staging Fallback)      |  |
|  +-------------------------------------------------------------------+  |
+-------------------------------------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                       DELIVERY OUTCOME & AUDIT                          |
|  - Success: `status: SENT`, `sentAt: now()`                             |
|  - Failure: `status: FAILED`, `errorCode`, `attemptCount++`             |
|  - Suppressed: `status: FAILED`, `errorCode: SUPPRESSED_REQUEST_*`      |
+-------------------------------------------------------------------------+
```

---

## 2. Core Hardening Components

### 2.1 Atomic Optimistic Concurrency Claim
To prevent multiple worker instances or concurrent polling loops from double-dispatching the same notification:
```typescript
const claim = await prisma.notification.updateMany({
  where: {
    id: notif.id,
    status: notif.status,
    attemptCount: notif.attemptCount,
  },
  data: {
    attemptCount: notif.attemptCount + 1,
    lastAttemptAt: new Date(),
  },
});

if (claim.count === 0) {
  // Another concurrent worker thread already claimed this record
  return false;
}
```

### 2.2 Stale Notification & Race Suppression
If a blood request is `CANCELLED`, `EXPIRED`, or `FULFILLED` while a notification is queued:
1. Worker inspects `opp.bloodRequest.status`.
2. Suppresses carrier dispatch.
3. Transitions notification to `FAILED` with `errorCode: 'SUPPRESSED_REQUEST_CANCELLED'` or `'SUPPRESSED_REQUEST_FULFILLED'`.
4. Sets `attemptCount = maxAttempts` to mark terminal failure.

### 2.3 Provider Abstraction & Safe Fallback
- Direct business logic calls `INotificationProvider.send()`.
- Providers implement `AbortSignal.timeout(10000)` to eliminate hanging socket connections.
- If credentials are not set, `DevelopmentNotificationProvider` safely logs simulated dispatches without false delivery claims.
