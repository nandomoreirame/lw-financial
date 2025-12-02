# Research: Interface de Autenticação e Dashboard de Saldo

**Feature**: 004-auth-dashboard
**Date**: 2025-12-02

## Research Tasks

### 1. React Router 7 (Remix) - Autenticação e Proteção de Rotas

**Task**: Research React Router 7 authentication patterns and protected routes implementation

**Decision**: Usar React Router 7 loaders e actions para autenticação, com middleware de proteção de rotas usando `shouldRevalidate` e redirecionamento condicional.

**Rationale**:

- React Router 7 (Remix) oferece suporte nativo para autenticação via loaders
- Permite verificação de autenticação no servidor antes de renderizar componentes
- Suporte a cookies httpOnly via server-side para segurança
- Integração natural com sessionStorage para client-side token storage
- Padrão recomendado na documentação oficial do React Router 7

**Alternatives considered**:

- Client-side only protection: Rejeitado por questões de segurança (token exposto)
- Third-party auth libraries: Rejeitado por complexidade desnecessária para MVP
- Custom middleware complexo: Rejeitado por violar princípio de simplicidade

**References**:

- React Router 7 Documentation: Authentication patterns
- Remix Auth Strategies: Server-side session management

---

### 2. JWT Token Storage - sessionStorage + httpOnly Cookie

**Task**: Research best practices for JWT token storage in React Router 7 applications

**Decision**: Armazenar token JWT em sessionStorage (client-side) para acesso rápido e em httpOnly cookie (server-side via React Router 7) para segurança adicional.

**Rationale**:

- sessionStorage: Limpa automaticamente ao fechar aba, reduz risco de XSS persistente
- httpOnly cookie: Não acessível via JavaScript, proteção adicional contra XSS
- React Router 7 permite gerenciamento de cookies server-side nativamente
- Padrão híbrido oferece melhor segurança sem comprometer UX
- Alinhado com especificação da feature (clarificação Q1)

**Alternatives considered**:

- localStorage only: Rejeitado por risco de XSS persistente
- Cookie only: Rejeitado por complexidade de gerenciamento client-side
- In-memory only: Rejeitado por perda de sessão ao recarregar página

**References**:

- OWASP: JWT Best Practices
- React Router 7: Cookie Management

---

### 3. React Query para Gerenciamento de Estado e Cache

**Task**: Research React Query (TanStack Query) patterns for API calls and cache management

**Decision**: Usar React Query para gerenciar chamadas API (`/login` e `/balance`), cache de dados e invalidação automática após operações bancárias.

**Rationale**:

- Já está instalado no projeto (@tanstack/react-query)
- Oferece cache automático, refetching e invalidação de queries
- Suporte a estados de loading, error e success nativos
- Permite invalidação de cache após operações (atualização automática de saldo)
- Reduz boilerplate comparado a useState/useEffect manual

**Alternatives considered**:

- useState/useEffect manual: Rejeitado por mais boilerplate e menos funcionalidades
- SWR: Rejeitado por React Query já estar instalado no projeto
- Redux/Zustand: Rejeitado por complexidade desnecessária para este caso

**References**:

- TanStack Query Documentation: Mutations and Cache Invalidation
- React Query Best Practices

---

### 4. Formatação de Moeda Brasileira (R$)

**Task**: Research libraries and patterns for Brazilian Real currency formatting

**Decision**: Usar `Intl.NumberFormat` nativo do JavaScript com locale 'pt-BR' e currency 'BRL' para formatação de saldo.

**Rationale**:

- API nativa do JavaScript, sem dependências adicionais
- Suporte completo a formato brasileiro (R$ 1.234,56)
- Performance otimizada (nativo)
- Internacionalização built-in
- Alinhado com especificação da feature (clarificação Q5)

**Alternatives considered**:

- react-number-format: Rejeitado por dependência desnecessária
- numeral.js: Rejeitado por bundle size adicional sem necessidade
- Formatação manual: Rejeitado por complexidade e propensão a erros

**References**:

- MDN: Intl.NumberFormat
- JavaScript Internationalization API

---

### 5. Skeleton Loaders e Estados de UI

**Task**: Research ShadcnUI components and patterns for loading and empty states

**Decision**: Usar componentes ShadcnUI existentes no projeto para skeleton loaders e mensagens informativas, seguindo padrões de design system.

**Rationale**:

- ShadcnUI já está instalado no projeto (packages/components/ui/)
- Componentes seguem padrões de acessibilidade
- Consistência visual com resto da aplicação
- Fácil customização via Tailwind CSS
- Alinhado com especificação da feature (clarificação Q3)

**Alternatives considered**:

- Componentes customizados: Rejeitado por inconsistência visual
- Third-party loading libraries: Rejeitado por ShadcnUI já disponível
- Spinner simples: Rejeitado por pior UX comparado a skeleton loader

**References**:

- ShadcnUI Documentation: Skeleton Component
- Tailwind CSS v4: Loading States Patterns

---

### 6. Detecção de Token JWT Expirado

**Task**: Research patterns for detecting and handling expired JWT tokens in React Router 7

**Decision**: Validar token JWT no loader da rota protegida, decodificar payload para verificar expiração, e redirecionar para login com mensagem informativa se expirado.

**Rationale**:

- Validação no loader permite interceptação antes de renderizar componente
- Decodificação de JWT sem verificação de assinatura é suficiente para verificar expiração
- Redirecionamento automático melhora UX e segurança
- Mensagem informativa ajuda usuário a entender o que aconteceu
- Alinhado com especificação da feature (clarificação Q2)

**Alternatives considered**:

- Interceptor HTTP: Rejeitado por complexidade e timing issues
- Polling de validação: Rejeitado por overhead desnecessário
- Silent refresh: Rejeitado por não estar no escopo (sem refresh token)

**References**:

- JWT.io: Decoding JWT tokens
- React Router 7: Error Boundaries and Redirects

---

## Summary

Todas as decisões técnicas foram baseadas em:

1. Tecnologias já instaladas no projeto (React Router 7, React Query, ShadcnUI)
2. Melhores práticas de segurança (JWT storage, token validation)
3. Padrões recomendados pela documentação oficial
4. Simplicidade e manutenibilidade (APIs nativas quando possível)
5. Alinhamento com especificação da feature e clarificações

Nenhuma dependência adicional crítica necessária. Todas as tecnologias necessárias já estão disponíveis no projeto.
