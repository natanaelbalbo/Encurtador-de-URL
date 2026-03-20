import { Router } from 'express';
import * as urlController from './url.controller';
import { authenticate } from '../../middlewares/authenticate';
import { validate } from '../../middlewares/validate';
import { createUrlSchema } from './url.schema';
import { rateLimiter } from '../../middlewares/rateLimiter';

const router = Router();

const apiRateLimit = rateLimiter({ windowMs: 60_000, max: 100 });

/**
 * @swagger
 * /api/urls:
 *   post:
 *     tags: [URLs]
 *     summary: Create a shortened URL
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [url]
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *                 example: https://example.com/very-long-url
 *     responses:
 *       201:
 *         description: URL created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', apiRateLimit, authenticate, validate(createUrlSchema), urlController.create);

/**
 * @swagger
 * /api/urls:
 *   get:
 *     tags: [URLs]
 *     summary: List user's URLs with click counts (paginated)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Paginated list of URLs
 *       401:
 *         description: Unauthorized
 */
router.get('/', apiRateLimit, authenticate, urlController.list);

/**
 * @swagger
 * /api/urls/{id}:
 *   delete:
 *     tags: [URLs]
 *     summary: Delete a URL
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: URL deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: URL not found
 */
router.delete('/:id', apiRateLimit, authenticate, urlController.remove);

export default router;
