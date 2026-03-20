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
 *     summary: Criar uma URL encurtada
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
 *                 example: https://exemplo.com/url-muito-longa
 *     responses:
 *       201:
 *         description: URL criada com sucesso
 *       400:
 *         description: Erro de validação
 *       401:
 *         description: Não autorizado
 */
router.post('/', apiRateLimit, authenticate, validate(createUrlSchema), urlController.create);

/**
 * @swagger
 * /api/urls:
 *   get:
 *     tags: [URLs]
 *     summary: Listar URLs do usuário com contagem de cliques (paginado)
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
 *         description: Lista paginada de URLs
 *       401:
 *         description: Não autorizado
 */
router.get('/', apiRateLimit, authenticate, urlController.list);

/**
 * @swagger
 * /api/urls/{id}:
 *   delete:
 *     tags: [URLs]
 *     summary: Excluir uma URL
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
 *         description: URL excluída com sucesso
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Proibido
 *       404:
 *         description: URL não encontrada
 */
router.delete('/:id', apiRateLimit, authenticate, urlController.remove);

/**
 * @swagger
 * /api/urls/{id}/stats:
 *   get:
 *     tags: [URLs]
 *     summary: Obter estatísticas de acesso por dia de uma URL
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *     responses:
 *       200:
 *         description: Array com contagem de acessos diários
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Proibido
 *       404:
 *         description: URL não encontrada
 */
router.get('/:id/stats', apiRateLimit, authenticate, urlController.stats);

export default router;
