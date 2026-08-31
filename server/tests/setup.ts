import { beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/config/db.js';

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});
