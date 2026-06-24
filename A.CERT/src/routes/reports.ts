import { Router } from 'express';
import db from '../database.js';

const router = Router();

router.get('/', (_req, res) => {
  try {
    const dossiersConcluidos = db.prepare(
      "SELECT COUNT(*) as count FROM dossiers WHERE status = 'Concluído'"
    ).get() as { count: number };

    const certidoesEmitidas = db.prepare(
      "SELECT COUNT(*) as count FROM certificates WHERE status = 'Obtida'"
    ).get() as { count: number };

    const totalCertidoes = db.prepare(
      'SELECT COUNT(*) as count FROM certificates'
    ).get() as { count: number };

    const tempoMedio = db.prepare(`
      SELECT COALESCE(AVG(
        (julianday(COALESCE(obtained_at, datetime('now'))) - julianday(created_at)) * 24 * 60
      ), 0) as avg_minutes FROM certificates
    `).get() as { avg_minutes: number };

    const pendenciasAbertas = db.prepare(
      "SELECT COUNT(*) as count FROM dossiers WHERE status = 'Pendente'"
    ).get() as { count: number };

    const dossierStatus = db.prepare(`
      SELECT status, COUNT(*) as total
      FROM dossiers
      GROUP BY status
    `).all() as { status: string; total: number }[];

    const monthlyEmission = db.prepare(`
      SELECT strftime('%m', obtained_at) as mes, COUNT(*) as total
      FROM certificates
      WHERE status = 'Obtida' AND obtained_at >= date('now', '-12 months')
      GROUP BY strftime('%m', obtained_at)
      ORDER BY mes
    `).all() as { mes: string; total: number }[];

    res.json({
      stats: {
        dossiersConcluidos: dossiersConcluidos.count,
        certidoesEmitidas: certidoesEmitidas.count,
        tempoMedio: Math.round(tempoMedio.avg_minutes / 60 * 10) / 10,
        pendenciasAbertas: pendenciasAbertas.count,
      },
      dossierStatus: dossierStatus.map(d => ({
        label: d.status,
        total: d.total,
      })),
      monthlyEmission: monthlyEmission.map(e => ({
        mes: ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][parseInt(e.mes)],
        total: e.total,
      })),
    });
  } catch (err) {
    console.error('[Reports] Erro:', err);
    res.status(500).json({ error: 'Erro ao carregar relatórios' });
  }
});

router.get('/export', (_req, res) => {
  try {
    const rows = db.prepare(`
      SELECT
        d.identifier as dossier_identifier,
        d.status as dossier_status,
        d.created_by as responsible,
        p.name as client_name,
        p.cpf as client_cpf,
        pr.identifier as property_identifier,
        c.name as certificate_name,
        c.organ,
        c.status as certificate_status,
        c.protocol,
        c.obtained_at,
        c.created_at as certificate_created_at,
        d.created_at as dossier_created_at,
        d.updated_at as dossier_updated_at
      FROM dossiers d
      LEFT JOIN persons p ON p.id = d.person_id
      LEFT JOIN properties pr ON pr.id = d.property_id
      LEFT JOIN certificates c ON c.dossier_id = d.id
      ORDER BY d.created_at DESC
    `).all() as any[];

    res.json({ data: rows });
  } catch (err) {
    console.error('[Reports] Erro export:', err);
    res.status(500).json({ error: 'Erro ao exportar dados' });
  }
});

export default router;
