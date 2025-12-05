# Research: Protected Routes Authentication

**Feature**: Protected Routes Authentication
**Date**: 2025-12-02
**Phase**: 0 - Outline & Research

## Research Tasks

### 1. Fastify Authentication Middleware Pattern

**Task**: Research Fastify middleware patterns for authentication and route protection

**Findings**:

**Decision**: Usar Fastify hooks (`onRequest` ou `preHandler`) para implementar middleware de autenticação

**Rationale**:

- Fastify suporta hooks em diferentes pontos do ciclo de vida da requisição
- `preHandler` é ideal para validação de autenticação antes de executar handlers de rotas
- Permite aplicação global (via `fastify.addHook`) ou por rota (via `fastify.register`)
- Integra naturalmente com o sistema de rotas Fastify existente
- Performance otimizada (hooks são executados de forma eficiente)

**Alternatives Considered**:

- **Plugin Fastify**: Mais complexo para um middleware simples, melhor para funcionalidades maiores
- **Decorator pattern**: Não é padrão no Fastify, adiciona complexidade desnecessária
- **Express-style middleware**: Fastify não usa middleware do Express diretamente, requer adaptação

**Implementation Pattern**:

```typescript
// Middleware global
fastify.addHook('preHandler', async (request, reply) => {
  // Validação de autenticação
});

// Middleware por rota
fastify.register(async function (fastify) {
  fastify.addHook('preHandler', async (request, reply) => {
    // Validação de autenticação
  });

  fastify.get('/protected-route', async (request, reply) => {
    // Handler da rota
  });
});
```

**Key Points**:

- `preHandler` executa após parsing da requisição mas antes do handler da rota
- Permite acesso ao `request` e `reply` para validação e resposta
- Pode ser aplicado globalmente ou por escopo (rota, prefixo, etc.)
- Suporta async/await nativamente

### 2. JWT Token Validation with jsonwebtoken

**Task**: Research JWT token validation patterns using jsonwebtoken library

**Findings**:

**Decision**: Usar biblioteca `jsonwebtoken` (já presente no projeto) para validação de tokens

**Rationale**:

- Biblioteca já está instalada no projeto (usada na US-001 para geração de tokens)
- API simples e bem documentada para validação
- Suporta verificação de assinatura e expiração automaticamente
- Performance adequada para validação stateless (<50ms)
- Compatível com tokens gerados pelo sistema de login existente

**Alternatives Considered**:

- **jose (JWT library)**: Mais moderno, mas adiciona nova dependência desnecessariamente
- **Better Auth token validation**: Better Auth tem validação própria, mas requer integração mais complexa
- **Custom JWT parsing**: Mais controle, mas aumenta complexidade e risco de bugs de segurança

**Implementation Pattern**:

```typescript
import jwt from 'jsonwebtoken';

// Validação de token
try {
  const decoded = jwt.verify(token, secret, {
    algorithms: ['HS256'], // Algoritmo usado na geração (US-001)
  });
  // Token válido, prosseguir
} catch (error) {
  // Token inválido, expirado ou com assinatura incorreta
  // Retornar 401 Unauthorized
}
```

**Key Points**:

- `jwt.verify()` valida automaticamente assinatura e expiração (`exp` claim)
- Retorna payload decodificado se válido
- Lança exceção se token inválido, expirado ou com assinatura incorreta
- Não valida outros claims além de `exp` (conforme clarificação)
- Performance: validação stateless, sem I/O, tipicamente <10ms

### 3. Authorization Header Parsing

**Task**: Research best practices for parsing Authorization header with Bearer token format

**Findings**:

**Decision**: Extrair token do header `Authorization` seguindo formato `Bearer <token>`

**Rationale**:

- Formato padrão HTTP para autenticação Bearer tokens (RFC 6750)
- Amplamente suportado e reconhecido por desenvolvedores
- Compatível com ferramentas de API (Postman, curl, etc.)
- Case-insensitive para nome do header (HTTP specification)

**Alternatives Considered**:

- **Custom header format**: Não padrão, reduz compatibilidade
- **Query parameter**: Menos seguro (tokens aparecem em logs), não recomendado
- **Cookie-based**: Mais complexo, requer configuração adicional

**Implementation Pattern**:

```typescript
// Extrair token do header Authorization
const authHeader = request.headers.authorization;

if (!authHeader) {
  return reply.status(401).send({ error: 'Authentication required' });
}

// Verificar formato Bearer
if (!authHeader.startsWith('Bearer ')) {
  return reply.status(401).send({ error: 'Invalid authorization format' });
}

// Extrair token (usar primeiro header se múltiplos presentes)
const token = authHeader.substring(7).trim(); // Remove "Bearer " prefix

if (!token) {
  return reply.status(401).send({ error: 'Token required' });
}
```

**Key Points**:

- Header `Authorization` é case-insensitive (HTTP spec)
- Formato esperado: `Bearer <token>` (espaço após "Bearer" é obrigatório)
- Múltiplos headers: usar primeiro encontrado (conforme clarificação)
- Token não pode estar vazio após remover prefixo "Bearer "
- Whitespace após "Bearer " deve ser tratado como token ausente

### 4. Error Response Format

**Task**: Research error response format for authentication failures

**Findings**:

**Decision**: Retornar JSON com formato consistente `{ "error": "mensagem descritiva" }`

**Rationale**:

- Formato simples e consistente com outras respostas de erro da API
- Mensagens claras para desenvolvedores sem vazar informações sensíveis
- Alinhado com padrões REST para respostas de erro
- Facilita debugging sem comprometer segurança

**Alternatives Considered**:

- **WWW-Authenticate header**: Padrão HTTP, mas menos comum em APIs REST modernas
- **Mensagens detalhadas por tipo de erro**: Pode vazar informações sobre sistema de autenticação
- **Códigos de erro customizados**: Adiciona complexidade desnecessária

**Implementation Pattern**:

```typescript
// Erros de autenticação
reply.status(401).send({
  error: 'Authentication required',
});

reply.status(401).send({
  error: 'Invalid or expired token',
});

// Mensagens genéricas para não vazar detalhes
// Não revelar se token está expirado vs inválido vs assinatura incorreta
```

**Key Points**:

- Sempre retornar status 401 Unauthorized para falhas de autenticação
- Mensagens genéricas para não vazar informações sensíveis
- Formato JSON consistente
- Não diferenciar entre tipos de erro de token (expired vs invalid) por segurança

### 5. Performance Optimization for Stateless Validation

**Task**: Research performance optimization techniques for stateless JWT validation

**Findings**:

**Decision**: Validação stateless sem consulta ao banco de dados, usando apenas verificação de assinatura e expiração

**Rationale**:

- Validação stateless é extremamente rápida (<10ms tipicamente)
- Não adiciona carga ao banco de dados
- Escalável horizontalmente (sem estado compartilhado)
- Atende requisito de <50ms facilmente
- Trade-off: não valida se usuário ainda existe (conforme clarificação)

**Alternatives Considered**:

- **Validação com consulta ao banco**: Adiciona latência significativa (>50ms), não atende requisito
- **Cache de validação**: Complexidade adicional, não necessário para <50ms
- **Token blacklist**: Requer estado compartilhado (Redis), complexidade adicional

**Key Points**:

- Validação stateless: apenas verificação de assinatura (cryptographic) e expiração (timestamp)
- Sem I/O operations: não consulta banco de dados, não faz chamadas de rede
- Performance: tipicamente <10ms, bem abaixo do limite de 50ms
- Escalabilidade: cada requisição é independente, fácil de escalar horizontalmente
- Trade-off aceito: não valida existência do usuário (pode ser tratado em rotas específicas se necessário)

### 6. Integration with Existing Better Auth Setup

**Task**: Research integration patterns with existing Better Auth configuration

**Findings**:

**Decision**: Usar mesmo secret do Better Auth para validação de tokens, mas implementar middleware independente

**Rationale**:

- Tokens são gerados pelo Better Auth na US-001 usando `BETTER_AUTH_SECRET`
- Middleware deve usar mesmo secret para validar tokens gerados
- Middleware independente permite maior controle e performance
- Não requer integração direta com Better Auth handlers (que são mais complexos)

**Alternatives Considered**:

- **Usar Better Auth handlers diretamente**: Mais complexo, menos controle sobre performance
- **Secret diferente**: Tokens não seriam validados corretamente
- **Better Auth middleware**: Não existe nativamente, requer implementação customizada

**Key Points**:

- Usar `process.env.BETTER_AUTH_SECRET` para validação (mesmo secret usado na geração)
- Middleware independente do Better Auth handlers (mais simples e performático)
- Compatível com tokens gerados pelo sistema de login (US-001)
- Permite extensão futura se necessário (ex: integração com Better Auth sessions)

## Summary of Decisions

1. **Fastify Hooks**: Usar `preHandler` hook para middleware de autenticação
2. **JWT Library**: Usar `jsonwebtoken` (já presente) para validação
3. **Header Format**: `Authorization: Bearer <token>` (padrão HTTP)
4. **Error Format**: JSON `{ "error": "mensagem" }` com status 401
5. **Validation Strategy**: Stateless (sem banco de dados) para performance
6. **Secret**: Usar `BETTER_AUTH_SECRET` do ambiente (mesmo da geração)

## Open Questions Resolved

- ✅ Qual padrão usar para middleware Fastify? → `preHandler` hook
- ✅ Qual biblioteca usar para validação JWT? → `jsonwebtoken` (já presente)
- ✅ Como extrair token do header? → Formato `Bearer <token>`
- ✅ Qual formato de erro retornar? → JSON `{ "error": "..." }`
- ✅ Como otimizar performance? → Validação stateless
- ✅ Como integrar com Better Auth? → Usar mesmo secret, middleware independente
