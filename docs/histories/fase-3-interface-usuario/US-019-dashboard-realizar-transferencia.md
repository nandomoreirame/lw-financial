# US-019: Dashboard - Realizar Transferência

**Como** usuário autenticado
**Eu quero** ter campos no dashboard para realizar transferência
**Para que** eu possa transferir dinheiro para outra conta

## Critérios de Aceite:

- Deve ter campo para conta de destino
- Deve ter campo para valor da transferência
- Deve ter botão para confirmar transferência
- Deve enviar requisição POST para `/event` com tipo "transfer"
- Deve atualizar saldo após transferência bem-sucedida
- Deve exibir mensagem de sucesso ou erro
