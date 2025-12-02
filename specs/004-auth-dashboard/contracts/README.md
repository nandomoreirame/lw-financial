# API Contracts

Este diretório contém os contratos de API para a feature **004-auth-dashboard**.

## Arquivos

- `login-api.yaml`: Contrato OpenAPI 3.0 para endpoint `/login`
- `balance-api.yaml`: Contrato OpenAPI 3.0 para endpoint `/balance`

## Endpoints

### POST /login

Autenticação de usuário com username e password. Retorna token JWT que deve ser armazenado em sessionStorage (client-side) e httpOnly cookie (server-side).

**Request Body**:

```json
{
  "username": "admin",
  "pass": "admin123"
}
```

**Response 200**:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### GET /balance

Consulta saldo da conta bancária do usuário autenticado. Requer autenticação via JWT token.

**Query Parameters**:

- `account_id` (required): ID da conta bancária

**Response 200**:

```json
1234.56
```

**Nota**: O saldo retornado é um número. A formatação como Real brasileiro (R$ 1.234,56) é feita no frontend usando `Intl.NumberFormat`.

## Autenticação

Ambos os endpoints requerem autenticação:

- **Login**: Não requer autenticação (endpoint público)
- **Balance**: Requer token JWT válido (via Authorization header ou httpOnly cookie)

## Validação

Os contratos seguem as especificações do backend existente:

- Validação de username: 3-20 caracteres alfanuméricos
- Validação de password: mínimo 6 caracteres
- Token JWT com expiração de 1 hora

## Testes

Os contratos podem ser usados para:

- Geração de clientes API
- Testes de contrato (contract testing)
- Documentação Swagger/OpenAPI
- Validação de requisições/respostas
