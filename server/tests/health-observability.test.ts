import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/db.js';
import { authService } from '../src/services/auth.service.js';
import { Role } from '../src/types/index.js';
import bcrypt from 'bcryptjs';

describe('Health, Observability & Admin Audit Log Tests', () => {
  let adminCookie: string;
  let donorCookie: string;

  beforeAll(async () => {
    // Seed Admin
    const adminPasswordHash = await bcrypt.hash('AdminPass123!', 12);
    const admin = await prisma.user.upsert({
      where: { email: 'observability.admin@blooddonation.org' },
      update: { role: Role.ADMIN },
      create: {
        email: 'observability.admin@blooddonation.org',
        passwordHash: adminPasswordHash,
        role: Role.ADMIN,
        sessionVersion: 1,
      },
    });
    const adminToken = authService.generateToken(admin.id, admin.role, admin.sessionVersion);
    adminCookie = `token=${adminToken}`;

    // Seed Donor
    const donorPasswordHash = await bcrypt.hash('DonorPass123!', 12);
    const donor = await prisma.user.upsert({
      where: { email: 'observability.donor@example.org' },
      update: { role: Role.DONOR },
      create: {
        email: 'observability.donor@example.org',
        passwordHash: donorPasswordHash,
        role: Role.DONOR,
        sessionVersion: 1,
      },
    });
    const donorToken = authService.generateToken(donor.id, donor.role, donor.sessionVersion);
    donorCookie = `token=${donorToken}`;
  });

  it('1. /health/live should return 200 process liveness with X-Request-ID', async () => {
    const res = await request(app).get('/health/live');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('alive');
    expect(res.headers['x-request-id']).toBeDefined();
  });

  it('2. /health/ready should return 200 readiness with connected database status', async () => {
    const res = await request(app).get('/health/ready');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ready');
    expect(res.body.database).toBe('connected');
  });

  it('3. GET / should return friendly JSON metadata and API routing documentation', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('online');
    expect(res.body.endpoints).toBeDefined();
    expect(res.headers['x-request-id']).toBeDefined();
  });

  it('4. GET /api/v1/admin/audit-logs should return paginated audit logs for admin', async () => {
    const res = await request(app)
      .get('/api/v1/admin/audit-logs?page=1&limit=10')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toBeDefined();
    expect(res.body.data.pagination).toBeDefined();
  });

  it('5. GET /api/v1/admin/audit-logs should strictly reject donor access with 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/v1/admin/audit-logs')
      .set('Cookie', donorCookie);

    expect(res.status).toBe(403);
  });
});
