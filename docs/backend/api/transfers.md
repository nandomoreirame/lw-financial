# API de Transferencias

Documentacao completa da API de transferencias entre contas bancarias.

## Visao Geral

A API de transferencias permite movimentar dinheiro entre contas bancarias do sistema LW Financial. As transferencias podem ser realizadas usando:

- **ID da conta**: Identificador unico interno (UUID)
- **Codigo da conta**: Codigo amigavel no formato `XXXX-X` (ex: `1234-5`)

## Endpoint

```
POST /v1/event
```

### Headers Obrigatorios

| Header          | Valor              | Descricao                 |
| --------------- | ------------------ | ------------------------- |
| `Content-Type`  | `application/json` | Tipo do conteudo          |
| `Authorization` | `Bearer <token>`   | Token JWT de autenticacao |

## Request Body

### Transferencia por Codigo de Conta (Recomendado)

```json
{
  "type": "transfer",
  "originAccountCode": "1234-5",
  "destinationAccountCode": "5678-9",
  "amount": 100.5
}
```

### Transferencia por ID de Conta

```json
{
  "type": "transfer",
  "origin": "uuid-da-conta-origem",
  "destination": "uuid-da-conta-destino",
  "amount": 100.5
}
```

### Parametros

| Campo                    | Tipo   | Obrigatorio | Descricao                                      |
| ------------------------ | ------ | ----------- | ---------------------------------------------- |
| `type`                   | string | Sim         | Deve ser `"transfer"`                          |
| `amount`                 | number | Sim         | Valor da transferencia (0.01 a 999999.99)      |
| `originAccountCode`      | string | Nao\*       | Codigo da conta de origem (formato: `XXXX-X`)  |
| `destinationAccountCode` | string | Nao\*       | Codigo da conta de destino (formato: `XXXX-X`) |
| `origin`                 | string | Nao\*       | ID (UUID) da conta de origem                   |
| `destination`            | string | Nao\*       | ID (UUID) da conta de destino                  |

> \*Pelo menos um metodo de identificacao deve ser fornecido para origem e destino.

### Regras de Negocio

1. **Conta de origem**: Deve pertencer ao usuario autenticado (validacao de ownership)
2. **Conta de destino**: Pode pertencer a qualquer usuario (nao valida ownership)
3. **Saldo**: A conta de origem deve ter saldo suficiente
4. **Mesma conta**: Nao e possivel transferir para a mesma conta

## Responses

### Sucesso (201 Created)

```json
{
  "origin": {
    "id": "uuid-da-conta-origem",
    "code": "1234-5",
    "balance": 899.5
  },
  "destination": {
    "id": "uuid-da-conta-destino",
    "code": "5678-9",
    "balance": 1100.5
  }
}
```

### Erros

#### 400 Bad Request - Validacao

```json
{
  "error": "Invalid amount"
}
```

```json
{
  "error": "Amount must have at most 2 decimal places"
}
```

```json
{
  "error": "Origin and destination cannot be the same"
}
```

```json
{
  "error": "Destination account is required for transfer"
}
```

```json
{
  "error": "Invalid account code format. Expected format: XXXX-X"
}
```

```json
{
  "error": "Insufficient funds"
}
```

#### 401 Unauthorized

```json
{
  "error": "Authentication required when using account code"
}
```

#### 404 Not Found

```json
{
  "error": "Account not found or access denied"
}
```

```json
{
  "error": "Account not found"
}
```

## Exemplos de Uso

### cURL

```bash
curl -X POST http://localhost:3333/v1/event \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <seu-token-jwt>" \
  -d '{
    "type": "transfer",
    "originAccountCode": "1234-5",
    "destinationAccountCode": "5678-9",
    "amount": 100.00
  }'
```

### JavaScript/TypeScript (Frontend)

```typescript
import { transfer } from '../lib/api';

// Transferir R$ 100,00 da conta 1234-5 para 5678-9
const result = await transfer('5678-9', 100.0, '1234-5');

console.log('Saldo origem:', result.origin.balance);
console.log('Saldo destino:', result.destination.balance);
```

### React Hook

```typescript
import { useTransfer } from '../hooks/use-transfer';

function TransferButton() {
  const { transfer, isLoading, error } = useTransfer('1234-5');

  const handleTransfer = async () => {
    try {
      await transfer('5678-9', 100.00);
      // Sucesso!
    } catch (err) {
      // Tratar erro
    }
  };

  return (
    <button onClick={handleTransfer} disabled={isLoading}>
      {isLoading ? 'Transferindo...' : 'Transferir'}
    </button>
  );
}
```

## Arquitetura Interna

### Fluxo de Resolucao de Conta

A funcao `resolveAccountId()` centraliza a logica de resolucao de contas:

```
1. Se accountCode fornecido:
   a. Validar formato (regex: /^\d{4}-\d$/)
   b. Buscar conta por codigo
   c. Validar ownership (se requireOwnership=true)
   d. Retornar ID da conta

2. Se fallbackAccountId fornecido:
   a. Retornar fallbackAccountId

3. Se usuario autenticado:
   a. Buscar/criar conta padrao do usuario
   b. Retornar ID da conta

4. Caso contrario:
   a. Retornar erro 401
```

### Transacao Atomica

A transferencia e executada em uma transacao Prisma para garantir atomicidade:

```typescript
await prisma.$transaction(async (tx) => {
  // 1. Verificar saldo da origem
  // 2. Debitar origem
  // 3. Creditar destino
  // 4. Registrar transacao
});
```

## Validacoes

### Valor (amount)

- Minimo: R$ 0,01
- Maximo: R$ 999.999,99
- Precisao: 2 casas decimais
- Deve ser numero positivo

### Codigo de Conta (accountCode)

- Formato: `XXXX-X` (4 digitos, hifen, 1 digito)
- Regex: `/^\d{4}-\d$/`
- Exemplo valido: `1234-5`
- Exemplo invalido: `12345`, `123-45`, `ABCD-1`

## Tratamento de Erros no Frontend

O cliente de API traduz erros para mensagens em portugues:

```typescript
// Mapeamento de erros
'insufficient funds' -> 'Saldo insuficiente para transferencia'
'same' -> 'A conta de origem e destino nao podem ser a mesma'
'not found' -> 'Conta de destino nao encontrada'
```

## Cache e Invalidacao

Apos uma transferencia bem-sucedida, o React Query invalida:

1. Cache de saldo da conta de origem
2. Cache de transacoes da conta de origem
3. Cache geral de transacoes

```typescript
queryClient.invalidateQueries({ queryKey: ['balance', originAccountCode] });
queryClient.invalidateQueries({
  queryKey: ['transactions', originAccountCode],
});
queryClient.invalidateQueries({ queryKey: ['transactions'] });
```

## Seguranca

1. **Autenticacao**: Todas as transferencias requerem JWT valido
2. **Ownership**: A conta de origem deve pertencer ao usuario autenticado
3. **Validacao de entrada**: Todos os parametros sao validados
4. **Transacao atomica**: Garante consistencia dos dados

## Arquivos Relacionados

### Backend

- `apps/backend/src/bank/handlers/event.ts` - Handler do endpoint
- `apps/backend/src/bank/services/account.service.ts` - Servico de contas

### Frontend

- `apps/frontend/app/lib/api.ts` - Cliente de API
- `apps/frontend/app/hooks/use-transfer.ts` - Hook React
- `apps/frontend/app/components/dashboard/transfer-form.tsx` - Formulario
- `apps/frontend/app/components/dashboard/transfer-dialog.tsx` - Dialog
- `packages/components/lib/validation.ts` - Schemas de validacao
