# Quickstart: Login no Sistema

**Feature**: Login no Sistema
**Date**: 2025-01-27
**Phase**: 1 - Design & Contracts

## Overview

Este guia fornece instruções rápidas para implementar o endpoint de login usando Fastify e Better Auth.

## Prerequisites

- Node.js/Bun runtime instalado
- PostgreSQL rodando (via Docker Compose)
- Dependências do projeto instaladas (`bun install`)

## Installation

### 1. Instalar Dependências

```bash
cd apps/backend
bun add fastify @fastify/cors better-auth
bun add -d @types/node
```

### 2. Configurar Variáveis de Ambiente

Criar/atualizar `apps/backend/.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/lw-financial"
BETTER_AUTH_SECRET="your-secret-key-here-min-32-chars"
BETTER_AUTH_URL="http://localhost:3001"
PORT=3001
```

**Importante**: Gerar um secret seguro para `BETTER_AUTH_SECRET`:

```bash
openssl rand -base64 32
```

## Implementation Steps

### Step 1: Criar Schema de Validação

Criar `packages/shared/src/schemas/auth.ts`:

```typescript
import { z } from 'zod';

export const loginSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(
      /^[a-zA-Z0-9]+$/,
      'Username must contain only alphanumeric characters'
    ),
  pass: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginRequest = z.infer<typeof loginSchema>;
```

### Step 2: Configurar Better Auth

Criar `apps/backend/src/auth/better-auth.ts`:

```typescript
import { betterAuth } from 'better-auth';

export const auth = betterAuth({
  database: {
    // Não requerido nesta fase (credenciais hardcoded)
  },
  emailAndPassword: {
    enabled: true,
  },
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3001',
  trustedOrigins: ['http://localhost:3000', 'http://localhost:3001'],
});
```

### Step 3: Criar Middleware de Validação

Criar `apps/backend/src/middleware/validation.ts`:

```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import { loginSchema } from '@lw-financial/shared';

export async function validateLogin(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const body = request.body as any;
    loginSchema.parse(body);
  } catch (error) {
    reply.status(400).send({
      error: error instanceof Error ? error.message : 'Invalid request format',
    });
    return false;
  }
  return true;
}
```

### Step 4: Implementar Rota Fastify

Criar `apps/backend/src/auth/routes.ts`:

```typescript
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { auth } from './better-auth';
import { validateLogin } from '../middleware/validation';

// Credenciais hardcoded
const HARDCODED_CREDENTIALS = {
  username: 'admin',
  password: 'admin123',
};

export async function loginRoutes(fastify: FastifyInstance) {
  // Rota de autenticação Better Auth
  fastify.route({
    method: ['GET', 'POST'],
    url: '/api/auth/*',
    async handler(request: FastifyRequest, reply: FastifyReply) {
      try {
        const url = new URL(request.url, `http://${request.headers.host}`);

        const headers = new Headers();
        Object.entries(request.headers).forEach(([key, value]) => {
          if (value) headers.append(key, value.toString());
        });

        const req = new Request(url.toString(), {
          method: request.method,
          headers,
          body: request.body ? JSON.stringify(request.body) : undefined,
        });

        const response = await auth.handler(req);

        reply.status(response.status);
        response.headers.forEach((value, key) => reply.header(key, value));
        reply.send(response.body ? await response.text() : null);
      } catch (error) {
        fastify.log.error('Authentication Error:', error);
        reply.status(500).send({
          error: 'Internal authentication error',
          code: 'AUTH_FAILURE',
        });
      }
    },
  });

  // Rota de login customizada
  fastify.post(
    '/login',
    {
      preHandler: validateLogin,
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { username, pass } = request.body as {
        username: string;
        pass: string;
      };

      // Verificar credenciais hardcoded
      if (
        username !== HARDCODED_CREDENTIALS.username ||
        pass !== HARDCODED_CREDENTIALS.password
      ) {
        return reply.status(403).send({
          error: 'Invalid credentials',
        });
      }

      // Gerar token JWT via Better Auth
      // (Implementação específica depende da API do Better Auth)
      const token = 'generated-jwt-token'; // Placeholder

      reply.status(200).send({ token });
    }
  );
}
```

### Step 5: Migrar Servidor para Fastify

Atualizar `apps/backend/src/index.ts`:

```typescript
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { loginRoutes } from './auth/routes';

const fastify = Fastify({ logger: true });

// Configurar CORS
fastify.register(cors, {
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
});

// Registrar rotas
fastify.register(loginRoutes);

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

const PORT = process.env.PORT || 3001;

fastify.listen({ port: Number(PORT) }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log(`Backend server running on http://localhost:${PORT}`);
});
```

## Testing

### Teste Manual com cURL

```bash
# Login bem-sucedido
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","pass":"admin123"}'

# Resposta esperada:
# {"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}

# Erro: formato inválido
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{"username":"ab","pass":"admin123"}'

# Resposta esperada:
# {"error":"Username must be at least 3 characters"}

# Erro: campo ausente
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin"}'

# Resposta esperada:
# {"error":"Password must be at least 6 characters"}
```

### Teste com Método HTTP Inválido

```bash
# Deve retornar 405 Method Not Allowed
curl -X GET http://localhost:3001/login

# Resposta esperada:
# {"error":"Method not allowed. Use POST"}
# Header: Allow: POST
```

## Next Steps

1. Implementar geração de token JWT real via Better Auth
2. Adicionar testes unitários e de integração
3. Implementar tratamento de credenciais inválidas (US-003)
4. Adicionar proteção de rotas autenticadas (US-002)

## Troubleshooting

### Erro: "BETTER_AUTH_SECRET is required"

- Verificar se variável de ambiente está configurada
- Gerar novo secret com `openssl rand -base64 32`

### Erro: "Cannot find module '@lw-financial/shared'"

- Executar `bun install` na raiz do lw-financial
- Verificar se `packages/shared` está no workspace

### Erro: CORS bloqueando requisições

- Verificar `trustedOrigins` no Better Auth config
- Verificar configuração do `@fastify/cors`

## References

- [Better Auth Fastify Integration](https://www.better-auth.com/docs/integrations/fastify)
- [Fastify Documentation](https://www.fastify.io/)
- [OpenAPI Contract](./contracts/login-api.yaml)
