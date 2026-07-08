import { Router } from 'express';
import { queryRaw, executeRaw } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const type = (_req.query.type as string) || '';

    const uuidRE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    const personas = (!type || type === 'pessoas')
      ? (await queryRaw(
          `SELECT id, name, cpf, email, created_at, archived_at, deleted_at
           FROM persons WHERE deleted_at IS NOT NULL OR archived_at IS NOT NULL
           ORDER BY COALESCE(deleted_at, archived_at) DESC LIMIT 100`
        ) as any[]).map((r: any) => ({
          id: r.id, title: r.name, subtitle1: r.cpf || '', subtitle2: r.email || '',
          entityType: 'pessoas', entityLabel: 'Pessoa', archivedAt: r.archived_at, deletedAt: r.deleted_at, createdAt: r.created_at, extra: {},
        }))
      : [];

    const imoveis = (!type || type === 'imoveis')
      ? (await queryRaw(
          `SELECT id, identifier, address, registration, type, created_at, deleted_at
           FROM properties WHERE deleted_at IS NOT NULL
           ORDER BY deleted_at DESC LIMIT 100`
        ) as any[]).map((r: any) => {
          const isUUID = uuidRE.test(r.identifier || '');
          const title = isUUID || !r.identifier
            ? (r.address ? r.address.split(',')[0].trim() : (r.type || 'Imóvel'))
            : r.identifier;
          return {
            id: r.id, title,
            subtitle1: isUUID ? `${r.type || 'Imóvel'} — ${r.address || 'Sem endereço'}` : (r.address || ''),
            subtitle2: r.registration || '',
            entityType: 'imoveis', entityLabel: 'Imóvel', archivedAt: null, deletedAt: r.deleted_at, createdAt: r.created_at,
            extra: { type: r.type, registration: r.registration },
          };
        })
      : [];

    const dossies = (!type || type === 'dossies')
      ? (await queryRaw(
          `SELECT id, identifier, status, created_by, created_at, archived_at, deleted_at
           FROM dossiers WHERE deleted_at IS NOT NULL OR archived_at IS NOT NULL
           ORDER BY COALESCE(deleted_at, archived_at) DESC LIMIT 100`
        ) as any[]).map((r: any) => ({
          id: r.id, title: r.identifier || '', subtitle1: r.status || '', subtitle2: r.created_by || '',
          entityType: 'dossies', entityLabel: 'Dossiê', archivedAt: r.archived_at, deletedAt: r.deleted_at, createdAt: r.created_at, extra: {},
        }))
      : [];

    const usuarios = (!type || type === 'usuarios')
      ? (await queryRaw(
          `SELECT id, name, email, role, created_at, is_active, deleted_at
           FROM users WHERE is_active = 0 OR deleted_at IS NOT NULL
           ORDER BY COALESCE(deleted_at, created_at) DESC LIMIT 100`
        ) as any[]).map((r: any) => ({
          id: r.id, title: r.name, subtitle1: r.email, subtitle2: r.role || '',
          entityType: 'usuarios', entityLabel: 'Usuário', archivedAt: null, deletedAt: r.deleted_at, createdAt: r.created_at, extra: { isActive: r.is_active },
        }))
      : [];

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

router.get('/:entity/:id', async (req, res) => {
  try {
    const entity = req.params.entity as string;
    const id = req.params.id as string;

    if (entity === 'pessoas') {
      const row = await queryRaw(`SELECT * FROM persons WHERE id = $1`, id);
      res.json(row[0] || null);
    } else if (entity === 'imoveis') {
      const row = await queryRaw(`SELECT * FROM properties WHERE id = $1`, id);
      res.json(row[0] || null);
    } else if (entity === 'dossies') {
      const row = await queryRaw(`SELECT * FROM dossiers WHERE id = $1`, id);
      res.json(row[0] || null);
    } else if (entity === 'usuarios') {
      const row = await queryRaw(`SELECT id, name, email, role, department_id, position_id, is_active, last_access_at, created_at FROM users WHERE id = $1`, id);
      res.json(row[0] || null);
    } else {
      res.status(400).json({ error: 'Entidade inválida' });
    }
  } catch (err) {
    console.error('[Trash] Erro ao buscar detalhes:', err);
    res.status(500).json({ error: 'Erro ao carregar detalhes' });
  }
});

router.post('/:entity/:id/restore', authMiddleware, async (req, res) => {
  try {
    const entity = req.params.entity as string;
    const id = req.params.id as string;

    if (entity === 'usuarios') {
      await executeRaw('UPDATE users SET is_active = 1, deleted_at = NULL WHERE id = $1', id);
    } else if (entity === 'pessoas') {
      await executeRaw('UPDATE persons SET archived_at = NULL, deleted_at = NULL WHERE id = $1', id);
    } else if (entity === 'imoveis') {
      await executeRaw('UPDATE properties SET deleted_at = NULL WHERE id = $1', id);
    } else if (entity === 'dossies') {
      await executeRaw('UPDATE dossiers SET archived_at = NULL, deleted_at = NULL WHERE id = $1', id);
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
      await executeRaw('DELETE FROM certificates WHERE dossier_id = $1', id);
      await executeRaw('DELETE FROM activities WHERE dossier_ref = $1', id);
    }

    if (entity === 'usuarios') {
      await executeRaw('DELETE FROM user_sessions WHERE user_id = $1', id);
      await executeRaw('DELETE FROM user_permissions WHERE user_id = $1', id);
      await executeRaw('DELETE FROM users WHERE id = $1', id);
    } else if (entity === 'pessoas') {
      await executeRaw('DELETE FROM persons WHERE id = $1', id);
    } else if (entity === 'imoveis') {
      await executeRaw('DELETE FROM properties WHERE id = $1', id);
    } else if (entity === 'dossies') {
      await executeRaw('DELETE FROM dossiers WHERE id = $1', id);
    } else {
      res.status(400).json({ error: 'Entidade inválida' });
      return;
    }

    res.json({ success: true });
  } catch (err) {
    console.error('[Trash] Erro ao excluir permanentemente:', err);
    res.status(500).json({ error: 'Erro ao excluir permanentemente' });
  }
});

export default router;
