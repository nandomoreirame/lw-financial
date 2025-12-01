# US-016: Dashboard - Visualização de Saldo

**Como** usuário autenticado
**Eu quero** visualizar o saldo da minha conta no dashboard
**Para que** eu possa acompanhar meu saldo atual

## Critérios de Aceite:

- Deve exibir saldo da conta autenticada
- Deve atualizar saldo após operações
- Deve fazer requisição GET para `/balance` com account_id do usuário
