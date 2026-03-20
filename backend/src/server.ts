import app from './app';
import { env } from './config/env';
import { prisma } from './lib/prisma';

async function main() {
  await prisma.$connect();
  console.log('Conectado ao PostgreSQL');

  app.listen(env.PORT, () => {
    console.log(`Servidor rodando em http://localhost:${env.PORT}`);
    console.log(`Documentação Swagger em http://localhost:${env.PORT}/api-docs`);
  });
}

main().catch((err) => {
  console.error('Falha ao iniciar o servidor:', err);
  process.exit(1);
});
