# US-005: Consultar Saldo de Conta Existente

**Como** usuário autenticado
**Eu quero** consultar o saldo de uma conta
**Para que** eu possa verificar o valor disponível

## Critérios de Aceite:

- Deve aceitar requisição GET em `/balance?account_id=<id>`
- Deve exigir autenticação (token JWT válido)
- Deve retornar status 200 OK com saldo no formato `{ "balance": <valor> }`
- Deve retornar saldo correto da conta especificada
