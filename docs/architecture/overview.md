# Visão Geral da Arquitetura

Este documento descreve a arquitetura geral do sistema LW Financial, incluindo decisões de design, padrões utilizados e estrutura do projeto.

## Visão Geral do Sistema

O LW Financial é um sistema bancário completo desenvolvido como uma aplicação full-stack moderna, utilizando Bun Workspaces para gerenciamento de monorepo. O sistema é composto por:

- **Frontend**: Aplicação React Router 7 (Remix) com React 19
- **Backend**: API REST construída com Fastify e Prisma ORM
- **Banco de Dados**: PostgreSQL
- **Autenticação**: JWT tokens com Better Auth (preparado para integração futura)

## Arquitetura de Alto Nível

```
┌─────────────────────────────────────────────────────────┐
│                     Cliente (Browser)                      │
│  React Router 7 (Remix) + React 19 + TanStack Query      │
└───────────────────────┬───────────────────────────────────┘
                        │
                        │ HTTP/REST API
                        │ JWT Authentication
                        │
┌───────────────────────▼───────────────────────────────────┐
│                    Backend (Fastify)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Auth       │  │   Bank       │  │  Middleware  │  │
│  │   Routes     │  │   Routes     │  │  (JWT)       │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└───────────────────────┬───────────────────────────────────┘
                        │
                        │ Prisma ORM
                        │
┌───────────────────────▼───────────────────────────────────┐
│              PostgreSQL Database                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐           │
│  │  User    │  │  Account │  │ Transaction  │           │
│  └──────────┘  └──────────┘  └──────────────┘           │
└───────────────────────────────────────────────────────────┘
```

## Estrutura do Monorepo

O projeto utiliza Bun Workspaces para gerenciar múltiplos pacotes em um único repositório:

```
.
├── apps/
│   ├── frontend/          # Aplicação React Router 7
│   └── backend/           # API Fastify
├── packages/
│   ├── shared/            # Schemas Zod compartilhados
│   ├── components/         # Componentes UI compartilhados (Shadcn UI)
│   └── styles/            # Estilos globais (Tailwind CSS v4)
└── docs/                  # Documentação completa
```

### Benefícios da Estrutura Monorepo

- **Código Compartilhado**: Schemas Zod, componentes UI e utilitários compartilhados
- **Desenvolvimento Sincronizado**: Mudanças no backend e frontend podem ser testadas juntas
- **Build Otimizado**: Bun Workspaces permite builds incrementais
- **Type Safety**: TypeScript compartilhado entre frontend e backend

## Camadas da Aplicação

### Frontend

#### Camada de Apresentação

- **Componentes React**: Componentes funcionais com hooks
- **Shadcn UI**: Componentes acessíveis e customizáveis
- **Tailwind CSS v4**: Estilização utilitária

#### Camada de Estado

- **TanStack Query**: Gerenciamento de estado servidor e cache
- **React Hook Form**: Gerenciamento de formulários
- **SessionStorage**: Armazenamento de token JWT no cliente

#### Camada de Roteamento

- **React Router 7**: Roteamento full-stack com middleware
- **Protected Routes**: Middleware de autenticação
- **Route-based Code Splitting**: Carregamento otimizado

#### Camada de Integração

- **API Client**: Cliente HTTP centralizado (`lib/api.ts`)
- **Custom Hooks**: Hooks reutilizáveis para operações bancárias
- **Error Handling**: Tratamento centralizado de erros

### Backend

#### Camada de Roteamento

- **Fastify Routes**: Rotas organizadas por domínio (auth, bank)
- **Route Handlers**: Handlers específicos para cada endpoint
- **Schema Validation**: Validação com schemas Fastify

#### Camada de Negócio

- **Services**: Lógica de negócio isolada (ex: `account.service.ts`)
- **Domain Logic**: Regras de negócio (validações, cálculos)
- **Transaction Management**: Gerenciamento de transações atômicas

#### Camada de Dados

- **Prisma ORM**: Abstração do banco de dados
- **Migrations**: Versionamento de schema
- **Type Safety**: Tipos gerados automaticamente

#### Camada de Segurança

- **JWT Authentication**: Tokens JWT para autenticação
- **Middleware**: Validação de tokens em rotas protegidas
- **Input Validation**: Validação de entrada com Zod

## Padrões de Design

### Separação de Responsabilidades

Cada camada tem uma responsabilidade clara:

- **Routes**: Apenas roteamento e validação de entrada
- **Handlers**: Orquestração de chamadas de serviços
- **Services**: Lógica de negócio pura
- **Database**: Acesso a dados via Prisma

### Dependency Injection

Serviços são injetados onde necessário, facilitando testes:

```typescript
// Exemplo: account.service.ts
export const accountService = {
  getBalanceByUserId,
  deposit,
  withdraw,
  transfer,
};
```

### Error Handling

Erros são tratados de forma consistente:

- **Backend**: Erros customizados com status codes apropriados
- **Frontend**: Erros traduzidos para mensagens amigáveis
- **API**: Respostas de erro padronizadas

### Type Safety

TypeScript é usado em todo o projeto:

- **Schemas Zod**: Validação e inferência de tipos
- **Prisma Types**: Tipos gerados do schema do banco
- **API Types**: Tipos compartilhados entre frontend e backend

## Fluxo de Dados

### Autenticação

```
1. Usuário faz login → POST /v1/login
2. Backend valida credenciais → Prisma query
3. Backend gera JWT token → jsonwebtoken
4. Frontend armazena token → sessionStorage
5. Frontend inclui token em requisições → Authorization header
6. Backend valida token → Middleware de autenticação
```

### Operação Bancária (Exemplo: Depósito)

```
1. Usuário preenche formulário → React Hook Form
2. Frontend valida dados → Zod schema
3. Frontend faz requisição → POST /v1/event
4. Backend valida token → Middleware
5. Backend valida entrada → Fastify schema
6. Backend processa operação → account.service.deposit()
7. Backend atualiza banco → Prisma transaction
8. Backend retorna resultado → JSON response
9. Frontend atualiza cache → TanStack Query invalidation
10. Frontend atualiza UI → React re-render
```

## Decisões Arquiteturais Importantes

### 1. Monorepo com Bun Workspaces

**Decisão**: Usar Bun Workspaces em vez de múltiplos repositórios.

**Razão**: Facilita compartilhamento de código, sincronização de mudanças e desenvolvimento integrado.

**Alternativas Consideradas**: Múltiplos repositórios, npm/yarn workspaces.

### 2. React Router 7 (Remix)

**Decisão**: Usar React Router 7 em vez de Next.js ou Vite puro.

**Razão**: Framework full-stack moderno com suporte a SSR, roteamento baseado em arquivos e integração nativa com React.

**Alternativas Consideradas**: Next.js, Vite + React Router v6.

### 3. Fastify em vez de Express

**Decisão**: Usar Fastify como framework backend.

**Razão**: Performance superior, validação de schemas integrada, TypeScript nativo e ecossistema moderno.

**Alternativas Consideradas**: Express, NestJS, Hono.

### 4. Prisma ORM

**Decisão**: Usar Prisma em vez de TypeORM ou Sequelize.

**Razão**: Type safety excelente, migrations automáticas, Prisma Studio e melhor DX.

**Alternativas Consideradas**: TypeORM, Sequelize, Drizzle.

### 5. TanStack Query

**Decisão**: Usar TanStack Query para gerenciamento de estado servidor.

**Razão**: Cache automático, invalidação inteligente, loading states e error handling integrados.

**Alternativas Consideradas**: SWR, Apollo Client, Redux.

### 6. JWT Tokens

**Decisão**: Usar JWT tokens em vez de sessões server-side.

**Razão**: Stateless, escalável, fácil de implementar e adequado para APIs REST.

**Alternativas Consideradas**: Session cookies, OAuth2, Better Auth sessions.

## Segurança

### Autenticação

- **JWT Tokens**: Tokens com expiração de 1 hora
- **Token Storage**: sessionStorage no frontend (não localStorage para evitar XSS)
- **Token Validation**: Validação em todas as rotas protegidas
- **Password Hashing**: Bcrypt com salt rounds 10

### Validação

- **Input Validation**: Validação em múltiplas camadas (Zod, Fastify schemas)
- **SQL Injection**: Prevenido pelo Prisma ORM (prepared statements)
- **XSS**: Prevenido pelo React (escaping automático)
- **CSRF**: Protegido por CORS configurado adequadamente

### CORS

CORS configurado para permitir apenas origem do frontend:

```typescript
await fastify.register(cors, {
  origin: clientOrigin,
  credentials: true,
});
```

## Performance

### Frontend

- **Code Splitting**: Roteamento baseado em arquivos com lazy loading
- **Query Caching**: TanStack Query cache para reduzir requisições
- **Optimistic Updates**: Atualizações otimistas para melhor UX
- **Bundle Size**: Tree shaking e minificação automáticos

### Backend

- **Fastify**: Framework otimizado para performance
- **Database Indexing**: Índices em campos frequentemente consultados
- **Connection Pooling**: Pool de conexões do Prisma
- **Transaction Batching**: Operações agrupadas em transações

## Escalabilidade

### Horizontal Scaling

O sistema é projetado para escalar horizontalmente:

- **Stateless Backend**: Sem estado no servidor (JWT tokens)
- **Database Connection Pooling**: Prisma gerencia pool de conexões
- **Load Balancer Ready**: Pode ser colocado atrás de load balancer

### Vertical Scaling

Otimizações para melhor uso de recursos:

- **Efficient Queries**: Queries otimizadas com Prisma
- **Caching**: Cache de queries no frontend (TanStack Query)
- **Lazy Loading**: Carregamento sob demanda de componentes

## Testabilidade

### Testes Unitários

- **Frontend**: Testes de componentes, hooks e utilitários
- **Backend**: Testes de services e handlers

### Testes de Integração

- **API Tests**: Testes de endpoints completos
- **Database Tests**: Testes com banco de dados real (Docker)

### Testes E2E

- Planejado para implementação futura

## Monitoramento e Observabilidade

### Logging

- **Fastify Logger**: Logging estruturado no backend
- **Console Logs**: Logs de desenvolvimento no frontend
- **Error Tracking**: Preparado para integração futura (Sentry, etc.)

### Health Checks

- **Health Endpoint**: `/v1/health` para verificação de saúde
- **Database Health**: Verificação de conexão com banco

## Próximos Passos Arquiteturais

### Melhorias Planejadas

1. **Rate Limiting**: Implementar rate limiting na API
2. **Caching**: Adicionar cache Redis para queries frequentes
3. **Message Queue**: Implementar fila para operações assíncronas
4. **Microservices**: Considerar separação em microserviços se necessário
5. **GraphQL**: Avaliar GraphQL como alternativa ao REST
6. **Real-time**: Implementar WebSockets para notificações em tempo real

### Considerações Futuras

- **Multi-tenancy**: Suporte a múltiplos tenants
- **Audit Logging**: Logging completo de todas as operações
- **Backup Strategy**: Estratégia de backup automatizado
- **Disaster Recovery**: Plano de recuperação de desastres

## Referências

- [Documentação do Backend](../backend/README.md)
- [Documentação da API](../backend/api/README.md)
- [Documentação do Frontend](../frontend/README.md)
- [Especificações Técnicas](../../specs/)

---

**Última atualização**: 2025-01-15
**Versão da Arquitetura**: 1.0.0
