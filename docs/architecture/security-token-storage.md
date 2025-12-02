# Decisão Arquitetural: Estratégia de Armazenamento de Token

**Data**: 2025-12-02
**Status**: Ativo
**Versão**: 1.0

## Contexto

O sistema precisa armazenar tokens JWT para autenticação de usuários. A escolha do método de armazenamento impacta diretamente a segurança, complexidade de implementação e experiência do usuário.

## Decisão Atual

**Implementação**: `sessionStorage` (client-side)\*\*

O token JWT é armazenado no `sessionStorage` do navegador, acessível apenas via JavaScript no contexto da mesma origem.

## Análise de Opções

### Opção 1: sessionStorage (Implementada)

#### Vantagens

- ✅ **Simplicidade**: Implementação direta sem configuração adicional
- ✅ **Limpeza Automática**: Token removido automaticamente ao fechar aba/janela
- ✅ **Compatibilidade SSR**: Funciona bem com React Router 7 e navegação client-side
- ✅ **Sem CSRF**: Não requer implementação de proteção CSRF
- ✅ **Desenvolvimento Rápido**: Menor complexidade para MVP

#### Desvantagens

- ⚠️ **Vulnerabilidade XSS**: Tokens acessíveis via JavaScript podem ser roubados em ataques XSS
- ⚠️ **Não Persiste**: Token perdido ao fechar aba (pode ser visto como vantagem)
- ⚠️ **Acessível a Scripts**: Qualquer script executando no contexto pode acessar

#### Mitigações Implementadas

1. **Validação de Entrada**: Todos os inputs são validados e sanitizados
2. **HTTPS Obrigatório**: Comunicação sempre via HTTPS em produção
3. **Expiração de Token**: Tokens expiram em 1 hora
4. **Validação Server-Side**: Todos os endpoints validam tokens no servidor
5. **Content Security Policy**: Recomendado implementar CSP headers

### Opção 2: httpOnly Cookies (Alternativa Futura)

#### Vantagens

- ✅ **Proteção XSS**: Tokens não acessíveis via JavaScript
- ✅ **Persistência**: Pode persistir entre sessões (se configurado)
- ✅ **Segurança Aprimorada**: Maior proteção contra roubo de token

#### Desvantagens

- ⚠️ **Complexidade**: Requer configuração de CORS e cookies
- ⚠️ **CSRF**: Necessita implementação de proteção CSRF
- ⚠️ **SSR Complexidade**: Mais complexo com React Router 7 SSR
- ⚠️ **Configuração**: Requer configuração de SameSite, Secure, etc.

#### Requisitos para Migração

1. Implementar CSRF tokens
2. Configurar CORS adequadamente
3. Configurar cookies (SameSite, Secure, httpOnly)
4. Atualizar middleware de autenticação
5. Testar compatibilidade com SSR

### Opção 3: localStorage (Não Recomendado)

#### Por que não usar

- ❌ **Persistência Indesejada**: Tokens persistem mesmo após fechar navegador
- ❌ **Mesmas Vulnerabilidades XSS**: Ainda acessível via JavaScript
- ❌ **Sem Vantagens**: Não oferece benefícios sobre sessionStorage

## Decisão e Justificativa

**Decisão**: Usar `sessionStorage` para MVP

**Justificativa**:

1. **Velocidade de Desenvolvimento**: Permite focar em funcionalidades core
2. **Segurança Adequada para MVP**: Com mitigações implementadas, oferece segurança suficiente
3. **Simplicidade**: Reduz complexidade e pontos de falha
4. **Compatibilidade**: Funciona bem com React Router 7 e arquitetura atual

## Plano de Evolução

### Fase 1 (Atual - MVP)

- ✅ sessionStorage com validação server-side
- ✅ HTTPS obrigatório
- ✅ Expiração de token (1h)
- ✅ Validação de entrada

### Fase 2 (Futuro - Produção)

- 🔄 Implementar Content Security Policy (CSP)
- 🔄 Adicionar rate limiting
- 🔄 Monitoramento de segurança

### Fase 3 (Futuro - Alta Segurança)

- 🔄 Avaliar migração para httpOnly cookies
- 🔄 Implementar CSRF protection
- 🔄 Refresh tokens
- 🔄 MFA (Multi-Factor Authentication)

## Métricas de Segurança

### Atuais

- Token expiration: 1 hora
- HTTPS enforcement: ✅
- Server-side validation: ✅
- Input sanitization: ✅

### Recomendadas para Produção

- CSP headers: ⚠️ Pendente
- Rate limiting: ⚠️ Pendente
- Security monitoring: ⚠️ Pendente
- Token rotation: ⚠️ Pendente

## Referências

- [OWASP - Token Storage](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html)
- [MDN - sessionStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage)
- [React Router 7 - Authentication](https://reactrouter.com/en/main/start/overview)

## Revisão

Esta decisão deve ser revisada quando:

- Aplicação escala para produção com dados sensíveis
- Requisitos de segurança aumentam
- Novas vulnerabilidades são identificadas
- Time de desenvolvimento permite implementar httpOnly cookies

---

**Aprovado por**: Equipe de Desenvolvimento
**Próxima Revisão**: Quando migrar para produção ou identificar necessidade de maior segurança
