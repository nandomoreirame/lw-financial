# US-004: Reset do Sistema

**Como** administrador do sistema
**Eu quero** resetar o estado do sistema
**Para que** eu possa limpar todos os dados e começar do zero

## Critérios de Aceite:

- Deve aceitar requisição POST em `/reset`
- Deve exigir autenticação (token JWT válido)
- Deve retornar status 200 OK após reset bem-sucedido
- Deve limpar todas as contas e transações
