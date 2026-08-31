# HEMACARE — NOTIFICATION OPERATIONS & RELIABILITY

This document details the architecture, retry policies, consent rules, and gateway configurations for transfusion outreach notifications.

---

## 1. Notification Delivery Pipeline

```
 Coordinator Dispatches Outreach
               │
               ▼
   [ OpportunityService ]
               │ (Check donor consent & anti-fatigue cooldown)
               ▼
   [ NotificationService ]
               │ (Create Notification record with status PENDING & idempotencyKey)
               ▼
   [ NotificationWorker ] ◄── (Database-backed queue poller)
               │ (Transaction-safe claiming)
               ▼
  [ NotificationProviderFactory ]
         │                │
         ▼                ▼
[ Resend / SendGrid ] [ Twilio Telecom ]
         │                │
         ▼                ▼
   [ Sent Email ]     [ Sent SMS ]
```

---

## 2. Idempotency Key Architecture

Every automated notification receives a deterministic `idempotencyKey`:
```text
opportunity-${opportunityId}-${channel}
```
If a coordinator retries or network latency duplicates the request, the database unique constraint blocks duplicate records and returns the existing notification without sending duplicate SMS/emails.

---

## 3. Retry Policy & Exponential Backoff

| Attempt | Timing | Trigger | Action on Failure |
| :--- | :--- | :--- | :--- |
| **Attempt 1** | Immediate | Worker picks up `PENDING` record | Marks `FAILED`, sets `lastAttemptAt = NOW()` |
| **Attempt 2** | +2 Minutes Cooldown | Worker finds `FAILED` with `attemptCount = 1` | Increments `attemptCount = 2`, records `errorCode` |
| **Attempt 3** | +10 Minutes Cooldown | Worker finds `FAILED` with `attemptCount = 2` | If failed, permanently marks dead-letter failure |
| **Manual** | On-demand | Coordinator clicks "Retry" on `/admin/operations` | Re-dispatches if `attemptCount < 3` |

---

## 4. Donor Consent & Anti-Fatigue Rules

1. **Consent Flag Enforcement**: If `donorProfile.preferences.allowBloodRequestNotifications === false`, external dispatch is suppressed.
2. **Channel Preference**: Respects `donorProfile.preferences.preferredNotificationChannel` (`EMAIL`, `SMS`, or `IN_APP`).
3. **Emergency Cooldowns**: Donors cannot receive more than 3 outreach notifications within 24 hours to prevent notification fatigue.
