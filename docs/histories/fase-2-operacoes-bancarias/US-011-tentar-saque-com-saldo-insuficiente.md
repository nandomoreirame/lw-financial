# US-011: Tentar Saque com Saldo Insuficiente

**Como** sistema
**Eu quero** bloquear saque quando o saldo for insuficiente
**Para que** não seja permitido saldo negativo

## Critérios de Aceite:

- Deve retornar status 400 Bad Request
- Deve retornar mensagem `{ "error": "Insufficient funds" }`
- Deve validar saldo antes de processar saque
- Não deve alterar o saldo da conta
