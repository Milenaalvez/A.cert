import nodemailer from 'nodemailer';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

function getSmtpFromEnv() {
  if (process.env.SMTP_DISABLED === 'true') return null;
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const fromEmail = process.env.SMTP_FROM_EMAIL || user || '';
  const fromName = process.env.SMTP_FROM_NAME || 'A.CERT';
  if (!host || !user || !pass) return null;
  return { host, port, user, pass, fromEmail, fromName };
}

function wrapEmail(title: string, body: string): string {
  const logoUrl = `${FRONTEND_URL}/images/logo-email.png`;
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#F0F2F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F0F2F5;padding:24px 0;">
  <tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

      <tr>
        <td bgcolor="#0B1220" style="background-color:#0B1220;background-image:linear-gradient(135deg,#0B1220,#07101F,#020817);padding:20px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:44px;vertical-align:middle;">
                <img src="${logoUrl}" width="44" height="44" alt="A.CERT" style="display:block;border-radius:8px;" />
              </td>
              <td style="padding-left:14px;vertical-align:middle;">
                <span style="color:#FFFFFF;font-size:18px;font-weight:700;letter-spacing:-0.3px;display:block;line-height:1.2;">A.CERT</span>
                <span style="color:rgba(255,255,255,0.5);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1.2px;display:block;margin-top:1px;">Central de Certidões Imobiliárias</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <tr>
        <td style="background-color:#FFFFFF;padding:0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:28px;color:#374151;font-size:14px;line-height:1.7;">
              <h2 style="margin:0 0 16px 0;color:#111827;font-size:18px;font-weight:700;">${title}</h2>
              ${body}
            </td></tr>
          </table>
        </td>
      </tr>

      <tr>
        <td style="background-color:#F6F7F9;border-top:1px solid #E5E7EB;padding:16px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="color:#9CA3AF;font-size:11px;line-height:1.6;">
              <p style="margin:0 0 6px 0;">© ${new Date().getFullYear()} A.CERT — Todos os direitos reservados.</p>
              <p style="margin:0 0 6px 0;">Dúvidas? <a href="mailto:contato@acert.tech" style="color:#FF7A00;text-decoration:none;">contato@acert.tech</a></p>
              <p style="margin:0;color:#B0B7C3;">Se você não solicitou este email, ignore esta mensagem.</p>
            </td></tr>
          </table>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function buttonHtml(text: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;padding:14px 32px;background-color:#FF7A00;color:#FFFFFF;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;margin:8px 0;">${text}</a>`;
}

export async function enviarEmailConfirmacao(email: string, name: string, token: string): Promise<void> {
  const link = `${FRONTEND_URL}/confirmar-email/${token}?email=${encodeURIComponent(email)}`;
  console.log('───────────────────────────────────────────');
  console.log('  EMAIL DE CONFIRMAÇÃO → ' + email);

  const smtp = getSmtpFromEnv();
  if (!smtp) {
    console.log('  ⚠ SMTP_HOST/USER/PASS não definidos no .env');
    console.log('───────────────────────────────────────────');
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtp.host, port: smtp.port, secure: smtp.port === 465,
      auth: { user: smtp.user, pass: smtp.pass },
    });

    const info = await transporter.sendMail({
      from: `"${smtp.fromName}" <${smtp.fromEmail}>`,
      to: email,
      subject: 'Confirme seu email — A.CERT',
      html: wrapEmail('Confirme seu email',
        `<p style="margin:0 0 16px 0;">Olá <strong>${name}</strong>,</p>
         <p style="margin:0 0 20px 0;">Clique no botão abaixo para confirmar seu email e ativar sua conta na A.CERT.</p>
         ${buttonHtml('Confirmar Email', link)}
         <p style="margin:20px 0 0 0;color:#9CA3AF;font-size:12px;">O link expira em 24 horas. Se não foi você, ignore este email.</p>`),
    });

    console.log('  ✅ Enviado! MessageId:', info.messageId);
  } catch (err: any) {
    const code = err.code || 'UNKNOWN';
    const msg = err.response || err.message || String(err);
    console.error(`  ❌ FALHA [${code}]:`, msg);
    if (code === 'EAUTH') {
      console.error('     → Verifique SMTP_USER/SMTP_PASS no .env (Hostinger pode exigir senha de app)');
    }
    if (code === 'ECONNREFUSED' || code === 'ETIMEDOUT') {
      console.error(`     → Verifique SMTP_HOST=${smtp.host} e SMTP_PORT=${smtp.port}`);
    }
  }
  console.log('───────────────────────────────────────────');
}

export async function enviarEmailRedefinirSenha(email: string, name: string, token: string): Promise<void> {
  const link = `${FRONTEND_URL}/redefinir-senha?token=${token}`;
  console.log('───────────────────────────────────────────');
  console.log('  REDEFINIÇÃO DE SENHA → ' + email);

  const smtp = getSmtpFromEnv();
  if (!smtp) {
    console.log('  ⚠ SMTP_HOST/USER/PASS não definidos no .env');
    console.log('───────────────────────────────────────────');
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtp.host, port: smtp.port, secure: smtp.port === 465,
      auth: { user: smtp.user, pass: smtp.pass },
    });

    const info = await transporter.sendMail({
      from: `"${smtp.fromName}" <${smtp.fromEmail}>`,
      to: email,
      subject: 'Redefina sua senha — A.CERT',
      html: wrapEmail('Redefinição de Senha',
        `<p style="margin:0 0 16px 0;">Olá <strong>${name}</strong>,</p>
         <p style="margin:0 0 20px 0;">Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para criar uma nova senha:</p>
         ${buttonHtml('Redefinir Senha', link)}
         <p style="margin:20px 0 0 0;color:#9CA3AF;font-size:12px;">O link expira em 1 hora. Se não foi você, ignore este email.</p>`),
    });

    console.log('  ✅ Enviado! MessageId:', info.messageId);
  } catch (err: any) {
    const code = err.code || 'UNKNOWN';
    const msg = err.response || err.message || String(err);
    console.error(`  ❌ FALHA [${code}]:`, msg);
    if (code === 'EAUTH') {
      console.error('     → Verifique SMTP_USER/SMTP_PASS no .env (Hostinger pode exigir senha de app)');
    }
  }
  console.log('───────────────────────────────────────────');
}

export async function enviarEmailBoasVindas(email: string, name: string, tempPassword: string, companyName: string): Promise<void> {
  console.log('───────────────────────────────────────────');
  console.log('  BOAS-VINDAS → ' + email);

  const smtp = getSmtpFromEnv();
  if (!smtp) {
    console.log('  ⚠ SMTP_HOST/USER/PASS não definidos no .env');
    console.log('───────────────────────────────────────────');
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtp.host, port: smtp.port, secure: smtp.port === 465,
      auth: { user: smtp.user, pass: smtp.pass },
    });

    const info = await transporter.sendMail({
      from: `"${smtp.fromName}" <${smtp.fromEmail}>`,
      to: email,
      subject: `Bem-vindo(a) à ${companyName}, ${name}!`,
      html: wrapEmail('Boas-vindas!',
        `<p style="margin:0 0 16px 0;">Olá <strong>${name}</strong>,</p>
         <p style="margin:0 0 16px 0;">Sua conta na <strong>${companyName}</strong> foi criada com sucesso na plataforma A.CERT.</p>
         ${tempPassword ? `
         <p style="margin:0 0 16px 0;">Utilize as credenciais abaixo para seu primeiro acesso:</p>
         <div style="background:#F3F4F6;padding:16px;border-radius:8px;margin:18px 0;">
           <p style="margin:0 0 8px 0;font-size:12px;color:#6B7280;">Dados de acesso:</p>
           <p style="margin:0 0 4px 0;font-size:14px;font-weight:700;color:#111827;">📧 ${email}</p>
           <p style="margin:0;font-size:14px;font-weight:700;color:#111827;">🔑 ${tempPassword}</p>
         </div>
         <p style="margin:0 0 20px 0;color:#D97706;font-size:13px;font-weight:600;">⚠ No primeiro login, você precisará trocar sua senha.</p>
         ` : `
         <p style="margin:0 0 16px 0;">Confirme seu email para ativar sua conta e começar a usar a plataforma.</p>
         `}
         ${buttonHtml('Acessar Plataforma', `${FRONTEND_URL}/login`)}
         <p style="margin:20px 0 0 0;color:#9CA3AF;font-size:12px;">Dúvidas? Responda este email ou entre em contato pelo suporte.</p>`),
    });

    console.log('  ✅ Enviado! MessageId:', info.messageId);
  } catch (err: any) {
    const code = err.code || 'UNKNOWN';
    const msg = err.response || err.message || String(err);
    console.error(`  ❌ FALHA [${code}]:`, msg);
    if (code === 'EAUTH') {
      console.error('     → Verifique SMTP_USER/SMTP_PASS no .env (Hostinger pode exigir senha de app)');
    }
  }
  console.log('───────────────────────────────────────────');
}
