import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

describe('CSRF & Origin Hardening Security Tests', () => {
  it('should allow read-only GET requests even with external Origin header', async () => {
    const res = await request(app)
      .get('/health/live')
      .set('Origin', 'https://external-website.com');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('alive');
  });

  it('should allow state-changing mutation with configured allowed Origin', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .set('Origin', 'http://localhost:5173')
      .send({ email: 'nonexistent@example.org' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should strictly block state-changing mutation from malicious Origin with 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .set('Origin', 'https://malicious-attacker-site.com')
      .send({ email: 'donor@example.org' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('CSRF_ORIGIN_FORBIDDEN');
  });

  it('should exempt health check endpoints from CSRF origin restrictions', async () => {
    const res = await request(app)
      .get('/health/ready')
      .set('Origin', 'https://monitoring-agent.cloud');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ready');
  });
});
