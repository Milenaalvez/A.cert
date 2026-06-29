import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const type = (_req.query.type as string) || '';

    const personas = (!type || type === 'pessoas') ? await prisma.person.findMany({
      where: { OR: [{ archivedAt: { not: null } }, { deletedAt: { not: null } }] },
      select: { id: true, name: true, cpf: true, email: true, createdAt: true, archivedAt: true, deletedAt: true },
      orderBy: { createdAt: 'desc' }, take: 100,
    }).then(rows => rows.map(r => ({
      id: r.id, title: r.name, subtitle1: r.cpf || '', subtitle2: r.email || '',
      entityType: 'pessoas', entityLabel: 'Pessoa', archivedAt: r.archivedAt, deletedAt: r.deletedAt, createdAt: r.createdAt, extra: {},
    }))) : [];

    const imoveis = (!type || type === 'imoveis') ? await prisma.property.findMany({
      where: { OR: [{ deletedAt: { not: null } }] },
      select: { id: true, identifier: true, address: true, registration: true, type: true, createdAt: true, deletedAt: true },
      orderBy: { createdAt: 'desc' }, take: 100,
    }).then(rows => rows.map(r => ({
      id: r.id, title: r.identifier || '', subtitle1: r.address || '', subtitle2: r.registration || '',
      entityType: 'imoveis', entityLabel: 'Imóvel', archivedAt: null, deletedAt: r.deletedAt, createdAt: r.createdAt, extra: { type: r.type, registration: r.registration },
    }))) : [];

    const dossies = (!type || type === 'dossies') ? await prisma.dossier.findMany({
      where: { OR: [{ archivedAt: { not: null } }, { deletedAt: { not: null } }] },
      select: { id: true, identifier: true, status: true, createdBy: true, createdAt: true, archivedAt: true, deletedAt: true },
      orderBy: { createdAt: 'desc' }, take: 100,
    }).then(rows => rows.map(r => ({
      id: r.id, title: r.identifier || '', subtitle1: r.status || '', subtitle2: r.createdBy || '',
      entityType: 'dossies', entityLabel: 'Dossiê', archivedAt: r.archivedAt, deletedAt: r.deletedAt, createdAt: r.createdAt, extra: {},
    }))) : [];

    const usuarios = (!type || type === 'usuarios') ? await prisma.user.findMany({
      where: { OR: [{ isActive: 0 }, { deletedAt: { not: null } }] },
      select: { id: true, name: true, email: true, role: true, createdAt: true, isActive: true, deletedAt: true },
      orderBy: { createdAt: 'desc' }, take: 100,
    }).then(rows => rows.map(r => ({
      id: r.id, title: r.name, subtitle1: r.email, subtitle2: r.role || '',
      entityType: 'usuarios', entityLabel: 'Usuário', archivedAt: null, deletedAt: r.deletedAt, createdAt: r.createdAt, extra: { isActive: r.isActive },
    }))) : [];

    const results = [...personas, ...imoveis, ...dossies, ...usuarios];
    results.sort((a, b) => {
      const dateA = new Date(a.deletedAt || a.archivedAt || a.createdAt).getTime();
      const dateB = new Date(b.deletedAt || b.archivedAt || b.createdAt).getTime();
      return dateB - dateA;
    });

    res.json({ items: results, total: results.length });
  } catch (err) {
    console.error('[Trash] Erro ao listar:', err);
    res.status(500).json({ error: 'Erro ao carregar lixeira' });
  }
});

router.post('/:entity/:id/restore', authMiddleware, async (req, res) => {
  try {
    const entity = req.params.entity as string;
    const id = req.params.id as string;

    if (entity === 'usuarios') {
      await prisma.user.update({ where: { id }, data: { isActive: 1, deletedAt: null } });
    } else if (entity === 'pessoas') {
      await prisma.person.update({ where: { id }, data: { archivedAt: null, deletedAt: null } });
    } else if (entity === 'imoveis') {
      await prisma.property.update({ where: { id }, data: { deletedAt: null } });
    } else if (entity === 'dossies') {
      await prisma.dossier.update({ where: { id }, data: { archivedAt: null, deletedAt: null } });
    } else {
      res.status(400).json({ error: 'Entidade inválida' });
      return;
    }

    res.json({ success: true });
  } catch (err) {
    console.error('[Trash] Erro ao restaurar:', err);
    res.status(500).json({ error: 'Erro ao restaurar item' });
  }
});

router.delete('/:entity/:id', authMiddleware, async (req, res) => {
  try {
    const entity = req.params.entity as string;
    const id = req.params.id as string;

    if (entity === 'dossies') {
      await prisma.certificate.deleteMany({ where: { dossierId: id } });
      await prisma.activity.deleteMany({ where: { dossierRef: id } });
    }

    if (entity === 'usuarios') await prisma.user.delete({ where: { id } });
    else if (entity === 'pessoas') await prisma.person.delete({ where: { id } });
    else if (entity === 'imoveis') await prisma.property.delete({ where: { id } });
    else if (entity === 'dossies') await prisma.dossier.delete({ where: { id } });
    else { res.status(400).json({ error: 'Entidade inválida' }); return; }

    res.json({ success: true });
  } catch (err) {
    console.error('[Trash] Erro ao excluir permanentemente:', err);
    res.status(500).json({ error: 'Erro ao excluir permanentemente' });
  }
});

export default router;
