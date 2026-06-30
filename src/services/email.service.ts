import prisma, { queryRaw } from '../lib/prisma.js';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

async function getSmtpConfig(): Promise<{
  host: string;
  port: number;
  user: string;
  pass: string;
  fromEmail: string;
  fromName: string;
} | null> {
  try {
    const settings = await queryRaw(
      `SELECT key, value FROM settings WHERE key IN ('smtp_host','smtp_port','smtp_user','smtp_pass','smtp_from_email','smtp_from_name')`
    );
    const map: Record<string, string> = {};
    for (const s of settings) map[s.key] = s.value;

    const host = map.smtp_host || process.env.SMTP_HOST;
    const port = parseInt(map.smtp_port || process.env.SMTP_PORT || '465', 10);
    const user = map.smtp_user || process.env.SMTP_USER;
    const pass = map.smtp_pass || process.env.SMTP_PASS;
    const fromEmail = map.smtp_from_email || process.env.SMTP_FROM_EMAIL || user;
    const fromName = map.smtp_from_name || process.env.SMTP_FROM_NAME || 'A.CERT';

    if (!host || !user || !pass) return null;
    return { host, port, user, pass, fromEmail: fromEmail || user, fromName };
  } catch {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (!host || !user || !pass) return null;
    return {
      host,
      port: parseInt(process.env.SMTP_PORT || '465', 10),
      user,
      pass,
      fromEmail: process.env.SMTP_FROM_EMAIL || user,
      fromName: process.env.SMTP_FROM_NAME || 'A.CERT',
    };
  }
}

export async function enviarEmailConfirmacao(email: string, name: string, token: string): Promise<void> {
  const link = `${FRONTEND_URL}/api/auth/confirmar/${token}`;

  console.log('───────────────────────────────────────────');
  console.log('  EMAIL DE CONFIRMAÇÃO');
  console.log('  Para: ' + email);
  console.log('  Nome: ' + name);

  const smtp = await getSmtpConfig();
  if (!smtp) {
    console.log('  ⚠ SMTP não configurado.');
    console.log('───────────────────────────────────────────');
    return;
  }

  try {
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.default.createTransport({
      host: smtp.host, port: smtp.port, secure: smtp.port === 465,
      auth: { user: smtp.user, pass: smtp.pass },
    });

    await transporter.sendMail({
      from: `"${smtp.fromName}" <${smtp.fromEmail}>`,
      to: email,
      subject: 'Confirme seu email — A.CERT',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
          <h2 style="color:#F97316;">A.CERT</h2>
          <p>Olá <strong>${name}</strong>,</p>
          <p>Clique no botão abaixo para confirmar seu email:</p>
          <a href="${link}" style="display:inline-block;padding:14px 28px;background:#F97316;color:#fff;text-decoration:none;border-radius:12px;font-weight:600;margin:20px 0;">
            Confirmar Email
          </a>
          <p style="color:#999;font-size:13px;">Se não foi você, ignore este email.</p>
        </div>
      `,
    });

    console.log('  ✅ Enviado para ' + email);
  } catch (err) {
    console.error('  ❌ Erro:', err);
  }
  console.log('───────────────────────────────────────────');
}

export async function enviarEmailRedefinirSenha(email: string, name: string, token: string): Promise<void> {
  const link = `${FRONTEND_URL}/redefinir-senha?token=${token}`;

  console.log('───────────────────────────────────────────');
  console.log('  REDEFINIÇÃO DE SENHA');
  console.log('  Para: ' + email);
  console.log('  Nome: ' + name);

  const smtp = await getSmtpConfig();
  if (!smtp) {
    console.log('  ⚠ SMTP não configurado.');
    console.log('───────────────────────────────────────────');
    return;
  }

  try {
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.default.createTransport({
      host: smtp.host, port: smtp.port, secure: smtp.port === 465,
      auth: { user: smtp.user, pass: smtp.pass },
    });

    await transporter.sendMail({
      from: `"${smtp.fromName}" <${smtp.fromEmail}>`,
      to: email,
      subject: 'Redefina sua senha — A.CERT',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
          <h2 style="color:#F97316;">A.CERT</h2>
          <p>Olá <strong>${name}</strong>,</p>
          <p>Recebemos uma solicitação para redefinir sua senha.</p>
          <a href="${link}" style="display:inline-block;padding:14px 28px;background:#F97316;color:#fff;text-decoration:none;border-radius:12px;font-weight:600;margin:20px 0;">
            Redefinir Senha
          </a>
          <p style="color:#999;font-size:13px;">O link expira em 1 hora. Se não foi você, ignore este email.</p>
        </div>
      `,
    });

    console.log('  ✅ Enviado para ' + email);
  } catch (err) {
    console.error('  ❌ Erro:', err);
  }
  console.log('───────────────────────────────────────────');
}

export async function enviarEmailBoasVindas(email: string, name: string, tempPassword: string, companyName: string): Promise<void> {
  const link = process.env.FRONTEND_URL || 'https://acert.online';

  console.log('───────────────────────────────────────────');
  console.log('  BOAS-VINDAS');
  console.log('  Para: ' + email + ' | Empresa: ' + companyName);

  const smtp = await getSmtpConfig();
  if (!smtp) {
    console.log('  ⚠ SMTP não configurado.');
    console.log('───────────────────────────────────────────');
    return;
  }

  try {
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.default.createTransport({
      host: smtp.host, port: smtp.port, secure: smtp.port === 465,
      auth: { user: smtp.user, pass: smtp.pass },
    });

    await transporter.sendMail({
      from: `"${smtp.fromName}" <${smtp.fromEmail}>`,
      to: email,
      subject: `Bem-vindo(a) à A.CERT, ${name}!`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:20px;">
          <h2 style="color:#F97316;">A.CERT</h2>
          <p>Que bom ter você conosco, <strong>${name}</strong>!</p>
          <p>Sua empresa <strong>${companyName}</strong> já está na plataforma.</p>
          <div style="background:#F5F5F5;padding:16px;border-radius:10px;margin:18px 0;">
            <p style="margin:0 0 6px;font-size:13px;color:#888;">Seus dados de acesso:</p>
            <p style="margin:0;font-size:15px;font-weight:700;">📧 ${email}</p>
            <p style="margin:6px 0 0;font-size:15px;font-weight:700;">🔑 ${tempPassword}</p>
          </div>
          <p style="color:#E67E22;font-weight:600;font-size:13px;">⚠ No primeiro login, você precisará trocar sua senha.</p>
          <a href="${link}/login" style="display:inline-block;padding:12px 26px;background:#F97316;color:#fff;text-decoration:none;border-radius:10px;font-weight:600;margin:10px 0;font-size:14px;">
            Acessar Plataforma
          </a>
          <p style="color:#999;font-size:12px;margin-top:16px;">Dúvidas? Responda este email ou entre em contato pelo suporte.</p>
        </div>
      `,
    });

    console.log('  ✅ Enviado para ' + email);
  } catch (err) {
    console.error('  ❌ Erro:', err);
  }
  console.log('───────────────────────────────────────────');
}
