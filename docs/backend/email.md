# Sistema de Templates de Email com React Email

Este diretório contém o sistema de templates de email usando [React Email](https://react.email/docs/introduction).

## Estrutura

```
email/
├── config.ts          # Configuração do transporte SMTP (nodemailer)
├── render.ts          # Função helper para renderizar templates React Email
├── sender.ts          # Funções para enviar emails usando os templates
├── templates/
│   ├── base.tsx       # Template base compartilhado
│   ├── verification-email.tsx
│   ├── password-reset-email.tsx
│   ├── password-changed-email.tsx
│   └── index.ts       # Exports centralizados
└── README.md          # Esta documentação
```

## Templates Disponíveis

### 1. VerificationEmail

Template para verificação de email de novos usuários.

**Props:**

- `userName?: string | null` - Nome do usuário
- `userEmail: string` - Email do usuário
- `verificationUrl: string` - URL de verificação
- `verificationToken: string` - Token de verificação
- `appName?: string` - Nome da aplicação

### 2. PasswordResetEmail

Template para redefinição de senha.

**Props:**

- `userName?: string | null` - Nome do usuário
- `userEmail: string` - Email do usuário
- `resetUrl: string` - URL de redefinição
- `resetToken: string` - Token de redefinição
- `appName?: string` - Nome da aplicação

### 3. PasswordChangedEmail

Template para notificação de alteração de senha.

**Props:**

- `userName?: string | null` - Nome do usuário
- `userEmail: string` - Email do usuário
- `appName?: string` - Nome da aplicação

## Uso

Os templates são automaticamente usados pelo Better Auth através das funções em `sender.ts`:

- `sendVerificationEmail()` - Envia email de verificação
- `sendPasswordResetEmail()` - Envia email de reset de senha
- `sendPasswordChangedEmail()` - Envia notificação de senha alterada

## Desenvolvimento

### Visualizar Templates

Para visualizar os templates durante o desenvolvimento, use o script configurado:

```bash
# Do diretório apps/backend
bun run email
```

Isso iniciará o servidor de preview do React Email em `http://localhost:3003`.

**Nota**: Os templates precisam ter `export default` para serem detectados pelo React Email CLI. Os templates já estão configurados com `export default` e `PreviewProps` para visualização.

### Criar Novo Template

1. Crie um novo arquivo em `templates/` seguindo o padrão dos existentes
2. Use o `BaseEmail` como wrapper
3. Exporte o componente
4. Adicione função de envio em `sender.ts` se necessário
5. Integre com Better Auth em `better-auth.ts`

## Configuração

As configurações de email são feitas através de variáveis de ambiente (ver `ENV.md`):

- `SMTP_HOST` - Host do servidor SMTP
- `SMTP_PORT` - Porta SMTP
- `SMTP_USER` - Usuário SMTP
- `SMTP_PASS` - Senha SMTP
- `SMTP_FROM` - Email remetente
- `APP_NAME` - Nome da aplicação

## Integração com MailHog

Em desenvolvimento, os emails são enviados para o MailHog (via Docker). Acesse `http://localhost:8025` para visualizar os emails enviados.

## Referências

- [React Email Documentation](https://react.email/docs/introduction)
- [React Email Components](https://react.email/docs/components)
- [Nodemailer Integration](https://react.email/docs/integrations/nodemailer)
