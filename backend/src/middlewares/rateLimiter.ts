import { Request, Response, NextFunction } from 'express';
import { redis } from '../lib/redis';
import { AppError } from './errorHandler';

interface RateLimitOptions {
  windowMs: number;
  max: number;
}

export function rateLimiter({ windowMs, max }: RateLimitOptions) {
  const windowSec = Math.ceil(windowMs / 1000);

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `ratelimit:${ip}:${req.baseUrl || req.path}`;

    try {
      const current = await redis.incr(key);

      if (current === 1) {
        await redis.expire(key, windowSec);
      }

      const ttl = await redis.ttl(key);

      res.set({
        'X-RateLimit-Limit': String(max),
        'X-RateLimit-Remaining': String(Math.max(0, max - current)),
        'X-RateLimit-Reset': String(Math.ceil(Date.now() / 1000) + ttl),
      });

      if (current > max) {
        throw new AppError(429, 'Muitas requisições, tente novamente mais tarde');
      }

      next();
    } catch (err) {
      if (err instanceof AppError) throw err;
      next();
    }
  };
}
