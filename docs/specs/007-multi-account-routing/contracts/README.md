# API Contracts: Multi-Account Management with Account Code Routing

**Feature**: Multi-Account Management with Account Code Routing
**Date**: 2025-12-03
**Phase**: 1 - Design & Contracts

## Overview

Esta feature adiciona suporte a múltiplas contas bancárias por usuário, com códigos únicos para identificação e roteamento. Os contratos API documentam os novos endpoints e modificações nos endpoints existentes.

## Endpoints

### New Endpoints

1. **GET /v1/accounts/:code** - Buscar conta bancária por código
   - Especificação: `account-by-code-api.yaml`

### Modified Endpoints

1. **GET /v1/accounts** - Listar contas do usuário (atualizado para incluir código)
   - Modificação: Resposta agora inclui campo `code` para cada conta

2. **POST /v1/event** - Criar evento de depósito/saque (atualizado para aceitar accountCode)
   - Modificação: Request body aceita campo opcional `accountCode`

3. **GET /v1/transactions** - Consultar histórico de transações (atualizado para filtrar por conta)
   - Modificação: Query parameter opcional `accountCode` para filtrar por conta específica

## Authentication

Todos os endpoints requerem autenticação via JWT token no header:

```
Authorization: Bearer <jwt_token>
```

O `userId` é extraído automaticamente do token JWT no backend.

## Account Code Format

Todos os códigos de conta seguem o formato:

- Pattern: `^\d{4}-\d$`
- Format: 4 dígitos, hífen, 1 dígito
- Example: "1234-5"
- Uniqueness: Códigos são únicos em todo o sistema

## Error Responses

Todos os endpoints seguem padrão de erro consistente:

```json
{
  "error": "Error message description"
}
```

Status codes comuns:

- `400 Bad Request`: Dados inválidos (formato de código, validação)
- `401 Unauthorized`: Token JWT inválido ou expirado
- `404 Not Found`: Conta não encontrada ou acesso negado
- `500 Internal Server Error`: Erro interno do servidor

## Validation

### Account Code Validation

- Formato: Deve seguir padrão `^\d{4}-\d$`
- Existência: Conta deve existir no banco
- Ownership: Conta deve pertencer ao usuário autenticado

### Ownership Validation

Todas as operações validam que a conta pertence ao usuário autenticado antes de processar. Tentativas de acessar contas de outros usuários retornam `404 Not Found`.
