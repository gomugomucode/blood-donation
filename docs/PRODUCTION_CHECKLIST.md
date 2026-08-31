# HEMACARE — PRODUCTION GO-LIVE CHECKLIST

Complete all verification items prior to promoting HemaCare to live healthcare operations:

---

## 1. Secrets & Authentication
- [ ] `JWT_SECRET` is at least 32 cryptographically secure random characters.
- [ ] Initial admin credentials changed from default `AdminSecurePass123!`.
- [ ] Database credentials restricted with least-privilege IAM roles.
- [ ] No secrets committed to source code or git history.

---

## 2. Infrastructure & Hosting
- [ ] PostgreSQL multi-AZ deployment with automated daily backups.
- [ ] HTTPS enforced with TLS 1.3 across all domains.
- [ ] `CLIENT_URL` explicitly configured on backend to match frontend production domain.
- [ ] `VITE_API_URL` configured on frontend pointing to backend `/api/v1`.
- [ ] Rate limits verified and active on auth and general API routes.

---

## 3. Notification Gateways
- [ ] Live Resend / SendGrid API key verified with verified sender domain.
- [ ] Live Twilio account configured with compliant SMS registration (10DLC / shortcode).
- [ ] Donor notification consent preferences verified active.
- [ ] Notification worker background service active.

---

## 4. Observability & Monitoring
- [ ] `GET /health/live` and `GET /health/ready` responding `200 OK`.
- [ ] Sentry / Error monitoring DSN configured for production exception capture.
- [ ] Structured JSON logging active with request IDs.
- [ ] Admin operations dashboard verified on `/admin/operations`.
