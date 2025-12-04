import nodemailer from 'nodemailer';

/**
 * Configuração do transporte SMTP para envio de emails
 * Em desenvolvimento, usa MailHog (via Docker)
 * Em produção, usa configuração SMTP real
 */
export const createEmailTransport = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (isDevelopment) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: Number(process.env.SMTP_PORT || 1025),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST!,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  });
};

export const emailTransport = createEmailTransport();
