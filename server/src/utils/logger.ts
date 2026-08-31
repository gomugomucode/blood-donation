import { env } from '../config/env.js';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  requestId?: string;
  userId?: string;
  role?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  durationMs?: number;
  errorCode?: string;
  [key: string]: unknown;
}

const REDACTED_KEYS = new Set([
  'password',
  'passwordhash',
  'currentpassword',
  'newpassword',
  'token',
  'tokenhash',
  'resettoken',
  'authorization',
  'cookie',
  'patientreference',
  'diagnosis',
  'clinicalnotes',
]);

/**
 * Recursively sanitizes data to prevent leaking secrets, credentials, or private medical details into logs.
 */
export function sanitizeLogData(data: unknown): unknown {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeLogData(item));
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();
    if (REDACTED_KEYS.has(lowerKey) || lowerKey.includes('password') || lowerKey.includes('secret')) {
      sanitized[key] = '[REDACTED]';
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeLogData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

class StructuredLogger {
  private format(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const cleanContext = context ? (sanitizeLogData(context) as LogContext) : {};

    if (env.NODE_ENV === 'production') {
      return JSON.stringify({
        timestamp,
        level,
        message,
        ...cleanContext,
      });
    }

    const reqId = cleanContext.requestId ? ` [${cleanContext.requestId}]` : '';
    const details = Object.keys(cleanContext).length > 0 ? ` ${JSON.stringify(cleanContext)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}]${reqId} ${message}${details}`;
  }

  public info(message: string, context?: LogContext): void {
    console.log(this.format('info', message, context));
  }

  public warn(message: string, context?: LogContext): void {
    console.warn(this.format('warn', message, context));
  }

  public error(message: string, context?: LogContext): void {
    console.error(this.format('error', message, context));
  }

  public debug(message: string, context?: LogContext): void {
    if (env.NODE_ENV !== 'production' && env.NODE_ENV !== 'test') {
      console.debug(this.format('debug', message, context));
    }
  }
}

export const logger = new StructuredLogger();
