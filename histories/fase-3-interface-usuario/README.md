# Fase 3: Interface do Usuário (Frontend)

Esta fase contém todas as histórias de usuário relacionadas à interface do usuário: telas, formulários e interações do frontend.

## Histórias de Usuário

### Sprint 3.1: Autenticação no Frontend

15. **US-015: Tela de Login**
    - Formulário de login (username/password)
    - Integração com POST `/login`
    - Armazenamento de token JWT
    - Redirecionamento para dashboard

### Sprint 3.2: Dashboard Principal

16. **US-016: Dashboard - Visualização de Saldo**
    - Exibição de saldo da conta autenticada
    - Integração com GET `/balance`

17. **US-017: Dashboard - Realizar Depósito**
    - Formulário de depósito
    - Integração com POST `/event` (tipo "deposit")

18. **US-018: Dashboard - Realizar Saque**
    - Formulário de saque
    - Integração com POST `/event` (tipo "withdraw")

19. **US-019: Dashboard - Realizar Transferência**
    - Formulário de transferência
    - Integração com POST `/event` (tipo "transfer")

### Sprint 3.3: Funcionalidades Complementares

20. **US-020: Dashboard - Histórico de Transações**
    - Lista de transações recentes
    - Exibição de tipo, valor e data/hora

21. **US-021: Logout**
    - Botão de logout
    - Remoção de token JWT
    - Redirecionamento para login

22. **US-022: Mensagens de Erro**
    - Componente de mensagens de erro
    - Tratamento de erros 400, 401, 403, 404
    - Mensagens claras e objetivas

## Ordem de Implementação Recomendada

1. US-015 (tela de login)
2. US-016 → 3. US-017 → 4. US-018 → 5. US-019
3. US-020 → 7. US-021 → 8. US-022

## Dependências

- Todas as histórias dependem de **Fase 1** (autenticação)
- Todas as histórias dependem de **Fase 2** (endpoints já implementados)
- US-016, US-017, US-018, US-019 dependem de US-015 (precisam estar autenticados)
- US-022 deve ser considerado desde o início (não deixar para o final)
