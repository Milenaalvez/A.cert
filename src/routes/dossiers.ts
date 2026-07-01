import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import prisma, { queryRaw, queryRawOne, executeRaw } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { gerarDossiePDFFromDB } from '../services/dossie.service.js';

const router = Router();

function validarCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let rem = (sum * 10) % 11;
  if (rem === 10) rem = 0;
  if (rem !== parseInt(digits[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  rem = (sum * 10) % 11;
  if (rem === 10) rem = 0;
  return rem === parseInt(digits[10]);
}

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { transaction_type, status, priority, created_by, observation, property, participants } = req.body;

    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      res.status(400).json({ error: 'Pelo menos um participante é obrigatório.' });
      return;
    }

    const year = new Date().getFullYear();
    const count = await queryRawOne(
      `SELECT COUNT(*) as count FROM dossiers WHERE identifier LIKE $1`,
      `${year}-%`
    );
    const next = String((count.count || 0) + 1).padStart(3, '0');
    const identifier = `${year}-${next}`;
    const dossierId = `doss_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    let propertyId: string | null = null;
    if (property && property.identifier) {
      propertyId = randomUUID();
      await executeRaw(`
        INSERT INTO properties (id, identifier, registration, type, address, neighborhood, city, state, zip_code, cartorio, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      `,
        propertyId,
        property.identifier,
        property.registration || '',
        'Outros',
        property.address || '',
        property.neighborhood || '',
        property.city || '',
        property.state || '',
        property.zipCode || '',
        property.cartorio || '',
        'Regular'
      );
    }

    await executeRaw(`
      INSERT INTO dossiers (id, identifier, person_id, property_id, status, priority, created_by, observation, transaction_type, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
    `,
      dossierId,
      identifier,
      null,
      propertyId,
      status || 'Em andamento',
      priority || 'Regular',
      created_by || 'Sistema',
      observation || '',
      transaction_type || 'venda'
    );

    let firstPersonId: string | null = null;
    for (const p of participants) {
      let personId = p.id;
      const cpfDigits = (p.cpf || '').replace(/\D/g, '');

      if (!personId || personId.startsWith('pre_')) {
        if (cpfDigits.length === 11) {
          const existing = await queryRawOne(`SELECT id FROM persons WHERE cpf = $1`, cpfDigits);
          if (existing) {
            personId = existing.id;
          }
        }
        if (!personId || personId.startsWith('pre_')) {
          personId = randomUUID();
          await executeRaw(`
            INSERT INTO persons (id, name, cpf, birth_date, mother_name, father_name, email, is_pre_cadastro, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 0, NOW())
          `, personId, p.name.trim(), cpfDigits || null, p.birthDate || null, p.motherName || null, p.fatherName || null, p.email || null);
        }
      }

      if (!firstPersonId) firstPersonId = personId;

      await executeRaw(`
        INSERT INTO dossier_participants (dossier_id, person_id, role)
        VALUES ($1, $2, $3) ON CONFLICT (dossier_id, person_id) DO NOTHING
      `, dossierId, personId, p.role || 'proprietario');

      if (propertyId) {
        await executeRaw(`
          INSERT INTO property_owners (id, property_id, person_id, participation)
          VALUES ($1, $2, $3, $4) ON CONFLICT (property_id, person_id) DO NOTHING
        `, randomUUID(), propertyId, personId, 0);
      }
    }

    if (firstPersonId) {
      await executeRaw(`UPDATE dossiers SET person_id = $1 WHERE id = $2`, firstPersonId, dossierId);
    }

    const userRow = await queryRawOne(`SELECT name FROM users WHERE id = $1`, req.user!.userId);
    const userName = userRow?.name || req.user!.email;

    await executeRaw(`
      INSERT INTO activities (id, user_name, action, reference, dossier_ref, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `,
      `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userName,
      participants.length > 1 ? `criou o dossiê com ${participants.length} participantes` : 'criou o dossiê',
      identifier,
      dossierId
    );

    res.json({ id: dossierId, identifier, status: status || 'Em andamento' });
  } catch (error) {
    console.error('[Dossiers] Erro ao criar:', error);
    res.status(500).json({ error: 'Erro ao criar dossiê' });
  }
});

router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 12));
    const search = (req.query.search as string) || '';
    const status = (req.query.status as string) || '';
    const period = (req.query.period as string) || '';
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 0;

    if (status) {
      idx++;
      conditions.push(`d.status = $${idx}`);
      params.push(status);
    }

    if (period === 'hoje') {
      conditions.push("d.updated_at::timestamp >= NOW() - INTERVAL '1 day'");
    } else if (period === 'semana') {
      conditions.push("d.updated_at::timestamp >= NOW() - INTERVAL '7 days'");
    } else if (period === 'mes') {
      conditions.push("d.updated_at::timestamp >= NOW() - INTERVAL '30 days'");
    }

    if (search) {
      const s = `%${search}%`;
      conditions.push(`(d.identifier LIKE $${idx + 1} OR p.name LIKE $${idx + 2} OR prop.address LIKE $${idx + 3})`);
      params.push(s, s, s);
      idx += 3;
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const countResult = await queryRawOne(`
      SELECT COUNT(*) as count FROM dossiers d
      LEFT JOIN persons p ON p.id = d.person_id
      LEFT JOIN properties prop ON prop.id = d.property_id
      ${where}
    `, ...params);

    const total = countResult.count;
    const totalPages = Math.ceil(total / limit) || 1;

    const limitIdx = params.length + 1;
    const offsetIdx = params.length + 2;

    const dossiers = await queryRaw(`
      SELECT d.id, d.identifier, d.status, d.priority, d.created_by, d.created_at, d.updated_at, d.observation,
             p.id as person_id, p.name as person_name, p.cpf as person_cpf,
             prop.identifier as property_identifier, prop.type as property_type, prop.address as property_address
      FROM dossiers d
      LEFT JOIN persons p ON p.id = d.person_id
      LEFT JOIN properties prop ON prop.id = d.property_id
      ${where}
      ORDER BY d.updated_at DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `, ...params, limit, offset);

    const enriched = await Promise.all(dossiers.map(async (d: any) => {
      const certStats: { total: number; obtidas: number; pendentes: number } = await queryRawOne(`
        SELECT
          COUNT(*) as total,
          COALESCE(SUM(CASE WHEN status = 'Obtida' THEN 1 ELSE 0 END), 0) as obtidas,
          COALESCE(SUM(CASE WHEN status = 'Pendente' THEN 1 ELSE 0 END), 0) as pendentes
        FROM certificates WHERE dossier_id = $1
      `, d.id);

      const personComplete = d.person_cpf && d.person_cpf.length > 0;
      const allCertsObtained = certStats.obtidas >= 9;
      const derivedStatus = allCertsObtained && personComplete ? 'Concluído' : 'Pendente';

      const activityCount: { count: number } = await queryRawOne(
        `SELECT COUNT(*) as count FROM activities WHERE dossier_ref = $1`, d.id
      );

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
    }));

    const statsRow = await queryRawOne(`
      SELECT
        (SELECT COUNT(*) FROM dossiers) as total,
        (SELECT COUNT(*) FROM dossiers WHERE created_at::timestamp >= NOW() - INTERVAL '30 days') as total_mes
    `);

    const mesAnterior = await queryRawOne(
      `SELECT COUNT(*) as count FROM dossiers WHERE created_at::timestamp < NOW() - INTERVAL '30 days' AND created_at::timestamp >= NOW() - INTERVAL '60 days'`
    );

    const pendentes = enriched.filter(d => d.status === 'Pendente').length;
    const concluidos = enriched.filter(d => d.status === 'Concluído').length;
    const cancelados = enriched.filter(d => d.status === 'Cancelado').length;

    const attentionItems = await queryRaw(`
      SELECT d.id, d.identifier, d.created_by as responsible, d.updated_at,
             (SELECT COUNT(*) FROM certificates WHERE dossier_id = d.id AND status = 'Pendente') as pendencias
      FROM dossiers d
      LEFT JOIN persons p ON p.id = d.person_id
      WHERE (SELECT COUNT(*) FROM certificates WHERE dossier_id = d.id AND status = 'Obtida') < 9
         OR p.cpf IS NULL OR p.cpf = ''
      ORDER BY pendencias DESC, d.updated_at ASC
      LIMIT 5
    `);

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

    const activities = await queryRaw(`
      SELECT a.user_name, a.action, a.reference, a.dossier_ref, a.created_at,
             d.identifier as dossier_identifier
      FROM activities a
      LEFT JOIN dossiers d ON d.id = a.dossier_ref
      ORDER BY a.created_at DESC
      LIMIT 8
    `);

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
router.get('/:id/certificates', async (_req, res) => {
  try {
    const { id } = _req.params;
    const templates = await queryRaw(`SELECT * FROM certificate_templates ORDER BY ordem ASC`);
    const dossierCerts = await queryRaw(`SELECT name as key, status, obtained_at FROM certificates WHERE dossier_id = $1`, id);
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
router.post('/:id/certificates/ingest', authMiddleware, async (_req, res) => {
  try {
    const { id } = _req.params;
    const { cert_key } = _req.body;
    if (!cert_key) { res.status(400).json({ error: 'cert_key é obrigatório' }); return; }
    const template = await queryRawOne(`SELECT * FROM certificate_templates WHERE key = $1`, cert_key);
    if (!template) { res.status(404).json({ error: 'Template não encontrado' }); return; }
    const existing = await queryRawOne(`SELECT id FROM certificates WHERE dossier_id = $1 AND name = $2`, id, template.label);
    const now = new Date().toISOString();
    if (existing) {
      await executeRaw(`UPDATE certificates SET status = 'Obtida', obtained_at = $1, updated_at = $2 WHERE id = $3`, now, now, existing.id);
    } else {
      const certId = `cert_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      await executeRaw(`INSERT INTO certificates (id, dossier_id, name, organ, status, protocol, obtained_at, created_at) VALUES ($1, $2, $3, $4, 'Obtida', $5, $6, $7)`, certId, id, template.label, template.requires_orgao || 'Sistema', `AUTO-${Date.now()}`, now, now);
    }
    await executeRaw(`UPDATE dossiers SET updated_at = NOW() WHERE id = $1`, id);
    const userRow = await queryRawOne(`SELECT name FROM users WHERE id = $1`, _req.user!.userId);
    await executeRaw(`INSERT INTO activities (id, user_name, action, reference, dossier_ref, created_at) VALUES ($1, $2, $3, $4, $5, NOW())`, `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, userRow?.name || _req.user!.email, `obteve certidão: ${template.label}`, template.label, id);
    res.json({ success: true, cert_key, status: 'Obtida', obtained_at: now });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao processar certidão' });
  }
});

router.get('/:id', async (_req, res) => {
  try {
    const { id } = _req.params;
    const dossier = await queryRawOne(`
      SELECT d.id, d.identifier, d.status, d.priority, d.created_by, d.created_at, d.updated_at, d.observation,
             d.transaction_type,
             p.id as person_id, p.name as person_name, p.cpf as person_cpf, p.rg as person_rg,
             p.mother_name as person_mother_name, p.father_name as person_father_name, p.email as person_email,
             prop.identifier as property_identifier, prop.type as property_type, prop.address as property_address,
             prop.registration as property_registration,
             prop.cartorio as property_cartorio
      FROM dossiers d
      LEFT JOIN persons p ON p.id = d.person_id
      LEFT JOIN properties prop ON prop.id = d.property_id
      WHERE d.id = $1
    `, id);

    if (!dossier) {
      res.status(404).json({ error: 'Dossiê não encontrado' });
      return;
    }

    const certStats = await queryRawOne(`
      SELECT
        COUNT(*) as total,
        COALESCE(SUM(CASE WHEN status = 'Obtida' THEN 1 ELSE 0 END), 0) as obtidas,
        COALESCE(SUM(CASE WHEN status = 'Pendente' THEN 1 ELSE 0 END), 0) as pendentes
      FROM certificates WHERE dossier_id = $1
    `, id);

    const personComplete = dossier.person_cpf && dossier.person_cpf.length > 0;
    const allCertsObtained = certStats.obtidas >= 9;
    const derivedStatus = allCertsObtained && personComplete ? 'Concluído' : 'Pendente';

    const certificates = await queryRaw(`
      SELECT c.id, c.name, c.organ, c.status, c.protocol, c.obtained_at, c.created_at, c.document_path
      FROM certificates c WHERE c.dossier_id = $1 ORDER BY c.created_at DESC
    `, id);

    const activities = await queryRaw(`
      SELECT a.user_name, a.action, a.reference, a.created_at
      FROM activities a WHERE a.dossier_ref = $1 ORDER BY a.created_at DESC LIMIT 20
    `, id);

    const personProperties = dossier.person_id ? await queryRaw(`
      SELECT p.id, p.identifier, p.registration, p.type, p.address, p.neighborhood, p.city, p.status
      FROM properties p
      JOIN property_owners po ON po.property_id = p.id
      WHERE po.person_id = $1 AND (p.deleted_at IS NULL OR p.deleted_at = '')
      ORDER BY p.created_at DESC
    `, dossier.person_id) : [];

    const participants = await queryRaw(`
      SELECT dp.role, p.id, p.name, p.cpf, p.rg, p.birth_date, p.mother_name, p.father_name, p.email,
             (SELECT COUNT(*) FROM certificates c WHERE c.dossier_id = $1 AND c.person_id = p.id) as cert_total,
             (SELECT COUNT(*) FROM certificates c WHERE c.dossier_id = $2 AND c.person_id = p.id AND c.status = 'Obtida') as cert_obtidas
      FROM dossier_participants dp
      JOIN persons p ON p.id = dp.person_id
      WHERE dp.dossier_id = $3
      ORDER BY dp.role = 'proprietario' DESC, p.name ASC
    `, id, id, id);

    res.json({
      id: dossier.id,
      identifier: dossier.identifier,
      status: derivedStatus,
      priority: dossier.priority,
      responsible: dossier.created_by || 'Não atribuído',
      observation: dossier.observation || '',
      transactionType: dossier.transaction_type || 'venda',
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
        cartorio: dossier.property_cartorio,
      } : null,
      personProperties,
      participants: participants.map(p => ({
        id: p.id,
        name: p.name,
        cpf: p.cpf,
        rg: p.rg,
        birthDate: p.birth_date,
        motherName: p.mother_name,
        fatherName: p.father_name,
        email: p.email,
        role: p.role,
        certTotal: p.cert_total,
        certObtidas: p.cert_obtidas,
      })),
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

router.post('/merge', authMiddleware, async (req, res) => {
  try {
    const { person_ids } = req.body;
    if (!person_ids || person_ids.length < 2) {
      res.status(400).json({ error: 'É necessário informar pelo menos 2 pessoas' });
      return;
    }

    const [primaryId, ...secondaryIds] = person_ids;

    const primaryDossier = await queryRawOne(`
      SELECT id, identifier, observation FROM dossiers WHERE person_id = $1 ORDER BY created_at DESC LIMIT 1
    `, primaryId);

    if (!primaryDossier) {
      res.status(400).json({ error: 'Dossiê não encontrado para a pessoa principal' });
      return;
    }

    const mergedObservations: string[] = [];
    if (primaryDossier.observation) mergedObservations.push(primaryDossier.observation);

    for (const secId of secondaryIds) {
      const secDossier = await queryRawOne(`
        SELECT id, observation FROM dossiers WHERE person_id = $1 ORDER BY created_at DESC LIMIT 1
      `, secId);

      if (!secDossier) continue;

      if (secDossier.observation) mergedObservations.push(secDossier.observation);

      // Move certificates from secondary to primary
      await executeRaw(`UPDATE certificates SET dossier_id = $1 WHERE dossier_id = $2`,
        primaryDossier.id, secDossier.id);

      // Delete secondary dossier
      await executeRaw(`DELETE FROM dossiers WHERE id = $1`, secDossier.id);
    }

    const newObservation = mergedObservations.length > 0
      ? mergedObservations.join(' | ')
      : 'Dossiê conjunto';

    await executeRaw(`UPDATE dossiers SET observation = $1, updated_at = NOW() WHERE id = $2`,
      newObservation, primaryDossier.id);

    const userRow = await queryRawOne(`SELECT name FROM users WHERE id = $1`, req.user!.userId);
    const userName = userRow?.name || req.user!.email;

    await executeRaw(`
      INSERT INTO activities (id, user_name, action, reference, dossier_ref, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `,
      `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userName,
      'criou dossiê conjunto',
      primaryDossier.identifier,
      primaryDossier.id
    );

    res.json({ success: true, primary_dossier_id: primaryDossier.id, identifier: primaryDossier.identifier });
  } catch (error) {
    console.error('[Dossiers Merge] Erro:', error);
    res.status(500).json({ error: 'Erro ao mesclar dossiês' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, responsible, observation } = req.body;

    const dossier = await queryRawOne(`SELECT * FROM dossiers WHERE id = $1`, id);
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

    await executeRaw(`
      UPDATE dossiers SET status = $1, priority = $2, created_by = $3, observation = $4, updated_at = NOW()
      WHERE id = $5
    `, newStatus, newPriority, newResponsible, newObservation, id);

    const userRow = await queryRawOne(`SELECT name FROM users WHERE id = $1`, req.user!.userId);
    const userName = userRow?.name || req.user!.email;

    const actionText = changes.length > 0
      ? `editou o dossiê: ${changes.join('; ')}`
      : 'editou o dossiê';

    await executeRaw(`
      INSERT INTO activities (id, user_name, action, reference, dossier_ref, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `,
      `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userName,
      actionText,
      dossier.identifier,
      id
    );

    const updated = await queryRawOne(`
      SELECT d.id, d.identifier, d.status, d.priority, d.created_by, d.created_at, d.updated_at, d.observation,
             p.id as person_id, p.name as person_name, p.cpf as person_cpf,
             prop.identifier as property_identifier, prop.type as property_type, prop.address as property_address
      FROM dossiers d
      LEFT JOIN persons p ON p.id = d.person_id
      LEFT JOIN properties prop ON prop.id = d.property_id
      WHERE d.id = $1
    `, id);

    const certStats = await queryRawOne(`
      SELECT
        COUNT(*) as total,
        COALESCE(SUM(CASE WHEN status = 'Obtida' THEN 1 ELSE 0 END), 0) as obtidas,
        COALESCE(SUM(CASE WHEN status = 'Pendente' THEN 1 ELSE 0 END), 0) as pendentes
      FROM certificates WHERE dossier_id = $1
    `, id);

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

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await queryRawOne(`SELECT id FROM dossiers WHERE id = $1`, id);
    if (!existing) {
      res.status(404).json({ error: 'Dossiê não encontrado' });
      return;
    }
    await executeRaw(`UPDATE dossiers SET deleted_at = NOW() WHERE id = $1`, id);
    res.json({ success: true });
  } catch (error) {
    console.error('[Dossiers Delete] Erro:', error);
    res.status(500).json({ error: 'Erro ao mover dossiê para lixeira' });
  }
});

router.post('/:id/generate', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const dossier = await queryRawOne(`
      SELECT d.id, d.identifier, d.status, d.priority, d.created_by, d.created_at, d.updated_at, d.observation,
             d.transaction_type,
             p.id as person_id, p.name as person_name, p.cpf as person_cpf, p.rg as person_rg,
             p.mother_name as person_mother_name, p.father_name as person_father_name, p.email as person_email,
             prop.identifier as property_identifier, prop.type as property_type, prop.address as property_address,
             prop.registration as property_registration, prop.cartorio as property_cartorio
      FROM dossiers d
      LEFT JOIN persons p ON p.id = d.person_id
      LEFT JOIN properties prop ON prop.id = d.property_id
      WHERE d.id = $1
    `, id);

    if (!dossier) {
      res.status(404).json({ error: 'Dossiê não encontrado' });
      return;
    }

    const certStats = await queryRawOne(`
      SELECT COUNT(*) as total,
        COALESCE(SUM(CASE WHEN status = 'Obtida' THEN 1 ELSE 0 END), 0) as obtidas,
        COALESCE(SUM(CASE WHEN status = 'Pendente' THEN 1 ELSE 0 END), 0) as pendentes
      FROM certificates WHERE dossier_id = $1
    `, id);

    const certificates = await queryRaw(`
      SELECT c.id, c.name, c.organ, c.status, c.protocol, c.obtained_at, c.created_at, c.person_id, c.document_path
      FROM certificates c WHERE c.dossier_id = $1 ORDER BY c.created_at DESC
    `, id);

    const personComplete = dossier.person_cpf && dossier.person_cpf.length > 0;
    const allCertsObtained = certStats.obtidas >= 9;
    const derivedStatus = allCertsObtained && personComplete ? 'Concluído' : 'Pendente';

    const participants = await queryRaw(`
      SELECT dp.role, p.id, p.name, p.cpf,
             (SELECT COUNT(*) FROM certificates c WHERE c.dossier_id = $1 AND c.person_id = p.id) as cert_total,
             (SELECT COUNT(*) FROM certificates c WHERE c.dossier_id = $2 AND c.person_id = p.id AND c.status = 'Obtida') as cert_obtidas
      FROM dossier_participants dp
      JOIN persons p ON p.id = dp.person_id
      WHERE dp.dossier_id = $3
      ORDER BY dp.role = 'proprietario' DESC, p.name ASC
    `, id, id, id);

    const payload = {
      identifier: dossier.identifier,
      status: derivedStatus,
      priority: dossier.priority || 'Regular',
      responsible: dossier.created_by || 'Não atribuído',
      transactionType: dossier.transaction_type || 'venda',
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
        cartorio: dossier.property_cartorio,
      } : null,
      certificateCount: certStats.total,
      certificatesObtidas: certStats.obtidas,
      certificatesPendentes: certStats.pendentes,
      progress: certStats.total > 0 ? Math.round((certStats.obtidas / certStats.total) * 100) : 0,
      certificates,
      participants: participants.map(p => ({
        id: p.id, name: p.name, cpf: p.cpf, role: p.role,
        certTotal: p.cert_total, certObtidas: p.cert_obtidas,
      })),
    };

    const pdfBuffer = await gerarDossiePDFFromDB(payload);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="dossie_${dossier.identifier.toLowerCase().replace(/[^a-z0-9]/g, '_')}.pdf"`);
    res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    console.error('[Dossiers Generate] Erro:', error);
    res.status(500).json({ error: 'Erro ao gerar dossiê' });
  }
});

router.put('/:id/link-property', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { property_id } = req.body;

    if (!property_id) {
      res.status(400).json({ error: 'property_id é obrigatório' });
      return;
    }

    const dossier = await queryRawOne(`SELECT id, identifier, person_id FROM dossiers WHERE id = $1`, id);
    if (!dossier) {
      res.status(404).json({ error: 'Dossiê não encontrado' });
      return;
    }

    const property = await queryRawOne(`SELECT id, identifier FROM properties WHERE id = $1`, property_id);
    if (!property) {
      res.status(404).json({ error: 'Imóvel não encontrado' });
      return;
    }

    await executeRaw(`UPDATE dossiers SET property_id = $1, updated_at = NOW() WHERE id = $2`, property_id, id);

    const userName = (req as any).user?.name || 'Sistema';
    await executeRaw(`
      INSERT INTO activities (id, user_name, action, reference, dossier_ref, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `,
      `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userName,
      `Vinculou o imóvel ${property.identifier} ao dossiê`,
      dossier.identifier,
      id
    );

    res.json({ success: true, property_id });
  } catch (error) {
    console.error('[Dossiers Link Property] Erro:', error);
    res.status(500).json({ error: 'Erro ao vincular imóvel' });
  }
});

router.delete('/:id/link-property', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const dossier = await queryRawOne(`SELECT id, identifier FROM dossiers WHERE id = $1`, id);
    if (!dossier) {
      res.status(404).json({ error: 'Dossiê não encontrado' });
      return;
    }

    await executeRaw(`UPDATE dossiers SET property_id = NULL, updated_at = NOW() WHERE id = $1`, id);

    const userName = (req as any).user?.name || 'Sistema';
    await executeRaw(`
      INSERT INTO activities (id, user_name, action, reference, dossier_ref, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `,
      `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userName,
      'Removeu o vínculo do imóvel do dossiê',
      dossier.identifier,
      id
    );

    res.json({ success: true });
  } catch (error) {
    console.error('[Dossiers Unlink Property] Erro:', error);
    res.status(500).json({ error: 'Erro ao desvincular imóvel' });
  }
});

export default router;
