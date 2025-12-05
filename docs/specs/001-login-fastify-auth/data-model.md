# Data Model: Login no Sistema

**Feature**: Login no Sistema
**Date**: 2025-01-27
**Phase**: 1 - Design & Contracts

## Entities

### User Credentials (Temporary/Hardcoded)

**Purpose**: Representa as credenciais de autenticação para login

**Attributes**:

- `username` (string, required): Nome de usuário para autenticação
  - Validation: 3-20 caracteres alfanuméricos (regex: `^[a-zA-Z0-9]+$`)
  - Example: "admin"
- `password` (string, required): Senha para autenticação
  - Validation: Mínimo 6 caracteres
  - Example: "admin123"

**State**: Hardcoded na primeira implementação

- Username: "admin"
- Password: "admin123"

**Note**: Esta entidade não é persistida no banco de dados nesta fase. Credenciais são validadas contra valores hardcoded. Futuras fases podem migrar para banco de dados com hash de senha.

### Authentication Token

**Purpose**: Representa o token JWT gerado após autenticação bem-sucedida

**Attributes**:

- `token` (string, JWT): Token de autenticação JWT
  - Format: JWT (JSON Web Token)
  - Contains: Payload com informações de autenticação (gerenciado pelo Better Auth)
  - Expiration: Configurável via Better Auth (recomendado: 1 hora para sistema bancário)

**Response Format**:

```json
{
  "token": "<jwt_token_string>"
}
```

**Lifecycle**:

1. Generated: Após validação bem-sucedida de credenciais
2. Used: Enviado em header `Authorization: Bearer <token>` para requisições autenticadas
3. Expired: Token inválido após expiração (tratado em US-002)

**Note**: Token é gerado e gerenciado pelo Better Auth. Não requer persistência nesta feature.

## Validation Rules

### Username Validation

- **Required**: Sim
- **Type**: String
- **Length**: 3-20 caracteres
- **Pattern**: Apenas caracteres alfanuméricos (a-z, A-Z, 0-9)
- **Error**: 400 Bad Request se validação falhar
- **Message**: "Username must be 3-20 alphanumeric characters"

### Password Validation

- **Required**: Sim
- **Type**: String
- **Length**: Mínimo 6 caracteres
- **Pattern**: Qualquer caractere (sem restrições de complexidade nesta fase)
- **Error**: 400 Bad Request se validação falhar
- **Message**: "Password must be at least 6 characters"

### Validation Order

1. **Format Validation** (FR-002a, FR-002b, FR-002c): Aplicada PRIMEIRO
   - Valida formato de username e password
   - Retorna 400 Bad Request se falhar
   - Não prossegue para verificação de credenciais se falhar

2. **Credential Verification** (FR-003): Aplicada APÓS validação de formato
   - Compara username e password com credenciais hardcoded
   - Retorna 403 Forbidden se credenciais inválidas (tratado em US-003)
   - Prossegue para geração de token se válido

## Request/Response Models

### Login Request

```typescript
{
  username: string; // 3-20 alphanumeric characters
  pass: string; // minimum 6 characters
}
```

**Note**: Campo `pass` (não `password`) conforme especificação original da US-001.

### Login Success Response

```typescript
{
  token: string; // JWT token string
}
```

**Status**: 200 OK

### Error Response

```typescript
{
  error: string; // Descriptive error message
}
```

**Status Codes**:

- 400 Bad Request: Validação de formato falhou, campos ausentes, corpo vazio
- 405 Method Not Allowed: Método HTTP diferente de POST
- 403 Forbidden: Credenciais inválidas (US-003, não nesta feature)

## State Transitions

### Authentication Flow

```
[Request Received]
    ↓
[Method Validation] → [405 Method Not Allowed] (se não POST)
    ↓
[Format Validation] → [400 Bad Request] (se formato inválido)
    ↓
[Credential Verification] → [403 Forbidden] (se credenciais inválidas - US-003)
    ↓
[Token Generation]
    ↓
[200 OK with Token]
```

## Data Relationships

**N/A**: Esta feature não possui relacionamentos entre entidades. Credenciais são hardcoded e tokens são stateless (JWT).

## Future Considerations

- **User Entity**: Futuramente, credenciais serão migradas para banco de dados
- **Password Hashing**: Implementar hash (bcrypt/argon2) quando migrar para banco
- **Session Management**: Better Auth pode gerenciar sessões se necessário
- **Refresh Tokens**: Adicionar suporte a refresh tokens para melhor UX
