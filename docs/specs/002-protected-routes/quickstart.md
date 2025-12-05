# Quickstart: Protected Routes Authentication

**Feature**: Protected Routes Authentication
**Date**: 2025-12-02
**Phase**: 1 - Design & Contracts

## Overview

Este guia fornece instruções rápidas para implementar o middleware de autenticação para proteger rotas da API usando validação de tokens JWT.

## Prerequisites

- Node.js/Bun runtime instalado
- Sistema de login (US-001) implementado e funcionando
- Tokens JWT sendo gerados corretamente pelo sistema de login
- Dependências do projeto instaladas (`bun install`)

## Installation

### 1. Verificar Dependências

A biblioteca `jsonwebtoken` já deve estar instalada (usada na US-001):

```bash
cd apps/backend
bun list | grep jsonwebtoken
```

Se não estiver instalada:

```bash
bun add jsonwebtoken
bun add -d @types/jsonwebtoken
```

### 2. Configurar Variáveis de Ambiente

Verificar que `BETTER_AUTH_SECRET` está configurado em `apps/backend/.env`:

```env
BETTER_AUTH_SECRET="your-secret-key-here-min-32-chars"
```

**Importante**: Deve ser o mesmo secret usado na geração de tokens (US-001).

## Implementation Steps

### Step 1: Criar Middleware de Autenticação

Criar `apps/backend/src/middleware/authentication.ts`:

```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    userId: string;
    username?: string;
    email?: string;
    [key: string]: unknown;
  };
}

export async function authenticateRequest(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<boolean> {
  try {
    // Extrair header Authorization
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      reply.status(401).send({
        error: 'Authentication required',
      });
      return false;
    }

    // Verificar formato Bearer
    if (!authHeader.startsWith('Bearer ')) {
      reply.status(401).send({
        error: 'Invalid authorization format',
      });
      return false;
    }

    // Extrair token
    const token = authHeader.substring(7).trim();

    if (!token) {
      reply.status(401).send({
        error: 'Invalid or expired token',
      });
      return false;
    }

    // Validar token JWT
    const secret = process.env.BETTER_AUTH_SECRET!;

    try {
      const decoded = jwt.verify(token, secret, {
        algorithms: ['HS256'],
      }) as jwt.JwtPayload;

      // Adicionar informações do usuário ao request
      (request as AuthenticatedRequest).user = {
        userId: decoded.userId as string,
        username: decoded.username as string,
        email: decoded.email as string,
        ...decoded,
      };

      return true;
    } catch (error) {
      // Token inválido, expirado ou com assinatura incorreta
      reply.status(401).send({
        error: 'Invalid or expired token',
      });
      return false;
    }
  } catch (error) {
    request.log.error({ err: error }, 'Authentication error');
    reply.status(401).send({
      error: 'Authentication required',
    });
    return false;
  }
}
```

### Step 2: Aplicar Middleware a Rotas Protegidas

#### Opção A: Middleware Global (para todas as rotas)

Em `apps/backend/src/index.ts`:

```typescript
import { authenticateRequest } from './middleware/authentication';

// Aplicar a todas as rotas (exceto rotas públicas)
fastify.addHook('preHandler', async (request, reply) => {
  // Lista de rotas públicas (exemplo)
  const publicRoutes = ['/login', '/api/auth'];

  if (publicRoutes.some((route) => request.url.startsWith(route))) {
    return; // Pular autenticação para rotas públicas
  }

  // Aplicar autenticação
  const authenticated = await authenticateRequest(request, reply);
  if (!authenticated) {
    return; // Resposta já enviada pelo middleware
  }
});
```

#### Opção B: Middleware por Rota (recomendado)

Criar plugin para rotas protegidas:

```typescript
// apps/backend/src/plugins/protected-routes.ts
import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateRequest } from '../middleware/authentication';

export async function protectedRoutesPlugin(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // Aplicar autenticação a todas as rotas neste plugin
  fastify.addHook('preHandler', async (request, reply) => {
    const authenticated = await authenticateRequest(request, reply);
    if (!authenticated) {
      return; // Resposta já enviada pelo middleware
    }
  });

  // Registrar rotas protegidas aqui
  // fastify.get('/api/users', async (request, reply) => { ... });
}
```

Registrar plugin em `apps/backend/src/index.ts`:

```typescript
import { protectedRoutesPlugin } from './plugins/protected-routes';

// Registrar rotas protegidas
await fastify.register(protectedRoutesPlugin, {
  prefix: '/api',
});
```

### Step 3: Usar Informações do Usuário nas Rotas

Em rotas protegidas, acessar informações do usuário:

```typescript
import { AuthenticatedRequest } from '../middleware/authentication';

fastify.get('/api/profile', async (request: AuthenticatedRequest, reply) => {
  const userId = request.user?.userId;
  const username = request.user?.username;

  // Usar informações do usuário
  // ...
});
```

## Testing

### Teste Manual com cURL

1. **Obter token de autenticação** (via endpoint `/login`):

```bash
curl -X POST http://localhost:3333/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","pass":"admin123"}'
```

Resposta esperada:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

2. **Acessar rota protegida com token válido**:

```bash
curl -X GET http://localhost:3333/api/protected-route \
  -H "Authorization: Bearer <token_obtido_acima>"
```

3. **Testar sem token** (deve retornar 401):

```bash
curl -X GET http://localhost:3333/api/protected-route
```

Resposta esperada:

```json
{
  "error": "Authentication required"
}
```

4. **Testar com token inválido** (deve retornar 401):

```bash
curl -X GET http://localhost:3333/api/protected-route \
  -H "Authorization: Bearer invalid-token"
```

Resposta esperada:

```json
{
  "error": "Invalid or expired token"
}
```

## Performance

- **Target**: <50ms para validação completa
- **Typical**: <10ms (validação stateless é muito rápida)
- **Monitoring**: Adicionar logs de performance se necessário

## Troubleshooting

### Erro: "BETTER_AUTH_SECRET is not defined"

**Solução**: Verificar que variável de ambiente está configurada em `.env`

### Erro: "Token inválido" mesmo com token válido

**Solução**: Verificar que `BETTER_AUTH_SECRET` é o mesmo usado na geração de tokens

### Performance >50ms

**Solução**: Verificar que não há consultas ao banco de dados na validação (deve ser stateless)

## Next Steps

- Definir rotas específicas que requerem proteção (features futuras)

- Implementar testes unitários e de integração
- Adicionar logging de tentativas de autenticação falhadas (se necessário)
- Considerar rate limiting para tentativas de autenticação (feature futura)
