# HEMACARE — OBSERVABILITY & MONITORING GUIDE

This document describes the logging taxonomy, request correlation tracing, error monitoring, and telemetry metrics on HemaCare.

---

## 1. Request Correlation Tracing (`X-Request-ID`)

Every incoming HTTP request is assigned a UUID correlation identifier:
- Generated in `requestIdMiddleware` or bounded from client header.
- Attached to response header `X-Request-ID`.
- Attached to all Winston log entries, audit events, and error response bodies.

---

## 2. Structured JSON Log Schema

In production, all logs are output in NDJSON format:

```json
{
  "timestamp": "2026-09-01T00:30:00.000Z",
  "level": "info",
  "message": "POST /api/v1/auth/login 200 45ms",
  "requestId": "e8930a62-e75d-4389-9003-763b551b42bc",
  "method": "POST",
  "path": "/api/v1/auth/login",
  "statusCode": 200,
  "durationMs": 45,
  "userId": "d2de8f9a-dec3-4b2e-b656-a088fa5789e9",
  "role": "DONOR"
}
```

---

## 3. Sensitive Data Redaction Policy

The logging and monitoring layers strictly redact:
- Passwords and `passwordHash`
- JWT session tokens and cookie headers
- Password reset token hashes
- Patient references and clinical diagnoses
- Telecom / Email provider API keys

---

## 4. Health Probes for Container Orchestrators

| Endpoint | Probe Type | Target | Expected Response |
| :--- | :--- | :--- | :--- |
| `GET /health/live` | Liveness | Kubernetes / Container runtime | `200 OK` (process alive) |
| `GET /health/ready` | Readiness | Load Balancer ingress | `200 OK` (DB connected) or `503` (degraded) |
