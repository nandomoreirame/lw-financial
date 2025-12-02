# Data Model: Protected Routes Authentication

**Feature**: Protected Routes Authentication
**Date**: 2025-12-02
**Phase**: 1 - Design & Contracts

## Entities

### Authentication Token (JWT)

**Purpose**: Representa o token JWT extraído do header `Authorization` para validação de autenticação

**Attributes**:

- `token` (string, JWT): Token de autenticação JWT extraído do header
  - Format: JWT (JSON Web Token)
  - Source: Header `Authorization: Bearer <token>`
  - Validation: Assinatura e expiração (`exp` claim)
  - Other claims: Opcionais, não validados nesta feature

**Validation Rules**:

- **Required**: Sim (header `Authorization` obrigatório)
- **Format**: Deve seguir padrão `Bearer <token>`
- **Token Structure**: Deve ser JWT válido (3 partes separadas por `.`)
- **Signature**: Deve ser válida usando `BETTER_AUTH_SECRET`
- **Expiration**: Claim `exp` deve existir e não estar expirado
- **Error**: 401 Unauthorized se validação falhar

**Lifecycle**:

1. **Extraction**: Extraído do header `Authorization` na requisição
2. **Validation**: Verificado assinatura e expiração (stateless)
3. **Usage**: Se válido, requisição prossegue para handler da rota
4. **Rejection**: Se inválido, requisição rejeitada com 401 Unauthorized

**Note**: Validação é stateless (sem consulta ao banco de dados). Apenas assinatura e expiração são validadas. Outros claims são opcionais e não afetam a validação.

### Protected Route

**Purpose**: Representa uma rota da API que requer autenticação

**Attributes**:

- `path` (string): Caminho da rota (ex: `/api/users`, `/api/transactions`)
- `method` (string): Método HTTP (GET, POST, PUT, DELETE, etc.)
- `requiresAuth` (boolean): Indica se rota requer autenticação (sempre `true` para rotas protegidas)

**Validation Rules**:

- **Middleware Application**: Middleware de autenticação deve ser aplicado antes do handler
- **Token Required**: Requer token JWT válido no header `Authorization`
- **Error Response**: Retorna 401 Unauthorized se autenticação falhar

**Note**: Rotas específicas serão definidas em features futuras. O middleware de autenticação deve ser flexível o suficiente para ser aplicado a qualquer rota.

## Request/Response Formats

### Request Format (Protected Route)

**Headers**:

```
Authorization: Bearer <jwt_token>
```

**Rules**:

- Header `Authorization` é obrigatório
- Formato deve ser `Bearer <token>` (case-insensitive para nome do header)
- Se múltiplos headers `Authorization` presentes, usar o primeiro
- Token não pode estar vazio após remover prefixo "Bearer "

### Response Format (Success)

**Status**: 200 OK (ou status específico da rota)

**Body**: Depende da rota específica (não afetado pela autenticação)

**Note**: Se autenticação for bem-sucedida, requisição prossegue normalmente para handler da rota.

### Response Format (Authentication Failure)

**Status**: 401 Unauthorized

**Body**:

```json
{
  "error": "Authentication required"
}
```

ou

```json
{
  "error": "Invalid or expired token"
}
```

**Rules**:

- Sempre retornar status 401 para falhas de autenticação
- Mensagens genéricas (não vazar detalhes sobre tipo de erro)
- Formato JSON consistente
- Não diferenciar entre tipos de erro (expired vs invalid) por segurança

## Validation Rules

### Authorization Header Validation

- **Presence**: Header `Authorization` deve estar presente
- **Format**: Deve começar com "Bearer " (case-sensitive para o valor)
- **Token Extraction**: Token é extraído removendo prefixo "Bearer " (7 caracteres)
- **Token Non-Empty**: Token não pode estar vazio após extração
- **Whitespace**: Whitespace após "Bearer " é tratado como token ausente

### JWT Token Validation

- **Structure**: Token deve ter estrutura JWT válida (3 partes: header.payload.signature)
- **Signature**: Assinatura deve ser válida usando `BETTER_AUTH_SECRET`
- **Expiration**: Claim `exp` deve existir e não estar expirado
- **Algorithm**: Algoritmo deve ser HS256 (usado na geração)
- **Other Claims**: Outros claims são opcionais e não afetam validação

### Error Handling

- **Missing Header**: Retorna 401 com `{ "error": "Authentication required" }`
- **Invalid Format**: Retorna 401 com `{ "error": "Invalid authorization format" }`
- **Invalid Token**: Retorna 401 com `{ "error": "Invalid or expired token" }`
- **Expired Token**: Retorna 401 com `{ "error": "Invalid or expired token" }`
- **Invalid Signature**: Retorna 401 com `{ "error": "Invalid or expired token" }`

**Note**: Mensagens genéricas são usadas para não vazar informações sensíveis sobre o sistema de autenticação.

## State Transitions

### Authentication Flow

```
Request Received
    ↓
[Header Present?]
    ├─ No → 401 Unauthorized ("Authentication required")
    └─ Yes → [Format Valid?]
              ├─ No → 401 Unauthorized ("Invalid authorization format")
              └─ Yes → [Token Valid?]
                        ├─ No → 401 Unauthorized ("Invalid or expired token")
                        └─ Yes → [Continue to Route Handler]
```

### Token Validation Flow

```
Token Extracted
    ↓
[Structure Valid?]
    ├─ No → 401 Unauthorized
    └─ Yes → [Signature Valid?]
              ├─ No → 401 Unauthorized
              └─ Yes → [Expiration Valid?]
                        ├─ No → 401 Unauthorized
                        └─ Yes → [Continue to Route Handler]
```

## Performance Considerations

- **Stateless Validation**: Sem consulta ao banco de dados
- **Target Performance**: <50ms para validação completa
- **Typical Performance**: <10ms (validação stateless é muito rápida)
- **Scalability**: Cada requisição é independente, fácil escalar horizontalmente
