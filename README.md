# URL Shortener

Mini plataforma de encurtador de URLs com painel de métricas, construída com **TypeScript**, **Node.js**, **PostgreSQL**, **Redis** e **Docker**.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)

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
| **Frontend** | React 19 + Vite + TypeScript + Tailwind CSS v3 + Lucide React |
| **Documentação API** | Swagger (swagger-ui-express + swagger-jsdoc) |
| **Testes** | Vitest + Supertest |
| **CI** | GitHub Actions |
| **Infraestrutura** | Docker Compose (4 serviços) |

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
