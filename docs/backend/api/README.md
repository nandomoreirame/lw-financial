# Documentação da API - LW Financial

Documentação completa da API REST do sistema bancário LW Financial.

## Índice

- [Visão Geral](#visão-geral)
- [Autenticação](#autenticação)
- [Endpoints](#endpoints)
- [Modelos de Dados](#modelos-de-dados)
- [Exemplos de Uso](#exemplos-de-uso)
- [Tratamento de Erros](#tratamento-de-erros)
- [Referências](#referências)

## Visão Geral

### Informações Básicas

- **URL Base**: `http://localhost:3333/v1` (desenvolvimento)
- **Versão da API**: `1.0.0`
- **Formato de Dados**: JSON
- **Autenticação**: JWT Bearer Token

### Versionamento

A API está versionada no prefixo `/v1`. Todas as requisições devem incluir este prefixo.

### Limites e Políticas

- **Rate Limiting**: Não implementado atualmente
- **Timeout**: 30 segundos por requisição
- **Tamanho máximo de payload**: 1MB
- **Tokens JWT**: Expiração de 1 hora

### Códigos de Conta

As contas bancárias possuem códigos únicos no formato `XXXX-X` (4 dígitos, hífen, 1 dígito).

**Exemplos válidos:**

- `1234-5`
- `0001-1`
- `9999-9`

**Exemplos inválidos:**

- `12345` (sem hífen)
- `123-45` (formato incorreto)
- `ABCD-1` (contém letras)

## Autenticação

### Obtendo um Token

Para obter um token JWT, use um dos seguintes endpoints:

- `POST /v1/login` - Autenticação de usuário existente
- `POST /v1/signup` - Registro de novo usuário

### Usando o Token

Todas as rotas protegidas requerem o token no header `Authorization`:

```
Authorization: Bearer <jwt_token>
```

### Estrutura do Token JWT

O token JWT contém as seguintes informações:

```json
{
  "userId": "clxuser123",
  "username": "admin",
  "email": "admin@example.com",
  "iat": 1705315800,
  "exp": 1705319400
}
```

- `userId`: ID único do usuário (CUID)
- `username`: Nome de usuário
- `email`: Email do usuário
- `iat`: Timestamp de emissão
- `exp`: Timestamp de expiração (1 hora após emissão)

### Expiração

Os tokens JWT expiram em 1 hora. Após a expiração, é necessário fazer login novamente.

## Endpoints

### Autenticação

#### `POST /v1/login`

Autentica um usuário e retorna um token JWT.

**Request Body:**

```json
{
  "username": "admin",
  "pass": "admin123"
}
```

**Validações:**

- `username`: 3-20 caracteres alfanuméricos
- `pass`: mínimo 6 caracteres

**Response 200:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Códigos de Erro:**

- `400`: Erro de validação
- `403`: Credenciais inválidas
- `405`: Método HTTP não permitido
- `500`: Erro interno do servidor

---

#### `POST /v1/signup`

Registra um novo usuário e cria uma conta bancária padrão.

**Request Body:**

```json
{
  "username": "novousuario",
  "email": "novo@example.com",
  "name": "Novo Usuário",
  "pass": "senha123"
}
```

**Validações:**

- `username`: 3-20 caracteres alfanuméricos, único
- `email`: formato de email válido, único
- `name`: mínimo 1 caractere
- `pass`: mínimo 6 caracteres

**Response 201:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Códigos de Erro:**

- `400`: Erro de validação
- `409`: Usuário ou email já existe
- `405`: Método HTTP não permitido
- `500`: Erro interno do servidor

---

#### `GET /v1/health`

Endpoint de verificação de saúde do sistema. Não requer autenticação.

**Response 200:**

```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

---

### Operações Bancárias

Todas as rotas bancárias requerem autenticação via JWT token no header `Authorization`.

#### `GET /v1/balance`

Consulta o saldo da conta bancária.

**Query Parameters:**

- `account_code` (opcional): Código da conta no formato `XXXX-X`. Se não fornecido, retorna o saldo da conta padrão do usuário.

**Exemplo:**

```
GET /v1/balance?account_code=1234-5
Authorization: Bearer <token>
```

**Response 200:**

```json
1500.5
```

**Códigos de Erro:**

- `401`: Não autenticado
- `404`: Conta não encontrada ou acesso negado
- `500`: Erro interno do servidor

---

#### `GET /v1/accounts`

Lista todas as contas bancárias do usuário autenticado.

**Response 200:**

```json
[
  {
    "id": "clx123456789",
    "code": "1234-5",
    "balance": 1500.5
  },
  {
    "id": "clx987654321",
    "code": "5678-9",
    "balance": 250.0
  }
]
```

**Códigos de Erro:**

- `401`: Não autenticado
- `500`: Erro interno do servidor

---

#### `GET /v1/accounts/:code`

Busca uma conta bancária pelo código único.

**Parâmetros de URL:**

- `code`: Código da conta no formato `XXXX-X` (4 dígitos, hífen, 1 dígito)

**Exemplo:**

```
GET /v1/accounts/1234-5
Authorization: Bearer <token>
```

**Response 200:**

```json
{
  "id": "clx123456789",
  "code": "1234-5",
  "balance": 1500.5
}
```

**Códigos de Erro:**

- `400`: Formato inválido
- `401`: Não autenticado
- `404`: Conta não encontrada ou acesso negado
- `500`: Erro interno do servidor

---

#### `POST /v1/accounts`

Cria uma nova conta bancária para o usuário autenticado.

**Request Body:**

```json
{
  "initialBalance": 100.0
}
```

**Validações:**

- `initialBalance` (opcional): Entre 0 e 999.999,99. Se não fornecido, será 0.

**Response 201:**

```json
{
  "id": "clx123456789",
  "code": "1234-5",
  "balance": 100.0
}
```

**Códigos de Erro:**

- `400`: Erro de validação
- `401`: Não autenticado
- `500`: Erro interno do servidor

---

#### `POST /v1/event`

Processa eventos bancários (depósito, saque, transferência).

**Comportamento para Usuários Autenticados:**

Para depósitos e saques autenticados:

- O backend identifica automaticamente a conta padrão do usuário a partir do token JWT
- Não é necessário enviar `destination` (depósito) ou `origin` (saque) no body
- Se `accountCode` for fornecido, a operação será aplicada à conta especificada

Para transferências:

- Ainda requer `originAccountCode` e `destinationAccountCode` (ou `origin` e `destination`) no body
- A conta de origem deve pertencer ao usuário autenticado

**Request Body - Depósito:**

```json
{
  "type": "deposit",
  "amount": 100.5,
  "accountCode": "1234-5"
}
```

**Request Body - Saque:**

```json
{
  "type": "withdraw",
  "amount": 50.0,
  "accountCode": "1234-5"
}
```

**Request Body - Transferência:**

```json
{
  "type": "transfer",
  "originAccountCode": "1234-5",
  "destinationAccountCode": "5678-9",
  "amount": 100.0
}
```

**Validações:**

- `amount`: Entre 0,01 e 999.999,99. Máximo 2 casas decimais.
- `accountCode`: Formato `XXXX-X` (opcional para usuários autenticados)
- `originAccountCode`: Formato `XXXX-X` (opcional para transferências)
- `destinationAccountCode`: Formato `XXXX-X` (obrigatório para transferências se não fornecer `destination`)

**Response 201 - Depósito:**

```json
{
  "destination": {
    "id": "clx123456789",
    "balance": 1500.5
  }
}
```

**Response 201 - Saque:**

```json
{
  "origin": {
    "id": "clx123456789",
    "balance": 1400.5
  }
}
```

**Response 201 - Transferência:**

```json
{
  "origin": {
    "id": "clx123456789",
    "balance": 1300.5
  },
  "destination": {
    "id": "clx987654321",
    "balance": 350.0
  }
}
```

**Códigos de Erro:**

- `400`: Requisição inválida ou saldo insuficiente
- `401`: Não autenticado ou token inválido
- `404`: Conta não encontrada
- `500`: Erro interno do servidor

**Mensagens de Erro Comuns:**

- `"Invalid amount"`: Valor inválido
- `"Insufficient funds"`: Saldo insuficiente
- `"Origin and destination cannot be the same"`: Mesma conta
- `"Destination account is required for transfer"`: Destino ausente
- `"Invalid account code format. Expected format: XXXX-X"`: Formato inválido

---

#### `GET /v1/transactions`

Retorna o histórico de transações do usuário autenticado.

**Query Parameters:**

- `accountCode` (opcional): Código da conta no formato `XXXX-X` para filtrar transações de uma conta específica.

**Exemplo:**

```
GET /v1/transactions?accountCode=1234-5
Authorization: Bearer <token>
```

**Response 200:**

```json
[
  {
    "id": "clx111111111",
    "type": "DEPOSIT",
    "amount": "100.50",
    "originAccountId": null,
    "originAccountCode": null,
    "destinationAccountId": "clx123456789",
    "destinationAccountCode": "1234-5",
    "userId": "clxuser123",
    "createdAt": "2025-01-15T10:30:00.000Z"
  },
  {
    "id": "clx222222222",
    "type": "WITHDRAW",
    "amount": "50.00",
    "originAccountId": "clx123456789",
    "originAccountCode": "1234-5",
    "destinationAccountId": null,
    "destinationAccountCode": null,
    "userId": "clxuser123",
    "createdAt": "2025-01-15T09:15:00.000Z"
  },
  {
    "id": "clx333333333",
    "type": "TRANSFER",
    "amount": "100.00",
    "originAccountId": "clx123456789",
    "originAccountCode": "1234-5",
    "destinationAccountId": "clx987654321",
    "destinationAccountCode": "5678-9",
    "userId": "clxuser123",
    "createdAt": "2025-01-15T08:00:00.000Z"
  },
  {
    "id": "initial-balance-clx123456789",
    "type": "INITIAL_BALANCE",
    "amount": "1000.00",
    "originAccountId": null,
    "originAccountCode": null,
    "destinationAccountId": "clx123456789",
    "destinationAccountCode": "1234-5",
    "userId": "clxuser123",
    "createdAt": "2025-01-10T00:00:00.000Z"
  }
]
```

**Tipos de Transação:**

- `DEPOSIT`: Depósito em conta
- `WITHDRAW`: Saque de conta
- `TRANSFER`: Transferência entre contas
- `INITIAL_BALANCE`: Saldo inicial calculado (apenas quando há saldo positivo que não é explicado pelas transações)

**Observações:**

- Retorna até 20 transações mais recentes
- Ordenadas por data de criação (mais recente primeiro)
- Inclui transação de saldo inicial se aplicável

**Códigos de Erro:**

- `400`: Formato de código de conta inválido
- `401`: Não autenticado
- `404`: Conta não encontrada ou acesso negado
- `500`: Erro interno do servidor

---

#### `POST /v1/reset`

Reseta o estado do sistema (limpa todas as contas e transações). Requer autenticação.

**⚠️ ATENÇÃO**: Esta operação é destrutiva e não pode ser desfeita. Use apenas em ambientes de desenvolvimento/teste.

**Response 200:**

```json
"OK"
```

**Códigos de Erro:**

- `401`: Não autorizado - Token JWT inválido ou ausente
- `500`: Erro interno do servidor

---

## Modelos de Dados

### Account (Conta Bancária)

```typescript
interface Account {
  id: string; // ID único da conta (CUID)
  code: string | null; // Código único no formato XXXX-X
  balance: number; // Saldo da conta em reais (R$)
}
```

### Transaction (Transação)

```typescript
interface Transaction {
  id: string; // ID único da transação (CUID)
  type: 'DEPOSIT' | 'WITHDRAW' | 'TRANSFER' | 'INITIAL_BALANCE';
  amount: string; // Valor da transação em reais (R$)
  originAccountId: string | null; // ID da conta de origem
  originAccountCode: string | null; // Código da conta de origem
  destinationAccountId: string | null; // ID da conta de destino
  destinationAccountCode: string | null; // Código da conta de destino
  userId: string | null; // ID do usuário que realizou a transação
  createdAt: string; // Data e hora de criação (ISO 8601)
}
```

### Error (Erro)

```typescript
interface Error {
  error: string; // Mensagem de erro descritiva
  code?: string; // Código de erro (opcional)
}
```

### LoginRequest

```typescript
interface LoginRequest {
  username: string; // 3-20 caracteres alfanuméricos
  pass: string; // Mínimo 6 caracteres
}
```

### SignupRequest

```typescript
interface SignupRequest {
  username: string; // 3-20 caracteres alfanuméricos, único
  email: string; // Formato de email válido, único
  name: string; // Mínimo 1 caractere
  pass: string; // Mínimo 6 caracteres
}
```

### EventRequest

```typescript
interface EventRequest {
  type: 'deposit' | 'withdraw' | 'transfer';
  amount: number; // 0.01 a 999999.99
  accountCode?: string; // Formato XXXX-X (opcional)
  originAccountCode?: string; // Formato XXXX-X (opcional)
  destinationAccountCode?: string; // Formato XXXX-X (opcional)
  origin?: string; // ID da conta de origem (opcional)
  destination?: string; // ID da conta de destino (opcional)
}
```

## Exemplos de Uso

### cURL

#### Login

```bash
curl -X POST http://localhost:3333/v1/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "pass": "admin123"
  }'
```

#### Consultar Saldo

```bash
curl -X GET "http://localhost:3333/v1/balance?account_code=1234-5" \
  -H "Authorization: Bearer <seu-token-jwt>"
```

#### Listar Contas

```bash
curl -X GET http://localhost:3333/v1/accounts \
  -H "Authorization: Bearer <seu-token-jwt>"
```

#### Criar Conta

```bash
curl -X POST http://localhost:3333/v1/accounts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <seu-token-jwt>" \
  -d '{
    "initialBalance": 100.0
  }'
```

#### Depósito

```bash
curl -X POST http://localhost:3333/v1/event \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <seu-token-jwt>" \
  -d '{
    "type": "deposit",
    "amount": 100.5,
    "accountCode": "1234-5"
  }'
```

#### Saque

```bash
curl -X POST http://localhost:3333/v1/event \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <seu-token-jwt>" \
  -d '{
    "type": "withdraw",
    "amount": 50.0,
    "accountCode": "1234-5"
  }'
```

#### Transferência

```bash
curl -X POST http://localhost:3333/v1/event \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <seu-token-jwt>" \
  -d '{
    "type": "transfer",
    "originAccountCode": "1234-5",
    "destinationAccountCode": "5678-9",
    "amount": 100.0
  }'
```

#### Histórico de Transações

```bash
curl -X GET "http://localhost:3333/v1/transactions?accountCode=1234-5" \
  -H "Authorization: Bearer <seu-token-jwt>"
```

### JavaScript/TypeScript (Fetch API)

#### Login

```typescript
async function login(username: string, password: string) {
  const response = await fetch('http://localhost:3333/v1/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username,
      pass: password,
    }),
  });

  if (!response.ok) {
    throw new Error('Login failed');
  }

  const data = await response.json();
  return data.token;
}
```

#### Consultar Saldo

```typescript
async function getBalance(token: string, accountCode?: string) {
  const url = accountCode
    ? `http://localhost:3333/v1/balance?account_code=${accountCode}`
    : 'http://localhost:3333/v1/balance';

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get balance');
  }

  return await response.json();
}
```

#### Depósito

```typescript
async function deposit(token: string, amount: number, accountCode?: string) {
  const response = await fetch('http://localhost:3333/v1/event', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      type: 'deposit',
      amount,
      accountCode,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Deposit failed');
  }

  return await response.json();
}
```

### Python (requests)

```python
import requests

BASE_URL = "http://localhost:3333/v1"

# Login
def login(username, password):
    response = requests.post(
        f"{BASE_URL}/login",
        json={"username": username, "pass": password}
    )
    response.raise_for_status()
    return response.json()["token"]

# Consultar Saldo
def get_balance(token, account_code=None):
    url = f"{BASE_URL}/balance"
    params = {"account_code": account_code} if account_code else {}
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(url, params=params, headers=headers)
    response.raise_for_status()
    return response.json()

# Depósito
def deposit(token, amount, account_code=None):
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
    data = {
        "type": "deposit",
        "amount": amount
    }
    if account_code:
        data["accountCode"] = account_code

    response = requests.post(
        f"{BASE_URL}/event",
        json=data,
        headers=headers
    )
    response.raise_for_status()
    return response.json()
```

## Tratamento de Erros

### Códigos de Status HTTP

- `200 OK`: Requisição bem-sucedida
- `201 Created`: Recurso criado com sucesso
- `400 Bad Request`: Erro de validação ou requisição inválida
- `401 Unauthorized`: Não autenticado ou token inválido
- `403 Forbidden`: Credenciais inválidas
- `404 Not Found`: Recurso não encontrado
- `409 Conflict`: Conflito (ex: usuário já existe)
- `500 Internal Server Error`: Erro interno do servidor

### Estrutura de Erro

Todos os erros retornam um objeto JSON com a seguinte estrutura:

```json
{
  "error": "Mensagem de erro descritiva",
  "code": "CÓDIGO_DE_ERRO" // Opcional
}
```

### Mensagens de Erro Comuns

| Código | Mensagem                                               | Descrição                             |
| ------ | ------------------------------------------------------ | ------------------------------------- |
| 400    | `Invalid amount`                                       | Valor inválido                        |
| 400    | `Insufficient funds`                                   | Saldo insuficiente                    |
| 400    | `Invalid account code format. Expected format: XXXX-X` | Formato de código inválido            |
| 400    | `Origin and destination cannot be the same`            | Mesma conta para origem e destino     |
| 401    | `Authentication required when using account code`      | Autenticação necessária               |
| 401    | `User information not found in token`                  | Token inválido ou expirado            |
| 403    | `Invalid credentials`                                  | Credenciais inválidas                 |
| 404    | `Account not found or access denied`                   | Conta não encontrada ou sem permissão |
| 409    | `Username already exists`                              | Usuário já existe                     |
| 409    | `Email already exists`                                 | Email já existe                       |

### Exemplo de Tratamento de Erros

```typescript
async function handleApiCall<T>(apiCall: () => Promise<Response>): Promise<T> {
  try {
    const response = await apiCall();

    if (!response.ok) {
      const error = await response.json();

      switch (response.status) {
        case 400:
          throw new ValidationError(error.error);
        case 401:
          throw new AuthenticationError(error.error);
        case 404:
          throw new NotFoundError(error.error);
        case 409:
          throw new ConflictError(error.error);
        default:
          throw new ApiError(error.error);
      }
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ValidationError) {
      // Tratar erro de validação
    } else if (error instanceof AuthenticationError) {
      // Redirecionar para login
    } else {
      // Tratar erro genérico
    }
    throw error;
  }
}
```

## Referências

### Documentação Adicional

- [Especificação OpenAPI/Swagger](./openapi.yaml) - Especificação completa em formato OpenAPI 3.0
- [Documentação de Transferências](./transfers.md) - Documentação detalhada da API de transferências
- [Variáveis de Ambiente](../ENV.md) - Configuração de variáveis de ambiente
- [Backend README](../../../apps/backend/README.md) - Documentação completa do backend

### Ferramentas Úteis

- **Swagger UI**: Acesse `http://localhost:3333/docs` para documentação interativa
- **Postman Collection**: Veja `docs/postman/` para coleção de requisições
- **Prisma Studio**: Visualize dados do banco em `http://localhost:5555`

### Links Externos

- [OpenAPI Specification](https://swagger.io/specification/)
- [JWT.io](https://jwt.io/) - Decodificar e validar tokens JWT
- [Fastify Documentation](https://www.fastify.io/)
- [Prisma Documentation](https://www.prisma.io/docs)

---

**Última atualização**: 2025-01-15
**Versão da API**: 1.0.0
