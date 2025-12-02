# US-018: Dashboard - Realizar Saque

**Como** usuário autenticado
**Eu quero** ter campos no dashboard para realizar saque
**Para que** eu possa sacar dinheiro da minha conta

## Critérios de Aceite:

- Deve ter campo para valor do saque
- Deve ter botão para confirmar saque
- Deve enviar requisição POST para `/event` com tipo "withdraw"
- Deve atualizar saldo após saque bem-sucedido
- Deve exibir mensagem de sucesso ou erro
