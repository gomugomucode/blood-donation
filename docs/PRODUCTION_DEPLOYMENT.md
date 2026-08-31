# HEMACARE — PRODUCTION DEPLOYMENT RUNBOOK

This guide provides end-to-end instructions for deploying the HemaCare Blood Donation Management Platform to production.

---

## 1. Architecture Overview

```
 [ Client Browser ]
        │
        ▼ (HTTPS)
 [ Vercel / Netlify ] ────► Static SPA Frontend (React 19 + Vite)
        │
        ▼ (HTTPS / API calls)
 [ Render / Railway / AWS ] ──► Express + TypeScript REST API
        │
        ├──► Background Notification Worker (Database-backed queue)
        ├──► Managed PostgreSQL (Prisma ORM)
        └──► External Gateways (Resend / SendGrid for Email, Twilio for SMS)
```

---

## 2. Backend Deployment (e.g. Render / Railway / Docker)

### Environment Variables
Configure the following in your cloud provider environment dashboard:

```env
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://user:password@hostname:5432/dbname?sslmode=require
CLIENT_URL=https://your-frontend-domain.vercel.app
JWT_SECRET=production_random_secret_at_least_32_chars_long
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=admin@blooddonation.org
ADMIN_PASSWORD=YourSecureProductionAdminPassword123!

# Real Notification Gateways
EMAIL_PROVIDER=resend
EMAIL_FROM="HemaCare Registry <alerts@blooddonation.org>"
EMAIL_API_KEY=re_your_live_resend_api_key

SMS_PROVIDER=twilio
SMS_FROM=+15551234567
SMS_ACCOUNT_SID=ACyour_live_twilio_sid
SMS_AUTH_TOKEN=your_live_twilio_auth_token
```

### Build & Start Commands
- **Build Command**: `npm run build --workspace=server && npx prisma migrate deploy --schema=server/prisma/schema.prisma`
- **Start Command**: `node server/dist/server.js`

---

## 3. Frontend Deployment (e.g. Vercel / Netlify)

### Environment Variables
- **`VITE_API_URL`**: `https://your-backend-service.onrender.com/api/v1`

### Build Settings
- **Framework Preset**: Vite
- **Root Directory**: `client`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **SPA Rewrites**: Add `vercel.json` rewrite rule `[{"source": "/(.*)", "destination": "/index.html"}]` to support direct deep linking to `/admin`, `/dashboard`, and `/dashboard/opportunities/:id`.

---

## 4. Verification & Health Monitoring

Verify endpoints post-deployment:
1. `GET https://your-backend-service.onrender.com/health/live` $\rightarrow$ `200 OK`
2. `GET https://your-backend-service.onrender.com/health/ready` $\rightarrow$ `200 OK` (database latency < 50ms)
3. Log into Admin Portal at `/admin/login` and verify system status on `/admin/operations`.
