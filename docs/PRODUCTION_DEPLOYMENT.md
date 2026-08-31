# HemaCare Production Deployment Guide

This guide details the steps required to deploy the **HemaCare Blood Donation Management Platform** to enterprise cloud environments (Kubernetes, AWS ECS, GCP Cloud Run, or hardened Ubuntu Linux VMs).

---

## 1. Architecture Overview

```mermaid
graph TD
    Client[Browser / Mobile SPA] -->|HTTPS :443| CDN[CloudFront / Cloudflare Edge]
    CDN -->|Static Assets| S3[Static Host / S3 Bucket]
    CDN -->|API Requests /api/*| LB[TLS Termination Load Balancer]
    LB -->|Reverse Proxy| Nginx[Nginx Ingress / Reverse Proxy]
    Nginx -->|HTTP :5000 + X-Request-ID| NodeApp[Node.js + Express + TypeScript API]
    NodeApp -->|Prisma Client Connection Pool| Postgres[(PostgreSQL 16 High-Availability RDS)]
```

---

## 2. Environment Configuration Matrix

All production secrets must be provisioned via a dedicated secret manager (AWS Secrets Manager, HashiCorp Vault, or GCP Secret Manager). **Never commit production credentials.**

| Variable | Description | Required | Example |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Runtime environment | Yes | `production` |
| `PORT` | API listen port | Yes | `5000` |
| `DATABASE_URL` | PostgreSQL connection pool URL | Yes | `postgresql://user:pass@db-cluster.internal:5432/hemacare?sslmode=require&connection_limit=25` |
| `JWT_SECRET` | 256-bit cryptographically random HMAC secret | Yes | `base64-random-32-byte-string` |
| `JWT_EXPIRES_IN` | Token expiration duration | Yes | `7d` |
| `CLIENT_URL` | Primary canonical SPA domain | Yes | `https://hemacare.org` |

---

## 3. Database Migration Runbook

Before deploying updated backend artifacts, apply pending migrations using Prisma CLI:

```bash
# 1. Inspect migration status
npx prisma migrate status --schema=server/prisma/schema.prisma

# 2. Apply non-breaking migrations atomically
npx prisma migrate deploy --schema=server/prisma/schema.prisma
```

---

## 4. Containerization & Dockerfile

### Production Server Dockerfile (`server/Dockerfile`)

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY server/package*.json ./server/
RUN npm ci --workspace=server
COPY server/ ./server/
RUN npx prisma generate --schema=server/prisma/schema.prisma
RUN npm run build --workspace=server

# Stage 2: Minimal Runtime
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/server/package*.json ./server/
RUN npm ci --omit=dev --workspace=server
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/prisma ./server/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER node
EXPOSE 5000
CMD ["node", "server/dist/server.js"]
```

---

## 5. Kubernetes Deployment Manifest

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hemacare-api
  labels:
    app: hemacare-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: hemacare-api
  template:
    metadata:
      labels:
        app: hemacare-api
    spec:
      containers:
        - name: api
          image: ghcr.io/hemacare/api:1.0.0
          ports:
            - containerPort: 5000
          envFrom:
            - secretRef:
                name: hemacare-secrets
            - configMapRef:
                name: hemacare-config
          resources:
            requests:
              cpu: "250m"
              memory: "256Mi"
            limits:
              cpu: "1000m"
              memory: "512Mi"
          livenessProbe:
            httpGet:
              path: /health/live
              port: 5000
            initialDelaySeconds: 10
            periodSeconds: 15
            timeoutSeconds: 3
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 5000
            initialDelaySeconds: 5
            periodSeconds: 10
            timeoutSeconds: 5
```

---

## 6. Nginx Reverse Proxy Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name api.hemacare.org;

    ssl_certificate /etc/letsencrypt/live/api.hemacare.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.hemacare.org/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 30s;
        proxy_connect_timeout 5s;
    }
}
```
