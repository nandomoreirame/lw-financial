import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface BaseEmailProps {
  preview?: string;
  title: string;
  children: React.ReactNode;
  appName?: string;
}

const BaseEmailComponent = ({
  preview,
  title,
  children,
  appName = 'LW Financial App',
}: BaseEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>{preview || title}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{title}</Heading>
          {children}
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} {appName}. Todos os direitos
              reservados.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '30px 30px 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '40px',
  margin: '0 0 20px',
  textAlign: 'center' as const,
};

const footer = {
  borderTop: '1px solid #e6ebf1',
  marginTop: '32px',
  paddingTop: '20px',
};

const footerText = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  textAlign: 'center' as const,
  margin: '0',
};

export const BaseEmail = BaseEmailComponent;
