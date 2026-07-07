import { Router } from 'express';
import prisma, { executeRaw, queryRaw, queryRawOne } from '../lib/prisma.js';
import { randomUUID } from 'node:crypto';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string || '50', 10);
    const rows = await queryRaw(
      'SELECT id, title, message, type, is_read as "isRead", link, source_ref as "sourceRef", created_at as "createdAt" FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
      req.user!.userId, limit
    );
    res.json(rows);
  } catch (err) {
    console.error('[Notifications] Erro ao listar:', err);
    res.status(500).json({ error: 'Erro ao buscar notificações' });
  }
});

router.get('/count', authMiddleware, async (req, res) => {
  try {
    const row = await queryRawOne(
      'SELECT COUNT(*)::int as count FROM notifications WHERE user_id = $1 AND is_read = 0',
      req.user!.userId
    );
    res.json({ count: (row as any)?.count || 0 });
  } catch (err) {
    console.error('[Notifications] Erro ao contar:', err);
    res.status(500).json({ error: 'Erro ao contar notificações' });
  }
});

router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    await executeRaw(
      'UPDATE notifications SET is_read = 1 WHERE id = $1 AND user_id = $2',
      req.params.id, req.user!.userId
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[Notifications] Erro ao marcar lida:', err);
    res.status(500).json({ error: 'Erro ao marcar como lida' });
  }
});

router.post('/mark-all-read', authMiddleware, async (req, res) => {
  try {
    await executeRaw(
      'UPDATE notifications SET is_read = 1 WHERE user_id = $1',
      req.user!.userId
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[Notifications] Erro ao marcar todas lidas:', err);
    res.status(500).json({ error: 'Erro ao marcar todas' });
  }
});

export { router as notificationsRoutes };

export async function createNotification(userId: string, title: string, message: string, type = 'info', link?: string, sourceRef?: string) {
  try {
    const id = randomUUID();
    await executeRaw(
      'INSERT INTO notifications (id, user_id, title, message, type, is_read, link, source_ref, created_at) VALUES ($1, $2, $3, $4, $5, 0, $6, $7, $8)',
      id, userId, title, message, type, link || null, sourceRef || null, new Date().toISOString()
    );
  } catch (err) {
    console.error('[Notifications] Erro ao criar:', err);
  }
}
