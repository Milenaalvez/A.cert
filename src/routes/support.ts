import { Router } from 'express';
import nodemailer from 'nodemailer';
import prisma from '../lib/prisma.js';
import { randomUUID } from 'node:crypto';

const router = Router();

function getSmtpFromEnv() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const fromEmail = process.env.SMTP_FROM_EMAIL || user || '';
  const fromName = process.env.SMTP_FROM_NAME || 'A.CERT';
  if (!host || !user || !pass) return null;
  return { host, port, user, pass, fromEmail, fromName };
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
        const smtp = getSmtpFromEnv();
        if (!smtp) {
          console.log('[Suporte] SMTP nao configurado — email NAO enviado');
          return;
        }

        const transporter = nodemailer.createTransport({
          host: smtp.host,
          port: smtp.port,
          secure: smtp.port === 465,
          auth: { user: smtp.user, pass: smtp.pass },
        });

        const info = await transporter.sendMail({
          from: `"${smtp.fromName}" <${smtp.user}>`,
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
