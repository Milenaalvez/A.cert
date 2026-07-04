import { Router } from 'express';
import prisma, { queryRaw } from '../lib/prisma.js';

const router = Router();

router.get('/', async (req, res) => {
  const q = (req.query.q as string || '').trim();
  if (!q) {
    res.json({ results: [] });
    return;
  }

  const s = `%${q}%`;

  try {
    const [dossiers, persons, properties, users] = await Promise.all([
      queryRaw(
        `SELECT d.id, d.identifier as label, 'dossier' as type,
          (SELECT COUNT(*) FROM dossier_participants WHERE dossier_id = d.id)::int as participant_count
        FROM dossiers d
        WHERE d.identifier LIKE $1
        LIMIT 5`, s
      ),
      queryRaw(
        `SELECT id, name as label, 'person' as type
        FROM persons
        WHERE name LIKE $1 OR cpf LIKE $2
        LIMIT 5`, s, s
      ),
      queryRaw(
        `SELECT id, identifier as label, 'property' as type
        FROM properties
        WHERE identifier LIKE $1 OR address LIKE $2
        LIMIT 5`, s, s
      ),
      queryRaw(
        `SELECT id, name as label, 'user' as type
        FROM users
        WHERE name LIKE $1 OR email LIKE $2
        LIMIT 5`, s, s
      ),
    ]);

    res.json({ results: [...dossiers, ...persons, ...properties, ...users] });
  } catch (error) {
    console.error('[Search] Erro:', error);
    res.status(500).json({ error: 'Erro ao buscar' });
  }
});

export default router;
