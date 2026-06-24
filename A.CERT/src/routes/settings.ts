import { Router } from 'express';
import db from '../database.js';
import { authMiddleware } from '../middleware/auth.js';
import { randomUUID } from 'node:crypto';

const router = Router();

function logAudit(userId: string, userName: string, action: string, module: string, detail?: string) {
  try {
    db.prepare(
      'INSERT INTO audit_log (id, user_id, user_name, action, module, detail) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(randomUUID(), userId, userName, action, module, detail || null);
  } catch {}
}

// Get all settings
router.get('/', authMiddleware, (_req, res) => {
  try {
    const rows = db.prepare('SELECT key, value, updated_at FROM settings ORDER BY key').all() as any[];
    const settings: Record<string, string> = {};
    for (const r of rows) {
      settings[r.key] = r.value;
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar configurações' });
  }
});

// Update settings (batch)
router.put('/', authMiddleware, (req, res) => {
  try {
    const user = (req as any).user;
    const body = req.body as Record<string, string>;

    if (!body || Object.keys(body).length === 0) {
      res.status(400).json({ error: 'Nenhuma configuração enviada' });
      return;
    }

    const upsert = db.prepare(
      'INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime(\'now\')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime(\'now\')'
    );

    const updated: string[] = [];
    for (const [key, value] of Object.entries(body)) {
      if (typeof value !== 'string') continue;
      upsert.run(key, value);
      updated.push(key);
      logAudit(user?.id || '', user?.name || '', `Alterou ${key}`, 'Configurações', `${key} = ${value.slice(0, 60)}`);
    }

    res.json({ success: true, updated });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao salvar configurações' });
  }
});

// Test SMTP connection
router.post('/test-smtp', authMiddleware, async (req, res) => {
  try {
    const nodemailer = await import('nodemailer');
    const { host, port, user, pass } = req.body;

    if (!host || !user) {
      res.status(400).json({ error: 'Host e usuário SMTP são obrigatórios' });
      return;
    }

    const transporter = nodemailer.default.createTransport({
      host,
      port: parseInt(port || '587', 10),
      secure: parseInt(port || '587', 10) === 465,
      auth: { user, pass: pass || '' },
      connectionTimeout: 10000,
    });

    await transporter.verify();
    res.json({ success: true, message: 'Conexão SMTP realizada com sucesso.' });
  } catch (err: any) {
    res.json({ success: false, message: `Falha na conexão SMTP: ${err.message}` });
  }
});

// Get certificate templates
router.get('/templates', authMiddleware, (_req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM certificate_templates ORDER BY ordem').all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar templates' });
  }
});

// Update certificate template
router.put('/templates/:id', authMiddleware, (req, res) => {
  try {
    const user = (req as any).user;
    const { label, category, site_url, type, html_template } = req.body;
    db.prepare(
      'UPDATE certificate_templates SET label = COALESCE(?, label), category = COALESCE(?, category), site_url = COALESCE(?, site_url), type = COALESCE(?, type) WHERE id = ?'
    ).run(label || null, category || null, site_url || null, type || null, req.params.id);
    logAudit(user?.id || '', user?.name || '', 'Atualizou template', 'Configurações', `Template: ${label || req.params.id}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar template' });
  }
});

// Get audit log
router.get('/audit', authMiddleware, (_req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 100').all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar auditoria' });
  }
});

// Get backup info
router.get('/backup', authMiddleware, (_req, res) => {
  try {
    const lastBackup = (db.prepare('SELECT value FROM settings WHERE key = ?').get('last_backup_at') as any)?.value || '';
    const backupSize = (db.prepare('SELECT value FROM settings WHERE key = ?').get('backup_size') as any)?.value || '0';
    res.json({ lastBackupAt: lastBackup, size: backupSize });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar informações de backup' });
  }
});

export default router;
