import { Button, Section, Text } from '@react-email/components';
import { BaseEmail } from './base';

interface VerificationEmailProps {
  userName?: string | null;
  userEmail: string;
  verificationUrl: string;
  verificationToken: string;
  appName?: string;
}

export const VerificationEmail = ({
  userName,
  userEmail,
  verificationUrl,
  verificationToken,
  appName,
}: VerificationEmailProps) => {
  const displayName = userName || userEmail;

  return (
    <BaseEmail
      preview="Verifique seu endereço de email para continuar"
      title="Verificação de Email"
      appName={appName}
    >
      <Text style={paragraph}>Olá {displayName},</Text>
      <Text style={paragraph}>
        Obrigado por se cadastrar! Para completar seu cadastro, por favor
        verifique seu endereço de email clicando no botão abaixo:
      </Text>
      <Section style={buttonContainer}>
        <Button style={button} href={verificationUrl}>
          Verificar Email
        </Button>
      </Section>
      <Text style={paragraph}>Ou copie e cole este link no seu navegador:</Text>
      <Text style={link}>{verificationUrl}</Text>
      <Text style={paragraph}>
        Se preferir, você também pode usar este código de verificação:
      </Text>
      <Section style={codeContainer}>
        <Text style={code}>{verificationToken}</Text>
      </Section>
      <Text style={paragraph}>
        <strong>Este link expira em 24 horas.</strong>
      </Text>
      <Text style={paragraph}>
        Se você não criou uma conta, pode ignorar este email com segurança.
      </Text>
    </BaseEmail>
  );
};

// Export default para React Email CLI
export default function VerificationEmailDefault() {
  return (
    <VerificationEmail
      userName="João Silva"
      userEmail="joao.silva@lwfinancial.com"
      verificationUrl="https://lwfinancial.com/verify?token=abc123def456"
      verificationToken="ABC123DEF456"
      appName="LW Financial App"
    />
  );
}

// PreviewProps para React Email CLI
VerificationEmailDefault.PreviewProps = {
  userName: 'João Silva',
  userEmail: 'joao.silva@lwfinancial.com',
  verificationUrl: 'https://lwfinancial.com/verify?token=abc123def456',
  verificationToken: 'ABC123DEF456',
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
  backgroundColor: '#5e6ad2',
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
  color: '#5e6ad2',
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
