# Resolução de Migrações Falhadas do Prisma

## Problema

Ao executar `prisma migrate deploy` em produção, você pode encontrar o erro:

```
Error: P3009

migrate found failed migrations in the target database, new migrations will not be applied.
```

Isso acontece quando uma migração falha durante a execução e fica marcada como "failed" no banco de dados, bloqueando a aplicação de novas migrações.

## Causas Comuns

1. **Timeout durante a execução da migração**
2. **Erro de sintaxe SQL na migração**
3. **Conflito com dados existentes** (ex: tentar criar índice único em coluna com valores duplicados)
4. **Problemas de conexão com o banco durante a migração**
5. **Migrações duplicadas** (duas migrações tentando fazer a mesma mudança)

## Solução Automática

O projeto inclui um script para resolver automaticamente migrações falhadas:

```bash
cd apps/backend
bun run prisma:resolve
```

Este script:

- Verifica quais migrações estão falhadas
- Confere se as mudanças já foram aplicadas no banco
- Marca a migração como resolvida se as mudanças já existem
- Fornece feedback detalhado sobre o estado

## Solução Manual

Se o script automático não resolver, você pode resolver manualmente:

### 1. Verificar Estado das Migrações

Conecte-se ao banco de dados e verifique:

```sql
SELECT
  migration_name,
  finished_at,
  applied_steps_count,
  started_at
FROM _prisma_migrations
WHERE finished_at IS NULL
ORDER BY started_at DESC;
```

### 2. Verificar se Mudanças Foram Aplicadas

Para a migração `20251204132804_add_account_code_field`, verifique:

```sql
-- Verificar se a coluna existe
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'bank_account'
  AND column_name = 'code';

-- Verificar se os índices existem
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'bank_account'
  AND indexname IN ('bank_account_code_key', 'bank_account_code_idx');
```

### 3. Resolver a Migração

Se as mudanças **já foram aplicadas**:

```bash
cd apps/backend
npx prisma migrate resolve --applied 20251204132804_add_account_code_field
```

Se as mudanças **não foram aplicadas** e você quer **aplicá-las manualmente**:

```sql
-- Aplicar as mudanças manualmente
ALTER TABLE "bank_account" ADD COLUMN IF NOT EXISTS "code" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "bank_account_code_key" ON "bank_account"("code");
CREATE INDEX IF NOT EXISTS "bank_account_code_idx" ON "bank_account"("code");

-- Depois marcar como resolvida
```

```bash
npx prisma migrate resolve --applied 20251204132804_add_account_code_field
```

Se as mudanças **não foram aplicadas** e você quer **reverter a migração**:

```bash
npx prisma migrate resolve --rolled-back 20251204132804_add_account_code_field
```

### 4. Aplicar Novas Migrações

Após resolver a migração falhada:

```bash
bun run prisma:deploy
```

## Prevenção

### 1. Testar Migrações em Ambiente de Staging

Sempre teste migrações em um ambiente similar à produção antes de aplicar em produção:

```bash
# Em staging
bun run prisma:deploy
```

### 2. Migrações Grandes em Etapas

Para migrações que podem demorar muito (ex: adicionar índice em tabela grande):

1. Crie a migração em etapas menores
2. Use `CREATE INDEX CONCURRENTLY` quando possível (PostgreSQL)
3. Monitore o tempo de execução

### 3. Backup Antes de Migrações

Sempre faça backup do banco antes de aplicar migrações em produção:

```bash
# Exemplo com pg_dump
pg_dump -h localhost -U postgres -d lw-financial-db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 4. Usar Transações Quando Possível

O Prisma já usa transações por padrão, mas certifique-se de que suas migrações são atômicas.

## Exemplo: Resolução da Migração `add_account_code_field`

### Cenário 1: Migração Parcialmente Aplicada

A migração começou a executar mas falhou no meio. A coluna foi criada mas os índices não.

**Solução:**

```sql
-- Verificar o que foi aplicado
SELECT column_name FROM information_schema.columns
WHERE table_name = 'bank_account' AND column_name = 'code';
-- Retorna: code ✅

SELECT indexname FROM pg_indexes
WHERE tablename = 'bank_account' AND indexname LIKE '%code%';
-- Retorna: (nenhum) ❌
```

```sql
-- Aplicar o que falta
CREATE UNIQUE INDEX IF NOT EXISTS "bank_account_code_key" ON "bank_account"("code");
CREATE INDEX IF NOT EXISTS "bank_account_code_idx" ON "bank_account"("code");
```

```bash
# Marcar como resolvida
npx prisma migrate resolve --applied 20251204132804_add_account_code_field
```

### Cenário 2: Migração Completamente Aplicada

A migração executou completamente mas falhou ao marcar como concluída (ex: timeout na conexão).

**Solução:**

```bash
# Apenas marcar como resolvida
npx prisma migrate resolve --applied 20251204132804_add_account_code_field
```

### Cenário 3: Migração Não Aplicada

A migração falhou antes de aplicar qualquer mudança.

**Solução:**

```bash
# Marcar como revertida e tentar novamente
npx prisma migrate resolve --rolled-back 20251204132804_add_account_code_field
bun run prisma:deploy
```

## Comandos Úteis

```bash
# Ver status das migrações
npx prisma migrate status

# Ver histórico de migrações no banco
npx prisma migrate resolve --help

# Aplicar migrações pendentes
bun run prisma:deploy

# Resolver migração falhada (automático)
bun run prisma:resolve
```

## Referências

- [Prisma Migrate Troubleshooting](https://www.prisma.io/docs/guides/migrate/troubleshooting-development)
- [Prisma Migrate Resolve](https://www.prisma.io/docs/reference/api-reference/command-reference#migrate-resolve)
- [Error P3009](https://www.prisma.io/docs/reference/api-reference/error-reference#p3009)
