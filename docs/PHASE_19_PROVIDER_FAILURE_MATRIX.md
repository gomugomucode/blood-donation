# PHASE 19 — NOTIFICATION PROVIDER FAILURE MATRIX

**Audit Date:** September 1, 2026  
**Engineering Suite:** Production Notification Reliability Suite  

---

## 1. Carrier Failure Classification & System Behavior

| HTTP / Network Error | Failure Category | Retryable? | Backoff Policy | System State Transition | Log Severity |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **HTTP 400 (Bad Request)** | Invalid Payload / Malformed Number | **NO** | None (Terminal) | `status: FAILED`, `attemptCount = 3` | `WARN` |
| **HTTP 401 / 403 (Auth Error)**| Bad API Key / Expired Token | **NO** | None (Terminal) | `status: FAILED`, `attemptCount = 3`, `errorCode: 'UNCONFIGURED_PROVIDER'` | `ERROR` |
| **HTTP 404 (Not Found)** | Invalid Endpoint Route | **NO** | None (Terminal) | `status: FAILED`, `attemptCount = 3` | `ERROR` |
| **HTTP 429 (Rate Limited)** | Carrier Ingestion Throttling | **YES** | Exponential: 30s -> 2m -> Terminal | `status: FAILED`, `errorCode = 'CARRIER_RATE_LIMIT'` | `WARN` |
| **HTTP 500 (Internal Error)** | Carrier Internal Outage | **YES** | Exponential: 30s -> 2m -> Terminal | `status: FAILED`, `errorCode = 'CARRIER_500'` | `WARN` |
| **HTTP 502 / 503 / 504** | Carrier Gateway Timeout / Outage | **YES** | Exponential: 30s -> 2m -> Terminal | `status: FAILED`, `errorCode = 'CARRIER_UNAVAILABLE'`| `WARN` |
| **Socket Timeout (`>10s`)** | Carrier Hanging Socket | **YES** | Exponential: 30s -> 2m -> Terminal | `status: FAILED`, `errorCode = 'DISPATCH_TIMEOUT'` | `WARN` |
| **Network ETIMEDOUT / ECONNRESET**| DNS / Network Interruption | **YES** | Exponential: 30s -> 2m -> Terminal | `status: FAILED`, `errorCode = 'NETWORK_ERROR'` | `WARN` |
| **Missing Phone / Email** | Donor Profile Missing Contact | **NO** | None (Terminal) | `status: FAILED`, `attemptCount = 3`, `errorCode = 'Missing recipient'` | `INFO` |
| **Request Cancelled / Fulfilled**| Stale Blood Request | **NO** | None (Terminal) | `status: FAILED`, `errorCode = 'SUPPRESSED_REQUEST_*'`| `INFO` |

---

## 2. Bounded Retry Cadence

```text
Attempt 1: Immediate dispatch upon worker pickup
   ↓ (Fails with Retryable Error)
Cooldown Delay: 30 seconds
   ↓
Attempt 2: Worker retry dispatch
   ↓ (Fails with Retryable Error)
Cooldown Delay: 2 minutes
   ↓
Attempt 3: Final retry dispatch
   ↓ (Fails)
Terminal State: Notification remains FAILED (attemptCount = 3), flagged in Admin Telemetry dashboard.
```

---

## 3. Worker Crash & Restart Recovery

- If the server process or background worker crashes while a notification is in transit:
- On restart, `notificationWorker.start()` resumes polling.
- Notifications in `PENDING` (or retryable `FAILED` past backoff cooldown) are picked up cleanly.
- Atomic `updateMany` guarantees that no notification is dispatched twice upon restart.
