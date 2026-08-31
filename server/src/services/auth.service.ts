import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db.js';
import { env } from '../config/env.js';
import { Role } from '../types/index.js';
import { RegisterInput, LoginInput } from '../validators/auth.validator.js';
import { ConflictError, UnauthorizedError, NotFoundError } from '../utils/errors.js';
import { eligibilityService } from './eligibility.service.js';

export interface AuthSessionResult {
  user: {
    id: string;
    email: string;
    role: Role;
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
   * Generates a signed JWT session token.
   */
  public generateToken(userId: string, role: Role): string {
    return jwt.sign({ userId, role }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as any,
    });
  }

  /**
   * Registers a new donor account.
   * Crucial Security Invariant: Server strictly forces role to DONOR.
   * Client-supplied role inputs are ignored/disallowed.
   */
  public async register(input: RegisterInput): Promise<AuthSessionResult> {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new ConflictError('An account with this email address already exists.');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    // Create User and DonorProfile in an atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: input.email,
          passwordHash,
          role: Role.DONOR, // Strict server enforcement
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

    const token = this.generateToken(result.user.id, result.user.role);

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
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

    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email address or password.');
    }

    const token = this.generateToken(user.id, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
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
   * Retrieves profile for currently authenticated user.
   */
  public async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
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
