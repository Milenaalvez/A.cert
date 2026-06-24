import { Router } from 'express';
import db from '../database.js';

const router = Router();

const months = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

router.get('/', (_req, res) => {
  try {
    // Dossiers breakdown
    const dossierStatus = db.prepare('SELECT status, COUNT(*) as total FROM dossiers GROUP BY status').all() as { status: string; total: number }[];
    const totalDossiers = (db.prepare('SELECT COUNT(*) as count FROM dossiers').get() as { count: number }).count;
    const dossiersConcluidos = (db.prepare("SELECT COUNT(*) as count FROM dossiers WHERE status = 'Concluído'").get() as { count: number }).count;
    const dossiersAndamento = (db.prepare("SELECT COUNT(*) as count FROM dossiers WHERE status = 'Em andamento'").get() as { count: number }).count;
    const dossiersPendentes = (db.prepare("SELECT COUNT(*) as count FROM dossiers WHERE status = 'Pendente'").get() as { count: number }).count;
    const dossiersCancelados = (db.prepare("SELECT COUNT(*) as count FROM dossiers WHERE status = 'Cancelado'").get() as { count: number }).count;
    const dossiersArquivados = (db.prepare("SELECT COUNT(*) as count FROM dossiers WHERE status = 'Arquivado'").get() as { count: number }).count;

    // Dossier avg time by status
    const dossierAvgTime = db.prepare(`
      SELECT status,
        CAST(ROUND(AVG((julianday(COALESCE(updated_at, datetime('now'))) - julianday(created_at)) * 24)) as INTEGER) as avg_hours
      FROM dossiers GROUP BY status
    `).all() as { status: string; avg_hours: number }[];

    // Certificates by organ with time avg
    const certByOrgan = db.prepare(`
      SELECT organ as name, COUNT(*) as total,
        SUM(CASE WHEN status = 'Obtida' THEN 1 ELSE 0 END) as success,
        SUM(CASE WHEN status = 'Erro' THEN 1 ELSE 0 END) as failed,
        CAST(COALESCE(ROUND(AVG(CASE WHEN obtained_at IS NOT NULL THEN (julianday(obtained_at) - julianday(created_at)) * 24 * 60 END)), 0) as INTEGER) as avg_minutes
      FROM certificates GROUP BY organ ORDER BY total DESC
    `).all() as { name: string; total: number; success: number; failed: number; avg_minutes: number }[];

    const totalCertificates = (db.prepare('SELECT COUNT(*) as count FROM certificates').get() as { count: number }).count;

    // Monthly emissions (last 12 months)
    const monthlyEmission = db.prepare(`
      SELECT strftime('%m', obtained_at) as mes, COUNT(*) as total
      FROM certificates WHERE status = 'Obtida' AND obtained_at IS NOT NULL AND obtained_at >= date('now', '-12 months')
      GROUP BY strftime('%m', obtained_at) ORDER BY mes
    `).all() as { mes: string; total: number }[];

    // Daily emissions (last 30 days)
    const dailyEmission = db.prepare(`
      SELECT date(obtained_at) as dia, COUNT(*) as total
      FROM certificates WHERE status = 'Obtida' AND obtained_at IS NOT NULL AND obtained_at >= date('now', '-30 days')
      GROUP BY date(obtained_at) ORDER BY dia
    `).all() as { dia: string; total: number }[];

    // Client growth
    const newClientsToday = (db.prepare("SELECT COUNT(*) as count FROM persons WHERE date(created_at) = date('now')").get() as { count: number }).count;
    const newClientsYesterday = (db.prepare("SELECT COUNT(*) as count FROM persons WHERE date(created_at) = date('now', '-1 days')").get() as { count: number }).count;
    const newClientsWeek = (db.prepare("SELECT COUNT(*) as count FROM persons WHERE created_at >= date('now', '-7 days')").get() as { count: number }).count;
    const newClientsLastWeek = (db.prepare("SELECT COUNT(*) as count FROM persons WHERE created_at >= date('now', '-14 days') AND created_at < date('now', '-7 days')").get() as { count: number }).count;
    const newClientsMonth = (db.prepare("SELECT COUNT(*) as count FROM persons WHERE created_at >= date('now', '-30 days')").get() as { count: number }).count;
    const newClientsLastMonth = (db.prepare("SELECT COUNT(*) as count FROM persons WHERE created_at >= date('now', '-60 days') AND created_at < date('now', '-30 days')").get() as { count: number }).count;
    const newClientsYear = (db.prepare("SELECT COUNT(*) as count FROM persons WHERE created_at >= date('now', '-365 days')").get() as { count: number }).count;

    // Properties by type with dossier/cert stats
    const propertiesByType = db.prepare(`
      SELECT p.type, COUNT(DISTINCT p.id) as total,
        COUNT(DISTINCT d.id) as dossiers_generated,
        COUNT(DISTINCT CASE WHEN c.status = 'Obtida' THEN c.id END) as certs_emitted,
        CAST(CASE WHEN COUNT(DISTINCT d.id) > 0 THEN ROUND(COUNT(DISTINCT CASE WHEN d.status = 'Concluído' THEN d.id END) * 100.0 / COUNT(DISTINCT d.id), 1) ELSE 0 END as INTEGER) as completion_rate
      FROM properties p
      LEFT JOIN dossiers d ON d.property_id = p.id
      LEFT JOIN certificates c ON c.dossier_id = d.id
      GROUP BY p.type ORDER BY total DESC
    `).all() as { type: string; total: number; dossiers_generated: number; certs_emitted: number; completion_rate: number }[];

    // Productivity ranking (top users)
    const productivityRanking = db.prepare(`
      SELECT u.id, u.name, u.avatar,
        CAST(COALESCE(td.total_dossiers, 0) as INTEGER) as total_dossiers,
        CAST(COALESCE(tc.total_certs, 0) as INTEGER) as total_certs,
        CAST(COALESCE(tc.success_certs, 0) as INTEGER) as success_certs,
        CAST(CASE WHEN COALESCE(tc.total_certs, 0) > 0 THEN ROUND(COALESCE(tc.success_certs, 0) * 100.0 / tc.total_certs, 1) ELSE 0 END as INTEGER) as success_rate
      FROM users u
      LEFT JOIN (
        SELECT created_by as uid, COUNT(*) as total_dossiers FROM dossiers GROUP BY created_by
      ) td ON td.uid = u.id
      LEFT JOIN (
        SELECT d.created_by as uid, COUNT(*) as total_certs,
          SUM(CASE WHEN c.status = 'Obtida' THEN 1 ELSE 0 END) as success_certs
        FROM dossiers d JOIN certificates c ON c.dossier_id = d.id
        WHERE d.created_by IS NOT NULL
        GROUP BY d.created_by
      ) tc ON tc.uid = u.id
      WHERE td.total_dossiers IS NOT NULL OR tc.total_certs IS NOT NULL
      ORDER BY COALESCE(td.total_dossiers, 0) DESC
      LIMIT 20
    `).all() as { id: string; name: string; avatar: string | null; total_dossiers: number; total_certs: number; success_certs: number; success_rate: number }[];

    // Growth trends
    const certThisMonth = (db.prepare("SELECT COUNT(*) as count FROM certificates WHERE status = 'Obtida' AND obtained_at IS NOT NULL AND obtained_at >= date('now', 'start of month')").get() as { count: number }).count;
    const certLastMonth = (db.prepare("SELECT COUNT(*) as count FROM certificates WHERE status = 'Obtida' AND obtained_at IS NOT NULL AND obtained_at >= date('now', 'start of month', '-1 month') AND obtained_at < date('now', 'start of month')").get() as { count: number }).count;
    const dossierCancelledThisMonth = (db.prepare("SELECT COUNT(*) as count FROM dossiers WHERE status = 'Cancelado' AND updated_at >= date('now', 'start of month')").get() as { count: number }).count;
    const dossierCancelledLastMonth = (db.prepare("SELECT COUNT(*) as count FROM dossiers WHERE status = 'Cancelado' AND updated_at >= date('now', 'start of month', '-1 month') AND updated_at < date('now', 'start of month')").get() as { count: number }).count;

    // Organic statuses
    const organStatuses = db.prepare('SELECT id, name, status, updated_at FROM organs').all() as any[];

    res.json({
      dossierBreakdown: {
        total: totalDossiers,
        concluidos: dossiersConcluidos,
        andamento: dossiersAndamento,
        pendentes: dossiersPendentes,
        cancelados: dossiersCancelados,
        arquivados: dossiersArquivados,
      },
      dossierDetails: dossierStatus.map(s => ({
        label: s.status,
        total: s.total,
        pct: totalDossiers > 0 ? Math.round(s.total / totalDossiers * 100) : 0,
        avgHours: (dossierAvgTime.find(t => t.status === s.status))?.avg_hours || 0,
        trend: getTrend(s.status, dossierAvgTime),
      })),
      certByOrgan: certByOrgan.map(c => ({
        name: c.name,
        total: c.total,
        success: c.success,
        failed: c.failed,
        successRate: c.total > 0 ? Math.round(c.success / c.total * 100) : 0,
        avgMinutes: c.avg_minutes,
      })),
      totalCertificates,
      monthlyEmission: monthlyEmission.map(e => ({ label: months[parseInt(e.mes)], total: e.total })),
      dailyEmission: dailyEmission.map(e => {
        const d = new Date(e.dia + 'T12:00:00');
        return { label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }), total: e.total };
      }),
      clientGrowth: {
        today: newClientsToday,
        yesterday: newClientsYesterday,
        week: newClientsWeek,
        lastWeek: newClientsLastWeek,
        month: newClientsMonth,
        lastMonth: newClientsLastMonth,
        year: newClientsYear,
      },
      propertiesByType,
      productivityRanking,
      organStatuses,
      trends: {
        certThisMonth,
        certLastMonth,
        certGrowthPct: certLastMonth > 0 ? Math.round((certThisMonth - certLastMonth) / certLastMonth * 100) : 0,
        dossierCancelledThisMonth,
        dossierCancelledLastMonth,
        cancelGrowthPct: dossierCancelledLastMonth > 0 ? Math.round((dossierCancelledThisMonth - dossierCancelledLastMonth) / dossierCancelledLastMonth * 100) : 0,
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        totalRecords: totalDossiers + totalCertificates + (db.prepare('SELECT COUNT(*) as count FROM persons').get() as { count: number }).count + (db.prepare('SELECT COUNT(*) as count FROM properties').get() as { count: number }).count,
        dataSource: 'Banco SQLite — Dados em tempo real da plataforma A.CERT',
      },
    });
  } catch (err) {
    console.error('[Reports] Erro:', err);
    res.status(500).json({ error: 'Erro ao carregar relatórios' });
  }
});

function getTrend(status: string, avgTimes: { status: string; avg_hours: number }[]): 'up' | 'down' | 'stable' {
  // Simple heuristic: compare with overall average
  const total = avgTimes.reduce((s, t) => s + t.avg_hours, 0) || 1;
  const overallAvg = total / Math.max(avgTimes.length, 1);
  const thisAvg = avgTimes.find(t => t.status === status)?.avg_hours || 0;
  if (thisAvg > overallAvg * 1.2) return 'up';
  if (thisAvg < overallAvg * 0.8) return 'down';
  return 'stable';
}

router.get('/export', (_req, res) => {
  try {
    const rows = db.prepare(`
      SELECT d.identifier as dossier_identifier, d.status as dossier_status, d.created_by as responsible,
        p.name as client_name, p.cpf as client_cpf, pr.identifier as property_identifier,
        c.name as certificate_name, c.organ, c.status as certificate_status, c.protocol,
        c.obtained_at, c.created_at as certificate_created_at,
        d.created_at as dossier_created_at, d.updated_at as dossier_updated_at
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
