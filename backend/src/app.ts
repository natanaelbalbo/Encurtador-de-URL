import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './config/env';
import { errorHandler } from './middlewares/errorHandler';
import authRoutes from './modules/auth/auth.routes';
import urlRoutes from './modules/url/url.routes';
import redirectRoutes from './modules/redirect/redirect.routes';

const app = express();

// Segurança & parsing
app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(express.json());

// Confiar no proxy para IP correto no rate limiter
app.set('trust proxy', 1);

// Documentação Swagger
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Encurtador de URL',
      version: '1.0.0',
      description: 'Uma plataforma mini de encurtamento de URLs com métricas',
    },
    servers: [{ url: `http://localhost:${env.PORT}` }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/modules/**/*.routes.ts'],
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/urls', urlRoutes);

// Verificação de saúde
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Rota de redirecionamento (deve ser a última — captura /:code)
app.use('/', redirectRoutes);

// Tratamento global de erros
app.use(errorHandler);

export default app;
