# US-021: Logout

**Como** usuário autenticado
**Eu quero** ter um botão de logout no dashboard
**Para que** eu possa encerrar minha sessão de forma segura

## Critérios de Aceite:

- Deve ter botão de logout visível
- Deve remover token JWT do armazenamento
- Deve redirecionar para tela de login após logout
- Deve invalidar sessão no frontend
