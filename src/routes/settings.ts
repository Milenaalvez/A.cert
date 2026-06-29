import { Router } from 'express';
import db from '../database.js';
import { authMiddleware } from '../middleware/auth.js';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Archiver as ArchiverClass } from 'archiver';
import unzipper from 'unzipper';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

function logAudit(userId: string, userName: string, action: string, module: string, detail?: string, ipAddress?: string, result?: string) {
  try {
    db.prepare(
      'INSERT INTO audit_log (id, user_id, user_name, action, module, detail, ip_address, result) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(randomUUID(), userId, userName, action, module, detail || null, ipAddress || '', result || 'success');
  } catch {}
}

router.get('/', authMiddleware, (_req, res) => {
  try {
    const rows = db.prepare('SELECT key, value, updated_at FROM settings ORDER BY key').all() as any[];
    const settings: Record<string, string> = {};
    for (const r of rows) settings[r.key] = r.value;
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar configurações' });
  }
});

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

router.get('/organs', authMiddleware, (_req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM organs ORDER BY name').all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar órgãos' });
  }
});

router.put('/organs/:id', authMiddleware, (req, res) => {
  try {
    const { status } = req.body;
    db.prepare('UPDATE organs SET status = ?, updated_at = datetime(\'now\') WHERE id = ?').run(status || 'online', req.params.id);
    logAudit((req as any).user?.id || '', (req as any).user?.name || '', 'Atualizou órgão', 'Configurações', `Órgão: ${req.params.id} → ${status}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar órgão' });
  }
});

router.post('/organs', authMiddleware, (req, res) => {
  try {
    const { name } = req.body;
    if (!name) { res.status(400).json({ error: 'Nome do órgão é obrigatório' }); return; }
    const id = randomUUID();
    db.prepare('INSERT INTO organs (id, name, status, updated_at) VALUES (?, ?, ?, datetime(\'now\'))').run(id, name, 'offline');
    logAudit((req as any).user?.id || '', (req as any).user?.name || '', 'Cadastrou órgão', 'Configurações', `Órgão: ${name}`);
    res.status(201).json({ id, name, status: 'offline' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao cadastrar órgão' });
  }
});

router.delete('/organs/:id', authMiddleware, (req, res) => {
  try {
    db.prepare('DELETE FROM organs WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover órgão' });
  }
});

router.get('/templates', authMiddleware, (_req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM certificate_templates ORDER BY ordem').all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar templates' });
  }
});

router.put('/templates/:id', authMiddleware, (req, res) => {
  try {
    const { label, category, site_url, type } = req.body;
    db.prepare(
      'UPDATE certificate_templates SET label = COALESCE(?, label), category = COALESCE(?, category), site_url = COALESCE(?, site_url), type = COALESCE(?, type) WHERE id = ?'
    ).run(label || null, category || null, site_url || null, type || null, req.params.id);
    logAudit((req as any).user?.id || '', (req as any).user?.name || '', 'Atualizou template', 'Configurações', `Template: ${label || req.params.id}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar template' });
  }
});

router.get('/pdf-templates', authMiddleware, (_req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM settings WHERE key LIKE \'pdf_%\' ORDER BY key').all() as any[];
    const config: Record<string, string> = {};
    for (const r of rows) config[r.key] = r.value;
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar templates PDF' });
  }
});

router.put('/pdf-templates', authMiddleware, (req, res) => {
  try {
    const body = req.body as Record<string, string>;
    const upsert = db.prepare(
      'INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime(\'now\')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime(\'now\')'
    );
    for (const [key, value] of Object.entries(body)) {
      if (!key.startsWith('pdf_')) continue;
      upsert.run(key, value);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao salvar templates PDF' });
  }
});

router.get('/audit', authMiddleware, (req, res) => {
  try {
    const { user: filterUser, action: filterAction, period, module: filterModule, result: filterResult } = req.query;
    let query = 'SELECT * FROM audit_log WHERE 1=1';
    const params: any[] = [];
    if (filterUser) { query += ' AND user_name LIKE ?'; params.push(`%${filterUser}%`); }
    if (filterAction) { query += ' AND action LIKE ?'; params.push(`%${filterAction}%`); }
    if (filterModule) { query += ' AND module LIKE ?'; params.push(`%${filterModule}%`); }
    if (filterResult) { query += ' AND result = ?'; params.push(filterResult); }
    if (period === 'hoje') { query += " AND created_at >= datetime('now', '-1 day')"; }
    else if (period === 'semana') { query += " AND created_at >= datetime('now', '-7 days')"; }
    else if (period === 'mes') { query += " AND created_at >= datetime('now', '-30 days')"; }
    query += ' ORDER BY created_at DESC LIMIT 200';
    const rows = db.prepare(query).all(...params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar auditoria' });
  }
});

router.get('/backup', authMiddleware, (_req, res) => {
  try {
    const lastBackup = (db.prepare('SELECT value FROM settings WHERE key = ?').get('last_backup_at') as any)?.value || '';
    const backupSize = (db.prepare('SELECT value FROM settings WHERE key = ?').get('backup_size') as any)?.value || '0';
    const files = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.zip')).map(f => {
      const stat = fs.statSync(path.join(BACKUP_DIR, f));
      return { name: f, size: stat.size, date: stat.mtime.toISOString() };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    res.json({ lastBackupAt: lastBackup, size: backupSize, files });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar informações de backup' });
  }
});

router.post('/backup/generate', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `backup-acert-${timestamp}.zip`;
    const filepath = path.join(BACKUP_DIR, filename);

    if (!fs.existsSync(DATA_DIR)) { res.status(500).json({ error: 'Diretório de dados não encontrado' }); return; }

    await new Promise<void>((resolve, reject) => {
      const output = fs.createWriteStream(filepath);
      const archive = new ArchiverClass('zip', { zlib: { level: 9 } });
      output.on('close', resolve);
      archive.on('error', reject);
      archive.pipe(output);
      archive.directory(DATA_DIR, 'data', { ignore: ['backups/**'] });
      archive.finalize();
    });

    const stat = fs.statSync(filepath);
    const sizeStr = stat.size > 1048576 ? `${(stat.size / 1048576).toFixed(2)} MB` : `${(stat.size / 1024).toFixed(2)} KB`;
    db.prepare('UPDATE settings SET value = ?, updated_at = datetime(\'now\') WHERE key = ?').run(filename, 'last_backup_at');
    db.prepare('UPDATE settings SET value = ?, updated_at = datetime(\'now\') WHERE key = ?').run(sizeStr, 'backup_size');
    logAudit(user?.id || '', user?.name || '', 'Gerou backup', 'Configurações', filename);
    res.json({ success: true, filename, size: sizeStr });
  } catch (err: any) {
    res.status(500).json({ error: `Erro ao gerar backup: ${err.message}` });
  }
});

router.get('/backup/download/:filename', authMiddleware, (req, res) => {
  const filepath = path.join(BACKUP_DIR, req.params.filename);
  if (!fs.existsSync(filepath)) {
    res.status(404).json({ error: 'Backup não encontrado' });
    return;
  }
  res.download(filepath);
});

router.post('/backup/restore', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const { filename } = req.body;
    if (!filename) { res.status(400).json({ error: 'Nome do backup é obrigatório' }); return; }
    const filepath = path.join(BACKUP_DIR, filename);
    if (!fs.existsSync(filepath)) { res.status(404).json({ error: 'Backup não encontrado' }); return; }
    await fs.createReadStream(filepath).pipe(unzipper.Extract({ path: DATA_DIR })).promise();
    logAudit(user?.id || '', user?.name || '', 'Restaurou backup', 'Configurações', filename);
    res.json({ success: true, message: 'Backup restaurado com sucesso. Reinicie o sistema.' });
  } catch (err: any) {
    res.status(500).json({ error: `Erro ao restaurar backup: ${err.message}` });
  }
});

router.delete('/backup/:filename', authMiddleware, (req, res) => {
  try {
    const filepath = path.join(BACKUP_DIR, req.params.filename);
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir backup' });
  }
});

router.get('/system-info', authMiddleware, (_req, res) => {
  try {
    const dbStat = fs.statSync(path.join(DATA_DIR, 'acert.db'));
    const dbSize = dbStat.size > 1048576 ? `${(dbStat.size / 1048576).toFixed(2)} MB` : `${(dbStat.size / 1024).toFixed(2)} KB`;
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    res.json({
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      lastUpdate: '2026-06-25',
      server: `Node.js ${process.version}`,
      database: dbSize,
      uptime: `${days}d ${hours}h`,
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar informações do sistema' });
  }
});

export default router;
