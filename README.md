# Monorepo

Monorepo criado com Bun Workspaces contendo frontend e backend.

## 📁 Estrutura

```
.
├── apps/
│   ├── frontend/     # React Router (Remix v7)
│   └── backend/      # Node.js + Express + Prisma
├── packages/
│   ├── shared/       # Código compartilhado (Zod)
│   └── ui/           # Componentes UI compartilhados
└── package.json      # Configuração do monorepo
```

## 🚀 Início Rápido

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

## 🛠️ Tecnologias

### Frontend

- **React Router v7** (Remix)
- **Tailwind CSS v4**
- **ShadcnUI**
- **React Query** (TanStack Query)
- **React Hook Form**
- **Zod** (validação)

### Backend

- **Node.js + TypeScript**
- **Express**
- **Prisma** (ORM)
- **PostgreSQL**
- **Zod** (validação)

### Ferramentas

- **Bun** (runtime e gerenciador de pacotes)
- **TypeScript**
- **ESLint + Prettier**
- **Husky + lint-staged**

## 📦 Scripts Disponíveis

```bash
# Desenvolvimento
bun run dev              # Executa todos os apps em dev

# Build
bun run build            # Build de todos os apps

# Qualidade de código
bun run lint             # Lint em todos os pacotes
bun run format           # Formata código com Prettier
bun run type-check       # Verifica tipos TypeScript

# Testes
bun run test             # Executa testes

# Limpeza
bun run clean            # Remove builds e cache
```

## 🔧 Configuração

### Backend - Banco de Dados

1. **Inicie o PostgreSQL com Docker Compose:**

```bash
# Na raiz do projeto
docker-compose up -d
```

Isso irá iniciar um container PostgreSQL na porta 5432 (padrão).

2. **Configure as variáveis de ambiente:**

Copie o arquivo de exemplo e ajuste se necessário:

```bash
cp apps/backend/.env.example apps/backend/.env
```

Ou configure diretamente em `apps/backend/.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/monorepo_dev?schema=public"
```

3. **Execute as migrações do Prisma:**

```bash
cd apps/backend
bun run prisma:migrate
bun run prisma:generate
```

4. **(Opcional) Abra o Prisma Studio:**

```bash
bun run prisma:studio
```

5. **Parar o banco de dados:**

```bash
docker-compose down
```

Para remover também os volumes (dados):

```bash
docker-compose down -v
```

### Frontend - ShadcnUI

Para adicionar componentes do ShadcnUI:

```bash
cd apps/frontend
bunx shadcn@latest add [component-name]
```

Exemplo:

```bash
bunx shadcn@latest add button
bunx shadcn@latest add card
```

## 📚 Documentação

- [React Router Docs](https://reactrouter.com)
- [Prisma Docs](https://www.prisma.io/docs)
- [ShadcnUI Docs](https://ui.shadcn.com)
- [React Query Docs](https://tanstack.com/query/latest)
- [Bun Docs](https://bun.sh/docs)

## 🤝 Contribuindo

1. Faça suas alterações
2. Execute `bun run lint` e `bun run type-check`
3. Commit suas mudanças (Husky irá validar automaticamente)
