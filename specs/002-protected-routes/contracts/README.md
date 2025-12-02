# API Contracts: Protected Routes Authentication

**Feature**: Protected Routes Authentication
**Date**: 2025-12-02
**Phase**: 1 - Design & Contracts

## Overview

Esta feature implementa middleware de autenticação que protege rotas da API. Não há endpoints específicos nesta feature - o middleware será aplicado a rotas definidas em features futuras.

## Authentication Header

Todas as rotas protegidas requerem o header `Authorization` com formato Bearer token:

```
Authorization: Bearer <jwt_token>
```

### Header Specification

- **Name**: `Authorization` (case-insensitive)
- **Format**: `Bearer <token>` (case-sensitive para o valor "Bearer")
- **Required**: Sim, para todas as rotas protegidas
- **Multiple Headers**: Se múltiplos headers `Authorization` presentes, usar o primeiro

### Token Format

- **Type**: JWT (JSON Web Token)
- **Structure**: `header.payload.signature` (3 partes separadas por `.`)
- **Algorithm**: HS256
- **Secret**: `BETTER_AUTH_SECRET` (mesmo usado na geração)
- **Required Claims**: `exp` (expiration)
- **Optional Claims**: Outros claims são opcionais e não afetam validação

## Response Formats

### Success Response

Quando autenticação é bem-sucedida, a requisição prossegue normalmente para o handler da rota. O middleware não modifica a resposta da rota.

**Status**: Depende da rota específica (200, 201, etc.)

**Body**: Depende da rota específica

### Error Response: Authentication Required

**Status**: `401 Unauthorized`

**Headers**:

```
Content-Type: application/json
```

**Body**:

```json
{
  "error": "Authentication required"
}
```

**When**: Header `Authorization` ausente ou vazio

### Error Response: Invalid Authorization Format

**Status**: `401 Unauthorized`

**Headers**:

```
Content-Type: application/json
```

**Body**:

```json
{
  "error": "Invalid authorization format"
}
```

**When**: Header `Authorization` não segue formato `Bearer <token>`

### Error Response: Invalid or Expired Token

**Status**: `401 Unauthorized`

**Headers**:

```
Content-Type: application/json
```

**Body**:

```json
{
  "error": "Invalid or expired token"
}
```

**When**:

- Token malformado (não é JWT válido)
- Token expirado (claim `exp` expirado)
- Assinatura inválida (token foi modificado ou secret incorreto)
- Token vazio após remover prefixo "Bearer "

## Example Requests

### Valid Request

```http
GET /api/protected-route HTTP/1.1
Host: localhost:3333
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbHV4eHh4eHh4IiwidXNlcm5hbWUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AbHcuY29tIiwiaWF0IjoxNzM1ODI0MDAwLCJleHAiOjE3MzU4Mjc2MDB9.signature
```

**Response**: Prossegue para handler da rota (status e body dependem da rota)

### Missing Authorization Header

```http
GET /api/protected-route HTTP/1.1
Host: localhost:3333
```

**Response**:

```json
{
  "error": "Authentication required"
}
```

**Status**: `401 Unauthorized`

### Invalid Format

```http
GET /api/protected-route HTTP/1.1
Host: localhost:3333
Authorization: Token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response**:

```json
{
  "error": "Invalid authorization format"
}
```

**Status**: `401 Unauthorized`

### Expired Token

```http
GET /api/protected-route HTTP/1.1
Host: localhost:3333
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MzU4MDAwMDB9.invalid
```

**Response**:

```json
{
  "error": "Invalid or expired token"
}
```

**Status**: `401 Unauthorized`

## Notes

- Rotas específicas serão definidas em features futuras
- Middleware será aplicado a rotas marcadas como protegidas
- Validação é stateless (sem consulta ao banco de dados)
- Performance target: <50ms para validação completa
- Mensagens de erro são genéricas para não vazar informações sensíveis
