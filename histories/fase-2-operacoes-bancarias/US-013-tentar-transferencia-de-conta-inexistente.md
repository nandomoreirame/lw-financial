# US-013: Tentar Transferência de Conta Inexistente

**Como** sistema
**Eu quero** retornar erro ao tentar transferir de conta inexistente
**Para que** o usuário seja informado que a conta de origem não existe

## Critérios de Aceite:

- Deve retornar status 404 Not Found
- Deve validar existência da conta de origem antes de processar
- Deve retornar mensagem de erro apropriada
- Não deve alterar saldos de nenhuma conta
