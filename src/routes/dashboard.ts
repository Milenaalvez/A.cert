import { Router } from 'express';
import prisma, { queryRaw, queryRawOne } from '../lib/prisma.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const dossiersAndamento = await queryRawOne(
      "SELECT COUNT(*)::int as count FROM dossiers WHERE status = 'Em andamento' AND (deleted_at IS NULL OR deleted_at = '')"
    ) as { count: number };

    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const dossiersAndamentoMesAnterior = await queryRawOne(
      "SELECT COUNT(*)::int as count FROM dossiers WHERE status = 'Em andamento' AND created_at < $1 AND (deleted_at IS NULL OR deleted_at = '')",
      inicioMes.toISOString()
    ) as { count: number };

    const semanasPassada = new Date();
    semanasPassada.setDate(semanasPassada.getDate() - 7);

    const pendenciasCriticas = await queryRawOne(
      "SELECT COUNT(*)::int as count FROM dossiers WHERE status = 'Pendente' AND (deleted_at IS NULL OR deleted_at = '')"
    ) as { count: number };

    const pendenciasSemanaPassada = await queryRawOne(
      "SELECT COUNT(*)::int as count FROM dossiers WHERE status = 'Pendente' AND created_at < $1 AND (deleted_at IS NULL OR deleted_at = '')",
      semanasPassada.toISOString()
    ) as { count: number };

    const certidoesEmitidas = await queryRawOne(
      "SELECT COUNT(*)::int as count FROM certificates WHERE status = 'Obtida'"
    ) as { count: number };

    const certidoesEmitidasMes = await queryRawOne(
      "SELECT COUNT(*)::int as count FROM certificates WHERE status = 'Obtida' AND obtained_at >= $1",
      inicioMes.toISOString()
    ) as { count: number };

    const certidoesEmitidasMesAnterior = await queryRawOne(
      "SELECT COUNT(*)::int as count FROM certificates WHERE status = 'Obtida' AND obtained_at >= $1 AND obtained_at < $2",
      new Date(inicioMes.getTime() - 30 * 86400000).toISOString(),
      inicioMes.toISOString()
    ) as { count: number };

    const totalCertidoes = await queryRawOne(
      'SELECT COUNT(*)::int as count FROM certificates'
    ) as { count: number };

    const totalCertidoesAnterior = await queryRawOne(
      'SELECT COUNT(*)::int as count FROM certificates WHERE created_at < $1',
      inicioMes.toISOString()
    ) as { count: number };

    const taxaConclusaoAtual = totalCertidoes.count > 0
      ? (certidoesEmitidas.count / totalCertidoes.count) * 100
      : 0;

    const taxaConclusaoAnterior = totalCertidoesAnterior.count > 0
      ? (await queryRawOne(
          "SELECT COUNT(*)::int as count FROM certificates WHERE status = 'Obtida' AND created_at < $1",
          inicioMes.toISOString()
        ) as { count: number }).count / totalCertidoesAnterior.count * 100
      : 0;

    const emissions = await queryRaw(`
      SELECT TO_CHAR(obtained_at::timestamp, 'MM') as mes, COUNT(*)::int as total
      FROM certificates
      WHERE status = 'Obtida' AND obtained_at::timestamp >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(obtained_at::timestamp, 'MM')
      ORDER BY mes
    `) as { mes: string; total: number }[];

    const distribution = await queryRaw(`
      SELECT
        CASE
          WHEN d.status = 'Cancelado' THEN 'Cancelado'
          WHEN d.status = 'Arquivado' THEN 'Cancelado'
          WHEN (SELECT COUNT(*) FROM certificates WHERE dossier_id = d.id AND status = 'Obtida') >= 9
               AND p.cpf IS NOT NULL AND p.cpf != '' THEN 'Concluído'
          ELSE 'Pendente'
        END as label,
        COUNT(*)::int as total
      FROM dossiers d
      LEFT JOIN persons p ON p.id = d.person_id
      WHERE (d.deleted_at IS NULL OR d.deleted_at = '')
      GROUP BY label
    `) as { label: string; total: number }[];

    const totalDossiers = await queryRawOne(
      "SELECT COUNT(*)::int as count FROM dossiers WHERE deleted_at IS NULL OR deleted_at = ''"
    ) as { count: number };

    const certHoje = await queryRawOne(
      "SELECT COUNT(*)::int as count FROM certificates WHERE status = 'Obtida' AND obtained_at::date = CURRENT_DATE"
    ) as { count: number };

    const tempoMedio = await queryRawOne(`
      SELECT COALESCE(AVG(
        EXTRACT(EPOCH FROM (COALESCE(obtained_at::timestamp, NOW()) - created_at::timestamp)) / 60
      ), 0) as avg_minutes FROM certificates
    `) as { avg_minutes: number };

    const taxaSucesso = totalCertidoes.count > 0
      ? (certidoesEmitidas.count / totalCertidoes.count) * 100
      : 0;

    const priorities = await queryRaw(`
      SELECT d.id, d.identifier, d.updated_at,
        (SELECT COUNT(*) FROM certificates WHERE dossier_id = d.id AND status = 'Pendente')::int as pendencias,
        (SELECT COUNT(*) FROM certificates WHERE dossier_id = d.id)::int as total_certs,
        CASE WHEN p.cpf IS NULL OR p.cpf = '' THEN true ELSE false END as missing_cpf
      FROM dossiers d
      LEFT JOIN persons p ON p.id = d.person_id
      WHERE ((SELECT COUNT(*) FROM certificates WHERE dossier_id = d.id AND status = 'Obtida') < 9
        OR p.cpf IS NULL OR p.cpf = '')
        AND (d.deleted_at IS NULL OR d.deleted_at = '')
      ORDER BY pendencias DESC, d.updated_at ASC
      LIMIT 8
    `) as { id: string; identifier: string; updated_at: string; pendencias: number; total_certs: number; missing_cpf: boolean }[];

    const organs = await queryRaw(
      'SELECT name, status FROM organs ORDER BY name'
    ) as { name: string; status: string }[];

    const activities = await queryRaw(`
      SELECT user_name, action, reference, dossier_ref, created_at
      FROM activities
      ORDER BY created_at DESC
      LIMIT 6
    `) as { user_name: string; action: string; reference: string | null; dossier_ref: string | null; created_at: string }[];

    res.json({
      dossiersAndamento: dossiersAndamento.count,
      dossiersAndamentoMesAnterior: dossiersAndamentoMesAnterior.count,
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
        label: d.label,
        total: d.total,
      })),
      resumo: {
        certidoesHoje: certHoje.count,
        certidoesMes: certidoesEmitidasMes.count,
        tempoMedio: Math.round(tempoMedio.avg_minutes / 60 * 10) / 10,
        taxaSucesso: Math.round(taxaSucesso * 10) / 10,
      },
      priorities: priorities.map(p => {
        const motivos: string[] = [];
        if (p.pendencias > 0) motivos.push(`${p.pendencias} certidão${p.pendencias > 1 ? 'ões' : ''} pendente${p.pendencias > 1 ? 's' : ''}`);
        if (p.missing_cpf) motivos.push('CPF não informado');
        if (p.total_certs === 0) motivos.push('Nenhuma certidão solicitada');
        return {
          id: p.id,
          identifier: p.identifier,
          motivo: motivos.join(' · ') || 'Requer atenção',
          pendencias: p.pendencias,
          diasSemAtualizar: Math.floor(
            (Date.now() - new Date(p.updated_at).getTime()) / 86400000
          ),
        };
      }),
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
