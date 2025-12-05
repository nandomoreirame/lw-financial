# Frontend - LW Financial

Documentação completa do frontend do sistema LW Financial, construído com React Router 7 (Remix), React 19 e Tailwind CSS v4.

## Visão Geral

O frontend é uma aplicação React Router 7 (Remix) que fornece uma interface moderna e responsiva para operações bancárias. A aplicação utiliza componentes acessíveis do Shadcn UI e gerencia estado servidor com TanStack Query.

## Tecnologias Principais

- **React Router 7** (Remix) - Framework full-stack com SSR
- **React 19.1.1** - Biblioteca UI moderna
- **Tailwind CSS v4.1.13** - Framework de estilização utilitária
- **Shadcn UI** - Componentes acessíveis e customizáveis
- **TanStack Query** - Gerenciamento de estado servidor e cache
- **React Hook Form** - Gerenciamento de formulários
- **Zod** - Validação de schemas TypeScript-first

## Estrutura do Projeto

```
apps/frontend/
├── app/
│   ├── components/          # Componentes React
│   │   ├── dashboard/       # Componentes do dashboard
│   │   ├── forms/           # Formulários (deposit, withdraw, transfer)
│   │   └── ui/              # Componentes UI básicos
│   ├── hooks/               # Custom hooks
│   │   ├── use-deposit.ts
│   │   ├── use-withdraw.ts
│   │   ├── use-transfer.ts
│   │   └── use-transactions.ts
│   ├── lib/                 # Utilitários e helpers
│   │   ├── api.ts           # Cliente HTTP centralizado
│   │   ├── auth.ts          # Utilitários de autenticação
│   │   ├── query-client.ts  # Configuração do TanStack Query
│   │   └── validators.ts    # Schemas Zod
│   ├── middleware/          # Middleware de rotas
│   │   └── auth.ts          # Middleware de autenticação
│   └── routes/              # Rotas da aplicação
│       ├── _index.tsx       # Home (redireciona para login)
│       ├── login.tsx        # Tela de login
│       ├── signup.tsx       # Tela de cadastro
│       ├── conta.$accountCode.tsx  # Dashboard da conta
│       └── $.tsx            # Página 404
├── public/                  # Arquivos estáticos
├── tests/                   # Testes unitários
└── vite.config.ts          # Configuração do Vite
```

## Rotas da Aplicação

### Rotas Públicas

- `/` - Home (redireciona para login se não autenticado)
- `/login` - Tela de login
- `/signup` - Tela de cadastro

### Rotas Protegidas

- `/conta/:accountCode` - Dashboard da conta específica
  - Visualização de saldo
  - Formulários de depósito, saque e transferência
  - Histórico de transações

### Rotas Especiais

- `*` - Página 404 (qualquer rota não encontrada)

## Autenticação

### Fluxo de Autenticação

1. **Login**: Usuário faz login em `/login`
2. **Token JWT**: Backend retorna token JWT
3. **Armazenamento**: Token armazenado em `sessionStorage`
4. **Middleware**: Middleware verifica token em rotas protegidas
5. **Redirecionamento**: Usuário não autenticado é redirecionado para `/login`

### Middleware de Autenticação

O middleware `app/middleware/auth.ts` protege rotas que requerem autenticação:

```typescript
export async function authMiddleware(request: Request) {
  const token = getTokenFromSession();

  if (!token && isProtectedRoute(request.url)) {
    return redirect('/login');
  }

  return null; // Continua para a rota
}
```

### Utilitários de Autenticação

- `getTokenFromSession()`: Obtém token do sessionStorage
- `setTokenInSession(token)`: Armazena token no sessionStorage
- `removeTokenFromSession()`: Remove token do sessionStorage
- `isAuthenticated()`: Verifica se usuário está autenticado

## Gerenciamento de Estado

### TanStack Query

O TanStack Query é usado para gerenciar estado servidor e cache:

```typescript
// Exemplo: use-deposit.ts
export function useDeposit(accountCode: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (amount: number) => deposit(accountCode, amount),
    onSuccess: () => {
      // Invalida cache de saldo e transações
      queryClient.invalidateQueries({ queryKey: ['balance', accountCode] });
      queryClient.invalidateQueries({
        queryKey: ['transactions', accountCode],
      });
    },
  });
}
```

### Cache e Invalidação

O cache é invalidado automaticamente após mutações:

- **Depósito**: Invalida `balance` e `transactions`
- **Saque**: Invalida `balance` e `transactions`
- **Transferência**: Invalida `balance` e `transactions` de ambas as contas

## Componentes Principais

### Dashboard

O dashboard (`/conta/:accountCode`) exibe:

- **Header**: Informações do usuário e botão de logout
- **Sidebar**: Lista de contas do usuário com roteamento
- **Card de Saldo**: Saldo atual da conta selecionada
- **Formulários**: Depósito, saque e transferência
- **Histórico**: Lista de transações recentes

### Formulários

Todos os formulários utilizam React Hook Form e Zod:

- **DepositForm**: Formulário de depósito
- **WithdrawForm**: Formulário de saque
- **TransferForm**: Formulário de transferência

### Componentes UI

Componentes do Shadcn UI utilizados:

- `Button` - Botões estilizados
- `Card` - Cards para conteúdo
- `Dialog` - Modais e diálogos
- `Form` - Formulários com validação
- `Input` - Campos de entrada
- `Select` - Seletores dropdown
- `Spinner` - Indicadores de loading

## Custom Hooks

### useDeposit

Hook para realizar depósitos:

```typescript
const { mutate: deposit, isLoading, error } = useDeposit(accountCode);

deposit(100.5);
```

### useWithdraw

Hook para realizar saques:

```typescript
const { mutate: withdraw, isLoading, error } = useWithdraw(accountCode);

withdraw(50.0);
```

### useTransfer

Hook para realizar transferências:

```typescript
const { mutate: transfer, isLoading, error } = useTransfer(originAccountCode);

transfer({ destinationAccountCode: '5678-9', amount: 100.0 });
```

### useTransactions

Hook para buscar histórico de transações:

```typescript
const { data: transactions, isLoading } = useTransactions(accountCode);
```

## Cliente de API

O cliente de API (`app/lib/api.ts`) centraliza todas as requisições HTTP:

```typescript
// Exemplo de uso
import { deposit, withdraw, transfer, getBalance } from './lib/api';

const balance = await getBalance(accountCode);
await deposit(accountCode, 100.5);
```

### Tratamento de Erros

O cliente de API traduz erros do backend para mensagens amigáveis:

```typescript
// Mapeamento de erros
const errorMessages = {
  'Insufficient funds': 'Saldo insuficiente',
  'Account not found': 'Conta não encontrada',
  // ...
};
```

## Validação

### Schemas Zod

Schemas de validação compartilhados em `packages/shared/`:

```typescript
// Exemplo: deposit schema
export const depositSchema = z.object({
  amount: z.number().min(0.01).max(999999.99),
  accountCode: z
    .string()
    .regex(/^\d{4}-\d$/)
    .optional(),
});
```

### Validação em Formulários

React Hook Form integrado com Zod:

```typescript
const form = useForm({
  resolver: zodResolver(depositSchema),
  defaultValues: {
    amount: 0,
  },
});
```

## Estilização

### Tailwind CSS v4

O projeto utiliza Tailwind CSS v4 para estilização:

- **Utility-first**: Classes utilitárias para estilização rápida
- **Responsive**: Breakpoints para mobile, tablet e desktop
- **Dark Mode**: Preparado para suporte a dark mode (futuro)

### Componentes Shadcn UI

Componentes acessíveis e customizáveis:

- Baseados em Radix UI
- Totalmente acessíveis (ARIA)
- Customizáveis via Tailwind CSS
- TypeScript-first

## Testes

### Testes Unitários

Testes de componentes, hooks e utilitários:

```bash
cd apps/frontend
bun test
```

### Estrutura de Testes

```
tests/
├── unit/
│   ├── api.deposit.test.ts
│   ├── api.transactions.test.ts
│   ├── currency-input.test.ts
│   ├── deposit-form.test.ts
│   └── ...
```

## Performance

### Code Splitting

React Router 7 faz code splitting automático por rota:

- Cada rota é carregada sob demanda
- Reduz tamanho inicial do bundle
- Melhora tempo de carregamento

### Otimizações

- **Lazy Loading**: Componentes carregados sob demanda
- **Query Caching**: Cache inteligente com TanStack Query
- **Optimistic Updates**: Atualizações otimistas para melhor UX
- **Memoization**: React.memo e useMemo onde apropriado

## Acessibilidade

### ARIA

Todos os componentes Shadcn UI são totalmente acessíveis:

- Labels apropriados
- Roles semânticos
- Navegação por teclado
- Suporte a leitores de tela

### Boas Práticas

- Contraste adequado de cores
- Foco visível em elementos interativos
- Mensagens de erro descritivas
- Feedback visual para ações

## Desenvolvimento

### Scripts Disponíveis

```bash
# Desenvolvimento
bun run dev              # Inicia servidor de desenvolvimento

# Build
bun run build            # Cria build de produção

# Testes
bun test                 # Executa testes
bun test --watch         # Modo watch

# Qualidade
bun run lint             # Executa ESLint
bun run type-check       # Verifica tipos TypeScript
```

### Adicionar Componentes Shadcn UI

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

## Troubleshooting

### Problemas Comuns

#### Token não persiste após refresh

**Solução**: Verifique se o token está sendo armazenado corretamente em `sessionStorage`. O token deve ser salvo após login bem-sucedido.

#### Erro de CORS

**Solução**: Verifique se `CLIENT_ORIGIN` no backend está configurado corretamente para `http://localhost:5173`.

#### Componente não encontrado

**Solução**: Certifique-se de que o componente foi adicionado corretamente com `bun run ui:add` e importado do caminho correto.

## Referências

- [React Router 7 Docs](https://reactrouter.com/)
- [React 19 Docs](https://react.dev/)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Shadcn UI Docs](https://ui.shadcn.com/)
- [Tailwind CSS v4 Docs](https://tailwindcss.com/docs/)
- [React Hook Form Docs](https://react-hook-form.com/)
- [Zod Docs](https://zod.dev/)

## Documentação Relacionada

- [Documentação da API](../backend/api/README.md)
- [Arquitetura do Sistema](../architecture/overview.md)
- [Backend README](../backend/README.md)

---

**Última atualização**: 2025-01-15
**Versão do Frontend**: 1.0.0
