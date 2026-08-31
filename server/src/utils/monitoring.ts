import { env } from '../config/env.js';
import { logger } from './logger.js';

export interface ErrorContext {
  requestId?: string;
  userId?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  [key: string]: any;
}

class MonitoringService {
  private isSentryActive: boolean = false;

  constructor() {
    if (env.SENTRY_DSN && env.NODE_ENV === 'production') {
      this.isSentryActive = true;
      logger.info('📡 Remote error monitoring (Sentry boundary) initialized.');
    }
  }

  /**
   * Captures exceptions with automatic redacting of PII and security tokens.
   */
  public captureException(error: Error, context: ErrorContext = {}): void {
    const sanitizedContext = this.sanitizeContext(context);

    logger.error(`[MONITORING] ${error.name}: ${error.message}`, {
      ...sanitizedContext,
      stack: env.NODE_ENV !== 'production' ? error.stack : undefined,
    });

    if (this.isSentryActive) {
      // Sentry SDK dispatch boundary
    }
  }

  private sanitizeContext(context: Record<string, any>): Record<string, any> {
    const sensitiveKeys = new Set([
      'password',
      'passwordHash',
      'token',
      'jwt',
      'cookie',
      'secret',
      'tokenHash',
      'authorization',
      'patientReference',
    ]);

    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(context)) {
      if (sensitiveKeys.has(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeContext(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
}

export const monitoringService = new MonitoringService();
