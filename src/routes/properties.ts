import { Router } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

router.get('/cartorios', async (_req, res) => {
  try {
    const registrosDF = [
      "1º Ofício de Registro de Imóveis do DF — Asa Sul",
      "2º Ofício de Registro de Imóveis do DF — Taguatinga",
      "3º Ofício de Registro de Imóveis do DF — Gama",
      "4º Ofício de Registro de Imóveis do DF — Sobradinho",
      "5º Ofício de Registro de Imóveis do DF — Planaltina",
      "6º Ofício de Registro de Imóveis do DF — Águas Claras",
    ];
    const entornoGo = [
      "Cartório de Registro de Imóveis de Valparaíso de Goiás",
      "Cartório de Registro de Imóveis de Novo Gama",
      "Cartório de Registro de Imóveis de Cidade Ocidental",
      "Cartório de Registro de Imóveis de Luziânia",
      "Cartório de Registro de Imóveis de Águas Lindas de Goiás",
      "Cartório de Registro de Imóveis de Formosa",
      "Cartório de Registro de Imóveis de Santo Antônio do Descoberto",
      "Cartório de Registro de Imóveis de Alexânia",
      "Cartório de Registro de Imóveis de Cristalina",
    ];
    const all = [...registrosDF, ...entornoGo];
    const q = (_req.query.q as string || "").trim().toLowerCase();
    const results = q ? all.filter(c => c.toLowerCase().includes(q)) : all;
    res.json(results.map(name => ({ name })));
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar cartórios' });
  }
});

router.get('/search', async (req, res) => {
  try {
    const q = ((req.query.q as string) || '').trim();
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    if (!q) { res.json({ properties: [] }); return; }

    const properties = await import('../lib/prisma.js').then(m =>
      m.queryRaw(
        `SELECT id, identifier, registration, type, address, neighborhood, city, status
        FROM properties
        WHERE (identifier ILIKE $1 OR address ILIKE $2 OR registration ILIKE $3)
          AND (deleted_at IS NULL OR deleted_at = '')
        ORDER BY updated_at DESC
        LIMIT $4`,
        `%${q}%`, `%${q}%`, `%${q}%`, limit
      )
    );

    res.json({ properties });
  } catch (error) {
    console.error('[Properties Search] Erro:', error);
    res.status(500).json({ error: 'Erro ao pesquisar imóveis' });
  }
});

export default router;
