# US-001: Login no Sistema

**Como** usuário do sistema bancário
**Eu quero** fazer login com username e senha
**Para que** eu possa acessar as funcionalidades do sistema

## Critérios de Aceite:

- Deve aceitar requisição POST em `/login`
- Deve receber body com `username` e `pass`
- Deve retornar status 200 OK com token JWT no formato `{ "token": "<jwt_token>" }`
- Deve validar credenciais (username: "admin", pass: "admin")
