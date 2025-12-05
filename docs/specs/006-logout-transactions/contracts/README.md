# API Contracts: User Logout and Transaction History

**Feature**: User Logout and Transaction History
**Date**: 2025-12-03

## Overview

Este diretório contém os contratos de API para o endpoint de histórico de transações `/v1/transactions`.

## Files

- `transactions-api.yaml`: Especificação OpenAPI 3.0.3 completa do endpoint `/v1/transactions`

## Endpoint

### GET /v1/transactions

Consulta o histórico de transações do usuário autenticado, retornando as 20 transações mais recentes.

**Authentication**: Obrigatória via JWT token (Bearer token no header Authorization)

**Request Headers**:

```
Authorization: Bearer <jwt_token>
```

**Success Response (200 OK)**:

```json
[
  {
    "id": "clx1234567890abcdef",
    "type": "DEPOSIT",
    "amount": "100.50",
    "originAccountId": null,
    "destinationAccountId": "clx9876543210fedcba",
    "userId": "clx1111111111111111",
    "createdAt": "2025-12-03T14:30:00.000Z"
  },
  {
    "id": "clx0987654321fedcba",
    "type": "WITHDRAW",
    "amount": "50.00",
    "originAccountId": "clx9876543210fedcba",
    "destinationAccountId": null,
    "userId": "clx1111111111111111",
    "createdAt": "2025-12-03T10:15:00.000Z"
  }
]
```

**Error Responses**:

- `401 Unauthorized`: Token JWT ausente ou inválido
- `403 Forbidden`: Token JWT expirado ou sem permissão
- `500 Internal Server Error`: Erro interno do servidor

## Query Parameters

Nenhum. O endpoint retorna automaticamente as 20 transações mais recentes do usuário autenticado.

## Response Characteristics

- **Limit**: Sempre retorna no máximo 20 transações (FR-020)
- **Ordering**: Transações ordenadas por `createdAt` DESC (mais recente primeiro) (FR-013)
- **Filtering**: Apenas transações do usuário autenticado (identificado via JWT token)
- **Format**: Array de objetos Transaction

## Usage

### View Contract

```bash
# Usar ferramenta OpenAPI viewer (Swagger UI, Redoc, etc.)
npx @redocly/cli preview-docs contracts/transactions-api.yaml
```

### Generate Client Code

```bash
# Exemplo com openapi-generator
openapi-generator-cli generate \
  -i contracts/transactions-api.yaml \
  -g typescript-axios \
  -o generated-client
```

### Validate Contract

```bash
# Usar swagger-cli ou similar
npx @apidevtools/swagger-cli validate contracts/transactions-api.yaml
```

## Testing

Use este contrato como referência para:

- Testes de integração
- Testes de contrato (contract testing)
- Documentação de API
- Geração de client SDKs

## Notes

- O endpoint não suporta paginação nesta versão (conforme Out of Scope)
- O endpoint não suporta filtros ou busca (conforme Out of Scope)
- A identificação do usuário é automática via JWT token, não requer parâmetros adicionais
- O limite de 20 transações é fixo e não configurável
