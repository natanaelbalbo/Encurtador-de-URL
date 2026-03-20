# 🔗 URL Shortener — Desafio Fullstack

Mini plataforma de encurtador de URLs com painel de métricas, construída com **TypeScript**, **Node.js**, **PostgreSQL**, **Redis** e **Docker**.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)

---

## Como Rodar o Projeto

### Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) e [Docker Compose](https://docs.docker.com/compose/install/) instalados

### Subindo com Docker (recomendado)

```bash
# 1. Clone o repositório
git clone https://github.com/natanaelbalbo/Encurtador-de-URL.git
cd Encurtador-de-URL

# 2. (Opcional) Copie e ajuste as variáveis de ambiente
cp .env.example .env

# 3. Suba toda a stack com um único comando
docker compose up --build
```

Acesse:
- **Frontend**: http://localhost
- **API**: http://localhost:3000
- **Swagger Docs**: http://localhost:3000/api-docs

### Rodando localmente (desenvolvimento)

```bash
# Suba apenas PostgreSQL e Redis
docker compose up postgres redis -d

# Backend
cd backend
cp ../.env.example ../.env  # ajuste DATABASE_URL se necessário
npm install
npx prisma migrate dev
npm run dev

# Frontend (outro terminal)
cd frontend
npm install
npm run dev
```

---

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| **Backend** | Express + TypeScript |
| **ORM / Migrations** | Prisma |
| **Banco de dados** | PostgreSQL 16 |
| **Cache** | Redis 7 |
| **Validação** | Zod |
| **Autenticação** | JWT (jsonwebtoken + bcrypt) |
| **Frontend** | React 19 + Vite + TypeScript |
| **Estilização** | Tailwind CSS |
| **Documentação API** | Swagger (swagger-ui-express + swagger-jsdoc) |
| **Testes** | Vitest + Supertest |
| **CI** | GitHub Actions |
| **Infraestrutura** | Docker Compose (4 serviços) |

---

## Decisões Técnicas

### 1. Express como framework HTTP
Optei pelo Express pela familiaridade e ecossistema maduro. Para um desafio de 5 dias, a simplicidade e vasta documentação permitem focar na lógica de negócio em vez de configuração do framework.

### 2. Prisma como ORM
O Prisma oferece excelente DX (Developer Experience): schema declarativo, migrations automáticas, type-safety completa que se integra naturalmente com TypeScript, e boa documentação. O trade-off de performance em queries complexas não se aplica neste projeto.

### 3. `clickCount` desnormalizado na tabela `urls`
Em vez de fazer `COUNT(*)` na tabela `access_logs` a cada listagem, mantenho um counter desnormalizado. **Trade-off consciente**: a escrita é levemente mais cara (incremento atômico), mas a leitura na listagem é muito mais rápida — especialmente com muitos registros de acesso.

### 4. Tabela `access_logs` separada
Embora o `clickCount` resolva a listagem, manter os logs de acesso individuais permite métricas futuras por dia/hora sem perder granularidade. O índice composto `(urlId, accessedAt)` otimiza queries de analytics.

### 5. Redis com propósito real (não apenas "para constar")

**Cache de redirecionamento:**
- Fluxo `GET /:code`: Redis HIT → redireciona sem tocar no banco / MISS → busca no PostgreSQL → grava no Redis → redireciona
- TTL de 1 hora. Invalidação ao deletar URL
- Impacto real: em URLs populares, elimina 100% dos hits no banco após o primeiro acesso

**Rate Limiting:**
- Sliding window counter via `INCR` + `EXPIRE`
- 100 req/min para API geral, 20 req/min para endpoints de autenticação
- Headers padrão: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Fail-open: se Redis cair, as requisições passam (não bloqueia a aplicação)

### 6. nanoid para short codes
Gera códigos URL-safe de 8 caracteres com alfabeto customizado (sem caracteres ambíguos como `0/O`, `1/l/I`). Baixa probabilidade de colisão e mais compacto que UUID.

### 7. Prefixo `/api` nas rotas
Evita colisão entre o redirecionamento `GET /:code` e as rotas da API. O nginx resolve isso em produção fazendo proxy seletivo.

### 8. Multi-stage Dockerfiles
Imagens finais menores e mais seguras: o build acontece em um estágio e apenas os artefatos de produção vão para a imagem final (sem `devDependencies`, sem código-fonte TypeScript).

### 9. nginx como servidor do frontend
Serve a SPA (Single Page Application) e faz proxy reverso para o backend. Isso elimina problemas de CORS em produção e permite que o front use caminhos relativos (`/api/...`).

### 10. Zod para validação
Validação type-safe em runtime, coerente com TypeScript. Usado tanto nos endpoints da API quanto na validação de variáveis de ambiente (`config/env.ts`).

---

## Estrutura do Projeto

```
/
├── docker-compose.yml          # Orquestra toda a stack
├── .env.example                # Template de variáveis de ambiente
├── .github/workflows/ci.yml   # CI com GitHub Actions
│
├── backend/
│   ├── Dockerfile              # Multi-stage build
│   ├── entrypoint.sh           # Roda migrations antes de iniciar
│   ├── prisma/
│   │   └── schema.prisma       # Modelos: User, Url, AccessLog
│   ├── src/
│   │   ├── app.ts              # Configura Express (middlewares, rotas)
│   │   ├── server.ts           # Entry point
│   │   ├── config/env.ts       # Validação de env vars com Zod
│   │   ├── lib/                # Singletons (Prisma, Redis)
│   │   ├── modules/
│   │   │   ├── auth/           # Register, Login, JWT
│   │   │   ├── url/            # CRUD de URLs + resolução + cache
│   │   │   └── redirect/       # GET /:code → 302
│   │   ├── middlewares/        # Auth, Validate, RateLimiter, ErrorHandler
│   │   └── utils/              # generateCode (nanoid)
│   └── tests/                  # Vitest + Supertest (18 testes)
│
└── frontend/
    ├── Dockerfile              # Multi-stage (Vite build → nginx)
    ├── nginx.conf              # Proxy reverso + SPA fallback
    └── src/
        ├── api/client.ts       # Axios com interceptor JWT
        ├── contexts/           # AuthContext (login/register/logout)
        ├── pages/              # Login, Register, Dashboard
        └── components/         # Layout, UrlForm, UrlList
```

---

## API Endpoints

| Método | Rota | Auth | Descrição | Status Codes |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | Não | Cadastro de usuário | 201, 400, 409 |
| `POST` | `/api/auth/login` | Não | Login (retorna JWT) | 200, 400, 401 |
| `POST` | `/api/urls` | JWT | Cria URL encurtada | 201, 400, 401 |
| `GET` | `/api/urls?page=1&limit=10` | JWT | Lista URLs do usuário (paginado) | 200, 401 |
| `DELETE` | `/api/urls/:id` | JWT | Remove uma URL | 204, 401, 403, 404 |
| `GET` | `/:code` | Não | Redireciona para URL original | 302, 404 |

Documentação interativa: **Swagger UI** disponível em `/api-docs`.

---

## Diferenciais Implementados

- ✅ **Testes** — 18 testes cobrindo auth, CRUD de URLs e redirecionamento (Vitest + Supertest)
- ✅ **Rate Limiting via Redis** — Sliding window com headers padrão e fail-open
- ✅ **Paginação** — Listagem paginada com meta dados (`page`, `limit`, `total`, `totalPages`)
- ✅ **CI** — GitHub Actions rodando testes do backend e build do frontend
- ✅ **Swagger** — Documentação OpenAPI 3.0 com swagger-ui-express

---

## O que Faria com Mais Tempo

- **Gráfico de acessos por dia** — A tabela `access_logs` já existe; bastaria agrupar por dia e renderizar com Chart.js/Recharts no dashboard
- **Testes E2E** — Playwright para testar o fluxo completo (register → login → encurtar → clicar → ver contagem)
- **Custom aliases** — Permitir que o usuário escolha o código da URL (ex: `/meu-link`)
- **Expiração de URLs** — Campo `expiresAt` na tabela, com job para limpeza periódica
- **Logs estruturados** — Pino ou Winston para logs em formato JSON, facilitando observabilidade
- **Monitoramento** — Health-check endpoint completo (DB + Redis status), métricas Prometheus
- **Deploy em cloud** — Fly.io ou Railway com CI/CD automático
- **Analytics avançados** — Geolocalização por IP, breakdown por device/browser
