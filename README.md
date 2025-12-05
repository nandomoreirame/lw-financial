# LW Financial

Sistema bancário completo desenvolvido com Bun Workspaces, contendo frontend e backend. O projeto implementa um sistema de gerenciamento de contas bancárias com autenticação, operações de depósito, saque, transferência e histórico de transações.

## 📊 Status do Projeto

- **Progresso Geral**: 100% das funcionalidades implementadas
- **Histórias de Usuário**: 22 de 22 concluídas (100%)
- **Features Principais**: 7 de 7 concluídas (100%)
- **Ultima Atualizacao**: 2025-12-04

### Features Implementadas

✅ **001-login-fastify-auth** - Sistema de autenticação completo
✅ **002-protected-routes** - Proteção de rotas com JWT
✅ **003-bank-account-model** - Modelos de conta e transação
✅ **004-auth-dashboard** - Dashboard de autenticação e visualização de saldo
✅ **005-deposit-withdraw** - Operações de depósito e saque
✅ **006-logout-transactions** - Logout e histórico de transações
✅ **007-multi-account-routing** - Suporte a múltiplas contas com roteamento por código

## Estrutura

```
.
├── apps/
│   ├── frontend/              # React Router 7 (Remix) + React 19
│   │   ├── app/
│   │   │   ├── components/    # Componentes React
│   │   │   ├── hooks/         # Custom hooks
│   │   │   ├── lib/           # Utilitários e helpers
│   │   │   ├── middleware/    # Middleware de rotas
│   │   │   └── routes/        # Rotas da aplicação
│   │   └── tests/             # Testes unitários
│   └── backend/               # Fastify + Prisma + PostgreSQL
│       ├── src/
│       │   ├── auth/          # Autenticação (Better Auth)
│       │   ├── bank/          # Operações bancárias
│       │   ├── middleware/    # Middleware de autenticação
│       │   └── db/            # Configuração do Prisma
│       ├── prisma/            # Schema e migrations
│       └── tests/             # Testes de integração
├── packages/
│   ├── shared/                # Schemas Zod compartilhados
│   ├── components/            # Componentes UI compartilhados (Shadcn UI)
│   │   ├── ui/                # Componentes base do Shadcn
│   │   └── lib/               # Utilitários (formatação, validação)
│   └── styles/                # Estilos globais (Tailwind CSS v4)
└── docs/                      # Documentação completa do projeto
```

## Início Rápido

### Instalar dependências

```bash
bun install
```

### Executar em desenvolvimento

```bash
# Executar todos os apps
bun run dev

# Executar apenas frontend
cd apps/frontend && bun run dev

# Executar apenas backend
cd apps/backend && bun run dev
```

## 🚀 Funcionalidades Implementadas

### Autenticação e Segurança

- ✅ Login com credenciais (admin/admin123)
- ✅ Geração e validação de tokens JWT
- ✅ Proteção de rotas autenticadas
- ✅ Middleware de autenticação no backend
- ✅ Proteção de rotas no frontend
- ✅ Logout funcional
- ✅ Tratamento de erros de autenticação

### Operações Bancárias

- ✅ Criação de contas bancárias
- ✅ Consulta de saldo
- ✅ Depósito em contas
- ✅ Saque de contas (com validação de saldo)
- ✅ Transferência entre contas (com suporte a account code)
- ✅ Histórico de transações (últimas 20)
- ✅ Reset do sistema (para testes)
- ✅ Suporte a múltiplas contas por usuário
- ✅ Códigos de conta únicos (formato: 1234-5)

### Interface do Usuário

- ✅ Tela de login responsiva
- ✅ Dashboard com visualização de saldo
- ✅ Formulários de depósito, saque e transferência
- ✅ Histórico de transações com formatação
- ✅ Seleção de contas na sidebar com roteamento por código
- ✅ Mensagens de erro amigáveis
- ✅ Estados de loading e feedback visual
- ✅ Design responsivo com Tailwind CSS v4
- ✅ Componentes acessíveis (Shadcn UI)

## 🛠️ Tecnologias

### Frontend

- **React Router 7** (Remix) - Framework full-stack
- **React 19.1.1** - Biblioteca UI
- **Tailwind CSS v4.1.13** - Estilização
- **Shadcn UI** - Componentes acessíveis
- **TanStack Query (React Query)** - Gerenciamento de estado servidor
- **React Hook Form** - Gerenciamento de formulários
- **Zod** - Validação de schemas

### Backend

- **Fastify** - Framework web rápido
- **TypeScript 5.3.3** - Tipagem estática
- **Prisma ORM 5.7.1** - ORM e migrations
- **PostgreSQL** - Banco de dados relacional
- **Better Auth** - Sistema de autenticação
- **JWT (jsonwebtoken)** - Tokens de autenticação
- **Zod** - Validação de schemas

### Ferramentas e DevOps

- **Bun** - Runtime e gerenciador de pacotes
- **TypeScript** - Tipagem estática
- **ESLint + Prettier** - Linting e formatação
- **Husky + lint-staged** - Git hooks
- **Docker Compose** - Containerização do PostgreSQL
- **Swagger/OpenAPI** - Documentação de API

## 📡 API Endpoints

### Autenticação

- `POST /v1/login` - Login no sistema (retorna JWT token)
- `POST /v1/signup` - Criar nova conta de usuário
- `POST /v1/auth/verify-email` - Verificar email
- `POST /v1/auth/reset-password` - Reset de senha
- `GET /v1/health` - Health check do sistema

### Operações Bancárias

- `GET /v1/balance?account_id=<id>` - Consultar saldo de uma conta
- `GET /v1/accounts` - Listar todas as contas do usuário
- `GET /v1/accounts/:code` - Buscar conta por código
- `POST /v1/accounts` - Criar nova conta bancária
- `POST /v1/event` - Criar evento (deposit, withdraw, transfer) - [Documentacao detalhada](./docs/backend/api/transfers.md)
- `GET /v1/transactions?accountCode=<code>` - Histórico de transações
- `POST /v1/reset` - Reset do sistema (apaga todas as contas e transações)

### Autenticação Necessária

Todos os endpoints bancários requerem autenticação via JWT token no header:

```
Authorization: Bearer <jwt_token>
```

## 🎨 Rotas do Frontend

- `/` - Home (redireciona para login se não autenticado)
- `/login` - Tela de login
- `/signup` - Tela de cadastro
- `/onboarding` - Tela de onboarding
- `/conta/:accountCode` - Dashboard da conta específica
- `*` - Página 404

## 📜 Scripts Disponíveis

```bash
# Desenvolvimento
bun run dev              # Executa todos os apps em dev
bun run dev:frontend     # Executa apenas o frontend
bun run dev:backend      # Executa apenas o backend

# Build
bun run build            # Build de todos os apps
bun run build:frontend   # Build apenas do frontend

# Qualidade de código
bun run lint             # Lint em todos os pacotes
bun run format           # Formata código com Prettier
bun run type-check       # Verifica tipos TypeScript

# Testes
bun run test             # Executa todos os testes

# Banco de dados
bun run db:migrate:deploy # Aplica migrations do Prisma

# Limpeza
bun run clean            # Remove builds e cache
```

## ⚙️ Configuração

### Pré-requisitos

- **Bun** instalado (versão 1.0 ou superior)
- **Docker** e **Docker Compose** para o banco de dados
- **Node.js** (opcional, Bun já inclui runtime Node.js)

### Instalação Inicial

1. **Clone o repositório e instale as dependências:**

```bash
bun install
```

2. **Configure as variáveis de ambiente do backend:**

```bash
cp apps/backend/.env.example apps/backend/.env
```

Edite `apps/backend/.env` com suas configurações:

```env
# Servidor
PORT=3001

# Autenticação
BETTER_AUTH_SECRET=your-secret-key-here-min-32-chars-change-in-production
BETTER_AUTH_URL=http://localhost:3001
BETTER_AUTH_BASE_URL=http://localhost:3001

# CORS
CLIENT_ORIGIN=http://localhost:5173

# Banco de Dados
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/lw-financial_dev?schema=public"

# Email (opcional - para desenvolvimento use MailHog)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_FROM=noreply@localhost
APP_NAME=LW Financial App
```

**Gerar BETTER_AUTH_SECRET:**

```bash
openssl rand -base64 32
```

### Banco de Dados

1. **Inicie o PostgreSQL com Docker Compose:**

```bash
# Na raiz do projeto
docker-compose up -d
```

Isso irá iniciar um container PostgreSQL na porta 5432.

2. **Execute as migrações do Prisma:**

```bash
cd apps/backend
bun run prisma:migrate
bun run prisma:generate
```

3. **(Opcional) Abra o Prisma Studio para visualizar dados:**

```bash
bun run prisma:studio
```

4. **Parar o banco de dados:**

```bash
docker-compose down
```

Para remover também os volumes (dados):

```bash
docker-compose down -v
```

### Executar Aplicação

1. **Inicie todos os serviços:**

```bash
bun run dev
```

Isso irá iniciar:

- Frontend em `http://localhost:5173`
- Backend em `http://localhost:3001`
- Swagger UI em `http://localhost:3001/docs`

2. **Ou execute separadamente:**

```bash
# Terminal 1 - Backend
bun run dev:backend

# Terminal 2 - Frontend
bun run dev:frontend
```

### Credenciais Padrão

- **Usuário**: `admin`
- **Senha**: `admin123`

### Adicionar Componentes Shadcn UI

Para adicionar novos componentes do Shadcn UI:

```bash
cd packages/components
bun run ui:add [component-name]
```

Exemplo:

```bash
bun run ui:add button
bun run ui:add card
bun run ui:add dialog
```

## 📋 Histórias de Usuário Implementadas

### Fase 1: Fundação e Autenticação ✅

- ✅ **US-001**: Login no Sistema
- ✅ **US-002**: Proteção de Rotas Autenticadas
- ✅ **US-003**: Validação de Credenciais Inválidas

### Fase 2: Operações Bancárias ✅

- ✅ **US-004**: Reset do Sistema
- ✅ **US-005**: Consultar Saldo de Conta Existente
- ✅ **US-006**: Consultar Saldo de Conta Inexistente
- ✅ **US-007**: Criar Conta com Depósito Inicial
- ✅ **US-008**: Realizar Depósito em Conta Existente
- ✅ **US-009**: Realizar Saque em Conta Existente
- ✅ **US-010**: Tentar Saque de Conta Inexistente
- ✅ **US-011**: Tentar Saque com Saldo Insuficiente
- ✅ **US-012**: Realizar Transferência Entre Contas
- ✅ **US-013**: Tentar Transferência de Conta Inexistente
- ✅ **US-014**: Tentar Transferência com Saldo Insuficiente

### Fase 3: Interface do Usuário ✅

- ✅ **US-015**: Tela de Login
- ✅ **US-016**: Dashboard - Visualização de Saldo
- ✅ **US-017**: Dashboard - Realizar Depósito
- ✅ **US-018**: Dashboard - Realizar Saque
- ✅ **US-019**: Dashboard - Realizar Transferência
- ✅ **US-020**: Dashboard - Histórico de Transações
- ✅ **US-021**: Logout
- ✅ **US-022**: Mensagens de Erro

**Total**: 22 de 22 historias concluidas (100%)

## 📚 Documentação

Toda a documentação do projeto está organizada no diretório [`./docs/`](./docs/README.md).

### Documentacao do Projeto

- [Estrutura de Documentacao](./docs/README.md) - Organizacao e guia de uso
- [Arquitetura](./docs/architecture/) - Decisoes arquiteturais e estrutura
- [Backend](./docs/backend/) - Documentacao especifica do backend
  - [Variaveis de Ambiente](./docs/backend/ENV.md)
  - [Email](./docs/backend/email.md)
  - [API de Transferencias](./docs/backend/api/transfers.md) - Documentacao completa
- [Frontend](./docs/frontend/) - Documentacao especifica do frontend
- [Especificacoes](./specs/) - Especificacoes tecnicas de features
- [Historias de Usuario](./docs/histories/) - User stories e requisitos
- [Progresso](./docs/progress/) - Relatorios de progresso do projeto
- [Troubleshooting](./docs/troubleshooting/) - Solucoes para problemas comuns

### Documentação Externa

- [React Router Docs](https://reactrouter.com) - Framework frontend
- [Fastify Docs](https://www.fastify.io/) - Framework backend
- [Prisma Docs](https://www.prisma.io/docs) - ORM e migrations
- [Shadcn UI Docs](https://ui.shadcn.com) - Componentes UI
- [TanStack Query Docs](https://tanstack.com/query/latest) - React Query
- [Bun Docs](https://bun.sh/docs) - Runtime e package manager
- [Better Auth Docs](https://www.better-auth.com) - Sistema de autenticação

## 🧪 Testes

O projeto inclui testes unitários e de integração:

### Testes do Backend

```bash
cd apps/backend
bun test
```

**Cobertura de Testes:**

- ✅ Testes de autenticação
- ✅ Testes de rotas protegidas
- ✅ Testes de modelo de conta bancária
- ✅ Testes de operações bancárias

### Testes do Frontend

```bash
cd apps/frontend
bun test
```

**Cobertura de Testes:**

- ✅ Testes de componentes (LoginForm, DepositForm, etc.)
- ✅ Testes de hooks customizados
- ✅ Testes de utilitários (formatação, validação)
- ✅ Testes de integração de API

## 🔒 Segurança

### Autenticação

- Tokens JWT com expiração configurável
- Armazenamento seguro de tokens (sessionStorage + httpOnly cookies)
- Validação de tokens em todas as rotas protegidas
- Middleware de autenticação no backend e frontend

### Validação

- Validação de schemas com Zod em todas as camadas
- Validação de entrada de dados (formulários e APIs)
- Sanitização de dados de entrada
- Tratamento seguro de erros (sem expor informações sensíveis)

### Boas Práticas

- Variáveis de ambiente para configurações sensíveis
- Secrets não commitados no repositório
- CORS configurado adequadamente
- Validação de saldo antes de operações de saque/transferência

## 🎯 Proximos Passos

### Melhorias Futuras

- Adicionar mais testes de integracao
- Implementar testes E2E
- Adicionar mais componentes Shadcn UI conforme necessario
- Otimizacoes de performance
- Implementar notificacoes em tempo real
- Adicionar exportacao de extrato em PDF

## 🤝 Contribuindo

1. **Faça um fork do projeto**
2. **Crie uma branch para sua feature:**

   ```bash
   git checkout -b feature/nova-funcionalidade
   ```

3. **Faça suas alterações**
4. **Execute validações:**

   ```bash
   bun run lint
   bun run type-check
   bun run test
   ```

5. **Commit suas mudanças:**
   - Use [Conventional Commits](https://www.conventionalcommits.org/)
   - Inclua emoji no início do commit (✨ feat, 🐛 fix, etc.)
   - Exemplo: `✨ feat: add new feature`

6. **Push e crie um Pull Request**
   - O Husky irá validar automaticamente antes do commit
   - Certifique-se de que todos os testes passam

### Padrões de Código

- **TypeScript**: Tipagem estrita habilitada
- **ESLint**: Regras configuradas e validadas
- **Prettier**: Formatação automática
- **Conventional Commits**: Padrão de mensagens de commit
- **Git Flow**: Estrutura de branches (feature/, bugfix/, etc.)

## 📄 Licença

Este projeto é privado e proprietário.

---

**Desenvolvido com ❤️ usando Bun, React Router 7, Fastify e Prisma**
