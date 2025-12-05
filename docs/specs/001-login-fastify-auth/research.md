# Research: Login no Sistema com Fastify e Better Auth

**Feature**: Login no Sistema
**Date**: 2025-01-27
**Phase**: 0 - Outline & Research

## Research Tasks

### 1. Better Auth Fastify Integration

**Task**: Research Better Auth Fastify integration patterns and configuration

**Findings**:

**Decision**: Usar Better Auth com integração Fastify seguindo a documentação oficial (https://www.better-auth.com/docs/integrations/fastify)

**Rationale**:

- Better Auth é uma biblioteca moderna de autenticação que suporta Fastify oficialmente
- A documentação fornece exemplo completo de integração com Fastify
- Suporta JWT tokens nativamente, alinhado com os requisitos da spec
- Configuração flexível e extensível para futuras melhorias

**Alternatives Considered**:

- **Passport.js**: Mais maduro, mas requer mais configuração e não tem suporte nativo para Fastify
- **Fastify JWT**: Mais simples, mas não fornece gerenciamento completo de sessão/autenticação
- **Custom JWT implementation**: Mais controle, mas aumenta complexidade e risco de segurança

**Implementation Pattern**:

```typescript
// Padrão da documentação Better Auth Fastify
fastify.route({
  method: ['GET', 'POST'],
  url: '/api/auth/*',
  async handler(request, reply) {
    // Converter Fastify request para Fetch API Request
    // Processar via auth.handler()
    // Converter resposta de volta para Fastify
  },
});
```

**Key Points**:

- Better Auth usa Fetch API Request/Response, requer conversão de/para Fastify
- Necessário configurar `trustedOrigins` para CORS
- Better Auth gerencia JWT generation automaticamente
- Configuração mínima necessária para username/password auth

### 2. Fastify Migration from Express

**Task**: Research migration patterns from Express to Fastify

**Decision**: Migração incremental mantendo estrutura existente, substituindo apenas o servidor HTTP

**Rationale**:

- Fastify é mais performático que Express (até 2x mais rápido)
- API similar ao Express facilita migração
- Melhor suporte para TypeScript nativo
- Compatível com Better Auth

**Migration Strategy**:

1. Substituir `express()` por `fastify()`
2. Converter `app.use(express.json())` para `fastify.register(require('@fastify/formbody'))` e `@fastify/accepts`
3. Converter rotas `app.get/post()` para `fastify.get/post()` ou `fastify.route()`
4. Manter estrutura de pastas e organização existente

**Key Differences**:

- Fastify usa plugins (`fastify.register()`) ao invés de middleware
- Request/Response objects têm API ligeiramente diferente
- Melhor suporte nativo para async/await
- Validação integrada via schemas JSON Schema

### 3. Validation Strategy

**Task**: Research validation patterns for username/password format

**Decision**: Usar Zod schemas no `packages/shared` para validação compartilhada

**Rationale**:

- Projeto já usa Zod (`packages/shared`)
- Validação compartilhada entre frontend e backend
- Type-safe validation com TypeScript
- Mensagens de erro customizáveis

**Validation Rules** (da spec):

- Username: 3-20 caracteres alfanuméricos
- Password: mínimo 6 caracteres
- Validação aplicada ANTES da verificação de credenciais

**Implementation**:

```typescript
// packages/shared/src/schemas/auth.ts
export const loginSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9]+$/),
  password: z.string().min(6),
});
```

### 4. JWT Token Configuration

**Task**: Research JWT token configuration for Better Auth

**Decision**: Usar configuração padrão do Better Auth com JWT

**Rationale**:

- Better Auth gerencia JWT automaticamente
- Configuração de expiração via `session` config
- Tokens assinados e verificados automaticamente
- Suporte a refresh tokens (futuro)

**Configuration**:

- Token format: JWT
- Expiration: Configurável via Better Auth (padrão razoável para sistema bancário: 1 hora)
- Secret: Via variável de ambiente `BETTER_AUTH_SECRET`

### 5. Error Handling Patterns

**Task**: Research error handling patterns for Fastify + Better Auth

**Decision**: Usar padrão de erro estruturado com status codes HTTP apropriados

**Rationale**:

- Especificação define formatos de erro claros (400 Bad Request, 405 Method Not Allowed)
- Fastify tem suporte nativo para error handling
- Better Auth retorna erros em formato padrão

**Error Response Format**:

```json
{
  "error": "mensagem descritiva"
}
```

**Status Codes**:

- 200 OK: Login bem-sucedido
- 400 Bad Request: Validação de formato falhou, campos ausentes
- 405 Method Not Allowed: Método HTTP não suportado
- 403 Forbidden: Credenciais inválidas (será tratado em US-003)

## Dependencies

### New Dependencies Required

```json
{
  "fastify": "^4.x",
  "@fastify/cors": "^8.x",
  "better-auth": "^latest"
}
```

### Existing Dependencies Used

- `zod`: Validação (já existe em `packages/shared`)
- `@lw-financial/shared`: Schemas compartilhados
- `typescript`: Type checking
- `prisma`: ORM (não usado nesta feature, mas presente)

## Integration Points

1. **Better Auth Configuration**: Arquivo `apps/backend/src/auth/better-auth.ts`
2. **Fastify Route Handler**: `apps/backend/src/auth/routes.ts` (integração Better Auth)
3. **Validation Middleware**: `apps/backend/src/middleware/validation.ts` (usa Zod schemas)
4. **Shared Schemas**: `packages/shared/src/schemas/auth.ts` (Zod schemas)

## Security Considerations

1. **Password Storage**: Credenciais hardcoded inicialmente (admin/admin123) - não requer hash nesta fase
2. **JWT Secret**: Deve ser configurado via variável de ambiente
3. **CORS**: Configurar `trustedOrigins` no Better Auth
4. **Rate Limiting**: Não implementado nesta feature (pode ser adicionado futuramente)

## Performance Considerations

- Fastify é mais performático que Express
- Better Auth é otimizado para performance
- Validação de formato antes da verificação de credenciais reduz carga desnecessária
- Meta: < 2 segundos para login completo (SC-001)

## Testing Strategy

- **Unit Tests**: Validação de formato (username/password)
- **Integration Tests**: Endpoint `/login` completo (sucesso e erros)
- **Test Framework**: Bun test (nativo do runtime) ou manter consistência com projeto

## Open Questions Resolved

**Q: Como integrar Better Auth com Fastify?**
A: Seguir documentação oficial, converter Request/Response entre Fetch API e Fastify

**Q: Onde colocar validação de formato?**
A: Middleware antes do handler Better Auth, usando Zod schemas compartilhados

**Q: Como migrar de Express para Fastify?**
A: Substituição incremental, manter estrutura, converter rotas e middleware

**Q: Configuração de JWT?**
A: Better Auth gerencia automaticamente, configurar apenas secret e expiration

## Next Steps

1. Criar estrutura de diretórios conforme `plan.md`
2. Implementar schemas Zod em `packages/shared`
3. Configurar Better Auth
4. Implementar rota Fastify com integração Better Auth
5. Adicionar validação de formato
6. Escrever testes
