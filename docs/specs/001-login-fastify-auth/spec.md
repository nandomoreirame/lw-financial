# Feature Specification: Login no Sistema

**Feature Branch**: `001-login-fastify-auth`
**Created**: 2025-01-27
**Status**: Draft
**Input**: User description: "@docs/histories/fase-1-fundacao-autenticacao/US-001-login-no-sistema.md usar fastify e better-auth (Better Auth Fastify Integration https://www.better-auth.com/docs/integrations/fastify )"

## Clarifications

### Session 2025-01-27

- Q: Qual deve ser a resposta HTTP e formato quando a requisição de login é inválida (campos ausentes, formato incorreto, etc.)? → A: 400 Bad Request com corpo JSON `{ "error": "mensagem descritiva" }` para campos ausentes/formato inválido
- Q: Existem restrições de formato para username e password, ou o sistema aceita qualquer string não vazia? → A: Validação estrita: username 3-20 caracteres alfanuméricos, password mínimo 6 caracteres
- Q: Qual deve ser a resposta quando alguém tenta acessar `/login` com um método HTTP diferente de POST? → A: 405 Method Not Allowed com header `Allow: POST`
- Q: Como resolver inconsistência entre validação de formato (password mínimo 6 caracteres) e credenciais hardcoded (password "admin" tem 5 caracteres)? → A: Aplicar validação de formato antes da verificação de credenciais (password "admin" falharia na validação). Credenciais hardcoded atualizadas para atender às regras de formato.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Autenticação com Credenciais Válidas (Priority: P1)

Como usuário do sistema bancário, eu quero fazer login fornecendo meu username e senha para obter acesso às funcionalidades do sistema.

**Why this priority**: Esta é a funcionalidade fundamental que permite aos usuários acessar o sistema. Sem autenticação bem-sucedida, nenhuma outra funcionalidade pode ser utilizada. É o primeiro passo crítico no fluxo de uso do sistema.

**Independent Test**: Pode ser totalmente testado enviando uma requisição POST com credenciais válidas e verificando que o sistema retorna um token de autenticação. Entrega valor imediato ao permitir que usuários autenticados acessem o sistema.

**Acceptance Scenarios**:

1. **Given** o sistema está operacional, **When** um usuário envia uma requisição POST para `/login` com username "admin" e senha "admin123" no corpo da requisição, **Then** o sistema retorna status 200 OK com um token JWT no formato `{ "token": "<jwt_token>" }`
2. **Given** o sistema está operacional, **When** um usuário envia uma requisição POST para `/login` com credenciais válidas, **Then** o token retornado pode ser usado para autenticação em requisições subsequentes

---

### Edge Cases

- **Given** uma requisição POST para `/login` com username ausente no corpo, **Then** o sistema retorna status 400 Bad Request com corpo JSON `{ "error": "mensagem descritiva" }`
- **Given** uma requisição POST para `/login` com senha ausente no corpo, **Then** o sistema retorna status 400 Bad Request com corpo JSON `{ "error": "mensagem descritiva" }`
- **Given** uma requisição POST para `/login` com ambos username e senha ausentes, **Then** o sistema retorna status 400 Bad Request com corpo JSON `{ "error": "mensagem descritiva" }`
- **Given** uma requisição que não é do tipo POST para `/login` (ex: GET, PUT, DELETE), **Then** o sistema retorna status 405 Method Not Allowed com header `Allow: POST`
- **Given** uma requisição POST enviada para um endpoint diferente de `/login`, **Then** o sistema retorna status 404 Not Found (tratamento padrão de rotas não encontradas)
- **Given** uma requisição POST para `/login` com corpo vazio, **Then** o sistema retorna status 400 Bad Request com corpo JSON `{ "error": "mensagem descritiva" }`
- **Given** uma requisição POST para `/login` com campos adicionais além de username e pass, **Then** o sistema ignora campos extras e processa apenas username e pass (campos extras não causam erro)
- **Given** uma requisição POST para `/login` com username fora do formato válido (menos de 3 caracteres, mais de 20 caracteres, ou caracteres não alfanuméricos), **Then** o sistema retorna status 400 Bad Request com corpo JSON `{ "error": "mensagem descritiva" }`
- **Given** uma requisição POST para `/login` com password com menos de 6 caracteres, **Then** o sistema retorna status 400 Bad Request com corpo JSON `{ "error": "mensagem descritiva" }`

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST accept POST requests to the `/login` endpoint
- **FR-001a**: System MUST return HTTP status 405 Method Not Allowed with header `Allow: POST` when `/login` is accessed with any HTTP method other than POST
- **FR-002**: System MUST receive and validate username and password from the request body
- **FR-002a**: System MUST validate username format: 3-20 alphanumeric characters
- **FR-002b**: System MUST validate password format: minimum 6 characters
- **FR-002c**: System MUST apply format validation BEFORE credential verification (format validation failures return 400 Bad Request and do not proceed to credential check)
- **FR-003**: System MUST validate credentials against stored authentication data (username: "admin", password: "admin123")
- **FR-004**: System MUST generate a JWT token upon successful authentication
- **FR-005**: System MUST return HTTP status 200 OK when authentication is successful
- **FR-006**: System MUST return the JWT token in the response body in the format `{ "token": "<jwt_token>" }`
- **FR-007**: System MUST handle authentication requests within acceptable response time limits
- **FR-008**: System MUST return HTTP status 400 Bad Request with JSON body `{ "error": "mensagem descritiva" }` when request is invalid (missing fields, empty body, or malformed format)

### Key Entities _(include if feature involves data)_

- **User Credentials**: Represents the authentication information required for login, consisting of username and password
- **Authentication Token**: Represents a time-limited access credential (JWT) that proves successful authentication and enables access to protected resources

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can complete the login process in under 2 seconds from request submission to receiving the authentication token
- **SC-002**: 100% of valid authentication requests (with correct credentials) result in successful login and token generation
- **SC-003**: The authentication endpoint handles concurrent login requests without performance degradation
- **SC-004**: Authentication tokens are generated and returned in a format that enables secure access to protected system resources

## Assumptions

- The system will use username/password authentication as the primary method
- Initial credentials (username: "admin", password: "admin123") are hardcoded for the first implementation phase and comply with format validation rules
- JWT tokens will have appropriate expiration times configured
- The authentication endpoint will be accessible via HTTP POST requests
- The system will be used in a banking context requiring secure authentication
- Future enhancements may include additional authentication methods, but this feature focuses on basic username/password login
