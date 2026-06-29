import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import prisma, { queryRaw, queryRawOne, executeRaw } from '../lib/prisma.js';
import { iniciarJob, getJob } from '../services/orquestrador.service.js';
import { validarCPF, validarCNPJ, validarEmail, validarTelefone, validarCEP } from '../utils/validation.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { type, includeArchived, q } = req.query;
    const showArchived = includeArchived === 'true';

    let whereParts: string[] = [];
    let params: any[] = [];

    if (!showArchived) {
      whereParts.push('p.archived_at IS NULL');
    }
    if (type === 'fisica') {
      whereParts.push('p.cpf IS NOT NULL');
    } else if (type === 'empresarial') {
      whereParts.push('p.cnpj IS NOT NULL');
    }
    if (q && typeof q === 'string' && q.trim()) {
      const idx = params.length + 1;
      whereParts.push(`(p.name LIKE $${idx} OR p.cpf LIKE $${idx + 1} OR p.cnpj LIKE $${idx + 2} OR p.email LIKE $${idx + 3})`);
      const like = `%${q.trim()}%`;
      params.push(like, like, like, like);
    }

    const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';

    const people = await queryRaw(`
      SELECT
        p.id, p.name, p.cpf, p.cnpj, p.email, p.phone, p.cell_phone,
        p.city, p.state, p.created_at, p.is_pre_cadastro, p.archived_at,
        (
          SELECT COUNT(*) FROM dossier_participants dp WHERE dp.person_id = p.id
        ) as dossier_count,
        (
          SELECT COUNT(*) FROM properties prop WHERE prop.owner_id = p.id
        ) as property_count,
        (
          SELECT COALESCE(MAX(d.updated_at), p.created_at)
          FROM dossier_participants dp
          JOIN dossiers d ON d.id = dp.dossier_id
          WHERE dp.person_id = p.id
        ) as last_update
      FROM persons p
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT 100
    `, ...params);

    const stats = await queryRawOne(`
      SELECT
        (SELECT COUNT(*) FROM persons WHERE archived_at IS NULL) as total,
        (SELECT COUNT(*) FROM persons p WHERE p.archived_at IS NULL AND EXISTS (SELECT 1 FROM dossier_participants dp WHERE dp.person_id = p.id)) as vinculadas
    `);

    const result = await Promise.all(people.map(async p => {
      const certStats = await queryRawOne(`
        SELECT
          COUNT(*) as total_certs,
          SUM(CASE WHEN c.status = 'Obtida' THEN 1 ELSE 0 END) as obtidas,
          SUM(CASE WHEN c.status = 'Pendente' THEN 1 ELSE 0 END) as pendentes
        FROM certificates c
        JOIN dossiers d ON d.id = c.dossier_id
        WHERE d.person_id = $1
      `, p.id);

      let docStatus: string;
      if (certStats.total_certs === 0) {
        docStatus = 'Sem análise';
      } else if (certStats.pendentes === 0) {
        docStatus = 'Completa';
      } else if (certStats.obtidas > 0) {
        docStatus = 'Parcial';
      } else {
        docStatus = 'Pendente';
      }

      let personType = 'Pessoa Física';
      if (p.cnpj) {
        personType = 'Pessoa Empresarial';
      } else if (!p.cpf) {
        personType = 'Pessoa Física';
      }

      const relationshipCount = await queryRawOne(`
        SELECT COUNT(*) as count FROM person_relationships
        WHERE person_id = $1 OR related_person_id = $2
      `, p.id, p.id);

      const dossiersVinculados = await queryRaw(`
        SELECT d.id, d.identifier, dp.role
        FROM dossier_participants dp
        JOIN dossiers d ON d.id = dp.dossier_id
        WHERE dp.person_id = $1
        ORDER BY d.created_at DESC
      `, p.id);

      return {
        id: p.id,
        name: p.name,
        cpf: p.cpf,
        cnpj: p.cnpj,
        email: p.email,
        phone: p.phone,
        cellPhone: p.cell_phone,
        city: p.city,
        state: p.state,
        createdAt: p.created_at,
        isPreCadastro: !!p.is_pre_cadastro,
        archivedAt: p.archived_at,
        type: personType,
        dossierCount: p.dossier_count,
        propertyCount: p.property_count,
        documentationStatus: docStatus,
        totalCerts: certStats.total_certs,
        certsObtidas: certStats.obtidas,
        certsPendentes: certStats.pendentes,
        relationshipCount: relationshipCount.count,
        updatedAt: p.last_update,
        dossiersVinculados: dossiersVinculados.map(d => ({
          id: d.id,
          identifier: d.identifier,
          role: d.role,
        })),
      };
    }));

    const docCompleta = result.filter(p => p.documentationStatus === 'Completa').length;
    const docPendente = result.filter(p =>
      p.documentationStatus === 'Pendente' || p.documentationStatus === 'Parcial'
    ).length;

    res.json({
      people: result,
      stats: {
        total: stats.total,
        vinculadas: stats.vinculadas,
        documentacaoCompleta: docCompleta,
        pendenciasDocumentais: docPendente,
      },
    });
  } catch (error) {
    console.error('[People] Erro:', error);
    res.status(500).json({ error: 'Erro ao carregar pessoas' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, cpf, cnpj, email, phone, cellPhone, rg, birthDate, maritalStatus, nationality, zipCode, city, state, address, observation, isPreCadastro, motherName, fatherName } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Nome é obrigatório' });
      return;
    }

    if (cpf) {
      const cpfClean = cpf.replace(/\D/g, '');
      if (cpfClean.length === 11 && !validarCPF(cpfClean)) {
        res.status(400).json({ error: 'CPF inválido' });
        return;
      }
    }

    if (cnpj) {
      const cnpjClean = cnpj.replace(/\D/g, '');
      if (cnpjClean.length === 14 && !validarCNPJ(cnpjClean)) {
        res.status(400).json({ error: 'CNPJ inválido' });
        return;
      }
    }

    if (email && !validarEmail(email)) {
      res.status(400).json({ error: 'Email inválido' });
      return;
    }

    if (phone && !validarTelefone(phone)) {
      res.status(400).json({ error: 'Telefone inválido' });
      return;
    }

    if (cellPhone && !validarTelefone(cellPhone)) {
      res.status(400).json({ error: 'Celular inválido' });
      return;
    }

    if (zipCode && !validarCEP(zipCode)) {
      res.status(400).json({ error: 'CEP inválido' });
      return;
    }

    if (email) {
      const emailClean = email.toLowerCase().trim();
      const existingEmail = await queryRawOne('SELECT id FROM persons WHERE email = $1', emailClean);
      if (existingEmail) {
        res.status(409).json({ error: 'Este email já está cadastrado' });
        return;
      }
    }

    if (cpf) {
      const cpfClean = cpf.replace(/\D/g, '');
      if (cpfClean.length === 11) {
        const existingCpf = await queryRawOne('SELECT id FROM persons WHERE cpf = $1', cpfClean);
        if (existingCpf) {
          res.status(409).json({ error: 'Este CPF já está cadastrado' });
          return;
        }
      }
    }

    const id = randomUUID();
    const created_at = new Date().toISOString();

    await executeRaw(`
      INSERT INTO persons (id, name, cpf, cnpj, email, phone, cell_phone, rg, birth_date, mother_name, father_name, marital_status, nationality, zip_code, city, state, address, observation, is_pre_cadastro, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
    `,
      id, name.trim(),
      cpf?.replace(/\D/g, '') || null,
      cnpj?.replace(/\D/g, '') || null,
      email?.toLowerCase().trim() || null,
      phone?.replace(/\D/g, '') || null,
      cellPhone?.replace(/\D/g, '') || null,
      rg || null,
      birthDate || null,
      motherName || null,
      fatherName || null,
      maritalStatus || null,
      nationality || null,
      zipCode?.replace(/\D/g, '') || null,
      city || null,
      state || null,
      address || null,
      observation || null,
      isPreCadastro ? 1 : 0,
      created_at
    );

    res.status(201).json({ success: true, id });
  } catch (error) {
    console.error('[People Create] Erro:', error);
    res.status(500).json({ error: 'Erro ao criar pessoa' });
  }
});

router.get('/:id/detail', async (req, res) => {
  try {
    const { id } = req.params;

    const person = await queryRawOne(`
      SELECT id, name, cpf, email, phone, cell_phone, rg, birth_date, mother_name, father_name, marital_status, nationality, zip_code, city, state, address, observation, created_at FROM persons WHERE id = $1
    `, id);

    if (!person) {
      res.status(404).json({ error: 'Pessoa não encontrada' });
      return;
    }

    const dossiers = await queryRaw(`
      SELECT
        d.id,
        d.identifier,
        d.status,
        d.priority,
        d.created_at,
        d.updated_at,
        p.identifier as property_identifier,
        p.type as property_type,
        p.address as property_address
      FROM dossiers d
      LEFT JOIN properties p ON p.id = d.property_id
      WHERE d.person_id = $1
      ORDER BY d.created_at DESC
    `, id);

    const dossiersWithCerts = await Promise.all(dossiers.map(async d => {
      const certificates = await queryRaw(`
        SELECT id, name, organ, status, protocol, obtained_at, document_path
        FROM certificates
        WHERE dossier_id = $1
        ORDER BY created_at ASC
      `, d.id);

      return { ...d, certificates };
    }));

    const totalCerts = dossiersWithCerts.reduce((acc, d) => acc + d.certificates.length, 0);
    const obtidas = dossiersWithCerts.reduce((acc, d) => acc + d.certificates.filter((c: any) => c.status === 'Obtida').length, 0);
    const pendentes = dossiersWithCerts.reduce((acc, d) => acc + d.certificates.filter((c: any) => c.status === 'Pendente').length, 0);

    res.json({
      person: {
        id: person.id,
        name: person.name,
        cpf: person.cpf,
        email: person.email,
        phone: person.phone,
        cellPhone: person.cell_phone,
        rg: person.rg,
        birthDate: person.birth_date,
        motherName: person.mother_name,
        fatherName: person.father_name,
        maritalStatus: person.marital_status,
        nationality: person.nationality,
        zipCode: person.zip_code,
        city: person.city,
        state: person.state,
        address: person.address,
        observation: person.observation,
        createdAt: person.created_at,
      },
      dossiers: dossiersWithCerts,
      stats: {
        totalDossiers: dossiersWithCerts.length,
        totalCertificates: totalCerts,
        obtidas,
        pendentes,
      },
    });
  } catch (error) {
    console.error('[People Detail] Erro:', error);
    res.status(500).json({ error: 'Erro ao carregar detalhes' });
  }
});

router.post('/:id/search', async (req, res) => {
  try {
    const { id } = req.params;

    const person = await queryRawOne('SELECT id, name, cpf FROM persons WHERE id = $1', id);

    if (!person) {
      res.status(404).json({ error: 'Pessoa não encontrada' });
      return;
    }

    const { nome, cpf: cpfBody, dataNascimento, nomeMae, nomePai, email: emailBody } = req.body || {};

    const job = iniciarJob({
      personId: person.id,
      nome: nome || person.name,
      cpf: cpfBody || person.cpf || '',
      dataNascimento: dataNascimento || '01/01/1980',
      nomeMae: nomeMae || 'Não informado',
      nomePai: nomePai || undefined,
      email: emailBody || '',
    });

    res.json({ jobId: job.id, status: job.status });
  } catch (error) {
    console.error('[People Search] Erro:', error);
    res.status(500).json({ error: 'Erro ao iniciar busca' });
  }
});

router.get('/:id/search/:jobId', async (req, res) => {
  try {
    const job = getJob(req.params.jobId);

    if (!job) {
      res.status(404).json({ error: 'Job não encontrado' });
      return;
    }

    res.json({
      jobId: job.id,
      status: job.status,
      resultados: job.resultados.map(r => ({
        status: r.status,
        orgao: r.orgao,
        dataConsulta: r.dataConsulta,
        protocolo: r.protocolo || null,
        error: r.error || null,
      })),
      inicio: job.inicio,
      fim: job.fim || null,
    });
  } catch (error) {
    console.error('[People Job Status] Erro:', error);
    res.status(500).json({ error: 'Erro ao consultar job' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, cnpj, email, phone, cellPhone, rg, birthDate, motherName, fatherName, maritalStatus, nationality, zipCode, city, state, address, observation } = req.body;

    const existing = await queryRawOne('SELECT id FROM persons WHERE id = $1', id);
    if (!existing) {
      res.status(404).json({ error: 'Pessoa não encontrada' });
      return;
    }

    await executeRaw(`
      UPDATE persons SET
        name = COALESCE($1, name),
        cnpj = COALESCE($2, cnpj),
        email = COALESCE($3, email),
        phone = COALESCE($4, phone),
        cell_phone = COALESCE($5, cell_phone),
        rg = COALESCE($6, rg),
        birth_date = COALESCE($7, birth_date),
        mother_name = COALESCE($8, mother_name),
        father_name = COALESCE($9, father_name),
        marital_status = COALESCE($10, marital_status),
        nationality = COALESCE($11, nationality),
        zip_code = COALESCE($12, zip_code),
        city = COALESCE($13, city),
        state = COALESCE($14, state),
        address = COALESCE($15, address),
        observation = COALESCE($16, observation)
      WHERE id = $17
    `, name, cnpj, email, phone, cellPhone, rg, birthDate, motherName, fatherName, maritalStatus, nationality, zipCode, city, state, address, observation, id);

    res.json({ success: true });
  } catch (error) {
    console.error('[People Update] Erro:', error);
    res.status(500).json({ error: 'Erro ao atualizar pessoa' });
  }
});

router.get('/:id/properties', async (req, res) => {
  try {
    const { id } = req.params;
    const properties = await queryRaw(`
      SELECT
        p.id,
        p.identifier,
        p.registration,
        p.type,
        p.address,
        p.status,
        po.participation,
        (SELECT COUNT(*) FROM dossiers d WHERE d.property_id = p.id) as dossier_count
      FROM properties p
      JOIN property_owners po ON po.property_id = p.id
      WHERE po.person_id = $1
      ORDER BY p.created_at DESC
    `, id);

    res.json({ properties });
  } catch (error) {
    console.error('[People Properties] Erro:', error);
    res.status(500).json({ error: 'Erro ao carregar imóveis' });
  }
});

router.post('/:id/archive', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await queryRawOne('SELECT id FROM persons WHERE id = $1', id);
    if (!existing) {
      res.status(404).json({ error: 'Pessoa não encontrada' });
      return;
    }
    // Archive by setting archived_at timestamp
    const current = await queryRawOne('SELECT archived_at FROM persons WHERE id = $1', id);
    if (!current?.archived_at) {
      await executeRaw('UPDATE persons SET archived_at = $1 WHERE id = $2', new Date().toISOString(), id);
    }
    res.json({ success: true });
  } catch (error) {
    console.error('[People Archive] Erro:', error);
    res.status(500).json({ error: 'Erro ao arquivar pessoa' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await queryRawOne('SELECT id FROM persons WHERE id = $1', id);
    if (!existing) {
      res.status(404).json({ error: 'Pessoa não encontrada' });
      return;
    }
    await executeRaw('UPDATE persons SET deleted_at = NOW() WHERE id = $1', id);
    res.json({ success: true });
  } catch (error) {
    console.error('[People Delete] Erro:', error);
    res.status(500).json({ error: 'Erro ao mover pessoa para lixeira' });
  }
});

router.get('/:id/relationships', async (req, res) => {
  try {
    const { id } = req.params;
    const rels = await queryRaw(`
      SELECT pr.id, pr.relationship_type, pr.created_at,
        CASE WHEN pr.person_id = $1 THEN pr.related_person_id ELSE pr.person_id END as other_id,
        p.name, p.cpf, p.cnpj, p.is_pre_cadastro
      FROM person_relationships pr
      JOIN persons p ON p.id = CASE WHEN pr.person_id = $2 THEN pr.related_person_id ELSE pr.person_id END
      WHERE pr.person_id = $3 OR pr.related_person_id = $4
    `, id, id, id, id);
    res.json({ relationships: rels });
  } catch (error) {
    console.error('[People Relationships] Erro:', error);
    res.status(500).json({ error: 'Erro ao carregar vínculos' });
  }
});

router.post('/:id/relationships', async (req, res) => {
  try {
    const { id } = req.params;
    const { related_person_id, relationship_type } = req.body;
    if (!related_person_id) {
      res.status(400).json({ error: 'Pessoa relacionada é obrigatória' });
      return;
    }
    if (id === related_person_id) {
      res.status(400).json({ error: 'Não é possível vincular a mesma pessoa' });
      return;
    }
    const existing = await queryRawOne(
      'SELECT id FROM person_relationships WHERE (person_id = $1 AND related_person_id = $2) OR (person_id = $3 AND related_person_id = $4)',
      id, related_person_id, related_person_id, id
    );
    if (existing) {
      res.status(400).json({ error: 'Vínculo já existe' });
      return;
    }
    const relId = randomUUID();
    await executeRaw(
      'INSERT INTO person_relationships (id, person_id, related_person_id, relationship_type) VALUES ($1, $2, $3, $4)',
      relId, id, related_person_id, relationship_type || 'parental'
    );
    res.json({ success: true, id: relId });
  } catch (error) {
    console.error('[People Relationship Create] Erro:', error);
    res.status(500).json({ error: 'Erro ao criar vínculo' });
  }
});

router.delete('/:id/relationships/:rid', async (req, res) => {
  try {
    const { rid } = req.params;
    await executeRaw('DELETE FROM person_relationships WHERE id = $1', rid);
    res.json({ success: true });
  } catch (error) {
    console.error('[People Relationship Delete] Erro:', error);
    res.status(500).json({ error: 'Erro ao remover vínculo' });
  }
});

export default router;
