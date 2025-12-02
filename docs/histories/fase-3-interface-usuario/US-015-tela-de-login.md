# US-015: Tela de Login

**Como** usuário do sistema
**Eu quero** ter uma tela de login com campos para username e password
**Para que** eu possa autenticar no sistema

## Critérios de Aceite:

- Deve ter formulário com campos "username" e "password"
- Deve ter botão para autenticação
- Deve enviar requisição POST para `/login`
- Deve armazenar token JWT após login bem-sucedido
- Deve redirecionar para dashboard após login
