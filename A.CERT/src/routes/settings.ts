import { Router } from 'express';
import prisma, { queryRaw, queryRawOne, executeRaw } from '../lib/prisma.js';
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

async function logAudit(userId: string, userName: string, action: string, module: string, detail?: string, ipAddress?: string, result?: string) {
  try {
    await executeRaw(
      'INSERT INTO audit_log (id, user_id, user_name, action, module, detail, ip_address, result) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      randomUUID(), userId, userName, action, module, detail || null, ipAddress || '', result || 'success'
    );
  } catch {}
}

router.get('/', authMiddleware, async (_req, res) => {
  try {
    const rows = await queryRaw('SELECT key, value, updated_at FROM settings ORDER BY key');
    const settings: Record<string, string> = {};
    for (const r of rows) settings[r.key] = r.value;
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar configurações' });
  }
});

router.put('/', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const body = req.body as Record<string, string>;
    if (!body || Object.keys(body).length === 0) {
      res.status(400).json({ error: 'Nenhuma configuração enviada' });
      return;
    }
    const sql = "INSERT INTO settings (key, value, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = NOW()";
    const updated: string[] = [];
    for (const [key, value] of Object.entries(body)) {
      if (typeof value !== 'string') continue;
      await executeRaw(sql, key, value);
      updated.push(key);
      await logAudit(user?.id || '', user?.name || '', `Alterou ${key}`, 'Configurações', `${key} = ${value.slice(0, 60)}`);
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

router.get('/organs', authMiddleware, async (_req, res) => {
  try {
    const rows = await queryRaw('SELECT * FROM organs ORDER BY name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar órgãos' });
  }
});

router.put('/organs/:id', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    await executeRaw('UPDATE organs SET status = $1, updated_at = NOW() WHERE id = $2', status || 'online', req.params.id as string);
    await logAudit((req as any).user?.id || '', (req as any).user?.name || '', 'Atualizou órgão', 'Configurações', `Órgão: ${req.params.id as string} → ${status}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar órgão' });
  }
});

router.post('/organs', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) { res.status(400).json({ error: 'Nome do órgão é obrigatório' }); return; }
    const id = randomUUID();
    await executeRaw('INSERT INTO organs (id, name, status, updated_at) VALUES ($1, $2, $3, NOW())', id, name, 'offline');
    await logAudit((req as any).user?.id || '', (req as any).user?.name || '', 'Cadastrou órgão', 'Configurações', `Órgão: ${name}`);
    res.status(201).json({ id, name, status: 'offline' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao cadastrar órgão' });
  }
});

router.delete('/organs/:id', authMiddleware, async (req, res) => {
  try {
    await executeRaw('DELETE FROM organs WHERE id = $1', req.params.id as string);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover órgão' });
  }
});

const BUILTIN_CONNECTORS = [
  { id: "rf", name: "Receita Federal", icon: "FileSearch" },
  { id: "trf1", name: "TRF1", icon: "Building2" },
  { id: "tjdft", name: "TJDFT", icon: "Building2" },
  { id: "trt", name: "TRT", icon: "Briefcase" },
  { id: "tst", name: "TST", icon: "Briefcase" },
  { id: "sefaz", name: "SEFAZ-DF", icon: "Landmark" },
  { id: "onr", name: "Certidão de Ônus (ONR)", icon: "Home" },
];

router.get('/connectors-status', authMiddleware, async (_req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const stats = await queryRaw(`
      SELECT
        organ,
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE status = 'Obtida')::int as obtidas,
        COUNT(*) FILTER (WHERE status = 'Obtida' AND obtained_at::timestamp::date = $1::date)::int as hoje,
        MAX(obtained_at) as ultima_consulta,
        AVG(EXTRACT(EPOCH FROM (obtained_at::timestamp - created_at::timestamp))) as tempo_medio_seg
      FROM certificates
      WHERE organ IS NOT NULL AND organ != ''
      GROUP BY organ
    `, today) as { organ: string; total: number; obtidas: number; hoje: number; ultima_consulta: string | null; tempo_medio_seg: number | null }[];

    const statsMap = new Map(stats.map(s => [s.organ, s]));

    const result = BUILTIN_CONNECTORS.map(c => {
      const s = statsMap.get(c.name);
      const obtidas = s?.obtidas ?? 0;
      const total = s?.total ?? 0;
      const taxaSucesso = total > 0 ? Math.round((obtidas / total) * 100) : 0;
      const ultima = s?.ultima_consulta || null;
      const tempoMedio = s?.tempo_medio_seg ? `${(s.tempo_medio_seg / 60).toFixed(1)} min` : "—";

      let status: "online" | "offline" | "unstable" = "offline";
      if (obtidas > 0 && ultima) {
        const diasDesdeUltima = Math.floor((Date.now() - new Date(ultima).getTime()) / 86400000);
        status = diasDesdeUltima <= 1 ? "online" : diasDesdeUltima <= 7 ? "unstable" : "offline";
      }

      return {
        ...c,
        status,
        totalCertidoes: total,
        certidoesObtidas: obtidas,
        certidoesHoje: s?.hoje ?? 0,
        taxaSucesso,
        ultimaConsulta: ultima,
        tempoMedio,
      };
    });

    res.json(result);
  } catch (err) {
    console.error('[Settings] Erro ao buscar status dos conectores:', err);
    res.status(500).json({ error: 'Erro ao buscar status dos conectores' });
  }
});

router.post('/connectors/:id/test', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const connector = BUILTIN_CONNECTORS.find(c => c.id === id);
    if (!connector) {
      res.status(404).json({ error: 'Conector não encontrado' });
      return;
    }

    const stats = await queryRawOne(
      `SELECT
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE status = 'Obtida')::int as obtidas,
        MAX(CASE WHEN status = 'Obtida' THEN obtained_at END) as ultima_obtida,
        MAX(created_at) as ultima_tentativa
      FROM certificates WHERE organ = $1`,
      connector.name
    ) as { total: number; obtidas: number; ultima_obtida: string | null; ultima_tentativa: string | null } | null;

    if (!stats || stats.total === 0) {
      res.json({
        success: false,
        message: 'Nenhuma certidão registrada para este órgão',
        total: 0, obtidas: 0,
      });
      return;
    }

    const online = stats.obtidas > 0;
    res.json({
      success: online,
      message: online
        ? `${stats.obtidas} de ${stats.total} certidões obtidas${stats.ultima_obtida ? ` · Última: ${new Date(stats.ultima_obtida).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}` : ''}`
        : `${stats.total} tentativa${stats.total > 1 ? 's' : ''}, nenhuma concluída${stats.ultima_tentativa ? ` · Última: ${new Date(stats.ultima_tentativa).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}` : ''}`,
      total: stats.total,
      obtidas: stats.obtidas,
      ultimaObtida: stats.ultima_obtida,
    });
  } catch (err) {
    console.error('[Settings] Erro ao testar conector:', err);
    res.status(500).json({ error: 'Erro ao testar conector' });
  }
});

router.get('/templates', authMiddleware, async (_req, res) => {
  try {
    const rows = await queryRaw('SELECT * FROM certificate_templates ORDER BY ordem');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar templates' });
  }
});

router.put('/templates/:id', authMiddleware, async (req, res) => {
  try {
    const { label, category, site_url, type } = req.body;
    await executeRaw(
      'UPDATE certificate_templates SET label = COALESCE($1, label), category = COALESCE($2, category), site_url = COALESCE($3, site_url), type = COALESCE($4, type) WHERE id = $5',
      label || null, category || null, site_url || null, type || null, req.params.id as string
    );
    await logAudit((req as any).user?.id || '', (req as any).user?.name || '', 'Atualizou template', 'Configurações', `Template: ${label || req.params.id as string}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar template' });
  }
});

router.get('/pdf-templates', authMiddleware, async (_req, res) => {
  try {
    const rows = await queryRaw("SELECT key, value FROM settings WHERE key LIKE 'pdf_%' ORDER BY key");
    const config: Record<string, string> = {};
    for (const r of rows) config[r.key] = r.value;
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar templates PDF' });
  }
});

router.put('/pdf-templates', authMiddleware, async (req, res) => {
  try {
    const body = req.body as Record<string, string>;
    const sql = "INSERT INTO settings (key, value, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = NOW()";
    for (const [key, value] of Object.entries(body)) {
      if (!key.startsWith('pdf_')) continue;
      await executeRaw(sql, key, value);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao salvar templates PDF' });
  }
});

router.get('/audit', authMiddleware, async (req, res) => {
  try {
    const { user: filterUser, action: filterAction, period, module: filterModule, result: filterResult } = req.query;
    let query = 'SELECT * FROM audit_log WHERE 1=1';
    const params: any[] = [];
    if (filterUser) { query += ` AND user_name LIKE $${params.length + 1}`; params.push(`%${filterUser}%`); }
    if (filterAction) { query += ` AND action LIKE $${params.length + 1}`; params.push(`%${filterAction}%`); }
    if (filterModule) { query += ` AND module LIKE $${params.length + 1}`; params.push(`%${filterModule}%`); }
    if (filterResult) { query += ` AND result = $${params.length + 1}`; params.push(filterResult); }
    if (period === 'hoje') { query += " AND created_at::timestamp >= NOW() - INTERVAL '1 day'"; }
    else if (period === 'semana') { query += " AND created_at::timestamp >= NOW() - INTERVAL '7 days'"; }
    else if (period === 'mes') { query += " AND created_at::timestamp >= NOW() - INTERVAL '30 days'"; }
    query += ' ORDER BY created_at DESC LIMIT 200';
    const rows = await queryRaw(query, ...params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar auditoria' });
  }
});

router.get('/backup', authMiddleware, async (_req, res) => {
  try {
    const lastBackup = (await queryRawOne('SELECT value FROM settings WHERE key = $1', 'last_backup_at'))?.value || '';
    const backupSize = (await queryRawOne('SELECT value FROM settings WHERE key = $1', 'backup_size'))?.value || '0';
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
      const archive = new (ArchiverClass as any)('zip', { zlib: { level: 9 } });
      output.on('close', resolve);
      archive.on('error', reject);
      archive.pipe(output);
      (archive as any).directory(DATA_DIR, 'data', { ignore: ['backups/**'] });
      archive.finalize();
    });

    const stat = fs.statSync(filepath);
    const sizeStr = stat.size > 1048576 ? `${(stat.size / 1048576).toFixed(2)} MB` : `${(stat.size / 1024).toFixed(2)} KB`;
    await executeRaw('UPDATE settings SET value = $1, updated_at = NOW() WHERE key = $2', filename, 'last_backup_at');
    await executeRaw('UPDATE settings SET value = $1, updated_at = NOW() WHERE key = $2', sizeStr, 'backup_size');
    await logAudit(user?.id || '', user?.name || '', 'Gerou backup', 'Configurações', filename);
    res.json({ success: true, filename, size: sizeStr });
  } catch (err: any) {
    res.status(500).json({ error: `Erro ao gerar backup: ${err.message}` });
  }
});

router.get('/backup/download/:filename', authMiddleware, (req, res) => {
  const filepath = path.join(BACKUP_DIR, req.params.filename as string);
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
    await logAudit(user?.id || '', user?.name || '', 'Restaurou backup', 'Configurações', filename);
    res.json({ success: true, message: 'Backup restaurado com sucesso. Reinicie o sistema.' });
  } catch (err: any) {
    res.status(500).json({ error: `Erro ao restaurar backup: ${err.message}` });
  }
});

router.delete('/backup/:filename', authMiddleware, (req, res) => {
  try {
    const filepath = path.join(BACKUP_DIR, req.params.filename as string);
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir backup' });
  }
});

router.get('/system-info', authMiddleware, async (_req, res) => {
  try {
    const dbPath = path.join(DATA_DIR, 'acert.db');
    let dbSize = '—';
    try {
      const dbStat = fs.statSync(dbPath);
      dbSize = dbStat.size > 1048576 ? `${(dbStat.size / 1048576).toFixed(2)} MB` : `${(dbStat.size / 1024).toFixed(2)} KB`;
    } catch {}

    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const mins = Math.floor((uptime % 3600) / 60);

    const [userCount, dossierCount, certCount, sessionCount] = await Promise.all([
      queryRawOne("SELECT COUNT(*)::int as count FROM users") as Promise<{ count: number }>,
      queryRawOne("SELECT COUNT(*)::int as count FROM dossiers WHERE deleted_at IS NULL OR deleted_at = ''") as Promise<{ count: number }>,
      queryRawOne("SELECT COUNT(*)::int as count FROM certificates") as Promise<{ count: number }>,
      queryRawOne("SELECT COUNT(*)::int as count FROM user_sessions WHERE is_active = 1") as Promise<{ count: number }>,
    ]);

    const memUsage = process.memoryUsage();
    const memMB = Math.round(memUsage.heapUsed / 1024 / 1024);

    const pkgJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'package.json'), 'utf-8'));

    res.json({
      version: pkgJson.version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      server: `Node.js ${process.version}`,
      database: dbSize,
      uptime: days > 0 ? `${days}d ${hours}h ${mins}min` : hours > 0 ? `${hours}h ${mins}min` : `${mins}min`,
      lastUpdate: '2026-06-25',
      stats: {
        users: userCount.count,
        dossiers: dossierCount.count,
        certificates: certCount.count,
        activeSessions: sessionCount.count,
      },
      resources: {
        memory: `${memMB} MB`,
        uptimeSeconds: Math.round(uptime),
      },
    });
  } catch (err) {
    console.error('[Settings] Erro ao buscar informações do sistema:', err);
    res.status(500).json({ error: 'Erro ao buscar informações do sistema' });
  }
});

export default router;
