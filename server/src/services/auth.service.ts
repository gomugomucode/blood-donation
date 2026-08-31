import { randomBytes, createHash } from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db.js';
import { env } from '../config/env.js';
import { Role } from '../types/index.js';
import {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
} from '../validators/auth.validator.js';
import { ConflictError, UnauthorizedError, NotFoundError, BadRequestError } from '../utils/errors.js';
import { eligibilityService } from './eligibility.service.js';
import { auditService } from './audit.service.js';
import { logger } from '../utils/logger.js';

export interface AuthSessionResult {
  user: {
    id: string;
    email: string;
    role: Role;
    sessionVersion: number;
    createdAt: Date;
    donorProfile?: {
      id: string;
      fullName: string;
      dateOfBirth: Date;
      address: string;
      contactNumber: string;
      bloodGroup: string;
      lastDonationAt: Date | null;
      deletedAt: Date | null;
    } | null;
  };
  token: string;
}

export class AuthService {
  /**
   * Generates a signed JWT session token with minimal standard claims, explicit HS256 algorithm, and sessionVersion.
   */
  public generateToken(userId: string, role: Role, sessionVersion: number = 1): string {
    return jwt.sign({ sub: userId, role, v: sessionVersion }, env.JWT_SECRET, {
      algorithm: 'HS256',
      expiresIn: env.JWT_EXPIRES_IN as any,
    });
  }

  /**
   * Registers a new donor account.
   * Crucial Security Invariant: Server strictly forces role to DONOR.
   */
  public async register(input: RegisterInput): Promise<AuthSessionResult> {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new ConflictError('An account with this email address already exists.');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: input.email,
          passwordHash,
          role: Role.DONOR,
          sessionVersion: 1,
        },
      });

      const donorProfile = await tx.donorProfile.create({
        data: {
          userId: user.id,
          fullName: input.fullName,
          dateOfBirth: input.dateOfBirth,
          address: input.address,
          contactNumber: input.contactNumber,
          bloodGroup: input.bloodGroup,
          preferences: input.preferences || {},
        },
      });

      return { user, donorProfile };
    });

    const token = this.generateToken(result.user.id, result.user.role, result.user.sessionVersion);

    await auditService.log({
      actorUserId: result.user.id,
      action: 'DONOR_REGISTER',
      targetType: 'User',
      targetId: result.user.id,
      metadata: { bloodGroup: result.donorProfile.bloodGroup },
    });

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        sessionVersion: result.user.sessionVersion,
        createdAt: result.user.createdAt,
        donorProfile: {
          id: result.donorProfile.id,
          fullName: result.donorProfile.fullName,
          dateOfBirth: result.donorProfile.dateOfBirth,
          address: result.donorProfile.address,
          contactNumber: result.donorProfile.contactNumber,
          bloodGroup: result.donorProfile.bloodGroup,
          lastDonationAt: result.donorProfile.lastDonationAt,
          deletedAt: result.donorProfile.deletedAt,
        },
      },
      token,
    };
  }

  /**
   * Authenticates user credentials and creates session.
   */
  public async login(input: LoginInput): Promise<AuthSessionResult> {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      include: {
        donorProfile: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email address or password.');
    }

    if (user.donorProfile?.deletedAt) {
      throw new UnauthorizedError('This account has been deactivated. Please contact support.');
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email address or password.');
    }

    const token = this.generateToken(user.id, user.role, user.sessionVersion);

    if (user.role === Role.ADMIN) {
      await auditService.log({
        actorUserId: user.id,
        action: 'ADMIN_LOGIN',
        targetType: 'User',
        targetId: user.id,
      });
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        sessionVersion: user.sessionVersion,
        createdAt: user.createdAt,
        donorProfile: user.donorProfile
          ? {
              id: user.donorProfile.id,
              fullName: user.donorProfile.fullName,
              dateOfBirth: user.donorProfile.dateOfBirth,
              address: user.donorProfile.address,
              contactNumber: user.donorProfile.contactNumber,
              bloodGroup: user.donorProfile.bloodGroup,
              lastDonationAt: user.donorProfile.lastDonationAt,
              deletedAt: user.donorProfile.deletedAt,
            }
          : null,
      },
      token,
    };
  }

  /**
   * Initiates secure password reset.
   * Generic response prevents user email enumeration.
   */
  public async forgotPassword(input: ForgotPasswordInput): Promise<{ message: string; devResetToken?: string }> {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase().trim() },
    });

    if (!user) {
      // Return identical generic response to prevent user enumeration
      return {
        message: 'If an account with that email exists, password reset instructions have been dispatched.',
      };
    }

    // Generate cryptographically secure reset token (64 hex chars)
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiration

    // Clean any previous unused tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    });

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    await auditService.log({
      actorUserId: user.id,
      action: 'PASSWORD_RESET_REQUESTED',
      targetType: 'User',
      targetId: user.id,
    });

    logger.info('Password reset token generated', {
      userId: user.id,
      expiresAt: expiresAt.toISOString(),
    });

    // Provide devResetToken for test automation and dev mode only
    const devResetToken = env.NODE_ENV !== 'production' ? rawToken : undefined;

    return {
      message: 'If an account with that email exists, password reset instructions have been dispatched.',
      devResetToken,
    };
  }

  /**
   * Completes password reset using single-use hashed token and invalidates active sessions.
   */
  public async resetPassword(input: ResetPasswordInput): Promise<{ message: string }> {
    const tokenHash = createHash('sha256').update(input.token.trim()).digest('hex');

    const resetTokenRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetTokenRecord || resetTokenRecord.usedAt || resetTokenRecord.expiresAt < new Date()) {
      throw new BadRequestError('Password reset token is invalid or has expired.');
    }

    const passwordHash = await bcrypt.hash(input.newPassword, 12);

    await prisma.$transaction(async (tx) => {
      // Update password and increment sessionVersion to invalidate existing JWT sessions
      await tx.user.update({
        where: { id: resetTokenRecord.userId },
        data: {
          passwordHash,
          sessionVersion: { increment: 1 },
        },
      });

      // Mark token as used
      await tx.passwordResetToken.update({
        where: { id: resetTokenRecord.id },
        data: { usedAt: new Date() },
      });
    });

    await auditService.log({
      actorUserId: resetTokenRecord.userId,
      action: 'PASSWORD_RESET_COMPLETED',
      targetType: 'User',
      targetId: resetTokenRecord.userId,
    });

    return {
      message: 'Your password has been successfully reset. Please log in with your new password.',
    };
  }

  /**
   * Allows authenticated user to update their password and invalidate sessions across devices.
   */
  public async changePassword(
    userId: string,
    input: ChangePasswordInput
  ): Promise<{ message: string }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User account not found.');
    }

    const isCurrentValid = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      throw new UnauthorizedError('Current password is incorrect.');
    }

    if (input.currentPassword === input.newPassword) {
      throw new BadRequestError('New password must be different from your current password.');
    }

    const passwordHash = await bcrypt.hash(input.newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        sessionVersion: { increment: 1 }, // Revokes all previous sessions
      },
    });

    await auditService.log({
      actorUserId: userId,
      action: 'PASSWORD_CHANGED',
      targetType: 'User',
      targetId: userId,
    });

    return {
      message: 'Password changed successfully. Active sessions have been invalidated.',
    };
  }

  /**
   * Retrieves profile for currently authenticated user.
   */
  public async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        sessionVersion: true,
        createdAt: true,
        updatedAt: true,
        donorProfile: {
          select: {
            id: true,
            fullName: true,
            dateOfBirth: true,
            address: true,
            contactNumber: true,
            bloodGroup: true,
            lastDonationAt: true,
            preferences: true,
            deletedAt: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User account not found.');
    }

    let eligibility = null;
    if (user.donorProfile) {
      eligibility = eligibilityService.evaluate({
        dateOfBirth: user.donorProfile.dateOfBirth,
        lastDonationAt: user.donorProfile.lastDonationAt,
        deletedAt: user.donorProfile.deletedAt,
      });
    }

    return {
      ...user,
      eligibility,
    };
  }
}

export const authService = new AuthService();
