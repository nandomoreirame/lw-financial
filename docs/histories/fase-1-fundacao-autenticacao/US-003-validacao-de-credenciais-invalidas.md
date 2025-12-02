# US-003: Validação de Credenciais Inválidas

**Como** sistema de segurança
**Eu quero** rejeitar tentativas de login com credenciais inválidas
**Para que** o sistema seja protegido contra acesso não autorizado

## Critérios de Aceite:

- Deve retornar status 403 Forbidden para credenciais inválidas
- Deve validar username e senha antes de gerar token
- Deve retornar erro apropriado sem expor detalhes de segurança
