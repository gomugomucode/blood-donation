/**
 * Test Database Safety Policy & Validator
 * 
 * FAIL-CLOSED POLICY:
 * ALLOW LOCAL / DISPOSABLE TEST HOSTS ONLY.
 * DENY ALL REMOTE / MANAGED DATABASE HOSTS BY DEFAULT.
 * 
 * Enforces strict isolation so that automated tests (Vitest) NEVER touch
 * production, staging, or remote managed databases (Supabase, Render, etc.).
 */

export interface DatabaseValidationResult {
  safe: boolean;
  host: string;
  dbName: string;
  port: string;
  reason?: string;
}

export const APPROVED_TEST_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '::1',
  '[::1]',
  'postgres',
  'test-db',
  'testdb',
  'db',
]);

/**
 * Safely extracts host, port, and database name from a connection URL
 * without exposing sensitive credentials (user, password, tokens).
 */
export function sanitizeConnectionUrl(rawUrl: string): { host: string; port: string; dbName: string } {
  if (!rawUrl || typeof rawUrl !== 'string') {
    throw new Error('Database connection URL is empty or not a string.');
  }

  try {
    // Normalise postgresql:// protocol
    const parsed = new URL(rawUrl);
    const host = (parsed.hostname || '').toLowerCase().trim();
    const port = parsed.port || '5432';
    const dbName = parsed.pathname ? parsed.pathname.replace(/^\//, '').split('?')[0] : '';

    return { host, port, dbName };
  } catch (err: any) {
    throw new Error(`Malformed database connection URL: ${err.message}`);
  }
}

/**
 * Validates whether the given environment and database URL are safe for automated test execution.
 * Fails closed on any ambiguity or remote target.
 */
export function validateTestDatabaseTarget(options?: {
  url?: string;
  nodeEnv?: string;
}): DatabaseValidationResult {
  const currentEnv = options?.nodeEnv !== undefined ? options.nodeEnv : (process.env.NODE_ENV || '');
  const targetUrl =
    options?.url !== undefined
      ? options.url
      : (process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || '');

  // 1. Layer 1: Strict NODE_ENV check
  if (currentEnv !== 'test') {
    return {
      safe: false,
      host: 'UNKNOWN',
      port: '',
      dbName: '',
      reason: `NODE_ENV must be explicitly set to "test" (Current: "${currentEnv || 'undefined'}"). Refusing to run tests.`,
    };
  }

  // 2. Layer 2: Missing URL check
  if (!targetUrl || targetUrl.trim() === '') {
    return {
      safe: false,
      host: 'MISSING',
      port: '',
      dbName: '',
      reason: 'No database URL provided (both TEST_DATABASE_URL and DATABASE_URL are empty).',
    };
  }

  // 3. Layer 3: Safe URL parsing (fail closed on malformed)
  let parsed: { host: string; port: string; dbName: string };
  try {
    parsed = sanitizeConnectionUrl(targetUrl);
  } catch (err: any) {
    return {
      safe: false,
      host: 'MALFORMED',
      port: '',
      dbName: '',
      reason: `Connection URL could not be safely parsed: ${err.message}`,
    };
  }

  const { host, port, dbName } = parsed;

  // 4. Layer 4: Explicit Allowlist Matching (Fail closed on any unapproved host)
  if (!APPROVED_TEST_HOSTS.has(host)) {
    return {
      safe: false,
      host,
      port,
      dbName,
      reason: `Host "${host}" is not on the approved test host allowlist. Remote databases are denied by default.`,
    };
  }

  // 5. Layer 5: Known Remote/Production Pattern Defense (Defense in depth)
  const lowerUrl = targetUrl.toLowerCase();
  if (
    lowerUrl.includes('supabase.co') ||
    lowerUrl.includes('supabase.com') ||
    lowerUrl.includes('render.com') ||
    lowerUrl.includes('aws.com') ||
    lowerUrl.includes('neon.tech') ||
    lowerUrl.includes('pooler')
  ) {
    return {
      safe: false,
      host,
      port,
      dbName,
      reason: `Connection string contains signatures of a remote managed provider.`,
    };
  }

  return {
    safe: true,
    host,
    port,
    dbName,
  };
}

/**
 * Asserts that the test database target is safe.
 * Throws a formatted, non-sensitive TEST DATABASE SAFETY ERROR if unsafe.
 */
export function assertTestDatabaseSafe(options?: {
  url?: string;
  nodeEnv?: string;
}): void {
  const result = validateTestDatabaseTarget(options);

  if (!result.safe) {
    const errorMsg = [
      '',
      '================================================================================',
      'TEST DATABASE SAFETY ERROR',
      '================================================================================',
      'Vitest attempted to execute against a non-approved or remote database.',
      '',
      'Tests have been aborted BEFORE any database connection, cleanup, or write occurred.',
      '',
      'Approved test hosts:',
      ...Array.from(APPROVED_TEST_HOSTS).map((h) => `  - ${h}`),
      '',
      `Detected host:     ${result.host || 'UNKNOWN'}`,
      `Detected port:     ${result.port || 'DEFAULT'}`,
      `Detected database: ${result.dbName || 'UNKNOWN'}`,
      `Safety rejection:  ${result.reason || 'Remote database denied by default.'}`,
      '',
      'Remediation:',
      '  1. Configure a local disposable PostgreSQL instance (e.g. localhost:5432).',
      '  2. Set TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/blood_donation_test?schema=public".',
      '  3. Ensure NODE_ENV=test is set in your test command or environment.',
      '================================================================================',
      '',
    ].join('\n');

    throw new Error(errorMsg);
  }
}
