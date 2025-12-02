import nodemailer from 'nodemailer';

/**
 * Configuração do transporte SMTP para envio de emails
 * Em desenvolvimento, usa MailHog (via Docker)
 * Em produção, usa configuração SMTP real
 */
export const createEmailTransport = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (isDevelopment) {
    // Configuração para MailHog (desenvolvimento)
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: Number(process.env.SMTP_PORT || 1025),
      secure: false, // MailHog não usa TLS
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
      // Desabilitar verificação de certificado em desenvolvimento
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  // Configuração para produção (SMTP real)
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST!,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true', // true para 465, false para outras portas
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  });
};

export const emailTransport = createEmailTransport();
