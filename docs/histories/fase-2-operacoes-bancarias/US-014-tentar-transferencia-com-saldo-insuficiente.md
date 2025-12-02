# US-014: Tentar Transferência com Saldo Insuficiente

**Como** sistema
**Eu quero** bloquear transferência quando o saldo for insuficiente
**Para que** não seja permitido saldo negativo

## Critérios de Aceite:

- Deve retornar status 400 Bad Request
- Deve retornar mensagem `{ "error": "Insufficient funds" }`
- Deve validar saldo antes de processar transferência
- Não deve alterar saldos de nenhuma conta
