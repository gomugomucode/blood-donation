import { prisma } from '../config/db.js';
import { Prisma } from '@prisma/client';

export interface CreateAuditLogParams {
  actorUserId?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export class AuditService {
  /**
   * Log an administrative or clinical security event
   * Never stores sensitive fields (passwords, tokens, personal medical records)
   */
  async log(params: CreateAuditLogParams): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          actorUserId: params.actorUserId || null,
          action: params.action,
          targetType: params.targetType,
          targetId: params.targetId || null,
          metadata: params.metadata || {},
          ipAddress: params.ipAddress || null,
          userAgent: params.userAgent || null,
        },
      });
    } catch (error) {
      // Non-blocking: log error to console without breaking user transactions
      console.error('⚠️ Failed to write audit log entry:', error);
    }
  }

  /**
   * Fetch recent audit logs with pagination and filters (Admin only)
   */
  async getAuditLogs(query: { page?: number; limit?: number; action?: string; targetType?: string }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {};
    if (query.action) where.action = query.action;
    if (query.targetType) where.targetType = query.targetType;

    const [total, items] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const auditService = new AuditService();
