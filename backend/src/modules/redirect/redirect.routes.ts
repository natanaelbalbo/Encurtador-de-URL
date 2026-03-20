import { Router } from 'express';
import * as redirectController from './redirect.controller';
import { rateLimiter } from '../../middlewares/rateLimiter';

const router = Router();

const redirectRateLimit = rateLimiter({ windowMs: 60_000, max: 100 });

/**
 * @swagger
 * /{code}:
 *   get:
 *     tags: [Redirect]
 *     summary: Redirecionar para a URL original
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: O código da URL encurtada
 *     responses:
 *       302:
 *         description: Redireciona para a URL original
 *       404:
 *         description: URL encurtada não encontrada
 */
router.get('/:code', redirectRateLimit, redirectController.redirect);

export default router;
