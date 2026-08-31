import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/db.js';
import { BloodGroup } from '../src/types/index.js';

describe('Authentication API Endpoints', () => {
  const testUser = {
    email: 'test.donor@example.org',
    password: 'Password123!',
    fullName: 'Test Donor',
    dateOfBirth: '1995-06-15',
    address: '123 Testing Lane, Tech City',
    contactNumber: '+1-555-9999',
    bloodGroup: BloodGroup.O_POSITIVE,
  };

  beforeEach(async () => {
    // Clean up test user if exists
    const existing = await prisma.user.findUnique({ where: { email: testUser.email } });
    if (existing) {
      await prisma.user.delete({ where: { id: existing.id } });
    }
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a valid donor and set HttpOnly session cookie', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user.role).toBe('DONOR');
      expect(response.body.data.user.donorProfile).toBeDefined();
      expect(response.body.data.user.donorProfile.fullName).toBe(testUser.fullName);
      expect(response.body.data.user.donorProfile.bloodGroup).toBe(BloodGroup.O_POSITIVE);
      expect(response.body.data.user.passwordHash).toBeUndefined(); // Security: never expose hash

      // Verify Set-Cookie header contains token
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain('token=');
      expect(cookies[0]).toContain('HttpOnly');
    });

    it('should reject registration with invalid email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...testUser, email: 'not-an-email' });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'email' })])
      );
    });

    it('should reject registration with weak password (< 8 characters)', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...testUser, password: '123' });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'password' })])
      );
    });

    it('should reject registration with invalid blood group', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...testUser, bloodGroup: 'XYZ_POSITIVE' });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    it('should reject duplicate email registration with 409 Conflict', async () => {
      // First registration
      await request(app).post('/api/v1/auth/register').send(testUser);

      // Attempt duplicate registration
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/v1/auth/register').send(testUser);
    });

    it('should authenticate valid credentials and issue session token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.token).toBeDefined();

      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain('token=');
    });

    it('should reject invalid password with 401 Unauthorized', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid email address or password');
    });

    it('should reject non-existent email with 401 Unauthorized', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'unknown@example.org',
          password: 'Password123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/logout & GET /api/v1/auth/me', () => {
    it('should retrieve me profile for authenticated session and clear cookie on logout', async () => {
      // 1. Register & login
      const loginRes = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);

      const cookie = loginRes.headers['set-cookie'];

      // 2. Fetch /auth/me
      const meRes = await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', cookie);

      expect(meRes.status).toBe(200);
      expect(meRes.body.success).toBe(true);
      expect(meRes.body.data.email).toBe(testUser.email);
      expect(meRes.body.data.eligibility).toBeDefined();

      // 3. Logout
      const logoutRes = await request(app)
        .post('/api/v1/auth/logout')
        .set('Cookie', cookie);

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.success).toBe(true);
    });
  });
});
