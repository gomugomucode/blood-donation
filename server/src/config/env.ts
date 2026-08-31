import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  DATABASE_URL: z.string({
    required_error: 'DATABASE_URL environment variable is required',
  }).min(1, 'DATABASE_URL cannot be empty'),
  JWT_SECRET: z.string({
    required_error: 'JWT_SECRET environment variable is required',
  }).min(32, 'JWT_SECRET must be at least 32 characters for production security'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  ADMIN_EMAIL: z.string().email().default('admin@blooddonation.org'),
  ADMIN_PASSWORD: z.string().min(8).default('AdminSecurePass123!'),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const errorDetails = result.error.issues
      .map((issue) => ` - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    console.error(`❌ Critical Environment Variable Configuration Error:\n${errorDetails}`);
    process.exit(1);
  }
  return result.data;
};

export const env = parseEnv();
