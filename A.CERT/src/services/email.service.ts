const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

export async function enviarEmailConfirmacao(email: string, name: string, token: string): Promise<void> {
  const link = `${FRONTEND_URL}/api/auth/confirmar/${token}`;

  console.log('═══════════════════════════════════════════');
  console.log('  EMAIL DE CONFIRMAÇÃO (dev)');
  console.log('  Para: ' + email);
  console.log('  Nome: ' + name);
  console.log('  Link: ' + link);
  console.log('═══════════════════════════════════════════');

  const SMTP_HOST = process.env.SMTP_HOST;
  const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
  const SMTP_USER = process.env.SMTP_USER;
  const SMTP_PASS = process.env.SMTP_PASS;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.log('[Email] SMTP não configurado. Apenas logado no console.');
    return;
  }

  try {
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.default.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    await transporter.sendMail({
      from: `"A.CERT" <${SMTP_USER}>`,
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

    console.log('[Email] Mensagem enviada para ' + email);
  } catch (err) {
    console.error('[Email] Erro ao enviar:', err);
  }
}

export async function enviarEmailRedefinirSenha(email: string, name: string, token: string): Promise<void> {
  const link = `${FRONTEND_URL}/redefinir-senha?token=${token}`;

  console.log('═══════════════════════════════════════════');
  console.log('  REDEFINIÇÃO DE SENHA (dev)');
  console.log('  Para: ' + email);
  console.log('  Nome: ' + name);
  console.log('  Link: ' + link);
  console.log('═══════════════════════════════════════════');

  const SMTP_HOST = process.env.SMTP_HOST;
  const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
  const SMTP_USER = process.env.SMTP_USER;
  const SMTP_PASS = process.env.SMTP_PASS;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.log('[Email] SMTP não configurado. Apenas logado no console.');
    return;
  }

  try {
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.default.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    await transporter.sendMail({
      from: `"A.CERT" <${SMTP_USER}>`,
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

    console.log('[Email] Email de redefinição enviado para ' + email);
  } catch (err) {
    console.error('[Email] Erro ao enviar email de redefinição:', err);
  }
}
