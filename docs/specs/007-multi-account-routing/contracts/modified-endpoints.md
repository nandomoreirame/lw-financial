# Modified API Endpoints

**Feature**: Multi-Account Management with Account Code Routing
**Date**: 2025-12-03

## Overview

Este documento descreve as modificações nos endpoints existentes para suportar múltiplas contas por usuário.

## GET /v1/accounts

### Modificações

- **Response atualizada**: Cada conta agora inclui campo `code`

### Response Schema (Atualizado)

```json
{
  "accounts": [
    {
      "id": "clx1234567890abcdef",
      "code": "1234-5", // NOVO: Código único da conta
      "balance": "1250.75",
      "userId": "clx1111111111111111",
      "createdAt": "2025-12-01T10:00:00.000Z",
      "updatedAt": "2025-12-03T14:30:00.000Z"
    }
  ]
}
```

### Campos Adicionados

- `code` (string, required): Código único no formato "XXXX-X"

## POST /v1/event

### Modificações

- **Request body atualizado**: Aceita campo opcional `accountCode`

### Request Schema (Atualizado)

```json
{
  "type": "deposit", // ou "withdraw"
  "amount": 100.5,
  "accountCode": "1234-5" // NOVO: Opcional - se não fornecido, usa conta padrão
}
```

### Comportamento

- Se `accountCode` for fornecido: processa transação na conta especificada
- Se `accountCode` não for fornecido: mantém comportamento atual (conta padrão)
- Validação: `accountCode` deve existir e pertencer ao usuário autenticado

### Response Schema (Sem mudanças)

## GET /v1/transactions

### Modificações

- **Query parameter adicionado**: `accountCode` (opcional)

### Query Parameters

- `accountCode` (string, optional): Código da conta para filtrar transações
  - Format: "XXXX-X" (4 dígitos, hífen, 1 dígito)
  - Se fornecido: retorna apenas transações relacionadas à conta especificada
  - Se não fornecido: mantém comportamento atual (todas as transações do usuário)

### Exemplos de Uso

```
GET /v1/transactions
→ Retorna todas as transações do usuário (comportamento atual)

GET /v1/transactions?accountCode=1234-5
→ Retorna apenas transações da conta "1234-5"
```

### Filtro de Transações

Quando `accountCode` é fornecido, o sistema retorna transações onde:

- A conta especificada é a conta de origem (withdraws, transfers sent)
- OU a conta especificada é a conta de destino (deposits, transfers received)

### Response Schema (Sem mudanças estruturais)

As transações retornadas seguem o mesmo formato, mas filtradas pela conta especificada.

## Validação de Propriedade

Todos os endpoints que recebem `accountCode` validam que:

1. O código existe no banco de dados
2. A conta pertence ao usuário autenticado (extraído do JWT)
3. Retorna `404 Not Found` se qualquer validação falhar

## Compatibilidade

- Todos os campos novos são adicionais (não removem funcionalidade existente)
- Campos opcionais mantêm comportamento padrão se não fornecidos
- Endpoints existentes continuam funcionando sem modificações
