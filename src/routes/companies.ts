import { Router } from 'express';
import { randomUUID, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import prisma, { queryRaw, queryRawOne, executeRaw } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { enviarEmailBoasVindas } from '../services/email.service.js';

const router = Router();

router.get('/', authMiddleware, async (_req, res) => {
  try {
    const rows = await queryRaw(
      `SELECT c.*, (SELECT COUNT(*) FROM users WHERE company_id = c.id AND deleted_at IS NULL)::int as user_count
      FROM companies c ORDER BY c.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao carregar empresas' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, cnpj, plan, license_expires_at, admin_email, admin_name } = req.body;

    if (!name || !admin_email || !admin_name) {
      res.status(400).json({ error: 'Nome da empresa, email e nome do admin são obrigatórios' });
      return;
    }

    const companyId = randomUUID();
    await prisma.company.create({
      data: {
        id: companyId, name: name.trim(), cnpj: cnpj ? cnpj.replace(/\D/g, '') : null,
        plan: plan || 'trial', licenseStatus: 'active',
        licenseExpiresAt: license_expires_at || null,
        createdAt: new Date().toISOString(),
      },
    });

    const userId = randomUUID();
    const tempPassword = randomBytes(4).toString('hex');
    const password_hash = bcrypt.hashSync(tempPassword, 10);
    const now = new Date().toISOString();

    await prisma.user.create({
      data: {
        id: userId, name: admin_name.trim(), email: admin_email.toLowerCase().trim(),
        passwordHash: password_hash, role: 'ADMIN', companyId,
        passwordChangeRequired: 1, emailConfirmed: 1, emailVerified: 1, isActive: 1, createdAt: now,
      },
    });

    await prisma.teamActivity.create({
      data: {
        id: randomUUID(), userId, userName: admin_name.trim(), action: 'CREATE_COMPANY',
        description: `Empresa ${name.trim()} criada com admin ${admin_name.trim()}`,
        entityType: 'company', entityId: companyId, timestamp: now,
      },
    });

    enviarEmailBoasVindas(admin_email.toLowerCase().trim(), admin_name.trim(), tempPassword, name.trim());

    res.status(201).json({
      company: { id: companyId, name: name.trim() },
      admin: { email: admin_email.toLowerCase().trim(), tempPassword },
    });
  } catch (err) {
    console.error('[Companies] Erro ao criar:', err);
    res.status(500).json({ error: 'Erro ao criar empresa' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, cnpj, plan, license_status, license_expires_at, logo_url } = req.body;
    const existing = await prisma.company.findUnique({ where: { id: req.params.id as string } });
    if (!existing) { res.status(404).json({ error: 'Empresa não encontrada' }); return; }

    await prisma.company.update({
      where: { id: req.params.id as string },
      data: {
        ...(name !== undefined && { name }),
        ...(cnpj !== undefined && { cnpj }),
        ...(plan !== undefined && { plan }),
        ...(license_status !== undefined && { licenseStatus: license_status }),
        ...(license_expires_at !== undefined && { licenseExpiresAt: license_expires_at }),
        ...(logo_url !== undefined && { logoUrl: logo_url }),
      },
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar empresa' });
  }
});

router.get('/:id/settings', authMiddleware, async (req, res) => {
  try {
    const rows = await prisma.companySetting.findMany({ where: { companyId: req.params.id as string } });
    const settings: Record<string, string> = {};
    for (const r of rows) settings[r.key] = r.value;
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao carregar configurações' });
  }
});

router.put('/:id/settings', authMiddleware, async (req, res) => {
  try {
    const body = req.body as Record<string, string>;
    for (const [key, value] of Object.entries(body)) {
      await prisma.companySetting.upsert({
        where: { companyId_key: { companyId: req.params.id as string, key } },
        create: { companyId: req.params.id as string, key, value },
        update: { value },
      });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao salvar configurações' });
  }
});

router.post('/:id/resend-credentials', authMiddleware, async (req, res) => {
  try {
    const company = await prisma.company.findUnique({ where: { id: req.params.id as string } });
    if (!company) { res.status(404).json({ error: 'Empresa não encontrada' }); return; }

    const admins = await prisma.user.findMany({
      where: { companyId: req.params.id as string, role: 'ADMIN' },
      select: { id: true, name: true, email: true },
    });
    if (admins.length === 0) { res.status(400).json({ error: 'Nenhum admin encontrado para esta empresa' }); return; }

    const tempPassword = randomBytes(4).toString('hex');
    const password_hash = bcrypt.hashSync(tempPassword, 10);

    for (const admin of admins) {
      await prisma.user.update({
        where: { id: admin.id },
        data: { passwordHash: password_hash, passwordChangeRequired: 1 },
      });
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

router.get('/:id/users', authMiddleware, async (req, res) => {
  try {
    const users = await queryRaw(
      `SELECT id, name, email, cpf, phone, role, is_active, created_at
       FROM users WHERE company_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC`,
      req.params.id
    );
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao carregar usuários' });
  }
});

router.put('/:id/users/:userId/approve', authMiddleware, async (req, res) => {
  try {
    await executeRaw(
      'UPDATE users SET is_active = 1, email_confirmed = 1 WHERE id = $1 AND company_id = $2',
      req.params.userId, req.params.id
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao aprovar usuário' });
  }
});

router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { license_status } = req.body;
    if (!license_status) { res.status(400).json({ error: 'Status é obrigatório' }); return; }
    const existing = await prisma.company.findUnique({ where: { id: req.params.id as string } });
    if (!existing) { res.status(404).json({ error: 'Empresa não encontrada' }); return; }
    await prisma.company.update({
      where: { id: req.params.id as string },
      data: { licenseStatus: license_status },
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar status' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await executeRaw('UPDATE users SET deleted_at = NOW() WHERE company_id = $1', req.params.id as string);
    await prisma.company.delete({ where: { id: req.params.id as string } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir empresa' });
  }
});

export default router;
