# US-008: Realizar Depósito em Conta Existente

**Como** usuário autenticado
**Eu quero** fazer um depósito em uma conta existente
**Para que** eu possa aumentar o saldo da conta

## Critérios de Aceite:

- Deve aceitar requisição POST em `/event` com tipo "deposit"
- Deve exigir autenticação (token JWT válido)
- Deve incrementar o saldo da conta de destino
- Deve retornar status 201 Created
- Deve retornar saldo atualizado no formato `{ "destination": { "id": "<id>", "balance": <novo_saldo> } }`
