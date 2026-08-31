import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
    DATABASE_URL: z
      .string({
        required_error: 'DATABASE_URL environment variable is required',
      })
      .min(1, 'DATABASE_URL cannot be empty'),
    JWT_SECRET: z
      .string({
        required_error: 'JWT_SECRET environment variable is required',
      })
      .min(32, 'JWT_SECRET must be at least 32 characters for production security'),
    JWT_EXPIRES_IN: z.string().default('7d'),
    CLIENT_URL: z.string().default('http://localhost:5173'),
    ADMIN_EMAIL: z.string().email().default('admin@blooddonation.org'),
    ADMIN_PASSWORD: z.string().min(8).default('AdminSecurePass123!'),

    // Email Notification Configuration
    EMAIL_PROVIDER: z.enum(['mock', 'resend', 'sendgrid', 'smtp']).default('mock'),
    EMAIL_FROM: z.string().default('HemaCare Transfusion Registry <alerts@blooddonation.org>'),
    EMAIL_API_KEY: z.string().optional(),

    // SMS Notification Configuration
    SMS_PROVIDER: z.enum(['mock', 'twilio', 'generic']).default('mock'),
    SMS_FROM: z.string().optional(),
    SMS_ACCOUNT_SID: z.string().optional(),
    SMS_AUTH_TOKEN: z.string().optional(),

    // Observability & Error Monitoring
    SENTRY_DSN: z.string().optional(),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === 'production') {
      if (data.EMAIL_PROVIDER !== 'mock' && !data.EMAIL_API_KEY) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['EMAIL_API_KEY'],
          message: `EMAIL_API_KEY is required in production when EMAIL_PROVIDER is "${data.EMAIL_PROVIDER}"`,
        });
      }

      if (data.SMS_PROVIDER === 'twilio') {
        if (!data.SMS_ACCOUNT_SID) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['SMS_ACCOUNT_SID'],
            message: 'SMS_ACCOUNT_SID is required in production when SMS_PROVIDER is "twilio"',
          });
        }
        if (!data.SMS_AUTH_TOKEN) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['SMS_AUTH_TOKEN'],
            message: 'SMS_AUTH_TOKEN is required in production when SMS_PROVIDER is "twilio"',
          });
        }
      }
    }
  });

export type EnvConfig = z.infer<typeof envSchema>;

export const parseEnv = (customEnv: Record<string, any> = process.env): EnvConfig => {
  const result = envSchema.safeParse(customEnv);
  if (!result.success) {
    const errorDetails = result.error.issues
      .map((issue) => ` - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    console.error(`❌ Critical Environment Variable Configuration Error:\n${errorDetails}`);
    if (customEnv.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw new Error(`Environment validation failed:\n${errorDetails}`);
  }
  return result.data;
};

export const env = parseEnv();
