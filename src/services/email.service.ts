const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

function getSmtpFromEnv() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const fromEmail = process.env.SMTP_FROM_EMAIL || user || '';
  const fromName = process.env.SMTP_FROM_NAME || 'A.CERT';
  if (!host || !user || !pass) return null;
  return { host, port, user, pass, fromEmail, fromName };
}

export async function enviarEmailConfirmacao(email: string, name: string, token: string): Promise<void> {
  const link = `${FRONTEND_URL}/api/auth/confirmar/${token}`;
  console.log('───────────────────────────────────────────');
  console.log('  EMAIL DE CONFIRMAÇÃO → ' + email);

  const smtp = getSmtpFromEnv();
  if (!smtp) {
    console.log('  ⚠ SMTP_HOST/USER/PASS não definidos no .env');
    console.log('───────────────────────────────────────────');
    return;
  }

  try {
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.default.createTransport({
      host: smtp.host, port: smtp.port, secure: smtp.port === 465,
      auth: { user: smtp.user, pass: smtp.pass },
      debug: true,
      logger: true,
    });

    const info = await transporter.sendMail({
      from: `"${smtp.fromName}" <${smtp.fromEmail}>`,
      to: email,
      subject: 'Confirme seu email — A.CERT',
      html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;"><h2 style="color:#F97316;">A.CERT</h2><p>Olá <strong>${name}</strong>,</p><p>Clique no botão abaixo para confirmar seu email:</p><a href="${link}" style="display:inline-block;padding:14px 28px;background:#F97316;color:#fff;text-decoration:none;border-radius:12px;font-weight:600;margin:20px 0;">Confirmar Email</a><p style="color:#999;font-size:13px;">Se não foi você, ignore este email.</p></div>`,
    });

    console.log('  ✅ Enviado! MessageId:', info.messageId);
  } catch (err: any) {
    console.error('  ❌ FALHA NO ENVIO:');
    console.error('     code:', err.code);
    console.error('     command:', err.command);
    console.error('     response:', err.response);
    console.error('     responseCode:', err.responseCode);
    console.error('     stack:', err.stack?.split('\n').slice(0, 3).join('\n'));
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
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.default.createTransport({
      host: smtp.host, port: smtp.port, secure: smtp.port === 465,
      auth: { user: smtp.user, pass: smtp.pass },
    });

    const info = await transporter.sendMail({
      from: `"${smtp.fromName}" <${smtp.fromEmail}>`,
      to: email,
      subject: 'Redefina sua senha — A.CERT',
      html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;"><h2 style="color:#F97316;">A.CERT</h2><p>Olá <strong>${name}</strong>,</p><p>Recebemos uma solicitação para redefinir sua senha.</p><a href="${link}" style="display:inline-block;padding:14px 28px;background:#F97316;color:#fff;text-decoration:none;border-radius:12px;font-weight:600;margin:20px 0;">Redefinir Senha</a><p style="color:#999;font-size:13px;">O link expira em 1 hora. Se não foi você, ignore este email.</p></div>`,
    });

    console.log('  ✅ Enviado! MessageId:', info.messageId);
  } catch (err: any) {
    console.error('  ❌ FALHA:', err.code, err.response || err.message);
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
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.default.createTransport({
      host: smtp.host, port: smtp.port, secure: smtp.port === 465,
      auth: { user: smtp.user, pass: smtp.pass },
    });

    const info = await transporter.sendMail({
      from: `"${smtp.fromName}" <${smtp.fromEmail}>`,
      to: email,
      subject: `Bem-vindo(a) à A.CERT, ${name}!`,
      html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:20px;"><h2 style="color:#F97316;">A.CERT</h2><p>Que bom ter você conosco, <strong>${name}</strong>!</p><p>Sua empresa <strong>${companyName}</strong> já está na plataforma.</p><div style="background:#F5F5F5;padding:16px;border-radius:10px;margin:18px 0;"><p style="margin:0 0 6px;font-size:13px;color:#888;">Seus dados de acesso:</p><p style="margin:0;font-size:15px;font-weight:700;">📧 ${email}</p><p style="margin:6px 0 0;font-size:15px;font-weight:700;">🔑 ${tempPassword}</p></div><p style="color:#E67E22;font-weight:600;font-size:13px;">⚠ No primeiro login, você precisará trocar sua senha.</p><a href="${FRONTEND_URL}/login" style="display:inline-block;padding:12px 26px;background:#F97316;color:#fff;text-decoration:none;border-radius:10px;font-weight:600;margin:10px 0;font-size:14px;">Acessar Plataforma</a><p style="color:#999;font-size:12px;margin-top:16px;">Dúvidas? Responda este email ou entre em contato pelo suporte.</p></div>`,
    });

    console.log('  ✅ Enviado! MessageId:', info.messageId);
  } catch (err: any) {
    console.error('  ❌ FALHA:', err.code, err.response || err.message);
  }
  console.log('───────────────────────────────────────────');
}
