# Troubleshooting: Problema de Redirecionamento após Login

## Sintoma

Usuário fica preso na tela "Redirecionando..." após efetuar login com sucesso.

## Causa Raiz

Contas bancárias no banco de dados sem código de conta (`code: null`).

### Como isso aconteceu?

1. Contas criadas antes da implementação da feature de códigos de conta
2. Possível falha no processo de signup/criação de conta

### Por que isso causa o problema?

O fluxo de redirecionamento em `/apps/frontend/app/routes/home.tsx` verifica se a conta tem código antes de redirecionar:

```typescript
if (firstAccount?.code) {
  navigate(`/conta/${firstAccount.code}`, { replace: true });
}
```

Se `code` for `null`, nenhum redirecionamento acontece.

## Solução

### 1. Solução Imediata: Executar Script de Backfill

Execute o script para gerar códigos para contas existentes sem código:

```bash
cd apps/backend
bun run scripts/backfill-account-codes.ts
```

**Output esperado:**

```
Starting account code backfill...
Found X account(s) without codes.
✓ Generated code XXXX-X for account [id] (user: [userId])
...

=== Backfill Summary ===
Total accounts processed: X
Successfully updated: X
Errors: 0

✓ All accounts have been successfully updated with codes.
```

### 2. Solução de Longo Prazo: Implementado

Foi implementado um mecanismo de retry automático em `/apps/frontend/app/routes/home.tsx`:

- **Retry automático**: Até 5 tentativas com delay de 1.5s
- **Feedback visual**: Mensagem clara quando conta está em processamento
- **Opções de recuperação**: Botões para atualizar manualmente

### 3. Prevenção Futura

O signup (`/apps/backend/src/auth/routes.ts`) SEMPRE gera código durante criação de conta (linha 374-381):

```typescript
const accountCode = await generateUniqueAccountCode();
await tx.bankAccount.create({
  data: {
    userId: user.id,
    balance: 0,
    code: accountCode,
  },
});
```

Se novas contas aparecerem sem código, investigar:

1. Erros no processo de signup
2. Problemas de transação no banco de dados
3. Falhas na geração de códigos únicos

## Verificação

Para verificar se há contas sem código no banco:

```sql
SELECT id, userId, balance, code, createdAt
FROM bank_account
WHERE code IS NULL;
```

## Logs Relevantes

- Backend: Erros ao criar conta durante signup
- Frontend: Erros na chamada da API `/v1/accounts`

## Histórico de Correções

- **2025-12-04**:
  - Encontradas e corrigidas 2 contas sem código
  - Implementado mecanismo de retry no frontend
  - Gerados códigos: `5691-5` e `5700-5`

## Arquivos Relevantes

- `/apps/frontend/app/routes/home.tsx` - Lógica de redirecionamento
- `/apps/backend/src/auth/routes.ts` - Criação de conta no signup
- `/apps/backend/scripts/backfill-account-codes.ts` - Script de correção
- `/apps/backend/src/bank/services/account-code.service.ts` - Geração de códigos
