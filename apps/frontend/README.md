# LW Financial - Frontend

Frontend do sistema bancário LW Financial, construído com React Router 7 (Remix), React 19, Tailwind CSS v4 e Shadcn UI. Interface moderna e responsiva para gerenciamento de contas bancárias.

## Tabela de Conteúdo

- [Sobre o Projeto](#sobre-o-projeto)
- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Scripts Disponíveis](#scripts-disponíveis)
- [Rotas da Aplicação](#rotas-da-aplicação)
- [Componentes](#componentes)
- [Hooks Customizados](#hooks-customizados)
- [Autenticação](#autenticação)
- [Estilização](#estilização)
- [Testes](#testes)
- [Build e Deploy](#build-e-deploy)

## Sobre o Projeto

Este é o frontend do sistema bancário LW Financial, responsável por:

- Interface de login e cadastro de usuários
- Dashboard bancário com visualização de saldo
- Operações de depósito, saque e transferência
- Histórico de transações
- Gerenciamento de múltiplas contas
- Proteção de rotas autenticadas
- Feedback visual e tratamento de erros

## Tecnologias

- **React Router 7** (Remix) - Framework full-stack
- **React 19.1.1** - Biblioteca UI
- **Tailwind CSS v4.1.13** - Framework de estilização
- **Shadcn UI** - Componentes acessíveis e customizáveis
- **TanStack Query (React Query)** - Gerenciamento de estado servidor
- **React Hook Form** - Gerenciamento de formulários
- **Zod** - Validação de schemas
- **TypeScript 5.9.2** - Tipagem estática
- **Vite** - Build tool e dev server
- **Bun** - Runtime e package manager
- **Lucide React** - Ícones
- **Sonner** - Notificações toast

## Pré-requisitos

- **Bun** instalado (versão 1.0 ou superior)
- Backend rodando (ver [Backend README](../backend/README.md))

## Instalação

1. **Instale as dependências na raiz do projeto:**

```bash
bun install
```

2. **Configure as variáveis de ambiente (se necessário):**

O frontend está configurado para se conectar ao backend em `http://localhost:3333` por padrão. Se o backend estiver em outra URL, ajuste o arquivo de configuração da API.

3. **Inicie o servidor de desenvolvimento:**

```bash
# Na raiz do projeto
bun run dev:frontend

# Ou diretamente na pasta do frontend
cd apps/frontend
bun run dev
```

O frontend estará disponível em: `http://localhost:5173`

## Configuração

### Variáveis de Ambiente

Atualmente, o frontend não requer variáveis de ambiente específicas. A URL da API está configurada no código (`apps/frontend/app/lib/api.ts`). Para produção, você pode usar variáveis de ambiente:

```env
VITE_API_URL=http://localhost:3333
```

E ajustar o código para usar `import.meta.env.VITE_API_URL`.

## Estrutura do Projeto

```
apps/frontend/
├── app/
│   ├── components/          # Componentes React
│   │   ├── dashboard/       # Componentes do dashboard
│   │   │   ├── balance-card.tsx
│   │   │   ├── dashboard-sidebar.tsx
│   │   │   ├── deposit-dialog.tsx
│   │   │   ├── deposit-form.tsx
│   │   │   ├── transaction-history.tsx
│   │   │   ├── transfer-dialog.tsx
│   │   │   ├── transfer-form.tsx
│   │   │   ├── withdraw-dialog.tsx
│   │   │   └── withdraw-form.tsx
│   │   ├── login/           # Componentes de login
│   │   │   ├── login-form.tsx
│   │   │   └── login-error.tsx
│   │   ├── signup/          # Componentes de cadastro
│   │   │   └── signup-form.tsx
│   │   └── onboarding/      # Componentes de onboarding
│   │       └── onboarding-form.tsx
│   ├── hooks/               # Custom hooks
│   │   ├── use-auth.ts
│   │   ├── use-accounts.ts
│   │   ├── use-balance.ts
│   │   ├── use-deposit.ts
│   │   ├── use-withdraw.ts
│   │   ├── use-transfer.ts
│   │   ├── use-transactions.ts
│   │   └── use-account-by-code.ts
│   ├── lib/                 # Utilitários e helpers
│   │   ├── api.ts           # Cliente HTTP e configuração da API
│   │   ├── auth.ts          # Utilitários de autenticação
│   │   ├── auth-redirect.ts # Lógica de redirecionamento
│   │   ├── query-client.ts  # Configuração do React Query
│   │   └── validators.ts    # Schemas Zod de validação
│   ├── middleware/          # Middleware de rotas
│   │   └── protected-route.ts
│   ├── routes/              # Rotas da aplicação
│   │   ├── home.tsx         # Página inicial
│   │   ├── login.tsx        # Página de login
│   │   ├── signup.tsx       # Página de cadastro
│   │   ├── onboarding.tsx   # Página de onboarding
│   │   ├── conta.$accountCode.tsx # Dashboard da conta
│   │   └── 404.tsx          # Página 404
│   ├── routes.ts            # Configuração de rotas
│   └── root.tsx             # Componente raiz
├── public/                  # Arquivos estáticos
│   ├── favicon.ico
│   └── bank.svg
├── tests/                   # Testes
│   ├── integration/         # Testes de integração
│   └── unit/                # Testes unitários
├── components.json          # Configuração do Shadcn UI
├── react-router.config.ts   # Configuração do React Router
├── vite.config.ts           # Configuração do Vite
└── package.json
```

## Scripts Disponíveis

```bash
# Desenvolvimento
bun run dev              # Inicia o servidor de desenvolvimento
bun run build            # Cria build de produção
bun run start            # Inicia servidor de produção (após build)

# Qualidade de Código
bun run typecheck        # Gera tipos e verifica TypeScript

# Testes
bun run test             # Executa testes unitários
bun run test:watch       # Executa testes em modo watch
```

## Rotas da Aplicação

### `/` (Home)

Página inicial que redireciona para login se o usuário não estiver autenticado, ou para o dashboard se estiver autenticado.

**Componente:** `app/routes/home.tsx`

**Comportamento:**

- Se não autenticado: redireciona para `/login`
- Se autenticado: redireciona para a primeira conta disponível ou `/onboarding`

---

### `/login`

Página de login do sistema.

**Componente:** `app/routes/login.tsx`

**Funcionalidades:**

- Formulário de login com validação
- Campos: username e senha
- Tratamento de erros de autenticação
- Redirecionamento após login bem-sucedido

**Validações:**

- Username: 3-20 caracteres alfanuméricos
- Senha: mínimo 6 caracteres

**Credenciais Padrão (desenvolvimento):**

- Usuário: `admin`
- Senha: `admin123`

---

### `/signup`

Página de cadastro de novos usuários.

**Componente:** `app/routes/signup.tsx`

**Funcionalidades:**

- Formulário de cadastro com validação
- Campos: username, email, nome completo e senha
- Validação de email e username únicos
- Criação automática de conta bancária após cadastro
- Redirecionamento para onboarding após cadastro

**Validações:**

- Username: 3-20 caracteres alfanuméricos, único
- Email: formato de email válido, único
- Nome: mínimo 1 caractere
- Senha: mínimo 6 caracteres

---

### `/onboarding`

Página de onboarding para novos usuários.

**Componente:** `app/routes/onboarding.tsx`

**Funcionalidades:**

- Criação de conta bancária com saldo inicial opcional
- Redirecionamento para dashboard após criação

---

### `/conta/:accountCode`

Dashboard principal da aplicação para uma conta específica.

**Componente:** `app/routes/conta.$accountCode.tsx`

**Parâmetros de Rota:**

- `accountCode`: Código da conta no formato `XXXX-X` (ex: `1234-5`)

**Funcionalidades:**

- Visualização de saldo da conta
- Operações de depósito
- Operações de saque
- Transferências entre contas
- Histórico de transações (últimas 20)
- Sidebar com lista de todas as contas do usuário
- Navegação entre contas
- Criação de novas contas
- Logout

**Componentes Utilizados:**

- `BalanceCard`: Card de exibição de saldo
- `DepositDialog`: Modal de depósito
- `WithdrawDialog`: Modal de saque
- `TransferDialog`: Modal de transferência
- `TransactionHistory`: Lista de transações
- `DashboardSidebar`: Sidebar com navegação
- `Header`: Cabeçalho com menu do usuário

---

### `*` (404)

Página de erro 404 para rotas não encontradas.

**Componente:** `app/routes/404.tsx`

**Funcionalidades:**

- Mensagem de página não encontrada
- Link de volta para home

---

## Componentes

### Componentes do Dashboard

#### `BalanceCard`

Exibe o saldo atual da conta em destaque.

**Props:**

- `balance`: Número (saldo)
- `accountCode`: String (código da conta)

**Localização:** `app/components/dashboard/balance-card.tsx`

---

#### `DashboardSidebar`

Sidebar lateral com navegação entre contas e ações.

**Funcionalidades:**

- Lista todas as contas do usuário
- Navegação entre contas
- Botão para criar nova conta
- Destaque da conta ativa

**Localização:** `app/components/dashboard/dashboard-sidebar.tsx`

---

#### `DepositDialog` / `DepositForm`

Modal e formulário para realizar depósitos.

**Funcionalidades:**

- Input de valor com formatação de moeda
- Validação de valor (mínimo 0,01 e máximo 999.999,99)
- Feedback visual de sucesso/erro

**Localização:** `app/components/dashboard/deposit-dialog.tsx`

---

#### `WithdrawDialog` / `WithdrawForm`

Modal e formulário para realizar saques.

**Funcionalidades:**

- Input de valor com formatação de moeda
- Validação de saldo suficiente
- Feedback visual de sucesso/erro

**Localização:** `app/components/dashboard/withdraw-dialog.tsx`

---

#### `TransferDialog` / `TransferForm`

Modal e formulário para realizar transferências.

**Funcionalidades:**

- Seleção de conta de destino
- Input de valor com formatação de moeda
- Validação de saldo suficiente
- Feedback visual de sucesso/erro

**Localização:** `app/components/dashboard/transfer-dialog.tsx`

---

#### `TransactionHistory`

Lista o histórico de transações da conta.

**Funcionalidades:**

- Exibe até 20 transações mais recentes
- Formatação de valores em moeda
- Formatação de datas
- Diferenciação visual por tipo de transação (depósito, saque, transferência)

**Localização:** `app/components/dashboard/transaction-history.tsx`

---

### Componentes de Autenticação

#### `LoginForm`

Formulário de login com validação.

**Localização:** `app/components/login/login-form.tsx`

---

#### `SignupForm`

Formulário de cadastro com validação.

**Localização:** `app/components/signup/signup-form.tsx`

---

#### `OnboardingForm`

Formulário de criação de conta inicial.

**Localização:** `app/components/onboarding/onboarding-form.tsx`

---

## Hooks Customizados

### `useAuth`

Hook para gerenciar autenticação do usuário.

**Retorna:**

- `user`: Objeto do usuário autenticado ou `null`
- `isAuthenticated`: Boolean
- `login`: Função de login
- `logout`: Função de logout
- `isLoading`: Boolean

**Localização:** `app/hooks/use-auth.ts`

---

### `useAccounts`

Hook para buscar todas as contas do usuário.

**Retorna:**

- `accounts`: Array de contas
- `isLoading`: Boolean
- `error`: Error ou null
- `refetch`: Função para atualizar dados

**Localização:** `app/hooks/use-accounts.ts`

---

### `useBalance`

Hook para buscar saldo de uma conta específica.

**Parâmetros:**

- `accountCode`: String (opcional)

**Retorna:**

- `balance`: Número
- `isLoading`: Boolean
- `error`: Error ou null
- `refetch`: Função para atualizar dados

**Localização:** `app/hooks/use-balance.ts`

---

### `useDeposit`

Hook para realizar depósito.

**Retorna:**

- `deposit`: Função para realizar depósito
- `isPending`: Boolean

**Localização:** `app/hooks/use-deposit.ts`

---

### `useWithdraw`

Hook para realizar saque.

**Retorna:**

- `withdraw`: Função para realizar saque
- `isPending`: Boolean

**Localização:** `app/hooks/use-withdraw.ts`

---

### `useTransfer`

Hook para realizar transferência.

**Retorna:**

- `transfer`: Função para realizar transferência
- `isPending`: Boolean

**Localização:** `app/hooks/use-transfer.ts`

---

### `useTransactions`

Hook para buscar histórico de transações.

**Parâmetros:**

- `accountCode`: String (opcional)

**Retorna:**

- `transactions`: Array de transações
- `isLoading`: Boolean
- `error`: Error ou null
- `refetch`: Função para atualizar dados

**Localização:** `app/hooks/use-transactions.ts`

---

### `useAccountByCode`

Hook para buscar uma conta específica por código.

**Parâmetros:**

- `accountCode`: String

**Retorna:**

- `account`: Objeto da conta
- `isLoading`: Boolean
- `error`: Error ou null

**Localização:** `app/hooks/use-account-by-code.ts`

---

## Autenticação

### Armazenamento de Token

O token JWT é armazenado no `sessionStorage` para persistência durante a sessão do navegador.

### Proteção de Rotas

Rotas protegidas utilizam o middleware `protected-route.ts` que:

- Verifica se o usuário está autenticado
- Redireciona para `/login` se não estiver
- Preserva a URL original para redirecionamento após login

### Estrutura do Token

O token JWT contém:

- `userId`: ID do usuário
- `username`: Nome de usuário
- `email`: Email do usuário

### Interceptação de Requisições

Todas as requisições HTTP incluem automaticamente o token JWT no header:

```
Authorization: Bearer <token>
```

## Estilização

### Tailwind CSS v4

O projeto utiliza Tailwind CSS v4 para estilização. Os estilos globais estão em `packages/styles/global.css`.

### Shadcn UI

Componentes UI baseados no Shadcn UI são utilizados para uma interface acessível e moderna:

- Button
- Card
- Dialog
- Form
- Input
- Label
- Select
- Tabs
- Toast (via Sonner)

**Adicionar Novos Componentes:**

```bash
cd packages/components
bun run ui:add [component-name]
```

Exemplos:

```bash
bun run ui:add table
bun run ui:add dropdown-menu
```

### Componentes Disponíveis

Os componentes Shadcn UI estão em `packages/components/ui/`. Verifique antes de criar novos componentes.

## Testes

### Executar Testes

```bash
# Todos os testes
bun run test

# Testes em modo watch
bun run test:watch
```

### Estrutura de Testes

```
tests/
├── integration/  # Testes de integração
└── unit/         # Testes unitários
    ├── components/  # Testes de componentes
    ├── hooks/       # Testes de hooks
    └── lib/         # Testes de utilitários
```

### Cobertura de Testes

- ✅ Componentes (LoginForm, DepositForm, etc.)
- ✅ Hooks customizados
- ✅ Utilitários (formatação, validação)
- ✅ Integração de API

## Build e Deploy

### Build de Produção

```bash
bun run build
```

O build será gerado em `build/`.

### Servidor de Produção

```bash
bun run start
```

Isso inicia o servidor React Router que serve a aplicação compilada.

### Variáveis de Ambiente em Produção

Para produção, configure a URL da API:

```env
VITE_API_URL=https://api.exemplo.com
```

E ajuste o código para usar `import.meta.env.VITE_API_URL` em vez da URL hardcoded.

## Troubleshooting

### Erro: "Failed to fetch" nas requisições

1. Verifique se o backend está rodando em `http://localhost:3333`
2. Verifique se não há problemas de CORS (o backend deve ter `CLIENT_ORIGIN` configurado)
3. Verifique o console do navegador para mais detalhes

### Erro: Token inválido ou expirado

O token JWT expira em 1 hora. Se você receber erros 401, faça logout e login novamente.

### Problemas com Hot Reload

Se o hot reload não estiver funcionando:

1. Pare o servidor
2. Limpe o cache: `rm -rf .react-router node_modules/.vite`
3. Reinicie o servidor

### Componente Shadcn não encontrado

Certifique-se de que o componente foi instalado:

```bash
cd packages/components
bun run ui:add [component-name]
```

## Documentação Adicional

- [Documentação do Projeto](../../README.md)
- [Backend README](../backend/README.md)
- [React Router Docs](https://reactrouter.com)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Shadcn UI Docs](https://ui.shadcn.com)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

## Contribuindo

1. Siga os padrões de código definidos
2. Execute `bun run lint` antes de commitar
3. Execute `bun run typecheck` para verificar tipos
4. Escreva testes para novos componentes e funcionalidades
5. Use [Conventional Commits](https://www.conventionalcommits.org/) para mensagens de commit

## Licença

Este projeto é privado e proprietário.

---

**Desenvolvido com ❤️ usando React Router 7, React 19, Tailwind CSS v4 e Shadcn UI**
