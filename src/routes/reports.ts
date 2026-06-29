import { Router } from 'express';
import prisma, { queryRaw, queryRawOne } from '../lib/prisma.js';

const router = Router();

const months = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

router.get('/', async (_req, res) => {
  try {
    const dossierStatus = await queryRaw('SELECT status, COUNT(*) as total FROM dossiers GROUP BY status') as any[];
    const totalDossiers = (await queryRawOne('SELECT COUNT(*) as count FROM dossiers')).count;
    const dossiersConcluidos = (await queryRawOne("SELECT COUNT(*) as count FROM dossiers WHERE status = 'Concluído'")).count;
    const dossiersAndamento = (await queryRawOne("SELECT COUNT(*) as count FROM dossiers WHERE status = 'Em andamento'")).count;
    const dossiersPendentes = (await queryRawOne("SELECT COUNT(*) as count FROM dossiers WHERE status = 'Pendente'")).count;
    const dossiersCancelados = (await queryRawOne("SELECT COUNT(*) as count FROM dossiers WHERE status = 'Cancelado'")).count;
    const dossiersArquivados = (await queryRawOne("SELECT COUNT(*) as count FROM dossiers WHERE status = 'Arquivado'")).count;

    const dossierAvgTime = await queryRaw(`
      SELECT status,
        CAST(ROUND(AVG(EXTRACT(EPOCH FROM (COALESCE(updated_at, NOW())::timestamp - created_at::timestamp)) / 3600)) as INTEGER) as avg_hours
      FROM dossiers GROUP BY status
    `) as any[];

    const certByOrgan = await queryRaw(`
      SELECT organ as name, COUNT(*) as total,
        SUM(CASE WHEN status = 'Obtida' THEN 1 ELSE 0 END) as success,
        SUM(CASE WHEN status = 'Erro' THEN 1 ELSE 0 END) as failed,
        CAST(COALESCE(ROUND(AVG(CASE WHEN obtained_at IS NOT NULL THEN EXTRACT(EPOCH FROM (obtained_at::timestamp - created_at::timestamp)) / 60 END)), 0) as INTEGER) as avg_minutes
      FROM certificates GROUP BY organ ORDER BY total DESC
    `) as any[];

    const totalCertificates = (await queryRawOne('SELECT COUNT(*) as count FROM certificates')).count;

    const monthlyEmission = await queryRaw(`
      SELECT TO_CHAR(obtained_at::timestamp, 'MM') as mes, COUNT(*) as total
      FROM certificates WHERE status = 'Obtida' AND obtained_at IS NOT NULL AND obtained_at >= NOW() - INTERVAL '12 months'
      GROUP BY TO_CHAR(obtained_at::timestamp, 'MM') ORDER BY mes
    `) as any[];

    const dailyEmission = await queryRaw(`
      SELECT obtained_at::date as dia, COUNT(*) as total
      FROM certificates WHERE status = 'Obtida' AND obtained_at IS NOT NULL AND obtained_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY obtained_at::date ORDER BY dia
    `) as any[];

    const newClientsToday = (await queryRawOne("SELECT COUNT(*) as count FROM persons WHERE created_at::date = CURRENT_DATE")).count;
    const newClientsYesterday = (await queryRawOne("SELECT COUNT(*) as count FROM persons WHERE created_at::date = CURRENT_DATE - INTERVAL '1 day'")).count;
    const newClientsWeek = (await queryRawOne("SELECT COUNT(*) as count FROM persons WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'")).count;
    const newClientsLastWeek = (await queryRawOne("SELECT COUNT(*) as count FROM persons WHERE created_at >= CURRENT_DATE - INTERVAL '14 days' AND created_at < CURRENT_DATE - INTERVAL '7 days'")).count;
    const newClientsMonth = (await queryRawOne("SELECT COUNT(*) as count FROM persons WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'")).count;
    const newClientsLastMonth = (await queryRawOne("SELECT COUNT(*) as count FROM persons WHERE created_at >= CURRENT_DATE - INTERVAL '60 days' AND created_at < CURRENT_DATE - INTERVAL '30 days'")).count;
    const newClientsYear = (await queryRawOne("SELECT COUNT(*) as count FROM persons WHERE created_at >= CURRENT_DATE - INTERVAL '365 days'")).count;

    const propertiesByType = await queryRaw(`
      SELECT p.type, COUNT(DISTINCT p.id) as total,
        COUNT(DISTINCT d.id) as dossiers_generated,
        COUNT(DISTINCT CASE WHEN c.status = 'Obtida' THEN c.id END) as certs_emitted,
        CAST(CASE WHEN COUNT(DISTINCT d.id) > 0 THEN ROUND(COUNT(DISTINCT CASE WHEN d.status = 'Concluído' THEN d.id END) * 100.0 / COUNT(DISTINCT d.id), 1) ELSE 0 END as INTEGER) as completion_rate
      FROM properties p
      LEFT JOIN dossiers d ON d.property_id = p.id
      LEFT JOIN certificates c ON c.dossier_id = d.id
      GROUP BY p.type ORDER BY total DESC
    `) as any[];

    const productivityRanking = await queryRaw(`
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
    `) as any[];

    const certThisMonth = (await queryRawOne("SELECT COUNT(*) as count FROM certificates WHERE status = 'Obtida' AND obtained_at IS NOT NULL AND obtained_at >= DATE_TRUNC('month', NOW())")).count;
    const certLastMonth = (await queryRawOne("SELECT COUNT(*) as count FROM certificates WHERE status = 'Obtida' AND obtained_at IS NOT NULL AND obtained_at >= DATE_TRUNC('month', NOW() - INTERVAL '1 month') AND obtained_at < DATE_TRUNC('month', NOW())")).count;
    const dossierCancelledThisMonth = (await queryRawOne("SELECT COUNT(*) as count FROM dossiers WHERE status = 'Cancelado' AND updated_at >= DATE_TRUNC('month', NOW())")).count;
    const dossierCancelledLastMonth = (await queryRawOne("SELECT COUNT(*) as count FROM dossiers WHERE status = 'Cancelado' AND updated_at >= DATE_TRUNC('month', NOW() - INTERVAL '1 month') AND updated_at < DATE_TRUNC('month', NOW())")).count;

    const organStatuses = await queryRaw('SELECT id, name, status, updated_at FROM organs') as any[];

    const personsCount = (await queryRawOne('SELECT COUNT(*) as count FROM persons')).count;
    const propertiesCount = (await queryRawOne('SELECT COUNT(*) as count FROM properties')).count;

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
        totalRecords: totalDossiers + totalCertificates + personsCount + propertiesCount,
        dataSource: 'Banco SQLite — Dados em tempo real da plataforma A.CERT',
      },
    });
  } catch (err) {
    console.error('[Reports] Erro:', err);
    res.status(500).json({ error: 'Erro ao carregar relatórios' });
  }
});

function getTrend(status: string, avgTimes: { status: string; avg_hours: number }[]): 'up' | 'down' | 'stable' {
  const total = avgTimes.reduce((s, t) => s + t.avg_hours, 0) || 1;
  const overallAvg = total / Math.max(avgTimes.length, 1);
  const thisAvg = avgTimes.find(t => t.status === status)?.avg_hours || 0;
  if (thisAvg > overallAvg * 1.2) return 'up';
  if (thisAvg < overallAvg * 0.8) return 'down';
  return 'stable';
}

router.get('/export', async (_req, res) => {
  try {
    const rows = await queryRaw(`
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
    `) as any[];
    res.json({ data: rows });
  } catch (err) {
    console.error('[Reports] Erro export:', err);
    res.status(500).json({ error: 'Erro ao exportar dados' });
  }
});

export default router;
