import { prisma } from '../../lib/prisma';
import { redis } from '../../lib/redis';
import { generateCode } from '../../utils/generateCode';
import { AppError } from '../../middlewares/errorHandler';
import { CreateUrlInput, ListUrlsQuery } from './url.schema';

const REDIS_URL_PREFIX = 'url:';
const REDIS_URL_TTL = 3600; // 1 hora

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
    throw new AppError(404, 'URL não encontrada');
  }

  if (url.userId !== userId) {
    throw new AppError(403, 'Você não tem permissão para excluir esta URL');
  }

  await prisma.url.delete({ where: { id: urlId } });

  // Invalidar cache do Redis
  await redis.del(`${REDIS_URL_PREFIX}${url.code}`);
}

export async function resolveUrl(code: string) {
  // 1. Verificar cache do Redis primeiro
  const cached = await redis.get(`${REDIS_URL_PREFIX}${code}`);
  if (cached) {
    return { originalUrl: cached, fromCache: true };
  }

  // 2. Cache miss — consultar PostgreSQL
  const url = await prisma.url.findUnique({
    where: { code },
    select: { id: true, originalUrl: true },
  });

  if (!url) {
    return null;
  }

  // 3. Armazenar no Redis para a próxima vez
  await redis.set(`${REDIS_URL_PREFIX}${code}`, url.originalUrl, 'EX', REDIS_URL_TTL);

  return { originalUrl: url.originalUrl, fromCache: false };
}

export async function trackClick(code: string, ip?: string, userAgent?: string) {
  // Atualizar contagem de cliques e registrar acesso em paralelo
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

export async function getUrlStats(urlId: string, userId: string, days = 7) {
  const url = await prisma.url.findUnique({ where: { id: urlId } });

  if (!url) {
    throw new AppError(404, 'URL não encontrada');
  }

  if (url.userId !== userId) {
    throw new AppError(403, 'Você não tem permissão para visualizar as estatísticas desta URL');
  }

  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const logs = await prisma.accessLog.findMany({
    where: {
      urlId,
      accessedAt: { gte: since },
    },
    select: { accessedAt: true },
    orderBy: { accessedAt: 'asc' },
  });

  // Agrupar por dia
  const statsMap = new Map<string, number>();

  // Preencher todos os dias com 0
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    statsMap.set(d.toISOString().split('T')[0], 0);
  }

  for (const log of logs) {
    const day = log.accessedAt.toISOString().split('T')[0];
    statsMap.set(day, (statsMap.get(day) || 0) + 1);
  }

  return Array.from(statsMap.entries()).map(([date, clicks]) => ({ date, clicks }));
}
