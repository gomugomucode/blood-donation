# HemaCare Observability, Monitoring & Reliability Architecture

This guide details the logging format, health probe contracts, telemetry metrics, and alerting thresholds configured for HemaCare.

---

## 1. Structured Logging Standards

In production mode (`NODE_ENV=production`), the application emits single-line JSON log events to `stdout` compatible with Datadog, AWS CloudWatch, Grafana Loki, and Google Cloud Logging:

```json
{
  "timestamp": "2026-08-31T17:45:10.123Z",
  "level": "info",
  "message": "Connected to PostgreSQL database successfully",
  "requestId": "4fb8097c-55ff-4cae-b69d-edea86324581",
  "method": "POST",
  "path": "/api/v1/auth/login",
  "statusCode": 200,
  "durationMs": 45
}
```

### Request Correlation (`X-Request-ID`):
- Every incoming HTTP request is assigned a unique UUIDv4 or propagates a valid upstream trace ID.
- Attached to the response header `X-Request-ID` and included in all related log statements, error traces, and audit logs.

---

## 2. Health & Readiness Probe Endpoints

| Endpoint | Probe Type | Purpose | HTTP Status | Response Contract |
| :--- | :--- | :--- | :--- | :--- |
| `GET /health/live` | Liveness | Verifies Express process is alive and responsive | `200 OK` | `{"status":"alive","timestamp":"...","service":"HemaCare Blood Donation API","requestId":"..."}` |
| `GET /health/ready` | Readiness | Verifies PostgreSQL database pool connectivity via `SELECT 1` | `200 OK` (Healthy) / `503 Service Unavailable` | `{"status":"ready","database":"connected",...}` |
| `GET /` | API Root | Human-readable discovery and status | `200 OK` | JSON metadata and frontend URLs |

---

## 3. Service Level Objectives (SLOs) & Critical Alerts

| Metric | Target / SLA | Alert Threshold | Action |
| :--- | :--- | :--- | :--- |
| **API Availability** | **99.9%** (< 43m downtime/mo) | Error rate > 1% over 5 min window | Page on-call engineer |
| **P95 Latency** | **< 200ms** (General APIs) | P95 > 500ms over 10 min window | Check DB connection pool & slow queries |
| **Database Pool Exhaustion** | **< 80% Utilization** | Active connections > 85% of max | Scale connection pool / check query leaks |
| **Failed Logins Spike** | **< 50 / min** | > 100 failed auths in 5 min | Check for brute force attack / trigger WAF rate limit |
| **Notification Failure Rate** | **< 0.5%** | Failed dispatches > 5 in 15 min | Inspect notification provider status & retry queue |
