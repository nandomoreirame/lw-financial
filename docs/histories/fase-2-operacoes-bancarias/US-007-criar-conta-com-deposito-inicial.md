# US-007: Criar Conta com Depósito Inicial

**Como** usuário autenticado
**Eu quero** criar uma nova conta através de um depósito
**Para que** eu possa iniciar operações bancárias

## Critérios de Aceite:

- Deve aceitar requisição POST em `/event` com tipo "deposit"
- Deve receber body: `{ "type": "deposit", "destination": "<id>", "amount": <valor> }`
- Deve criar conta se não existir
- Deve retornar status 201 Created
- Deve retornar `{ "destination": { "id": "<id>", "balance": <valor> } }`
