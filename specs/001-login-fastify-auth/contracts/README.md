# API Contracts: Login no Sistema

**Feature**: Login no Sistema
**Date**: 2025-01-27

## Overview

Este diretório contém os contratos de API para o endpoint de autenticação `/login`.

## Files

- `login-api.yaml`: Especificação OpenAPI 3.0.3 completa do endpoint `/login`

## Endpoint

### POST /login

Autentica um usuário com username e senha, retornando um token JWT.

**Request Body**:

```json
{
  "username": "admin",
  "pass": "admin123"
}
```

**Success Response (200 OK)**:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses**:

- `400 Bad Request`: Validação de formato falhou, campos ausentes
- `403 Forbidden`: Credenciais inválidas (US-003)
- `405 Method Not Allowed`: Método HTTP diferente de POST

## Validation Rules

### Username

- Required: Yes
- Type: String
- Length: 3-20 characters
- Pattern: `^[a-zA-Z0-9]+$` (alphanumeric only)

### Password (pass)

- Required: Yes
- Type: String
- Min Length: 6 characters

## Usage

### View Contract

```bash
# Usar ferramenta OpenAPI viewer (Swagger UI, Redoc, etc.)
npx @redocly/cli preview-docs contracts/login-api.yaml
```

### Generate Client Code

```bash
# Exemplo com openapi-generator
openapi-generator-cli generate \
  -i contracts/login-api.yaml \
  -g typescript-axios \
  -o generated-client
```

### Validate Contract

```bash
# Usar swagger-cli ou similar
npx @apidevtools/swagger-cli validate contracts/login-api.yaml
```

## Testing

Use este contrato como referência para:

- Testes de integração
- Testes de contrato (contract testing)
- Documentação de API
- Geração de client SDKs

## Notes

- Campo `pass` (não `password`) conforme especificação original US-001
- Credenciais hardcoded: username="admin", password="admin123"
- Token JWT é gerado pelo Better Auth
- Validação de formato aplicada ANTES da verificação de credenciais
