#Postman Collection - LW Financial API

Esta pasta contém a collection e os environments do Postman para testar a API LW Financial.

##Arquivos

- **LW-Financial-API.postman_collection.json** - Collection completa com todos os endpoints
- **Development.postman_environment.json** - Environment para desenvolvimento local
- **Production.postman_environment.json** - Environment para produção

##Como Importar

###1. Importar Collection e Environments

1. Abra o Postman
2. Clique em **Import** no canto superior esquerdo
3. Arraste os arquivos ou clique em **Upload Files**:
   - `LW-Financial-API.postman_collection.json`
   - `Development.postman_environment.json`
   - `Production.postman_environment.json`

###2. Selecionar Environment

1. No canto superior direito do Postman, clique no dropdown de environments
2. Selecione **Development** para testes locais ou **Production** para produção

##Endpoints Disponíveis

###Autenticação

- **GET /v1/health** - Health check do sistema
- **POST /v1/login** - Login e obtenção de token JWT
- **POST /v1/signup** - Registro de novo usuário

###Operações Bancárias

- **GET /v1/balance** - Consultar saldo (com opção de filtrar por código de conta)
- **GET /v1/accounts** - Listar todas as contas do usuário
- **GET /v1/accounts/:code** - Buscar conta por código
- **POST /v1/accounts** - Criar nova conta
- **POST /v1/event** - Operações bancárias:
  - `deposit` - Depósito
  - `withdraw` - Saque
  - `transfer` - Transferência
- **GET /v1/transactions** - Histórico de transações (com opção de filtrar por código de conta)
- **POST /v1/reset** - Reset do sistema (limpa todas as contas e transações)

## Variáveis de Environment

###Development

- `base_url`: `http://localhost:3333`
- `auth_token`: Token JWT (preenchido automaticamente após login/signup)
- `user_id`: ID do usuário (preenchido automaticamente após login/signup)
- `username`: Nome de usuário (preenchido automaticamente após login/signup)
- `user_email`: Email do usuário (preenchido automaticamente após login/signup)
- `account_code`: Código da conta no formato XXXX-X (preenchido automaticamente ao listar/criar contas)
- `account_id`: ID da conta (preenchido automaticamente ao listar/criar/buscar contas)
- `destination_account_code`: Código da conta de destino (preenchido automaticamente ao listar múltiplas contas)
- `origin_account_id`: ID da conta de origem (preenchido automaticamente após transferência)
- `destination_account_id`: ID da conta de destino (preenchido automaticamente após transferência)

###Production

- `base_url`: `https://api.lw-financial.com` (ajuste conforme necessário)
- Demais variáveis são as mesmas do Development

##Autenticação

A maioria dos endpoints requer autenticação via JWT token. O token e os dados do usuário são automaticamente salvos no environment após fazer login ou signup.

###Como Obter o Token e Dados do Usuário

1. Execute a requisição **Login** ou **Signup**
2. O token será automaticamente salvo na variável `auth_token` do environment
3. Os dados do usuário (userId, username, email) serão extraídos do token e salvos automaticamente
4. Todas as requisições autenticadas usarão automaticamente esse token

###Dados Salvos Automaticamente

Após login/signup, as seguintes variáveis são preenchidas automaticamente:

- `auth_token`: Token JWT para autenticação
- `user_id`: ID do usuário
- `username`: Nome de usuário
- `user_email`: Email do usuário

Após listar/criar contas, as seguintes variáveis são preenchidas automaticamente:

- `account_code`: Código da primeira conta (formato XXXX-X)
- `account_id`: ID da primeira conta
- `destination_account_code`: Código da segunda conta (se houver múltiplas contas)

###Credenciais Padrão (Development)

- **Username**: `admin`
- **Password**: `admin123`

## Exemplos de Uso

###1. Login e Obter Token

1. Selecione o environment **Development**
2. Execute a requisição **Auth > Login**
3. O token será salvo automaticamente

###2. Consultar Saldo

1. Certifique-se de estar autenticado (token salvo)
2. Execute **Bank Operations > Get Balance**

###3. Realizar Depósito

1. Execute **Bank Operations > Deposit**
2. Ajuste o valor no body da requisição
3. O depósito será feito na conta padrão do usuário autenticado

###4. Realizar Transferência

1. Obtenha os códigos das contas (via **List Accounts**)
2. Preencha as variáveis `account_code` e `destination_account_code` no environment
3. Execute **Bank Operations > Transfer**

##Dicas

1. **Token Automático**: Os endpoints de Login e Signup têm scripts que salvam automaticamente o token no environment
2. **Dados do Usuário Automáticos**: Após login/signup, os dados do usuário são extraídos do token JWT e salvos automaticamente
3. **Dados de Conta Automáticos**: Ao listar ou criar contas, os códigos e IDs são salvos automaticamente
4. **Variáveis Dinâmicas**: Use as variáveis do environment para facilitar os testes
5. **Filtros Opcionais**: Muitos endpoints têm query parameters opcionais que podem ser habilitados/desabilitados
6. **Códigos de Conta**: O formato é `XXXX-X` (4 dígitos, hífen, 1 dígito)

## Preenchimento Automático

A collection possui scripts automáticos que preenchem as variáveis do environment:

###Após Login/Signup

- ✅ Token JWT (`auth_token`)
- ✅ ID do usuário (`user_id`)
- ✅ Nome de usuário (`username`)
- ✅ Email do usuário (`user_email`)

###Após Listar Contas

- ✅ Código da primeira conta (`account_code`)
- ✅ ID da primeira conta (`account_id`)
- ✅ Código da segunda conta (`destination_account_code`) - se houver múltiplas contas
- ✅ ID da segunda conta (`destination_account_id`) - se houver múltiplas contas

###Após Criar Conta

- ✅ Código da conta criada (`account_code`)
- ✅ ID da conta criada (`account_id`)

###Após Buscar Conta por Código

- ✅ ID da conta (`account_id`)

###Após Operações Bancárias

- ✅ IDs das contas envolvidas são atualizados automaticamente

## Configuração do Backend

Para usar o environment de Development, certifique-se de que o backend está rodando:

```bash
cd apps/backend
bun run dev
```

O servidor estará disponível em `http://localhost:3333`

##Documentação Adicional

- Swagger UI: `http://localhost:3333/docs` (quando o backend estiver rodando)
- Documentação da API: Ver `docs/backend/` para mais detalhes

## Notas Importantes

- O token JWT expira em 1 hora
- Alguns endpoints requerem que a conta pertença ao usuário autenticado
- O endpoint `/v1/reset` limpa TODOS os dados do sistema (use com cuidado)
- Valores monetários devem estar entre R$ 0,01 e R$ 999.999,99
- Códigos de conta seguem o formato `XXXX-X` (ex: `1234-5`)
