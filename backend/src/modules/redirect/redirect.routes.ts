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
 *     summary: Redirect to the original URL
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: The short URL code
 *     responses:
 *       302:
 *         description: Redirects to original URL
 *       404:
 *         description: Short URL not found
 */
router.get('/:code', redirectRateLimit, redirectController.redirect);

export default router;
