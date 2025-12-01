# US-012: Realizar Transferência Entre Contas

**Como** usuário autenticado
**Eu quero** transferir dinheiro entre contas
**Para que** eu possa enviar dinheiro para outra conta

## Critérios de Aceite:

- Deve aceitar requisição POST em `/event` com tipo "transfer"
- Deve receber body: `{ "type": "transfer", "origin": "<id>", "amount": <valor>, "destination": "<id>" }`
- Deve exigir autenticação (token JWT válido)
- Deve decrementar saldo da conta de origem
- Deve incrementar saldo da conta de destino
- Deve retornar status 201 Created
- Deve retornar `{ "origin": { "id": "<id>", "balance": <saldo_origem> }, "destination": { "id": "<id>", "balance": <saldo_destino> } }`
