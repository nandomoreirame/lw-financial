# Fase 2: Operações Bancárias Core (Backend)

Esta fase contém todas as histórias de usuário relacionadas às operações bancárias: criação de contas, consulta de saldo, depósitos, saques e transferências.

## Histórias de Usuário

### Sprint 2.1: Gerenciamento de Contas e Saldo

4. **US-007: Criar Conta com Depósito Inicial**
   - Endpoint POST `/event` com tipo "deposit"
   - Criação de conta se não existir
   - Base para outras operações

5. **US-005: Consultar Saldo de Conta Existente**
   - Endpoint GET `/balance?account_id=<id>`
   - Retorno 200 OK com saldo

6. **US-006: Consultar Saldo de Conta Inexistente**
   - Tratamento de erro 404 Not Found

7. **US-008: Realizar Depósito em Conta Existente**
   - Incremento de saldo em conta existente

### Sprint 2.2: Operações de Saque

8. **US-009: Realizar Saque em Conta Existente**
   - Endpoint POST `/event` com tipo "withdraw"
   - Decremento de saldo

9. **US-010: Tentar Saque de Conta Inexistente**
   - Tratamento de erro 404 Not Found

10. **US-011: Tentar Saque com Saldo Insuficiente**
    - Validação de saldo suficiente
    - Retorno 400 Bad Request

### Sprint 2.3: Operações de Transferência

11. **US-012: Realizar Transferência Entre Contas**
    - Endpoint POST `/event` com tipo "transfer"
    - Decremento na origem e incremento no destino

12. **US-013: Tentar Transferência de Conta Inexistente**
    - Tratamento de erro 404 Not Found

13. **US-014: Tentar Transferência com Saldo Insuficiente**
    - Validação de saldo suficiente
    - Retorno 400 Bad Request

### Sprint 2.4: Utilitários

14. **US-004: Reset do Sistema**
    - Endpoint POST `/reset`
    - Limpeza de todas as contas e transações
    - Útil para testes e desenvolvimento

## Ordem de Implementação Recomendada

1. US-007 (criar conta) → 2. US-005 → 3. US-006 → 4. US-008
2. US-009 → 6. US-010 → 7. US-011
3. US-012 → 9. US-013 → 10. US-014
4. US-004 (pode ser feito em paralelo)

## Dependências

- Todas as histórias dependem de **Fase 1** (autenticação)
- US-005, US-006, US-008 dependem de US-007 (precisam de contas criadas)
- US-010, US-011 dependem de US-009 (mesmo endpoint)
- US-013, US-014 dependem de US-012 (mesmo endpoint)
