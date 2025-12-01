# Fase 1: Fundação e Autenticação (Backend)

Esta fase contém as histórias de usuário relacionadas à autenticação e segurança do sistema, que são a base para todas as outras funcionalidades.

## Histórias de Usuário

### Sprint 1.1: Autenticação Base

1. **US-001: Login no Sistema**
   - Endpoint POST `/login`
   - Validação de credenciais (admin/admin)
   - Geração de token JWT
   - Retorno 200 OK com token

2. **US-003: Validação de Credenciais Inválidas**
   - Tratamento de credenciais inválidas
   - Retorno 403 Forbidden

3. **US-002: Proteção de Rotas Autenticadas**
   - Middleware de autenticação JWT
   - Validação de header `Authorization: Bearer <token>`
   - Retorno 401 Unauthorized para rotas sem token

## Ordem de Implementação

1. US-001 → 2. US-003 → 3. US-002

## Dependências

- Nenhuma dependência externa
- US-002 depende de US-001 (precisa validar tokens JWT)
