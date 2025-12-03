# Code Review: Fase 4 - User Story 2 (Withdraw Money)

**Data**: 2025-12-02
**Feature**: 005-deposit-withdraw
**User Story**: US-018 - Dashboard Realizar Saque
**Arquivos Revisados**:

- `apps/frontend/app/lib/api.ts` (função `withdraw`)
- `apps/frontend/app/hooks/use-withdraw.ts`
- `apps/frontend/app/components/dashboard/withdraw-form.tsx`
- `apps/frontend/app/lib/validation.ts` (withdrawFormSchema)
- `apps/frontend/app/routes/dashboard.tsx` (integração)

---

## ✅ Funcionalidade

### O código faz o que deveria fazer

- [x] **PASS**: Função `withdraw()` implementada corretamente
- [x] **PASS**: Hook `useWithdraw` gerencia estado e cache adequadamente
- [x] **PASS**: Componente `WithdrawForm` valida e submete formulário
- [x] **PASS**: Integração no dashboard funcional

### Casos extremos são tratados

- [x] **PASS**: Validação de valor mínimo (R$ 0,01) e máximo (R$ 999.999,99)
- [x] **PASS**: Validação de 2 casas decimais
- [x] **PASS**: Verificação de saldo insuficiente (cliente e servidor)
- [x] **PASS**: Tratamento de token ausente
- [x] **PASS**: Tratamento de erros de rede/timeout
- [x] **PASS**: Tratamento de respostas inválidas do servidor
- [ ] **ISSUE**: Não trata caso onde `currentBalance` é `undefined` durante verificação de saldo

**Problema identificado**:

```typescript:86:89:apps/frontend/app/components/dashboard/withdraw-form.tsx
// Client-side balance check before submission
if (currentBalance !== undefined && data.amount > currentBalance) {
  setInsufficientFundsError('Saldo insuficiente para realizar o saque');
  return;
}
```

**Análise**: Se `currentBalance` for `undefined` (saldo ainda carregando), a verificação não ocorre e o formulário pode ser submetido. Embora o backend valide, seria melhor UX prevenir submissão enquanto saldo não está disponível.

**Recomendação**: Desabilitar botão de submit quando `currentBalance === undefined` ou adicionar verificação adicional.

### Tratamento de erros é apropriado

- [x] **PASS**: Erros de autenticação tratados (401/403)
- [x] **PASS**: Erros de saldo insuficiente tratados (400)
- [x] **PASS**: Erros de rede tratados com mensagens amigáveis
- [x] **PASS**: Erros de timeout tratados
- [x] **PASS**: Validação de estrutura de resposta do servidor
- [ ] **ISSUE**: Lógica de detecção de erro de saldo insuficiente pode ser melhorada

**Problema identificado**:

```typescript:293:307:apps/frontend/app/lib/api.ts
if (response.status === 400) {
  const error: ErrorResponse = await response.json().catch(() => ({
    error: 'Saldo insuficiente',
  }));
  // Check if error message mentions insufficient funds
  const errorMessage = error.error || 'Saldo insuficiente';
  if (
    errorMessage.toLowerCase().includes('insufficient') ||
    errorMessage.toLowerCase().includes('saldo') ||
    errorMessage.toLowerCase().includes('insuficiente')
  ) {
    throw new Error('Saldo insuficiente');
  }
  throw new Error(errorMessage);
}
```

**Análise**: A verificação de mensagem de erro é muito genérica. Se o backend retornar um erro 400 com mensagem "Valor inválido", pode ser confundido com saldo insuficiente.

**Recomendação**: Usar código de erro específico do backend ou verificar mensagem exata. Alternativamente, confiar apenas na validação do backend e tratar todos os 400 como erros de validação.

### Sem bugs óbvios ou erros de lógica

- [x] **PASS**: Lógica de validação correta
- [x] **PASS**: Lógica de submissão correta
- [x] **PASS**: Invalidação de cache após sucesso
- [ ] **ISSUE**: Múltiplos `useEffect` podem causar race conditions

**Problema identificado**:

```typescript:67:79:apps/frontend/app/components/dashboard/withdraw-form.tsx
// Clear insufficient funds error when amount changes
React.useEffect(() => {
  if (insufficientFundsError) {
    setInsufficientFundsError(null);
  }
}, [amountValue]);

// Clear error when form is reset
React.useEffect(() => {
  if (error) {
    setInsufficientFundsError(null);
  }
}, [error]);
```

**Análise**: Dois `useEffect` separados para limpar o mesmo estado podem causar renderizações desnecessárias. Além disso, o segundo `useEffect` limpa `insufficientFundsError` quando `error` muda, mas não há dependência de `insufficientFundsError` no array de dependências.

**Recomendação**: Consolidar lógica de limpeza de erros em um único `useEffect` ou usar um cleanup mais explícito.

---

## ✅ Qualidade do Código

### Código é legível e bem estruturado

- [x] **PASS**: Código bem organizado e comentado
- [x] **PASS**: Estrutura de arquivos lógica
- [x] **PASS**: Separação de responsabilidades adequada
- [x] **PASS**: TypeScript com tipos bem definidos

### Funções são pequenas e focadas

- [x] **PASS**: Função `withdraw()` focada em uma responsabilidade
- [x] **PASS**: Hook `useWithdraw` focado em gerenciamento de estado
- [x] **PASS**: Componente `WithdrawForm` bem estruturado
- [ ] **ISSUE**: Função `onSubmit` poderia ser extraída para melhorar testabilidade

**Recomendação**: Considerar extrair lógica de validação de saldo para função separada.

### Nomes de variáveis são descritivos

- [x] **PASS**: Nomes descritivos e consistentes
- [x] **PASS**: Uso de TypeScript para documentação de tipos
- [x] **PASS**: Interfaces bem nomeadas

### Sem duplicação de código

- [x] **PASS**: Reutilização de `transactionAmountSchema` para validação
- [x] **PASS**: Padrão similar ao `DepositForm` (consistência)
- [ ] **ISSUE**: Lógica de tratamento de erro similar entre `deposit()` e `withdraw()`

**Análise**: As funções `deposit()` e `withdraw()` têm lógica muito similar. A única diferença significativa é o tratamento de erro 400 para saldo insuficiente.

**Recomendação**: Considerar extrair lógica comum para função auxiliar `handleEventRequest()` que aceita o tipo de evento como parâmetro.

### Segue convenções do projeto

- [x] **PASS**: Segue padrão do `DepositForm`
- [x] **PASS**: Usa mesmas bibliotecas (react-hook-form, zod, React Query)
- [x] **PASS**: Estilização com Tailwind CSS e ShadcnUI
- [x] **PASS**: Estrutura de pastas consistente

---

## ✅ Segurança

### Sem vulnerabilidades de segurança óbvias

- [x] **PASS**: Token JWT armazenado em sessionStorage (conforme padrão do projeto)
- [x] **PASS**: Validação de entrada no frontend e backend
- [x] **PASS**: Sem exposição de dados sensíveis em logs de produção
- [x] **PASS**: Validação de URL da API para prevenir injection attacks
- [x] **PASS**: Timeout em requisições para prevenir DoS

### Validação de entrada está presente

- [x] **PASS**: Validação com Zod no frontend
- [x] **PASS**: Validação de tipo, range e precisão
- [x] **PASS**: Validação de estrutura de resposta do servidor
- [ ] **ISSUE**: Validação de saldo no cliente não é suficiente para segurança

**Análise**: A validação de saldo no cliente é apenas para UX. O backend deve sempre validar saldo suficiente. Isso está correto, mas poderia ser mais explícito no código.

**Recomendação**: Adicionar comentário explicando que a validação de saldo no cliente é apenas para UX e que o backend sempre valida.

### Dados sensíveis são tratados adequadamente

- [x] **PASS**: Token JWT não é exposto em logs
- [x] **PASS**: Erros não expõem informações sensíveis
- [x] **PASS**: Logs apenas em ambiente de desenvolvimento

### Sem secrets hardcoded

- [x] **PASS**: Sem secrets hardcoded
- [x] **PASS**: URL da API via variável de ambiente
- [x] **PASS**: Timeout configurável

---

## 🔧 Melhorias Implementadas

### ✅ Prioridade Alta - IMPLEMENTADAS

1. **✅ Tratar caso de saldo `undefined` durante verificação**
   - ✅ Botão desabilitado quando `currentBalance === undefined`
   - ✅ Verificação adicional antes de permitir submissão com mensagem clara
   - ✅ Comentário explicando que validação de saldo no cliente é apenas para UX

2. **✅ Melhorar detecção de erro de saldo insuficiente**
   - ✅ Verificação mais específica de mensagens de erro
   - ✅ Tratamento separado para erros de validação vs saldo insuficiente
   - ✅ Mensagens de erro mais precisas

3. **✅ Consolidar lógica de limpeza de erros**
   - ✅ `useEffect` unificado para evitar race conditions
   - ✅ Dependências corretas adicionadas

### Prioridade Média

4. **Extrair lógica comum entre `deposit()` e `withdraw()`**
   - Criar função auxiliar `handleEventRequest()`
   - Reduzir duplicação de código

5. **Melhorar testabilidade**
   - Extrair lógica de validação de saldo para função separada
   - Facilitar testes unitários

### Prioridade Baixa

6. **Adicionar comentários explicativos**
   - Explicar que validação de saldo no cliente é apenas para UX
   - Documentar decisões de design

---

## 📊 Resumo

### Status Geral: ✅ **APROVADO COM SUGESTÕES**

**Pontos Fortes**:

- ✅ Funcionalidade completa e correta
- ✅ Código bem estruturado e legível
- ✅ Segurança adequada
- ✅ Segue padrões do projeto
- ✅ Tratamento de erros robusto

**Pontos de Atenção (Resolvidos)**:

- ✅ Tratamento de `currentBalance === undefined` - IMPLEMENTADO
- ✅ Lógica de detecção de erro de saldo insuficiente - MELHORADA
- ✅ Múltiplos `useEffect` - CONSOLIDADOS
- ⚠️ Oportunidade de reduzir duplicação de código (prioridade média)

**Recomendação Final**:
O código está funcional, seguro e robusto. As melhorias de prioridade alta foram implementadas. As questões restantes são de otimização e refatoração (prioridade média/baixa), não bloqueadores críticos. O código está pronto para produção.

---

## ✅ Checklist Final

### Funcionalidade

- [x] O código faz o que deveria fazer
- [x] Casos extremos são tratados (com ressalvas)
- [x] Tratamento de erros é apropriado (com melhorias sugeridas)
- [x] Sem bugs óbvios ou erros de lógica (com otimizações sugeridas)

### Qualidade do Código

- [x] Código é legível e bem estruturado
- [x] Funções são pequenas e focadas (com oportunidade de extração)
- [x] Nomes de variáveis são descritivos
- [x] Sem duplicação de código (com oportunidade de refatoração)
- [x] Segue convenções do projeto

### Segurança

- [x] Sem vulnerabilidades de segurança óbvias
- [x] Validação de entrada está presente
- [x] Dados sensíveis são tratados adequadamente
- [x] Sem secrets hardcoded
