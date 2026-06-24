import { Router } from 'express';
import db from '../database.js';

const router = Router();

router.get('/', (_req, res) => {
  try {
    const dossiersAndamento = db.prepare(
      "SELECT COUNT(*) as count FROM dossiers WHERE status = 'Em andamento'"
    ).get() as { count: number };

    const semanasPassada = new Date();
    semanasPassada.setDate(semanasPassada.getDate() - 7);

    const pendenciasCriticas = db.prepare(
      "SELECT COUNT(*) as count FROM dossiers WHERE status = 'Pendente'"
    ).get() as { count: number };

    const pendenciasSemanaPassada = db.prepare(
      "SELECT COUNT(*) as count FROM dossiers WHERE status = 'Pendente' AND created_at < ?"
    ).get(semanasPassada.toISOString()) as { count: number };

    const certidoesEmitidas = db.prepare(
      "SELECT COUNT(*) as count FROM certificates WHERE status = 'Obtida'"
    ).get() as { count: number };

    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const certidoesEmitidasMes = db.prepare(
      "SELECT COUNT(*) as count FROM certificates WHERE status = 'Obtida' AND obtained_at >= ?"
    ).get(inicioMes.toISOString()) as { count: number };

    const certidoesEmitidasMesAnterior = db.prepare(
      "SELECT COUNT(*) as count FROM certificates WHERE status = 'Obtida' AND obtained_at >= ? AND obtained_at < ?"
    ).get(
      new Date(inicioMes.getTime() - 30 * 86400000).toISOString(),
      inicioMes.toISOString()
    ) as { count: number };

    const totalCertidoes = db.prepare(
      'SELECT COUNT(*) as count FROM certificates'
    ).get() as { count: number };

    const totalCertidoesAnterior = db.prepare(
      'SELECT COUNT(*) as count FROM certificates WHERE created_at < ?'
    ).get(inicioMes.toISOString()) as { count: number };

    const taxaConclusaoAtual = totalCertidoes.count > 0
      ? (certidoesEmitidas.count / totalCertidoes.count) * 100
      : 0;

    const taxaConclusaoAnterior = totalCertidoesAnterior.count > 0
      ? (db.prepare(
          "SELECT COUNT(*) as count FROM certificates WHERE status = 'Obtida' AND created_at < ?"
        ).get(inicioMes.toISOString()) as { count: number }).count / totalCertidoesAnterior.count * 100
      : 0;

    const emissions = db.prepare(`
      SELECT strftime('%m', obtained_at) as mes, COUNT(*) as total
      FROM certificates
      WHERE status = 'Obtida' AND obtained_at >= date('now', '-6 months')
      GROUP BY strftime('%m', obtained_at)
      ORDER BY mes
    `).all() as { mes: string; total: number }[];

    const distribution = db.prepare(`
      SELECT priority, COUNT(*) as total
      FROM dossiers
      GROUP BY priority
    `).all() as { priority: string; total: number }[];

    const totalDossiers = db.prepare(
      'SELECT COUNT(*) as count FROM dossiers'
    ).get() as { count: number };

    const certHoje = db.prepare(
      "SELECT COUNT(*) as count FROM certificates WHERE status = 'Obtida' AND date(obtained_at) = date('now')"
    ).get() as { count: number };

    const tempoMedio = db.prepare(`
      SELECT COALESCE(AVG(
        (julianday(COALESCE(obtained_at, datetime('now'))) - julianday(created_at)) * 24 * 60
      ), 0) as avg_minutes FROM certificates
    `).get() as { avg_minutes: number };

    const taxaSucesso = totalCertidoes.count > 0
      ? (certidoesEmitidas.count / totalCertidoes.count) * 100
      : 0;

    const priorities = db.prepare(`
      SELECT d.identifier, c.name as tipo, d.updated_at
      FROM dossiers d
      LEFT JOIN certificates c ON c.dossier_id = d.id
      WHERE d.status = 'Pendente'
      ORDER BY d.updated_at ASC
      LIMIT 5
    `).all() as { identifier: string; tipo: string; updated_at: string }[];

    const organs = db.prepare(
      'SELECT name, status FROM organs ORDER BY name'
    ).all() as { name: string; status: string }[];

    const activities = db.prepare(`
      SELECT user_name, action, reference, dossier_ref, created_at
      FROM activities
      ORDER BY created_at DESC
      LIMIT 6
    `).all() as { user_name: string; action: string; reference: string | null; dossier_ref: string | null; created_at: string }[];

    res.json({
      dossiersAndamento: dossiersAndamento.count,
      pendenciasCriticas: pendenciasCriticas.count,
      pendenciasSemanaPassada: pendenciasSemanaPassada.count,
      certidoesEmitidas: certidoesEmitidas.count,
      certidoesEmitidasMes: certidoesEmitidasMes.count,
      certidoesEmitidasMesAnterior: certidoesEmitidasMesAnterior.count,
      taxaConclusao: Math.round(taxaConclusaoAtual * 10) / 10,
      taxaConclusaoAnterior: Math.round(taxaConclusaoAnterior * 10) / 10,
      emissions: emissions.map(e => ({
        mes: ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][parseInt(e.mes)],
        total: e.total,
      })),
      totalDossiers: totalDossiers.count,
      distribution: distribution.map(d => ({
        label: d.priority,
        total: d.total,
      })),
      resumo: {
        certidoesHoje: certHoje.count,
        certidoesMes: certidoesEmitidasMes.count,
        tempoMedio: Math.round(tempoMedio.avg_minutes / 60 * 10) / 10,
        taxaSucesso: Math.round(taxaSucesso * 10) / 10,
      },
      priorities: priorities.map(p => ({
        identifier: p.identifier,
        tipo: p.tipo || 'Documentação',
        diasSemAtualizar: Math.floor(
          (Date.now() - new Date(p.updated_at).getTime()) / 86400000
        ),
      })),
      organs,
      activities: activities.map(a => ({
        time: new Date(a.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        user: a.user_name,
        action: a.action,
        ref: a.dossier_ref,
      })),
    });
  } catch (error) {
    console.error('[Dashboard] Erro:', error);
    res.status(500).json({ error: 'Erro ao carregar dashboard' });
  }
});

export default router;
