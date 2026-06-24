import { Router } from 'express';
import db from '../database.js';

const router = Router();

router.get('/', (req, res) => {
  const q = (req.query.q as string || '').trim();
  if (!q) {
    res.json({ results: [] });
    return;
  }

  const s = `%${q}%`;

  const dossiers = db.prepare(`
    SELECT d.id, d.identifier as label, 'dossier' as type
    FROM dossiers d
    WHERE d.identifier LIKE ?
    LIMIT 5
  `).all(s) as { id: string; label: string; type: string }[];

  const persons = db.prepare(`
    SELECT id, name as label, 'person' as type
    FROM persons
    WHERE name LIKE ? OR cpf LIKE ?
    LIMIT 5
  `).all(s, s) as { id: string; label: string; type: string }[];

  const properties = db.prepare(`
    SELECT id, identifier as label, 'property' as type
    FROM properties
    WHERE identifier LIKE ? OR address LIKE ?
    LIMIT 5
  `).all(s, s) as { id: string; label: string; type: string }[];

  const certificates = db.prepare(`
    SELECT c.id, c.identifier as label, 'certificate' as type
    FROM certificates c
    WHERE c.identifier LIKE ?
    LIMIT 5
  `).all(s) as { id: string; label: string; type: string }[];

  const users = db.prepare(`
    SELECT id, name as label, 'user' as type
    FROM users
    WHERE name LIKE ? OR email LIKE ?
    LIMIT 5
  `).all(s, s) as { id: string; label: string; type: string }[];

  res.json({ results: [...dossiers, ...persons, ...properties, ...certificates, ...users] });
});

export default router;
