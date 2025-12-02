import { emailTransport } from './config';
import { renderEmail } from './render';
import { PasswordChangedEmail } from './templates/password-changed-email';
import { PasswordResetEmail } from './templates/password-reset-email';
import { VerificationEmail } from './templates/verification-email';

const appName = process.env.APP_NAME || 'LW Financial App';
const fromEmail = process.env.SMTP_FROM || 'noreply@localhost';

interface SendVerificationEmailParams {
  user: { email: string; name?: string | null };
  url: string;
  token: string;
}

export async function sendVerificationEmail({
  user,
  url,
  token,
}: SendVerificationEmailParams) {
  const { html, text } = await renderEmail(
    VerificationEmail({
      userName: user.name,
      userEmail: user.email,
      verificationUrl: url,
      verificationToken: token,
      appName,
    })
  );

  await emailTransport.sendMail({
    from: `"${appName}" <${fromEmail}>`,
    to: user.email,
    subject: 'Verifique seu email',
    html,
    text,
  });
}

interface SendPasswordResetEmailParams {
  user: { email: string; name?: string | null };
  url: string;
  token: string;
}

export async function sendPasswordResetEmail({
  user,
  url,
  token,
}: SendPasswordResetEmailParams) {
  const { html, text } = await renderEmail(
    PasswordResetEmail({
      userName: user.name,
      userEmail: user.email,
      resetUrl: url,
      resetToken: token,
      appName,
    })
  );

  await emailTransport.sendMail({
    from: `"${appName}" <${fromEmail}>`,
    to: user.email,
    subject: 'Redefinição de Senha',
    html,
    text,
  });
}

interface SendPasswordChangedEmailParams {
  user: { email: string; name?: string | null };
}

export async function sendPasswordChangedEmail({
  user,
}: SendPasswordChangedEmailParams) {
  const { html, text } = await renderEmail(
    PasswordChangedEmail({
      userName: user.name,
      userEmail: user.email,
      appName,
    })
  );

  await emailTransport.sendMail({
    from: `"${appName}" <${fromEmail}>`,
    to: user.email,
    subject: 'Senha Alterada',
    html,
    text,
  });
}
