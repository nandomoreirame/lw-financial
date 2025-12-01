# US-002: Proteção de Rotas Autenticadas

**Como** sistema de segurança
**Eu quero** bloquear acesso a rotas protegidas sem autenticação
**Para que** apenas usuários autenticados possam realizar operações bancárias

## Critérios de Aceite:

- Deve retornar status 401 Unauthorized ao acessar rotas protegidas sem token
- Deve validar token JWT no header `Authorization: Bearer <token>`
- Deve bloquear requisições sem header de autorização
