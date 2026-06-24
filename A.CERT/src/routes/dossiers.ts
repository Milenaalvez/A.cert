import { Router } from 'express';
import db from '../database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/', authMiddleware, (req, res) => {
  try {
    const { person_id, property_id, status, priority, created_by, observation } = req.body;

    if (!person_id || !created_by) {
      res.status(400).json({ error: 'Cliente e responsável são obrigatórios.' });
      return;
    }

    const year = new Date().getFullYear();
    const count = db.prepare(
      "SELECT COUNT(*) as count FROM dossiers WHERE identifier LIKE ?"
    ).get(`${year}-%`) as { count: number };
    const next = String((count.count || 0) + 1).padStart(3, '0');
    const identifier = `${year}-${next}`;

    const id = `doss_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    db.prepare(`
      INSERT INTO dossiers (id, identifier, person_id, property_id, status, priority, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(
      id,
      identifier,
      person_id,
      property_id || null,
      status || 'Em andamento',
      priority || 'Regular',
      created_by
    );

    const userRow = db.prepare('SELECT name FROM users WHERE id = ?').get(req.user!.userId) as { name: string } | undefined;
    const userName = userRow?.name || req.user!.email;

    db.prepare(`
      INSERT INTO activities (id, user_name, action, reference, dossier_ref, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).run(
      `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userName,
      'criou o dossiê',
      identifier,
      id
    );

    res.json({ id, identifier, status: status || 'Em andamento' });
  } catch (error) {
    console.error('[Dossiers] Erro ao criar:', error);
    res.status(500).json({ error: 'Erro ao criar dossiê' });
  }
});

router.get('/', (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 12));
    const search = (req.query.search as string) || '';
    const status = (req.query.status as string) || '';
    const period = (req.query.period as string) || '';
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: any[] = [];

    if (status) {
      conditions.push('d.status = ?');
      params.push(status);
    }

    if (period === 'hoje') {
      conditions.push("d.updated_at >= datetime('now', '-1 day')");
    } else if (period === 'semana') {
      conditions.push("d.updated_at >= datetime('now', '-7 days')");
    } else if (period === 'mes') {
      conditions.push("d.updated_at >= datetime('now', '-30 days')");
    }

    if (search) {
      conditions.push('(d.identifier LIKE ? OR p.name LIKE ? OR prop.address LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const countResult = db.prepare(`
      SELECT COUNT(*) as count FROM dossiers d
      LEFT JOIN persons p ON p.id = d.person_id
      LEFT JOIN properties prop ON prop.id = d.property_id
      ${where}
    `).get(...params) as { count: number };

    const total = countResult.count;
    const totalPages = Math.ceil(total / limit) || 1;

    const dossiers = db.prepare(`
      SELECT d.id, d.identifier, d.status, d.priority, d.created_by, d.created_at, d.updated_at, d.observation,
             p.id as person_id, p.name as person_name, p.cpf as person_cpf,
             prop.identifier as property_identifier, prop.type as property_type, prop.address as property_address
      FROM dossiers d
      LEFT JOIN persons p ON p.id = d.person_id
      LEFT JOIN properties prop ON prop.id = d.property_id
      ${where}
      ORDER BY d.updated_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset) as any[];

    const enriched = dossiers.map((d) => {
      const certStats = db.prepare(`
        SELECT
          COUNT(*) as total,
          COALESCE(SUM(CASE WHEN status = 'Obtida' THEN 1 ELSE 0 END), 0) as obtidas,
          COALESCE(SUM(CASE WHEN status = 'Pendente' THEN 1 ELSE 0 END), 0) as pendentes
        FROM certificates WHERE dossier_id = ?
      `).get(d.id) as { total: number; obtidas: number; pendentes: number };

      const personComplete = d.person_cpf && d.person_cpf.length > 0;
      const allCertsObtained = certStats.obtidas >= 9;
      const derivedStatus = allCertsObtained && personComplete ? 'Concluído' : 'Pendente';

      const activityCount = db.prepare(
        "SELECT COUNT(*) as count FROM activities WHERE dossier_ref = ?"
      ).get(d.id) as { count: number };

      return {
        id: d.id,
        identifier: d.identifier,
        status: derivedStatus,
        priority: d.priority,
        responsible: d.created_by || 'Não atribuído',
        observation: d.observation || '',
        createdAt: d.created_at,
        updatedAt: d.updated_at,
        person: {
          id: d.person_id,
          name: d.person_name,
          cpf: d.person_cpf,
        },
        property: d.property_identifier ? {
          identifier: d.property_identifier,
          type: d.property_type,
          address: d.property_address,
        } : null,
        certificateCount: certStats.total,
        certificatesObtidas: certStats.obtidas,
        certificatesPendentes: certStats.pendentes,
        progress: certStats.total > 0 ? Math.round((certStats.obtidas / certStats.total) * 100) : 0,
        commentsCount: activityCount.count,
      };
    });

    const statsRow = db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM dossiers) as total,
        (SELECT COUNT(*) FROM dossiers WHERE created_at >= datetime('now', '-30 days')) as total_mes
    `).get() as any;

    const mesAnterior = db.prepare(
      "SELECT COUNT(*) as count FROM dossiers WHERE created_at < datetime('now', '-30 days') AND created_at >= datetime('now', '-60 days')"
    ).get() as { count: number };

    const pendentes = enriched.filter(d => d.status === 'Pendente').length;
    const concluidos = enriched.filter(d => d.status === 'Concluído').length;
    const cancelados = enriched.filter(d => d.status === 'Cancelado').length;

    const attentionItems = db.prepare(`
      SELECT d.id, d.identifier, d.created_by as responsible, d.updated_at,
             (SELECT COUNT(*) FROM certificates WHERE dossier_id = d.id AND status = 'Pendente') as pendencias
      FROM dossiers d
      LEFT JOIN persons p ON p.id = d.person_id
      WHERE (SELECT COUNT(*) FROM certificates WHERE dossier_id = d.id AND status = 'Obtida') < 9
         OR p.cpf IS NULL OR p.cpf = ''
      ORDER BY pendencias DESC, d.updated_at ASC
      LIMIT 5
    `).all() as any[];

    const attentionWithMotives = attentionItems.map((a) => {
      const motives: string[] = [];
      if (a.pendencias > 0) motives.push(`${a.pendencias} pendência${a.pendencias > 1 ? 's' : ''}`);
      const dias = Math.floor((Date.now() - new Date(a.updated_at).getTime()) / 86400000);
      if (dias > 1) motives.push(`Prazo em ${Math.max(1, 5 - dias)} dias`);
      if (a.pendencias > 0) motives.push('Aguardando documentos');
      return {
        id: a.id,
        identifier: a.identifier,
        responsible: a.responsible || 'Não atribuído',
        status: 'Pendente',
        motives,
        mainMotive: motives[0] || 'Requer atenção',
      };
    });

    const activities = db.prepare(`
      SELECT a.user_name, a.action, a.reference, a.dossier_ref, a.created_at,
             d.identifier as dossier_identifier
      FROM activities a
      LEFT JOIN dossiers d ON d.id = a.dossier_ref
      ORDER BY a.created_at DESC
      LIMIT 8
    `).all() as any[];

    res.json({
      dossiers: enriched,
      stats: {
        total: statsRow.total,
        totalMes: statsRow.total_mes,
        em_andamento: 0,
        aguardando_pendencias: pendentes,
        concluidos: concluidos,
        cancelados: cancelados,
        crescimento: mesAnterior.count > 0
          ? Math.round(((statsRow.total - mesAnterior.count) / mesAnterior.count) * 100)
          : statsRow.total > 0 ? 100 : 0,
      },
      pagination: { page, limit, total, totalPages },
      attentionItems: attentionWithMotives,
      activities: activities.map((a) => ({
        user: a.user_name,
        action: a.action,
        reference: a.reference,
        dossierRef: a.dossier_identifier || a.dossier_ref,
        createdAt: a.created_at,
      })),
    });
  } catch (error) {
    console.error('[Dossiers] Erro:', error);
    res.status(500).json({ error: 'Erro ao carregar dossiês' });
  }
});

// GET /api/dossiers/:id/certificates — list templates with status
router.get('/:id/certificates', (_req, res) => {
  try {
    const { id } = _req.params;
    const templates = db.prepare(`SELECT * FROM certificate_templates ORDER BY ordem ASC`).all() as any[];
    const dossierCerts = db.prepare(`SELECT name as key, status, obtained_at FROM certificates WHERE dossier_id = ?`).all(id) as any[];
    const certMap = new Map(dossierCerts.map((c: any) => [c.key, c]));
    const result = templates.map((t: any) => {
      const existing = certMap.get(t.key);
      return { ...t, status: existing?.status || 'Pendente', obtained_at: existing?.obtained_at || null };
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar certidões' });
  }
});

// POST /api/dossiers/:id/certificates/ingest
router.post('/:id/certificates/ingest', authMiddleware, (_req, res) => {
  try {
    const { id } = _req.params;
    const { cert_key } = _req.body;
    if (!cert_key) { res.status(400).json({ error: 'cert_key é obrigatório' }); return; }
    const template = db.prepare("SELECT * FROM certificate_templates WHERE key = ?").get(cert_key) as any;
    if (!template) { res.status(404).json({ error: 'Template não encontrado' }); return; }
    const existing = db.prepare("SELECT id FROM certificates WHERE dossier_id = ? AND name = ?").get(id, template.label) as any;
    const now = new Date().toISOString();
    if (existing) {
      db.prepare("UPDATE certificates SET status = 'Obtida', obtained_at = ?, updated_at = ? WHERE id = ?").run(now, now, existing.id);
    } else {
      const certId = `cert_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      db.prepare("INSERT INTO certificates (id, dossier_id, name, organ, status, protocol, obtained_at, created_at) VALUES (?, ?, ?, ?, 'Obtida', ?, ?, ?)").run(certId, id, template.label, template.requires_orgao || 'Sistema', `AUTO-${Date.now()}`, now, now);
    }
    db.prepare("UPDATE dossiers SET updated_at = datetime('now') WHERE id = ?").run(id);
    const userRow = db.prepare('SELECT name FROM users WHERE id = ?').get(_req.user!.userId) as { name: string } | undefined;
    db.prepare("INSERT INTO activities (id, user_name, action, reference, dossier_ref, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))").run(`act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, userRow?.name || _req.user!.email, `obteve certidão: ${template.label}`, template.label, id);
    res.json({ success: true, cert_key, status: 'Obtida', obtained_at: now });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao processar certidão' });
  }
});

router.get('/:id', (_req, res) => {
  try {
    const { id } = _req.params;
    const dossier = db.prepare(`
      SELECT d.id, d.identifier, d.status, d.priority, d.created_by, d.created_at, d.updated_at, d.observation,
             p.id as person_id, p.name as person_name, p.cpf as person_cpf, p.rg as person_rg,
             p.mother_name as person_mother_name, p.father_name as person_father_name, p.email as person_email,
             prop.identifier as property_identifier, prop.type as property_type, prop.address as property_address,
             prop.registration as property_registration
      FROM dossiers d
      LEFT JOIN persons p ON p.id = d.person_id
      LEFT JOIN properties prop ON prop.id = d.property_id
      WHERE d.id = ?
    `).get(id) as any;

    if (!dossier) {
      res.status(404).json({ error: 'Dossiê não encontrado' });
      return;
    }

    const certStats = db.prepare(`
      SELECT
        COUNT(*) as total,
        COALESCE(SUM(CASE WHEN status = 'Obtida' THEN 1 ELSE 0 END), 0) as obtidas,
        COALESCE(SUM(CASE WHEN status = 'Pendente' THEN 1 ELSE 0 END), 0) as pendentes
      FROM certificates WHERE dossier_id = ?
    `).get(id) as { total: number; obtidas: number; pendentes: number };

    const personComplete = dossier.person_cpf && dossier.person_cpf.length > 0;
    const allCertsObtained = certStats.obtidas >= 9;
    const derivedStatus = allCertsObtained && personComplete ? 'Concluído' : 'Pendente';

    const certificates = db.prepare(`
      SELECT c.id, c.name, c.organ, c.status, c.protocol, c.obtained_at, c.created_at
      FROM certificates c WHERE c.dossier_id = ? ORDER BY c.created_at DESC
    `).all(id) as any[];

    const activities = db.prepare(`
      SELECT a.user_name, a.action, a.reference, a.created_at
      FROM activities a WHERE a.dossier_ref = ? ORDER BY a.created_at DESC LIMIT 20
    `).all(id) as any[];

    res.json({
      id: dossier.id,
      identifier: dossier.identifier,
      status: derivedStatus,
      priority: dossier.priority,
      responsible: dossier.created_by || 'Não atribuído',
      observation: dossier.observation || '',
      createdAt: dossier.created_at,
      updatedAt: dossier.updated_at,
      person: dossier.person_id ? {
        id: dossier.person_id,
        name: dossier.person_name,
        cpf: dossier.person_cpf,
        rg: dossier.person_rg,
        mother_name: dossier.person_mother_name || '',
        father_name: dossier.person_father_name || '',
        email: dossier.person_email || '',
      } : null,
      property: dossier.property_identifier ? {
        identifier: dossier.property_identifier,
        type: dossier.property_type,
        address: dossier.property_address,
        registration: dossier.property_registration,
      } : null,
      certificateCount: certStats.total,
      certificatesObtidas: certStats.obtidas,
      certificatesPendentes: certStats.pendentes,
      progress: certStats.total > 0 ? Math.round((certStats.obtidas / certStats.total) * 100) : 0,
      certificates,
      activities,
    });
  } catch (error) {
    console.error('[Dossier] Erro ao carregar:', error);
    res.status(500).json({ error: 'Erro ao carregar dossiê' });
  }
});

router.put('/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, responsible, observation } = req.body;

    const dossier = db.prepare('SELECT * FROM dossiers WHERE id = ?').get(id) as any;
    if (!dossier) {
      res.status(404).json({ error: 'Dossiê não encontrado' });
      return;
    }

    const changes: string[] = [];

    if (status !== undefined && status !== dossier.status) {
      changes.push(`status de "${dossier.status}" para "${status}"`);
    }
    if (priority !== undefined && priority !== dossier.priority) {
      changes.push(`prioridade de "${dossier.priority}" para "${priority}"`);
    }
    if (responsible !== undefined && responsible !== (dossier.created_by || '')) {
      changes.push(`responsável de "${dossier.created_by || 'Não atribuído'}" para "${responsible}"`);
    }
    if (observation !== undefined && observation !== (dossier.observation || '')) {
      changes.push('observação atualizada');
    }

    const newStatus = status !== undefined ? status : dossier.status;
    const newPriority = priority !== undefined ? priority : dossier.priority;
    const newResponsible = responsible !== undefined ? responsible : dossier.created_by;
    const newObservation = observation !== undefined ? observation : dossier.observation;

    db.prepare(`
      UPDATE dossiers SET status = ?, priority = ?, created_by = ?, observation = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(newStatus, newPriority, newResponsible, newObservation, id);

    const userRow = db.prepare('SELECT name FROM users WHERE id = ?').get(req.user!.userId) as { name: string } | undefined;
    const userName = userRow?.name || req.user!.email;

    const actionText = changes.length > 0
      ? `editou o dossiê: ${changes.join('; ')}`
      : 'editou o dossiê';

    db.prepare(`
      INSERT INTO activities (id, user_name, action, reference, dossier_ref, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).run(
      `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userName,
      actionText,
      dossier.identifier,
      id
    );

    const updated = db.prepare(`
      SELECT d.id, d.identifier, d.status, d.priority, d.created_by, d.created_at, d.updated_at, d.observation,
             p.id as person_id, p.name as person_name, p.cpf as person_cpf,
             prop.identifier as property_identifier, prop.type as property_type, prop.address as property_address
      FROM dossiers d
      LEFT JOIN persons p ON p.id = d.person_id
      LEFT JOIN properties prop ON prop.id = d.property_id
      WHERE d.id = ?
    `).get(id) as any;

    const certStats = db.prepare(`
      SELECT
        COUNT(*) as total,
        COALESCE(SUM(CASE WHEN status = 'Obtida' THEN 1 ELSE 0 END), 0) as obtidas,
        COALESCE(SUM(CASE WHEN status = 'Pendente' THEN 1 ELSE 0 END), 0) as pendentes
      FROM certificates WHERE dossier_id = ?
    `).get(id) as { total: number; obtidas: number; pendentes: number };

    res.json({
      id: updated.id,
      identifier: updated.identifier,
      status: updated.status,
      priority: updated.priority,
      responsible: updated.created_by || 'Não atribuído',
      observation: updated.observation || '',
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
      person: {
        id: updated.person_id,
        name: updated.person_name,
        cpf: updated.person_cpf,
      },
      property: updated.property_identifier ? {
        identifier: updated.property_identifier,
        type: updated.property_type,
        address: updated.property_address,
      } : null,
      certificateCount: certStats.total,
      certificatesObtidas: certStats.obtidas,
      certificatesPendentes: certStats.pendentes,
      progress: certStats.total > 0 ? Math.round((certStats.obtidas / certStats.total) * 100) : 0,
    });

  } catch (error) {
    console.error('[Dossiers] Erro ao atualizar:', error);
    res.status(500).json({ error: 'Erro ao atualizar dossiê' });
  }
});

export default router;
