# API Contracts: Dashboard Deposit and Withdraw Operations

## Overview

Este diretório contém os contratos de API para as operações de depósito e saque.

## Files

- `event-api.yaml`: Especificação OpenAPI 3.0.3 para o endpoint `/v1/event`

## Endpoint

### POST `/v1/event`

Processa eventos bancários (depósito, saque, transferência).

**Autenticação**: Requerida (Bearer JWT token)

**Comportamento para Depósitos e Saques Autenticados**:

- O backend identifica automaticamente a conta padrão do usuário a partir do token JWT
- Não é necessário enviar `destination` (depósitos) ou `origin` (saques) quando autenticado
- O backend usa `getOrCreateDefaultAccount(userId)` para obter/criar a conta padrão

**Validações**:

- Valor mínimo: R$ 0,01
- Valor máximo: R$ 999.999,99
- Precisão: exatamente 2 casas decimais
- Saldo suficiente para saques (validado no backend)

**Respostas**:

- `201 Created`: Operação bem-sucedida
- `400 Bad Request`: Valor inválido ou saldo insuficiente
- `401 Unauthorized`: Token JWT inválido ou expirado
- `404 Not Found`: Conta não encontrada (não deve acontecer)
- `500 Internal Server Error`: Erro interno

## Usage

Para visualizar e testar a API:

1. Inicie o servidor backend
2. Acesse a documentação Swagger em `http://localhost:3333/docs`
3. Ou use ferramentas como Postman/Insomnia importando o arquivo YAML

## Changes from Existing Implementation

**Modificação necessária no backend**:

- O handler atual requer `destination` para depósitos e `origin` para saques
- Esta feature modifica o handler para aceitar requisições sem esses campos quando autenticado
- O backend deve extrair `userId` do token JWT e usar a conta padrão automaticamente
