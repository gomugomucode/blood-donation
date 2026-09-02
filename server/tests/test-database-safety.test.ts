import { describe, it, expect } from 'vitest';
import {
  validateTestDatabaseTarget,
  assertTestDatabaseSafe,
  sanitizeConnectionUrl,
} from '../src/config/test-database-safety.js';

describe('Test Database Safety Guard & Policy Hardening', () => {
  describe('1. Credential Sanitization & Safe Parsing', () => {
    it('should parse host, port, and database name without exposing credentials', () => {
      const sanitized = sanitizeConnectionUrl(
        'postgresql://super_secret_user:super_secret_password_123!@localhost:5432/blood_donation_test?schema=public'
      );
      expect(sanitized.host).toBe('localhost');
      expect(sanitized.port).toBe('5432');
      expect(sanitized.dbName).toBe('blood_donation_test');
      expect(JSON.stringify(sanitized)).not.toContain('super_secret_user');
      expect(JSON.stringify(sanitized)).not.toContain('super_secret_password_123!');
    });

    it('should throw on malformed connection URL string', () => {
      expect(() => sanitizeConnectionUrl('not_a_valid_url')).toThrow(/Malformed database connection URL/);
    });

    it('should throw on empty connection URL string', () => {
      expect(() => sanitizeConnectionUrl('')).toThrow(/Database connection URL is empty/);
    });
  });

  describe('2. Negative Tests: Strict Rejection of Remote & Production Hosts', () => {
    it('should reject Supabase direct connection', () => {
      const result = validateTestDatabaseTarget({
        nodeEnv: 'test',
        url: 'postgresql://postgres:secretpassword@db.sqmgmlxcsgpkqiblklrh.supabase.co:5432/postgres',
      });
      expect(result.safe).toBe(false);
      expect(result.host).toBe('db.sqmgmlxcsgpkqiblklrh.supabase.co');
      expect(result.reason).toContain('not on the approved test host allowlist');
    });

    it('should reject Supabase transaction pooler (port 6543)', () => {
      const result = validateTestDatabaseTarget({
        nodeEnv: 'test',
        url: 'postgresql://postgres.sqmgmlxcsgpkqiblklrh:secretpassword@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
      });
      expect(result.safe).toBe(false);
      expect(result.host).toBe('aws-0-ap-southeast-1.pooler.supabase.com');
      expect(result.reason).toContain('not on the approved test host allowlist');
    });

    it('should reject Render managed PostgreSQL', () => {
      const result = validateTestDatabaseTarget({
        nodeEnv: 'test',
        url: 'postgresql://blood_donation_db_l85y_user:secretpassword@dpg-daascrbtqb8s73e389b0-a.oregon-postgres.render.com/blood_donation_db_l85y?sslmode=require',
      });
      expect(result.safe).toBe(false);
      expect(result.host).toBe('dpg-daascrbtqb8s73e389b0-a.oregon-postgres.render.com');
      expect(result.reason).toContain('not on the approved test host allowlist');
    });

    it('should reject generic remote PostgreSQL hostname', () => {
      const result = validateTestDatabaseTarget({
        nodeEnv: 'test',
        url: 'postgresql://dbuser:secret@database.production-hospital-network.org:5432/live_blood_bank',
      });
      expect(result.safe).toBe(false);
      expect(result.host).toBe('database.production-hospital-network.org');
      expect(result.reason).toContain('not on the approved test host allowlist');
    });

    it('should reject public remote IP address', () => {
      const result = validateTestDatabaseTarget({
        nodeEnv: 'test',
        url: 'postgresql://postgres:secret@198.51.100.42:5432/postgres',
      });
      expect(result.safe).toBe(false);
      expect(result.host).toBe('198.51.100.42');
      expect(result.reason).toContain('not on the approved test host allowlist');
    });

    it('should reject managed cloud PostgreSQL hostname (AWS RDS / Aurora)', () => {
      const result = validateTestDatabaseTarget({
        nodeEnv: 'test',
        url: 'postgresql://admin:secret@hemacare-prod.c3b9x.us-east-1.rds.amazonaws.com:5432/hemacare',
      });
      expect(result.safe).toBe(false);
      expect(result.host).toBe('hemacare-prod.c3b9x.us-east-1.rds.amazonaws.com');
      expect(result.reason).toContain('not on the approved test host allowlist');
    });

    it('should reject Neon serverless PostgreSQL hostname', () => {
      const result = validateTestDatabaseTarget({
        nodeEnv: 'test',
        url: 'postgresql://user:secret@ep-cool-fog-123456.us-east-2.aws.neon.tech/neondb',
      });
      expect(result.safe).toBe(false);
      expect(result.host).toBe('ep-cool-fog-123456.us-east-2.aws.neon.tech');
      expect(result.reason).toContain('not on the approved test host allowlist');
    });

    it('should fail closed when database URL is missing or empty', () => {
      const result = validateTestDatabaseTarget({
        nodeEnv: 'test',
        url: '',
      });
      expect(result.safe).toBe(false);
      expect(result.reason).toContain('No database URL provided');
    });

    it('should fail closed when connection URL is malformed', () => {
      const result = validateTestDatabaseTarget({
        nodeEnv: 'test',
        url: 'invalid_connection_string',
      });
      expect(result.safe).toBe(false);
      expect(result.reason).toContain('could not be safely parsed');
    });

    it('should fail closed when NODE_ENV is production', () => {
      const result = validateTestDatabaseTarget({
        nodeEnv: 'production',
        url: 'postgresql://postgres:postgres@localhost:5432/blood_donation_test',
      });
      expect(result.safe).toBe(false);
      expect(result.reason).toContain('NODE_ENV must be explicitly set to "test"');
    });

    it('should fail closed when NODE_ENV is development', () => {
      const result = validateTestDatabaseTarget({
        nodeEnv: 'development',
        url: 'postgresql://postgres:postgres@localhost:5432/blood_donation_test',
      });
      expect(result.safe).toBe(false);
      expect(result.reason).toContain('NODE_ENV must be explicitly set to "test"');
    });

    it('should throw formatted TEST DATABASE SAFETY ERROR on assertion failure', () => {
      expect(() => {
        assertTestDatabaseSafe({
          nodeEnv: 'test',
          url: 'postgresql://user:pass@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres',
        });
      }).toThrow(/TEST DATABASE SAFETY ERROR/);
    });
  });

  describe('3. Positive Tests: Allow Approved Local & Disposable Test Hosts', () => {
    it('should allow localhost with test database', () => {
      const result = validateTestDatabaseTarget({
        nodeEnv: 'test',
        url: 'postgresql://postgres:password@localhost:5432/blood_donation_test?schema=public',
      });
      expect(result.safe).toBe(true);
      expect(result.host).toBe('localhost');
      expect(result.dbName).toBe('blood_donation_test');
    });

    it('should allow IPv4 loopback 127.0.0.1 with test database', () => {
      const result = validateTestDatabaseTarget({
        nodeEnv: 'test',
        url: 'postgresql://postgres:password@127.0.0.1:5432/blood_donation_test?schema=public',
      });
      expect(result.safe).toBe(true);
      expect(result.host).toBe('127.0.0.1');
      expect(result.dbName).toBe('blood_donation_test');
    });

    it('should allow IPv6 loopback ::1 with test database', () => {
      const result = validateTestDatabaseTarget({
        nodeEnv: 'test',
        url: 'postgresql://postgres:password@[::1]:5432/blood_donation_test',
      });
      expect(result.safe).toBe(true);
      expect(result.host).toBe('[::1]');
      expect(result.dbName).toBe('blood_donation_test');
    });

    it('should allow Docker container service hostname "postgres"', () => {
      const result = validateTestDatabaseTarget({
        nodeEnv: 'test',
        url: 'postgresql://postgres:postgrespassword@postgres:5432/blood_donation_test',
      });
      expect(result.safe).toBe(true);
      expect(result.host).toBe('postgres');
      expect(result.dbName).toBe('blood_donation_test');
    });

    it('should allow Docker container service hostname "test-db"', () => {
      const result = validateTestDatabaseTarget({
        nodeEnv: 'test',
        url: 'postgresql://postgres:postgrespassword@test-db:5432/blood_donation_test',
      });
      expect(result.safe).toBe(true);
      expect(result.host).toBe('test-db');
      expect(result.dbName).toBe('blood_donation_test');
    });

    it('should not throw on assertTestDatabaseSafe with valid local target', () => {
      expect(() => {
        assertTestDatabaseSafe({
          nodeEnv: 'test',
          url: 'postgresql://postgres:postgres@localhost:5432/blood_donation_test',
        });
      }).not.toThrow();
    });
  });
});
