import { prisma } from '../../lib/prisma';
import { redis } from '../../lib/redis';
import { generateCode } from '../../utils/generateCode';
import { AppError } from '../../middlewares/errorHandler';
import { CreateUrlInput, ListUrlsQuery } from './url.schema';

const REDIS_URL_PREFIX = 'url:';
const REDIS_URL_TTL = 3600; // 1 hour

export async function createUrl(input: CreateUrlInput, userId: string) {
  const code = generateCode();

  const url = await prisma.url.create({
    data: {
      code,
      originalUrl: input.url,
      userId,
    },
    select: {
      id: true,
      code: true,
      originalUrl: true,
      clickCount: true,
      createdAt: true,
    },
  });

  return url;
}

export async function listUrls(userId: string, query: ListUrlsQuery) {
  const { page, limit } = query;
  const skip = (page - 1) * limit;

  const [urls, total] = await Promise.all([
    prisma.url.findMany({
      where: { userId },
      select: {
        id: true,
        code: true,
        originalUrl: true,
        clickCount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.url.count({ where: { userId } }),
  ]);

  return {
    data: urls,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function deleteUrl(urlId: string, userId: string) {
  const url = await prisma.url.findUnique({ where: { id: urlId } });

  if (!url) {
    throw new AppError(404, 'URL not found');
  }

  if (url.userId !== userId) {
    throw new AppError(403, 'You do not have permission to delete this URL');
  }

  await prisma.url.delete({ where: { id: urlId } });

  // Invalidate Redis cache
  await redis.del(`${REDIS_URL_PREFIX}${url.code}`);
}

export async function resolveUrl(code: string) {
  // 1. Check Redis cache first
  const cached = await redis.get(`${REDIS_URL_PREFIX}${code}`);
  if (cached) {
    return { originalUrl: cached, fromCache: true };
  }

  // 2. Cache miss — query PostgreSQL
  const url = await prisma.url.findUnique({
    where: { code },
    select: { id: true, originalUrl: true },
  });

  if (!url) {
    return null;
  }

  // 3. Store in Redis for next time
  await redis.set(`${REDIS_URL_PREFIX}${code}`, url.originalUrl, 'EX', REDIS_URL_TTL);

  return { originalUrl: url.originalUrl, fromCache: false };
}

export async function trackClick(code: string, ip?: string, userAgent?: string) {
  // Update click count and log access in parallel
  const url = await prisma.url.findUnique({ where: { code }, select: { id: true } });
  if (!url) return;

  await Promise.all([
    prisma.url.update({
      where: { code },
      data: { clickCount: { increment: 1 } },
    }),
    prisma.accessLog.create({
      data: {
        urlId: url.id,
        ip,
        userAgent,
      },
    }),
  ]);
}
