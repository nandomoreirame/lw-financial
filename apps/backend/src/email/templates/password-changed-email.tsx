import { Section, Text } from '@react-email/components';
import { BaseEmail } from './base';

interface PasswordChangedEmailProps {
  userName?: string | null;
  userEmail: string;
  appName?: string;
}

export const PasswordChangedEmail = ({
  userName,
  userEmail,
  appName,
}: PasswordChangedEmailProps) => {
  const displayName = userName || userEmail;

  return (
    <BaseEmail
      preview="Sua senha foi alterada com sucesso"
      title="Senha Alterada"
      appName={appName}
    >
      <Text style={paragraph}>Olá {displayName},</Text>
      <Text style={paragraph}>
        Este email confirma que a senha da sua conta foi alterada com sucesso.
      </Text>
      <Section style={infoBox}>
        <Text style={infoTitle}>Detalhes da alteração:</Text>
        <Text style={infoText}>
          • Data: {new Date().toLocaleString('pt-BR')}
        </Text>
        <Text style={infoText}>• Email da conta: {userEmail}</Text>
      </Section>
      <Text style={warning}>
        <strong>Importante:</strong> Se você não fez esta alteração, entre em
        contato conosco imediatamente. Sua conta pode estar comprometida.
      </Text>
      <Text style={paragraph}>
        Se você fez esta alteração, pode ignorar este aviso. Sua senha foi
        atualizada com sucesso e está pronta para uso.
      </Text>
    </BaseEmail>
  );
};

export default function PasswordChangedEmailDefault() {
  return (
    <PasswordChangedEmail
      userName="Pedro Oliveira"
      userEmail="pedro.oliveira@lwfinancial.com"
      appName="LW Financial App"
    />
  );
}

PasswordChangedEmailDefault.PreviewProps = {
  userName: 'Pedro Oliveira',
  userEmail: 'pedro.oliveira@lwfinancial.com',
  appName: 'LW Financial App',
};

const paragraph = {
  color: '#525f7f',
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'left' as const,
  margin: '0 0 16px',
};

const infoBox = {
  backgroundColor: '#f0f9ff',
  borderRadius: '4px',
  padding: '16px',
  margin: '20px 0',
  border: '1px solid #bae6fd',
};

const infoTitle = {
  color: '#0369a1',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 8px',
};

const infoText = {
  color: '#0369a1',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '4px 0',
};

const warning = {
  color: '#dc2626',
  fontSize: '14px',
  lineHeight: '20px',
  textAlign: 'left' as const,
  margin: '16px 0',
  padding: '12px',
  backgroundColor: '#fef2f2',
  borderRadius: '4px',
  border: '1px solid #fecaca',
};
