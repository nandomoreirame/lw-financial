# Research: Multi-Account Management with Account Code Routing

**Feature**: Multi-Account Management with Account Code Routing
**Date**: 2025-12-03
**Phase**: 0 - Outline & Research

## Research Tasks

### 1. Geração de Código Único para Contas Bancárias

**Task**: Research algorithm for generating unique account codes in format "XXXX-X" (4 digits, hyphen, 1 digit) with uniqueness guarantees under high concurrency

**Findings**:

**Decision**: Usar algoritmo determinístico baseado em timestamp e contador, com retry em caso de conflito e constraint de unicidade no banco de dados

**Rationale**:

- Formato "XXXX-X" permite 10,000 combinações possíveis (0000-0 a 9999-9)
- Algoritmo determinístico facilita debugging e testes
- Constraint de unicidade no PostgreSQL garante atomicidade
- Retry em caso de conflito (único) cobre casos extremos de concorrência
- Uso de transação de banco de dados garante consistência

**Alternatives Considered**:

- **UUID simplificado**: Mais seguro, mas não atende ao formato requerido "XXXX-X"
- **Sequencial com lock**: Mais simples, mas pode criar gargalo em alta concorrência
- **Geração aleatória pura**: Pode gerar muitos conflitos, exigindo muitos retries

**Implementation Pattern**:

```typescript
// Algoritmo de geração de código
function generateAccountCode(): string {
  // Primeiros 4 dígitos: últimos 4 dígitos do timestamp Unix (mod 10000)
  const timestampPart = Date.now() % 10000;
  const firstPart = timestampPart.toString().padStart(4, '0');

  // Último dígito: contador baseado em timestamp (0-9)
  const counterPart = Math.floor(Date.now() / 1000) % 10;

  return `${firstPart}-${counterPart}`;
}

// Com retry em caso de conflito
async function generateUniqueAccountCode(retries = 10): Promise<string> {
  for (let i = 0; i < retries; i++) {
    const code = generateAccountCode();
    const exists = await checkCodeExists(code);
    if (!exists) return code;

    // Aguardar um pouco antes de tentar novamente
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error('Failed to generate unique account code after retries');
}
```

**Database Constraint**:

```prisma
model BankAccount {
  code String @unique // Constraint de unicidade no banco
  // ...
}
```

**Key Points**:

- Constraint `@unique` no Prisma garante unicidade no nível do banco
- Retry cobre casos raros de conflito (probabilidade muito baixa)
- Transação de banco garante atomicidade durante criação
- Formato "XXXX-X" é URL-safe e legível

### 2. React Router 7 Rotas Dinâmicas

**Task**: Research best practices for dynamic routes in React Router 7 (Remix) with parameter validation and navigation

**Findings**:

**Decision**: Usar rotas dinâmicas com `route('conta/:accountCode', 'routes/conta.$accountCode.tsx')` e validação de parâmetro no loader

**Rationale**:

- React Router 7 suporta rotas dinâmicas usando sintaxe `:param` ou `$param`
- Validação no loader garante que apenas contas válidas sejam acessadas
- Navegação programática com `useNavigate()` permite atualizar URL ao selecionar conta
- Loader pode buscar dados da conta e redirecionar se inválida

**Alternatives Considered**:

- **Query parameters**: Menos limpo para URLs, não permite bookmark direto de conta
- **Estado global**: Não permite URLs compartilháveis, menos RESTful

**Implementation Pattern**:

```typescript
// routes.ts
route('conta/:accountCode', 'routes/conta.$accountCode.tsx');

// routes/conta.$accountCode.tsx
export async function loader({ params, request }: Route.LoaderArgs) {
  const { accountCode } = params;

  // Validar formato do código
  if (!/^\d{4}-\d$/.test(accountCode)) {
    throw new Response('Invalid account code format', { status: 400 });
  }

  // Buscar conta e validar propriedade
  const account = await getAccountByCode(accountCode);
  if (!account || account.userId !== currentUserId) {
    throw new Response('Account not found or access denied', { status: 404 });
  }

  return { account };
}
```

**Key Points**:

- Validação de formato no loader antes de buscar no banco
- Validação de propriedade garante segurança
- Redirecionamento automático em caso de erro
- URL compartilhável e bookmarkável

### 3. Filtragem de Transações por Conta

**Task**: Research efficient filtering of transactions by account code in backend API

**Findings**:

**Decision**: Estender endpoint GET `/v1/transactions` para aceitar query parameter `accountCode` e filtrar usando JOIN com BankAccount

**Rationale**:

- Reutilizar endpoint existente evita duplicação
- Query parameter permite filtro opcional (compatibilidade com código existente)
- JOIN eficiente no PostgreSQL usando índices existentes
- Filtro no backend reduz dados transferidos

**Alternatives Considered**:

- **Novo endpoint dedicado**: Mais RESTful, mas duplica lógica
- **Filtro no frontend**: Menos eficiente, transfere dados desnecessários

**Implementation Pattern**:

```typescript
// Backend handler
export async function transactionsHandler(
  request: FastifyRequest<{ Querystring: { accountCode?: string } }>,
  reply: FastifyReply
) {
  const { accountCode } = request.query;
  const userId = request.user.userId;

  const whereClause: Prisma.TransactionWhereInput = {
    userId,
    ...(accountCode && {
      OR: [
        { originAccount: { code: accountCode } },
        { destinationAccount: { code: accountCode } },
      ],
    }),
  };

  const transactions = await prisma.transaction.findMany({
    where: whereClause,
    include: {
      originAccount: true,
      destinationAccount: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return reply.send(transactions);
}
```

**Key Points**:

- Query parameter opcional mantém compatibilidade
- Filtro eficiente usando índices existentes em `originAccountId` e `destinationAccountId`
- JOIN com BankAccount para buscar por código
- Limite de 20 transações mantido

### 4. Seleção de Conta na Sidebar e Sincronização com URL

**Task**: Research patterns for synchronizing sidebar dropdown selection with URL route parameter

**Findings**:

**Decision**: Usar `useParams()` para ler código da URL e `useNavigate()` para atualizar URL ao selecionar conta, com sincronização bidirecional

**Rationale**:

- URL é a fonte da verdade para qual conta está sendo visualizada
- Sincronização bidirecional garante consistência (URL → Dropdown e Dropdown → URL)
- React Router 7 gerencia estado de navegação automaticamente
- Atualização de URL dispara re-render dos componentes dependentes

**Alternatives Considered**:

- **Estado global apenas**: Não permite URLs compartilháveis
- **Estado local + URL**: Duplicação de estado, pode ficar dessincronizado

**Implementation Pattern**:

```typescript
// Dashboard Sidebar Component
export function DashboardSidebar() {
  const { accountCode } = useParams();
  const navigate = useNavigate();
  const { data: accounts } = useAccounts();

  const handleAccountChange = (newCode: string) => {
    navigate(`/conta/${newCode}`);
  };

  // Sincronizar dropdown com URL atual
  useEffect(() => {
    if (accountCode && accounts) {
      const currentAccount = accounts.find(acc => acc.code === accountCode);
      // Atualizar estado do dropdown se necessário
    }
  }, [accountCode, accounts]);

  return (
    <Select value={accountCode} onValueChange={handleAccountChange}>
      {/* ... */}
    </Select>
  );
}
```

**Key Points**:

- URL é fonte única da verdade
- Navegação atualiza URL e dispara reload dos dados
- Dropdown reflete estado da URL automaticamente
- Componentes filhos recebem `accountCode` via props ou context

### 5. Geração de Código com Garantia de Unicidade em Alta Concorrência

**Task**: Research database-level strategies to ensure code uniqueness under concurrent account creation

**Findings**:

**Decision**: Usar constraint `@unique` no Prisma schema + transação de banco + retry com backoff exponencial

**Rationale**:

- Constraint de unicidade no PostgreSQL garante atomicidade
- Transação de banco isola tentativas concorrentes
- Retry cobre casos extremos onde código gerado colide
- Backoff exponencial evita thundering herd

**Implementation Pattern**:

```typescript
async function createAccountWithCode(userId: string, initialBalance: number) {
  const maxRetries = 10;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const code = generateAccountCode();

      return await prisma.$transaction(async (tx) => {
        // Tentar criar conta com código
        return await tx.bankAccount.create({
          data: {
            userId,
            balance: initialBalance,
            code, // Se código já existe, constraint falhará aqui
          },
        });
      });
    } catch (error) {
      if (error.code === 'P2002' && error.meta?.target?.includes('code')) {
        // Violação de constraint de unicidade
        retries++;
        if (retries >= maxRetries) {
          throw new Error('Failed to generate unique code after retries');
        }
        // Backoff exponencial
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, retries) * 10)
        );
      } else {
        throw error; // Outro erro, propagar
      }
    }
  }
}
```

**Key Points**:

- Constraint de unicidade no banco é garantia final
- Transação garante atomicidade
- Retry apenas para violações de unicidade
- Backoff exponencial reduz carga no banco

## Technology Decisions Summary

| Decision              | Choice                                            | Rationale                                           |
| --------------------- | ------------------------------------------------- | --------------------------------------------------- |
| Código de conta       | Formato "XXXX-X" com algoritmo determinístico     | Atende especificação, determinístico facilita debug |
| Garantia de unicidade | Constraint @unique + transação + retry            | Garante unicidade mesmo em alta concorrência        |
| Rotas dinâmicas       | React Router 7 `route('conta/:accountCode', ...)` | Suporte nativo, URLs compartilháveis                |
| Filtro de transações  | Query parameter no endpoint existente             | Reutiliza código, eficiente                         |
| Sincronização URL/UI  | URL como fonte da verdade                         | Permite bookmarks, compartilhamento                 |

## Dependencies Identified

- **Prisma Migration**: Adicionar campo `code` com constraint `@unique` ao modelo BankAccount
- **React Router 7**: Suporte a rotas dinâmicas já disponível
- **PostgreSQL**: Constraint de unicidade nativo
- **React Query**: Já em uso, suporta invalidação de cache por conta

## Open Questions Resolved

- ✅ Como garantir unicidade de código em alta concorrência? → Constraint + transação + retry
- ✅ Como sincronizar dropdown com URL? → URL como fonte da verdade, `useParams()` e `useNavigate()`
- ✅ Como filtrar transações por conta? → Query parameter no endpoint existente
- ✅ Como validar formato de código na URL? → Regex no loader antes de buscar no banco

## Next Steps

1. Criar migração Prisma para adicionar campo `code` com constraint `@unique`
2. Implementar serviço de geração de código único
3. Criar handler para buscar conta por código
4. Configurar rota dinâmica no React Router 7
5. Atualizar sidebar para sincronizar com URL
