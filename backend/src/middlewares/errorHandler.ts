import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: { message: err.message },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        message: 'Erro de validação',
        details: err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
    });
    return;
  }

  // Violação de constraint unique do Prisma
  if ((err as any).code === 'P2002') {
    const target = (err as any).meta?.target;
    res.status(409).json({
      error: { message: `Já existe um registro com este ${target?.[0] || 'campo'}` },
    });
    return;
  }

  if (env.NODE_ENV !== 'production') {
    console.error(err);
  }

  res.status(500).json({
    error: { message: 'Erro interno do servidor' },
  });
}
