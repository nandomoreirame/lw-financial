# US-010: Tentar Saque de Conta Inexistente

**Como** sistema
**Eu quero** retornar erro ao tentar sacar de conta inexistente
**Para que** o usuário seja informado que a conta não existe

## Critérios de Aceite:

- Deve retornar status 404 Not Found para conta inexistente
- Deve validar existência da conta antes de processar saque
- Deve retornar mensagem de erro apropriada
