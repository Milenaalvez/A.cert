import { Router } from 'express';
import db from '../database.js';
import { randomUUID } from 'node:crypto';

const router = Router();

// Submit support ticket
router.post('/ticket', (req, res) => {
  try {
    const { name, email, subject, category, message } = req.body;

    if (!name || !email || !subject || !message) {
      res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos.' });
      return;
    }

    const id = randomUUID();
    const protocol = `SUP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`;

    db.prepare(
      'INSERT INTO support_tickets (id, name, email, subject, category, message, protocol) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(id, name, email, subject, category || 'Problema técnico', message, protocol);

    // Try to send email via configured SMTP
    (async () => {
      try {
        const smtpRow = db.prepare("SELECT value FROM settings WHERE key = 'smtp_host'").get() as any;
        if (smtpRow?.value) {
          const settings = db.prepare("SELECT key, value FROM settings WHERE key LIKE 'smtp_%' OR key = 'company_name'").all() as any[];
          const smtp: Record<string, string> = {};
          for (const s of settings) smtp[s.key] = s.value;

          const nodemailer = await import('nodemailer');
          const transporter = nodemailer.default.createTransport({
            host: smtp.smtp_host,
            port: parseInt(smtp.smtp_port || '587', 10),
            secure: parseInt(smtp.smtp_port || '587', 10) === 465,
            auth: { user: smtp.smtp_user, pass: smtp.smtp_pass || '' },
          });

          await transporter.sendMail({
            from: `"${smtp.smtp_from_name || 'DONNOS Docs'}" <${smtp.smtp_from_email || smtp.smtp_user}>`,
            to: smtp.smtp_from_email || smtp.smtp_user,
            subject: `[${protocol}] ${subject}`,
            html: `<h3>Nova solicitação de suporte</h3><p><strong>Protocolo:</strong> ${protocol}</p><p><strong>Nome:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Categoria:</strong> ${category}</p><p><strong>Mensagem:</strong></p><p>${message}</p>`,
          });
        }
      } catch {}
    })();

    res.json({ success: true, protocol });
  } catch (err) {
    console.error('Erro ao criar ticket de suporte:', err);
    res.status(500).json({ error: 'Erro ao enviar solicitação' });
  }
});

// Get ticket by protocol
router.get('/ticket/:protocol', (req, res) => {
  try {
    const ticket = db.prepare(
      'SELECT id, protocol, subject, category, status, message, created_at, updated_at FROM support_tickets WHERE protocol = ?'
    ).get(req.params.protocol);

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
