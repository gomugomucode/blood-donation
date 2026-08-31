import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/db.js';
import { authService } from '../src/services/auth.service.js';
import { Role } from '../src/types/index.js';
import bcrypt from 'bcryptjs';

describe('Session Invalidation, Password Reset & Account Security Tests', () => {
  const testEmail = 'session.test@example.org';
  const initialPassword = 'InitialPass123!';
  const updatedPassword = 'NewSecurePass456!';
  let userId: string;

  beforeAll(async () => {
    // Clean and seed test user
    await prisma.passwordResetToken.deleteMany();
    await prisma.user.deleteMany({ where: { email: testEmail } });

    const passwordHash = await bcrypt.hash(initialPassword, 12);
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash,
        role: Role.DONOR,
        sessionVersion: 1,
      },
    });
    userId = user.id;
  });

  it('1. forgot-password should generate a secure single-use reset token and return generic message', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: testEmail });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('password reset instructions have been dispatched');
    expect(res.body.data.devResetToken).toBeDefined();

    const storedTokens = await prisma.passwordResetToken.findMany({
      where: { userId },
    });
    expect(storedTokens.length).toBe(1);
    expect(storedTokens[0].usedAt).toBeNull();
  });

  it('2. reset-password with valid token should update password and increment sessionVersion', async () => {
    // Generate fresh reset token
    const forgotRes = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: testEmail });

    const token = forgotRes.body.data.devResetToken;

    // Active session token generated with sessionVersion = 1
    const oldSessionToken = authService.generateToken(userId, Role.DONOR, 1);

    // Perform reset
    const resetRes = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({
        token,
        newPassword: updatedPassword,
      });

    expect(resetRes.status).toBe(200);
    expect(resetRes.body.success).toBe(true);

    // Verify token is marked used
    const updatedUser = await prisma.user.findUnique({ where: { id: userId } });
    expect(updatedUser?.sessionVersion).toBe(2);

    // Verify old session token is now strictly revoked (401 Unauthorized)
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', `token=${oldSessionToken}`);

    expect(meRes.status).toBe(401);
    expect(meRes.body.message).toContain('Session has been revoked');
  });

  it('3. reset-password should reject reusing the same token', async () => {
    const forgotRes = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: testEmail });

    const token = forgotRes.body.data.devResetToken;

    // Use token first time
    await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token, newPassword: 'AnotherPassword789!' });

    // Attempt second use
    const reuseRes = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token, newPassword: 'YetAnotherPassword123!' });

    expect(reuseRes.status).toBe(400);
    expect(reuseRes.body.message).toContain('invalid or has expired');
  });

  it('4. change-password should verify current password, update password, and revoke previous sessions', async () => {
    // Login with current password to get valid session
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testEmail,
        password: 'AnotherPassword789!',
      });

    expect(loginRes.status).toBe(200);
    const sessionCookie = loginRes.headers['set-cookie']?.[0];

    const changeRes = await request(app)
      .post('/api/v1/auth/change-password')
      .set('Cookie', sessionCookie)
      .send({
        currentPassword: 'AnotherPassword789!',
        newPassword: 'FinalStrongPassword999!',
      });

    expect(changeRes.status).toBe(200);
    expect(changeRes.body.success).toBe(true);

    // Verify old session is now revoked
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', sessionCookie);

    expect(meRes.status).toBe(401);
  });
});
