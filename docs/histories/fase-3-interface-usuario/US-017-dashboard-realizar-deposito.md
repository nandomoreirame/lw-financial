# US-017: Dashboard - Realizar Depósito

**Como** usuário autenticado
**Eu quero** ter campos no dashboard para realizar depósito
**Para que** eu possa depositar dinheiro na minha conta

## Critérios de Aceite:

- Deve ter campo para valor do depósito
- Deve ter botão para confirmar depósito
- Deve enviar requisição POST para `/event` com tipo "deposit"
- Deve atualizar saldo após depósito bem-sucedido
- Deve exibir mensagem de sucesso
