import { vi, beforeAll, afterAll } from 'vitest';

// Mock environment variables for tests
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_SECRET = 'test-secret-key-12345';
process.env.PORT = '3001';
process.env.NODE_ENV = 'test';
process.env.FRONTEND_URL = 'http://localhost:5173';

// Mock Redis
vi.mock('../src/lib/redis', () => {
  const mockRedis = {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
    incr: vi.fn().mockResolvedValue(1),
    expire: vi.fn().mockResolvedValue(1),
    ttl: vi.fn().mockResolvedValue(60),
    on: vi.fn(),
    quit: vi.fn(),
  };
  return { redis: mockRedis };
});

// Mock Prisma
vi.mock('../src/lib/prisma', () => {
  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    url: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    accessLog: {
      create: vi.fn(),
    },
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  };
  return { prisma: mockPrisma };
});

beforeAll(() => {
  // Any global setup
});

afterAll(() => {
  vi.restoreAllMocks();
});
