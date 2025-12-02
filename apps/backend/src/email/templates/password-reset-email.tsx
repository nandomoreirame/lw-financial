import { Button, Section, Text } from '@react-email/components';
import { BaseEmail } from './base';

interface PasswordResetEmailProps {
  userName?: string | null;
  userEmail: string;
  resetUrl: string;
  resetToken: string;
  appName?: string;
}

export const PasswordResetEmail = ({
  userName,
  userEmail,
  resetUrl,
  resetToken,
  appName,
}: PasswordResetEmailProps) => {
  const displayName = userName || userEmail;

  return (
    <BaseEmail
      preview="Redefina sua senha para continuar"
      title="Redefinição de Senha"
      appName={appName}
    >
      <Text style={paragraph}>Olá {displayName},</Text>
      <Text style={paragraph}>
        Recebemos uma solicitação para redefinir a senha da sua conta. Clique no
        botão abaixo para criar uma nova senha:
      </Text>
      <Section style={buttonContainer}>
        <Button style={button} href={resetUrl}>
          Redefinir Senha
        </Button>
      </Section>
      <Text style={paragraph}>Ou copie e cole este link no seu navegador:</Text>
      <Text style={link}>{resetUrl}</Text>
      <Text style={paragraph}>
        Se preferir, você também pode usar este código:
      </Text>
      <Section style={codeContainer}>
        <Text style={code}>{resetToken}</Text>
      </Section>
      <Text style={paragraph}>
        <strong>Este link expira em 1 hora.</strong>
      </Text>
      <Text style={warning}>
        Se você não solicitou a redefinição de senha, ignore este email. Sua
        senha permanecerá a mesma.
      </Text>
    </BaseEmail>
  );
};

// Export default para React Email CLI
export default function PasswordResetEmailDefault() {
  return (
    <PasswordResetEmail
      userName="Maria Santos"
      userEmail="maria.santos@lwfinancial.com"
      resetUrl="https://lwfinancial.com/reset-password?token=xyz789uvw012"
      resetToken="XYZ789UVW012"
      appName="LW Financial App"
    />
  );
}

// PreviewProps para React Email CLI
PasswordResetEmailDefault.PreviewProps = {
  userName: 'Maria Santos',
  userEmail: 'maria.santos@lwfinancial.com',
  resetUrl: 'https://lwfinancial.com/reset-password?token=xyz789uvw012',
  resetToken: 'XYZ789UVW012',
  appName: 'LW Financial App',
};

const paragraph = {
  color: '#525f7f',
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'left' as const,
  margin: '0 0 16px',
};

const buttonContainer = {
  padding: '27px 0 27px',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#dc2626',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 24px',
  width: 'fit-content',
  margin: '0 auto',
};

const link = {
  color: '#dc2626',
  fontSize: '14px',
  textDecoration: 'underline',
  wordBreak: 'break-all' as const,
  margin: '0 0 16px',
};

const codeContainer = {
  backgroundColor: '#f6f9fc',
  borderRadius: '4px',
  padding: '16px',
  margin: '16px 0',
  textAlign: 'center' as const,
};

const code = {
  color: '#333',
  fontSize: '20px',
  fontWeight: '600',
  fontFamily: 'monospace',
  letterSpacing: '2px',
  margin: '0',
};

const warning = {
  color: '#dc2626',
  fontSize: '14px',
  lineHeight: '20px',
  textAlign: 'left' as const,
  margin: '16px 0 0',
  padding: '12px',
  backgroundColor: '#fef2f2',
  borderRadius: '4px',
  border: '1px solid #fecaca',
};
