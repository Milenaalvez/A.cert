import { Router } from 'express';
import { randomUUID, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import db from '../database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

function isAdmin(req: any): boolean {
  return req.user?.email && db.prepare("SELECT role FROM users WHERE id = ? AND role = 'ADMIN'").get(req.user.userId) !== undefined;
}

router.get('/', authMiddleware, (_req, res) => {
  try {
    const rows = db.prepare(`
      SELECT c.*,
        (SELECT COUNT(*) FROM users WHERE company_id = c.id AND deleted_at IS NULL) as user_count
      FROM companies c
      ORDER BY c.created_at DESC
    `).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao carregar empresas' });
  }
});

router.post('/', authMiddleware, (req, res) => {
  try {
    const { name, cnpj, plan, license_expires_at, admin_email, admin_name } = req.body;

    if (!name || !admin_email || !admin_name) {
      res.status(400).json({ error: 'Nome da empresa, email e nome do admin são obrigatórios' });
      return;
    }

    const companyId = randomUUID();
    db.prepare(`
      INSERT INTO companies (id, name, cnpj, plan, license_status, license_expires_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(companyId, name.trim(), cnpj || null, plan || 'trial', 'active', license_expires_at || null);

    const userId = randomUUID();
    const tempPassword = randomBytes(4).toString('hex');
    const password_hash = bcrypt.hashSync(tempPassword, 10);

    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, company_id, password_change_required, email_verified, is_active, created_at)
      VALUES (?, ?, ?, ?, 'ADMIN', ?, 1, 1, 1, datetime('now'))
    `).run(userId, admin_name.trim(), admin_email.toLowerCase().trim(), password_hash, companyId);

    db.prepare(`
      INSERT INTO team_activities (id, user_id, user_name, action, description, entity_type, entity_id, timestamp)
      VALUES (?, ?, ?, 'CREATE_COMPANY', ?, 'company', ?, datetime('now'))
    `).run(randomUUID(), userId, admin_name.trim(), `Empresa ${name.trim()} criada com admin ${admin_name.trim()}`, companyId);

    res.status(201).json({
      company: { id: companyId, name: name.trim() },
      admin: { email: admin_email.toLowerCase().trim(), tempPassword },
    });
  } catch (err) {
    console.error('[Companies] Erro ao criar:', err);
    res.status(500).json({ error: 'Erro ao criar empresa' });
  }
});

router.put('/:id', authMiddleware, (req, res) => {
  try {
    const { name, cnpj, plan, license_status, license_expires_at, logo_url } = req.body;
    const existing = db.prepare('SELECT id FROM companies WHERE id = ?').get(req.params.id);
    if (!existing) { res.status(404).json({ error: 'Empresa não encontrada' }); return; }

    db.prepare(`
      UPDATE companies SET name = COALESCE(?, name), cnpj = COALESCE(?, cnpj), plan = COALESCE(?, plan),
        license_status = COALESCE(?, license_status), license_expires_at = COALESCE(?, license_expires_at),
        logo_url = COALESCE(?, logo_url)
      WHERE id = ?
    `).run(name || null, cnpj || null, plan || null, license_status || null, license_expires_at || null, logo_url || null, req.params.id);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar empresa' });
  }
});

router.get('/:id/settings', authMiddleware, (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM company_settings WHERE company_id = ?').all(req.params.id) as any[];
    const settings: Record<string, string> = {};
    for (const r of rows) settings[r.key] = r.value;
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao carregar configurações' });
  }
});

router.put('/:id/settings', authMiddleware, (req, res) => {
  try {
    const body = req.body as Record<string, string>;
    const upsert = db.prepare(
      'INSERT INTO company_settings (company_id, key, value) VALUES (?, ?, ?) ON CONFLICT(company_id, key) DO UPDATE SET value = excluded.value'
    );
    for (const [key, value] of Object.entries(body)) {
      upsert.run(req.params.id, key, value);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao salvar configurações' });
  }
});

router.post('/:id/resend-credentials', authMiddleware, (req, res) => {
  try {
    const company = db.prepare('SELECT id, name FROM companies WHERE id = ?').get(req.params.id) as any;
    if (!company) { res.status(404).json({ error: 'Empresa não encontrada' }); return; }

    const admins = db.prepare("SELECT id, name, email FROM users WHERE company_id = ? AND role = 'ADMIN'").all(req.params.id) as any[];
    if (admins.length === 0) { res.status(400).json({ error: 'Nenhum admin encontrado para esta empresa' }); return; }

    const tempPassword = randomBytes(4).toString('hex');
    const password_hash = bcrypt.hashSync(tempPassword, 10);

    for (const admin of admins) {
      db.prepare('UPDATE users SET password_hash = ?, password_change_required = 1 WHERE id = ?')
        .run(password_hash, admin.id);
    }

    res.json({
      success: true,
      message: 'Credenciais redefinidas',
      admin: { email: admins[0].email, tempPassword },
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao reenviar credenciais' });
  }
});

export default router;
