import { Router } from 'express';
import db from '../database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

const ENTITY_MAP: Record<string, { table: string; label: string; idField: string; selectFields: string }> = {
  pessoas: {
    table: 'persons',
    label: 'Pessoa',
    idField: 'id',
    selectFields: 'id, name as title, cpf as subtitle1, email as subtitle2, created_at, archived_at, deleted_at',
  },
  imoveis: {
    table: 'properties',
    label: 'Imóvel',
    idField: 'id',
    selectFields: "id, identifier as title, address as subtitle1, registration as subtitle2, type, created_at, deleted_at",
  },
  dossies: {
    table: 'dossiers',
    label: 'Dossiê',
    idField: 'id',
    selectFields: 'id, identifier as title, status as subtitle1, created_by as subtitle2, created_at, archived_at, deleted_at',
  },
  usuarios: {
    table: 'users',
    label: 'Usuário',
    idField: 'id',
    selectFields: "id, name as title, email as subtitle1, role as subtitle2, created_at, is_active, deleted_at",
  },
};

router.get('/', (_req, res) => {
  try {
    const type = (_req.query.type as string) || '';
    const keys = type ? [type] : Object.keys(ENTITY_MAP);
    const results: any[] = [];

    for (const key of keys) {
      const cfg = ENTITY_MAP[key];
      if (!cfg) continue;

      let query: string;
      let params: any[] = [];

      if (key === 'usuarios') {
        query = `SELECT ${cfg.selectFields}, ? as entity_type FROM ${cfg.table} WHERE is_active = 0 OR deleted_at IS NOT NULL`;
        params = [key];
      } else {
        query = `SELECT ${cfg.selectFields}, ? as entity_type FROM ${cfg.table} WHERE archived_at IS NOT NULL OR deleted_at IS NOT NULL`;
        params = [key];
      }

      if (key === 'usuarios') {
        query += ` ORDER BY COALESCE(deleted_at, created_at) DESC LIMIT 100`;
      } else {
        query += ` ORDER BY COALESCE(deleted_at, archived_at, created_at) DESC LIMIT 100`;
      }

      const rows = db.prepare(query).all(...params) as any[];
      for (const row of rows) {
        results.push({
          id: row.id,
          title: row.title,
          subtitle1: row.subtitle1 || '',
          subtitle2: row.subtitle2 || '',
          entityType: row.entity_type,
          entityLabel: cfg.label,
          archivedAt: row.archived_at || null,
          deletedAt: row.deleted_at || null,
          createdAt: row.created_at,
          extra: key === 'imoveis' ? { type: row.type, registration: row.subtitle2 } : {},
        });
      }
    }

    const total = results.length;
    results.sort((a, b) => {
      const dateA = new Date(a.deletedAt || a.archivedAt || a.createdAt).getTime();
      const dateB = new Date(b.deletedAt || b.archivedAt || b.createdAt).getTime();
      return dateB - dateA;
    });

    res.json({ items: results, total });
  } catch (err) {
    console.error('[Trash] Erro ao listar:', err);
    res.status(500).json({ error: 'Erro ao carregar lixeira' });
  }
});

// GET /api/trash/:entity/:id — detalhes do item
router.get('/:entity/:id', (req, res) => {
  try {
    const entity = req.params.entity as string;
    const id = req.params.id as string;
    const cfg = ENTITY_MAP[entity];
    if (!cfg) { res.status(400).json({ error: 'Entidade inválida' }); return; }

    const row = db.prepare(`SELECT * FROM ${cfg.table} WHERE ${cfg.idField} = ?`).get(id) as any;
    if (!row) { res.status(404).json({ error: 'Item não encontrado' }); return; }

    res.json(row);
  } catch (err) {
    console.error('[Trash] Erro ao buscar detalhes:', err);
    res.status(500).json({ error: 'Erro ao buscar detalhes' });
  }
});

// POST /api/trash/:entity/:id/restore
router.post('/:entity/:id/restore', authMiddleware, (req, res) => {
  try {
    const entity = req.params.entity as string;
    const id = req.params.id as string;
    const cfg = ENTITY_MAP[entity];
    if (!cfg) { res.status(400).json({ error: 'Entidade inválida' }); return; }

    if (entity === 'usuarios') {
      db.prepare(`UPDATE ${cfg.table} SET is_active = 1, deleted_at = NULL WHERE ${cfg.idField} = ?`).run(id);
    } else {
      db.prepare(`UPDATE ${cfg.table} SET archived_at = NULL, deleted_at = NULL WHERE ${cfg.idField} = ?`).run(id);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('[Trash] Erro ao restaurar:', err);
    res.status(500).json({ error: 'Erro ao restaurar item' });
  }
});

// DELETE /api/trash/:entity/:id — exclusão permanente
router.delete('/:entity/:id', authMiddleware, (req, res) => {
  try {
    const entity = req.params.entity as string;
    const id = req.params.id as string;
    const cfg = ENTITY_MAP[entity];
    if (!cfg) { res.status(400).json({ error: 'Entidade inválida' }); return; }

    if (entity === 'dossies') {
      db.prepare('DELETE FROM certificates WHERE dossier_id = ?').run(id);
      db.prepare('DELETE FROM activities WHERE dossier_ref = ?').run(id);
    }

    db.prepare(`DELETE FROM ${cfg.table} WHERE ${cfg.idField} = ?`).run(id);
    res.json({ success: true });
  } catch (err) {
    console.error('[Trash] Erro ao excluir permanentemente:', err);
    res.status(500).json({ error: 'Erro ao excluir permanentemente' });
  }
});

export default router;
