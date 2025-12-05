# LW Financial - Backend

Backend do sistema bancário LW Financial, construído com Fastify, Prisma ORM e PostgreSQL. Fornece uma API REST completa para operações bancárias com autenticação JWT, gerenciamento de contas e transações.

## Tabela de Conteúdo

- [Sobre o Projeto](#sobre-o-projeto)
- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Scripts Disponíveis](#scripts-disponíveis)
- [API Endpoints](#api-endpoints)
- [Autenticação](#autenticação)
- [Banco de Dados](#banco-de-dados)
- [Testes](#testes)
- [Documentação Swagger](#documentação-swagger)

## Sobre o Projeto

Este é o backend do sistema bancário LW Financial, responsável por:

- Autenticação de usuários com JWT
- Gerenciamento de contas bancárias
- Operações de depósito, saque e transferência
- Histórico de transações
- Suporte a múltiplas contas por usuário
- Códigos de conta únicos no formato `XXXX-X`

## Tecnologias

- **Fastify** - Framework web rápido e eficiente
- **TypeScript 5.3.3** - Tipagem estática
- **Prisma ORM 5.7.1** - ORM e gerenciamento de migrations
- **PostgreSQL** - Banco de dados relacional
- **Better Auth** - Sistema de autenticação (preparado para integração)
- **JWT (jsonwebtoken)** - Tokens de autenticação
- **Zod** - Validação de schemas
- **Bun** - Runtime e package manager
- **Swagger/OpenAPI** - Documentação interativa da API
- **Bcrypt** - Hash de senhas

## Pré-requisitos

- **Bun** instalado (versão 1.0 ou superior)
- **Docker** e **Docker Compose** para o banco de dados
- **PostgreSQL** (via Docker Compose)

## Instalação

1. **Instale as dependências na raiz do projeto:**

```bash
bun install
```

2. **Configure as variáveis de ambiente:**

Copie o arquivo de exemplo e configure:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações (veja [Configuração](#configuração)).

3. **Inicie o banco de dados:**

```bash
# Na raiz do projeto
docker-compose up -d
```

4. **Execute as migrations do Prisma:**

```bash
cd apps/backend
bun run prisma:migrate
bun run prisma:generate
```

5. **Execute o seed (opcional):**

```bash
bun run prisma:seed
```

## Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na pasta `apps/backend/` com as seguintes variáveis:

```env
# Servidor
PORT=3333

# Autenticação
BETTER_AUTH_SECRET=your-secret-key-here-min-32-chars-change-in-production
BETTER_AUTH_URL=http://localhost:3333
BETTER_AUTH_BASE_URL=http://localhost:3333

# CORS
CLIENT_ORIGIN=http://localhost:5173

# Banco de Dados
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/lw-financial_dev?schema=public"

# Email/SMTP (opcional - para desenvolvimento use MailHog)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_FROM=noreply@localhost
APP_NAME=LW Financial App
```

### Gerando BETTER_AUTH_SECRET

O `BETTER_AUTH_SECRET` deve ter no mínimo 32 caracteres. Para gerar uma chave segura:

```bash
openssl rand -base64 32
```

### Porta do PostgreSQL

O Docker Compose está configurado para usar a porta `5433` (mapeamento externo) para evitar conflitos com instalações locais do PostgreSQL. A porta interna do container continua sendo `5432`.

## Estrutura do Projeto

```
apps/backend/
├── src/
│   ├── auth/              # Rotas e lógica de autenticação
│   │   ├── routes.ts      # Rotas de login/signup
│   │   └── better-auth.ts # Configuração Better Auth
│   ├── bank/              # Operações bancárias
│   │   ├── routes.ts      # Registro de rotas bancárias
│   │   ├── handlers/      # Handlers de cada endpoint
│   │   │   ├── balance.ts
│   │   │   ├── accounts.ts
│   │   │   ├── create-account.ts
│   │   │   ├── account-by-code.ts
│   │   │   ├── event.ts
│   │   │   ├── reset.ts
│   │   │   └── transactions.ts
│   │   └── services/      # Lógica de negócio
│   │       ├── account.service.ts
│   │       └── account-code.service.ts
│   ├── middleware/        # Middlewares
│   │   ├── authentication.ts
│   │   └── validation.ts
│   ├── db/                # Configuração do Prisma
│   │   └── prisma.ts
│   ├── config/            # Configurações
│   │   └── swagger.ts
│   ├── types/             # Tipos TypeScript
│   │   └── auth.ts
│   └── index.ts           # Ponto de entrada
├── prisma/
│   ├── schema.prisma      # Schema do banco de dados
│   ├── migrations/        # Migrations do Prisma
│   └── seed.ts            # Seed do banco
├── scripts/               # Scripts utilitários
│   ├── backfill-account-codes.ts
│   └── resolve-failed-migration.ts
├── tests/                 # Testes
│   ├── integration/       # Testes de integração
│   └── unit/              # Testes unitários
└── package.json
```

## Scripts Disponíveis

```bash
# Desenvolvimento
bun run dev              # Inicia o servidor em modo desenvolvimento (watch)
bun run build            # Compila o TypeScript
bun run start            # Inicia o servidor compilado
bun run start:prod       # Deploy migrations e inicia servidor

# Banco de Dados
bun run prisma:migrate   # Cria uma nova migration
bun run prisma:deploy    # Aplica migrations em produção
bun run prisma:generate  # Gera o Prisma Client
bun run prisma:studio    # Abre o Prisma Studio (GUI do banco)
bun run prisma:seed      # Executa o seed do banco

# Qualidade de Código
bun run lint             # Executa o ESLint
bun run type-check       # Verifica tipos TypeScript

# Utilitários
bun run backfill:codes   # Preenche códigos de conta em registros antigos
bun run email            # Servidor de preview de emails (desenvolvimento)

# Testes
bun run test             # Executa todos os testes
```

## API Endpoints

A API está disponível no prefixo `/v1`. Documentação interativa disponível em `/docs` (Swagger UI).

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

**Response 403 (Credenciais Inválidas):**

```json
{
  "error": "Invalid credentials"
}
```

**Response 400 (Validação):**

```json
{
  "error": "Validation error message"
}
```

---

#### `POST /v1/signup`

Registra um novo usuário e cria uma conta bancária.

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

**Response 409 (Usuário ou Email Já Existe):**

```json
{
  "error": "Username already exists"
}
```

ou

```json
{
  "error": "Email already exists"
}
```

---

#### `GET /v1/health`

Endpoint de verificação de saúde do sistema.

**Response 200:**

```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

---

### Operações Bancárias

Todas as rotas bancárias requerem autenticação via JWT token no header:

```
Authorization: Bearer <jwt_token>
```

---

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

**Response 404 (Conta Não Encontrada):**

```json
{
  "error": "Account not found or access denied"
}
```

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

**Response 400 (Formato Inválido):**

```json
{
  "error": "Invalid account code format. Expected format: XXXX-X"
}
```

**Response 404 (Conta Não Encontrada):**

```json
{
  "error": "Account not found or access denied"
}
```

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

**Response 400 (Validação):**

```json
{
  "error": "Initial balance must be between 0 and 999.999,99"
}
```

---

#### `POST /v1/event`

Processa eventos bancários (depósito, saque, transferência).

Para usuários autenticados, identifica automaticamente a conta a partir do token JWT. Para depósitos e saques autenticados, não é necessário enviar `destination` ou `origin` no body.

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

**Response 400 (Saldo Insuficiente):**

```json
{
  "error": "Insufficient funds"
}
```

**Response 400 (Validação):**

```json
{
  "error": "Amount must be between R$ 0,01 and R$ 999.999,99"
}
```

**Response 404 (Conta Não Encontrada):**

```json
0
```

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

**Response 400 (Formato Inválido):**

```json
{
  "error": "Invalid account code format. Expected format: XXXX-X"
}
```

**Response 404 (Conta Não Encontrada):**

```json
{
  "error": "Account not found or access denied"
}
```

---

#### `POST /v1/reset`

Reseta o estado do sistema (limpa todas as contas e transações). Requer autenticação.

**Response 200:**

```json
"OK"
```

**Response 401 (Não Autenticado):**

```json
{
  "error": "Authentication error"
}
```

---

## Autenticação

### JWT Token

Após o login ou signup, um token JWT é retornado no formato:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Usando o Token

Todas as rotas protegidas requerem o token no header `Authorization`:

```
Authorization: Bearer <jwt_token>
```

### Estrutura do Token

O token JWT contém:

- `userId`: ID do usuário
- `username`: Nome de usuário
- `email`: Email do usuário
- `iat`: Timestamp de emissão
- `exp`: Timestamp de expiração (1 hora)

### Expiração

Os tokens JWT expiram em 1 hora. Após a expiração, é necessário fazer login novamente.

## Banco de Dados

### Schema Principal

O banco de dados utiliza os seguintes modelos principais:

- **User**: Usuários do sistema
- **Account**: Contas de autenticação (Better Auth)
- **BankAccount**: Contas bancárias
- **Transaction**: Transações bancárias
- **Session**: Sessões de usuário

### Migrations

```bash
# Criar nova migration
bun run prisma:migrate

# Aplicar migrations em produção
bun run prisma:deploy

# Ver status das migrations
npx prisma migrate status
```

### Prisma Studio

Visualize e edite dados do banco através do Prisma Studio:

```bash
bun run prisma:studio
```

Acesse em: `http://localhost:5555`

### Seed

Para popular o banco com dados iniciais:

```bash
bun run prisma:seed
```

## Testes

### Executar Testes

```bash
# Todos os testes
bun run test

# Testes em modo watch
bun test --watch
```

### Estrutura de Testes

```
tests/
├── integration/  # Testes de integração (API)
└── unit/         # Testes unitários
```

## Documentação Swagger

A documentação interativa da API está disponível em:

```
http://localhost:3333/docs
```

A documentação Swagger inclui:

- Descrição de todos os endpoints
- Schemas de request e response
- Exemplos de uso
- Teste interativo de endpoints

## Troubleshooting

### Erro: "BETTER_AUTH_SECRET must be at least 32 characters"

Certifique-se de que a variável `BETTER_AUTH_SECRET` no `.env` tenha pelo menos 32 caracteres. Gere uma nova chave:

```bash
openssl rand -base64 32
```

### Erro: "ECONNREFUSED" ao conectar ao banco

1. Verifique se o Docker Compose está rodando:

   ```bash
   docker-compose ps
   ```

2. Inicie o PostgreSQL:

   ```bash
   docker-compose up -d
   ```

3. Verifique se a porta está correta no `DATABASE_URL` (5433 para o host, 5432 dentro do container).

### Erro: "Migration failed"

Se uma migration falhar, você pode tentar resolver com:

```bash
bun run prisma:resolve
```

### Problemas com CORS

Certifique-se de que `CLIENT_ORIGIN` no `.env` esteja configurado corretamente para a URL do frontend (padrão: `http://localhost:5173`).

## Documentação Adicional

- [Variáveis de Ambiente](../docs/backend/ENV.md)
- [API de Transferências](../docs/backend/api/transfers.md)
- [Email](../docs/backend/email.md)
- [Documentação do Projeto](../../README.md)

## Contribuindo

1. Siga os padrões de código definidos
2. Execute `bun run lint` antes de commitar
3. Escreva testes para novas funcionalidades
4. Use [Conventional Commits](https://www.conventionalcommits.org/) para mensagens de commit

## Licença

Este projeto é privado e proprietário.

---

**Desenvolvido com ❤️ usando Fastify, Prisma e PostgreSQL**
