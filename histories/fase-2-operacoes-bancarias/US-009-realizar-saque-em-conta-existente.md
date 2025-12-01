# US-009: Realizar Saque em Conta Existente

**Como** usuário autenticado
**Eu quero** fazer um saque de uma conta
**Para que** eu possa retirar dinheiro da minha conta

## Critérios de Aceite:

- Deve aceitar requisição POST em `/event` com tipo "withdraw"
- Deve receber body: `{ "type": "withdraw", "origin": "<id>", "amount": <valor> }`
- Deve exigir autenticação (token JWT válido)
- Deve decrementar o saldo da conta de origem
- Deve retornar status 201 Created
- Deve retornar `{ "origin": { "id": "<id>", "balance": <novo_saldo> } }`
