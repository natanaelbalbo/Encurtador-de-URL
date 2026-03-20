import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/lib/prisma';
import { redis } from '../src/lib/redis';
import jwt from 'jsonwebtoken';

const mockPrisma = vi.mocked(prisma);
const mockRedis = vi.mocked(redis);

function createToken(userId = 'uuid-1', email = 'test@example.com') {
  return jwt.sign({ sub: userId, email }, process.env.JWT_SECRET!);
}

describe('URL Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/urls', () => {
    it('should create a shortened URL and return 201', async () => {
      const token = createToken();
      mockPrisma.url.create.mockResolvedValue({
        id: 'url-1',
        code: 'abc12345',
        originalUrl: 'https://example.com',
        clickCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'uuid-1',
      });

      const res = await request(app)
        .post('/api/urls')
        .set('Authorization', `Bearer ${token}`)
        .send({ url: 'https://example.com' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('code');
      expect(res.body).toHaveProperty('originalUrl', 'https://example.com');
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app)
        .post('/api/urls')
        .send({ url: 'https://example.com' });

      expect(res.status).toBe(401);
    });

    it('should return 400 for invalid URL', async () => {
      const token = createToken();

      const res = await request(app)
        .post('/api/urls')
        .set('Authorization', `Bearer ${token}`)
        .send({ url: 'not-a-url' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/urls', () => {
    it('should return paginated list of user URLs', async () => {
      const token = createToken();
      const urls = [
        {
          id: 'url-1',
          code: 'abc12345',
          originalUrl: 'https://example.com',
          clickCount: 5,
          createdAt: new Date(),
        },
      ];

      mockPrisma.url.findMany.mockResolvedValue(
        urls.map((u) => ({ ...u, updatedAt: new Date(), userId: 'uuid-1' })),
      );
      mockPrisma.url.count.mockResolvedValue(1);

      const res = await request(app)
        .get('/api/urls?page=1&limit=10')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
      expect(res.body.meta.total).toBe(1);
      expect(res.body.data).toHaveLength(1);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).get('/api/urls');
      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/urls/:id', () => {
    it('should delete a URL and return 204', async () => {
      const token = createToken();
      mockPrisma.url.findUnique.mockResolvedValue({
        id: 'url-1',
        code: 'abc12345',
        originalUrl: 'https://example.com',
        clickCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'uuid-1',
      });
      mockPrisma.url.delete.mockResolvedValue({
        id: 'url-1',
        code: 'abc12345',
        originalUrl: 'https://example.com',
        clickCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'uuid-1',
      });

      const res = await request(app)
        .delete('/api/urls/url-1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(204);
      expect(mockRedis.del).toHaveBeenCalledWith('url:abc12345');
    });

    it('should return 403 when deleting another user URL', async () => {
      const token = createToken('uuid-1');
      mockPrisma.url.findUnique.mockResolvedValue({
        id: 'url-1',
        code: 'abc12345',
        originalUrl: 'https://example.com',
        clickCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'uuid-other',
      });

      const res = await request(app)
        .delete('/api/urls/url-1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it('should return 404 for non-existent URL', async () => {
      const token = createToken();
      mockPrisma.url.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .delete('/api/urls/nonexistent')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /:code (redirect)', () => {
    it('should redirect to original URL with 302 (cache miss)', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.url.findUnique
        .mockResolvedValueOnce({
          id: 'url-1',
          originalUrl: 'https://example.com',
          code: 'abc12345',
          clickCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: 'uuid-1',
        })
        .mockResolvedValueOnce({
          id: 'url-1',
          originalUrl: 'https://example.com',
          code: 'abc12345',
          clickCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: 'uuid-1',
        });

      const res = await request(app).get('/abc12345');

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('https://example.com');
      expect(mockRedis.set).toHaveBeenCalled();
    });

    it('should redirect using Redis cache (cache hit)', async () => {
      mockRedis.get.mockResolvedValue('https://cached.com');
      mockPrisma.url.findUnique.mockResolvedValue({
        id: 'url-1',
        originalUrl: 'https://cached.com',
        code: 'cached12',
        clickCount: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'uuid-1',
      });

      const res = await request(app).get('/cached12');

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('https://cached.com');
    });

    it('should return 404 for unknown code', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.url.findUnique.mockResolvedValue(null);

      const res = await request(app).get('/unknown1');

      expect(res.status).toBe(404);
    });
  });
});
