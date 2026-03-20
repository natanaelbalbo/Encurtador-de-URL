import { z } from 'zod';

export const createUrlSchema = z.object({
  url: z.string().url('Formato de URL inválido'),
});

export const listUrlsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export type CreateUrlInput = z.infer<typeof createUrlSchema>;
export type ListUrlsQuery = z.infer<typeof listUrlsQuerySchema>;
