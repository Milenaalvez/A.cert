import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { randomUUID } from 'node:crypto';

const router = Router();

function getSmtpEnv(): Record<string, string> {
  return {
    smtp_host: process.env.SMTP_HOST || '',
    smtp_port: process.env.SMTP_PORT || '587',
    smtp_user: process.env.SMTP_USER || '',
    smtp_pass: process.env.SMTP_PASS || '',
    smtp_from_email: process.env.SMTP_FROM_EMAIL || '',
    smtp_from_name: process.env.SMTP_FROM_NAME || 'A.CERT',
  };
}

router.post('/ticket', async (req, res) => {
  try {
    const { name, email, subject, category, message } = req.body;

    if (!name || !email || !subject || !message) {
      res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos.' });
      return;
    }

    const id = randomUUID();
    const protocol = `SUP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`;

    await prisma.supportTicket.create({
      data: { id, name, email, subject, category: category || 'Problema técnico', message, protocol, createdAt: new Date().toISOString() },
    });

    (async () => {
      try {
        const envSettings = getSmtpEnv();
        const dbSettings = await prisma.setting.findMany({ where: { key: { startsWith: 'smtp_' } } });
        const smtp: Record<string, string> = { ...envSettings };
        for (const s of dbSettings) smtp[s.key] = s.value;

        console.log('[Suporte] SMTP config:', {
          host: smtp.smtp_host,
          port: smtp.smtp_port,
          user: smtp.smtp_user,
          passProvided: !!smtp.smtp_pass,
          from: smtp.smtp_from_email || smtp.smtp_user,
          dbKeys: dbSettings.map(s => s.key),
        });

        if (!smtp.smtp_host || !smtp.smtp_user || !smtp.smtp_pass) {
          console.error('[Suporte] SMTP incompleto — email NAO enviado');
          return;
        }

        const nodemailer = await import('nodemailer');
        const transporter = nodemailer.default.createTransport({
          host: smtp.smtp_host,
          port: parseInt(smtp.smtp_port || '587', 10),
          secure: parseInt(smtp.smtp_port || '587', 10) === 465,
          auth: { user: smtp.smtp_user, pass: smtp.smtp_pass },
        });

        const info = await transporter.sendMail({
          from: `"${smtp.smtp_from_name}" <${smtp.smtp_from_email || smtp.smtp_user}>`,
          to: 'suporte@acert.tech',
          replyTo: email,
          subject: `[${protocol}] ${subject}`,
          html: `<h3>Nova solicitação de suporte</h3>
<p><strong>Protocolo:</strong> ${protocol}</p>
<p><strong>Nome:</strong> ${name}</p>
<p><strong>Email:</strong> ${email}</p>
<p><strong>Categoria:</strong> ${category}</p>
<p><strong>Mensagem:</strong></p>
<p>${message}</p>`,
        });

        console.log('[Suporte] Email enviado:', info.messageId);
      } catch (err) {
        console.error('[Suporte] Erro ao enviar email:', err);
      }
    })();

    res.json({ success: true, protocol });
  } catch (err) {
    console.error('Erro ao criar ticket de suporte:', err);
    res.status(500).json({ error: 'Erro ao enviar solicitação' });
  }
});

router.get('/ticket/:protocol', async (req, res) => {
  try {
    const ticket = await prisma.supportTicket.findUnique({
      where: { protocol: req.params.protocol },
      select: { id: true, protocol: true, subject: true, category: true, status: true, message: true, createdAt: true, updatedAt: true },
    });

    if (!ticket) {
      res.status(404).json({ error: 'Ticket não encontrado' });
      return;
    }

    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar ticket' });
  }
});

export default router;
