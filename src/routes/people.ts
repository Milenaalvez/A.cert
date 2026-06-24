import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import db from '../database.js';
import { iniciarJob, getJob } from '../services/orquestrador.service.js';
import { validarCPF, validarCNPJ, validarEmail, validarTelefone, validarCEP } from '../utils/validation.js';

const router = Router();

router.get('/', (req, res) => {
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
      whereParts.push('(p.name LIKE ? OR p.cpf LIKE ? OR p.cnpj LIKE ? OR p.email LIKE ?)');
      const like = `%${q.trim()}%`;
      params.push(like, like, like, like);
    }

    const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';

    const people = db.prepare(`
      SELECT
        p.id, p.name, p.cpf, p.cnpj, p.email, p.phone, p.cell_phone,
        p.city, p.state, p.created_at, p.is_pre_cadastro, p.archived_at,
        (
          SELECT COUNT(*) FROM dossiers d WHERE d.person_id = p.id
        ) as dossier_count,
        (
          SELECT COUNT(*) FROM properties prop WHERE prop.owner_id = p.id
        ) as property_count,
        (
          SELECT COALESCE(MAX(d.updated_at), p.created_at)
          FROM dossiers d WHERE d.person_id = p.id
        ) as last_update
      FROM persons p
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT 100
    `).all(...params) as {
      id: string; name: string; cpf: string | null; cnpj: string | null; email: string | null;
      phone: string | null; cell_phone: string | null; city: string | null; state: string | null;
      created_at: string; is_pre_cadastro: number; archived_at: string | null; dossier_count: number;
      property_count: number; last_update: string;
    }[];

    const stats = db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM persons WHERE archived_at IS NULL) as total,
        (SELECT COUNT(*) FROM persons p WHERE p.archived_at IS NULL AND EXISTS (SELECT 1 FROM dossiers d WHERE d.person_id = p.id)) as vinculadas
    `).get() as { total: number; vinculadas: number };

    const result = people.map(p => {
      const certStats = db.prepare(`
        SELECT
          COUNT(*) as total_certs,
          SUM(CASE WHEN c.status = 'Obtida' THEN 1 ELSE 0 END) as obtidas,
          SUM(CASE WHEN c.status = 'Pendente' THEN 1 ELSE 0 END) as pendentes
        FROM certificates c
        JOIN dossiers d ON d.id = c.dossier_id
        WHERE d.person_id = ?
      `).get(p.id) as { total_certs: number; obtidas: number; pendentes: number };

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

      const relationshipCount = db.prepare(`
        SELECT COUNT(*) as count FROM person_relationships
        WHERE person_id = ? OR related_person_id = ?
      `).get(p.id, p.id) as { count: number };

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
      };
    });

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

router.post('/', (req, res) => {
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
      const existingEmail = db.prepare('SELECT id FROM persons WHERE email = ?').get(emailClean);
      if (existingEmail) {
        res.status(409).json({ error: 'Este email já está cadastrado' });
        return;
      }
    }

    if (cpf) {
      const cpfClean = cpf.replace(/\D/g, '');
      if (cpfClean.length === 11) {
        const existingCpf = db.prepare('SELECT id FROM persons WHERE cpf = ?').get(cpfClean);
        if (existingCpf) {
          res.status(409).json({ error: 'Este CPF já está cadastrado' });
          return;
        }
      }
    }

    const id = randomUUID();
    const created_at = new Date().toISOString();

    db.prepare(`
      INSERT INTO persons (id, name, cpf, cnpj, email, phone, cell_phone, rg, birth_date, mother_name, father_name, marital_status, nationality, zip_code, city, state, address, observation, is_pre_cadastro, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
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

router.get('/:id/detail', (req, res) => {
  try {
    const { id } = req.params;

    const person = db.prepare(`
      SELECT id, name, cpf, email, phone, cell_phone, rg, birth_date, mother_name, father_name, marital_status, nationality, zip_code, city, state, address, observation, created_at FROM persons WHERE id = ?
    `).get(id) as { id: string; name: string; cpf: string | null; email: string | null; phone: string | null; cell_phone: string | null; rg: string | null; birth_date: string | null; mother_name: string | null; father_name: string | null; marital_status: string | null; nationality: string | null; zip_code: string | null; city: string | null; state: string | null; address: string | null; observation: string | null; created_at: string } | undefined;

    if (!person) {
      res.status(404).json({ error: 'Pessoa não encontrada' });
      return;
    }

    const dossiers = db.prepare(`
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
      WHERE d.person_id = ?
      ORDER BY d.created_at DESC
    `).all(id) as {
      id: string; identifier: string; status: string; priority: string;
      created_at: string; updated_at: string;
      property_identifier: string | null; property_type: string | null; property_address: string | null;
    }[];

    const dossiersWithCerts = dossiers.map(d => {
      const certificates = db.prepare(`
        SELECT id, name, organ, status, protocol, obtained_at, document_path
        FROM certificates
        WHERE dossier_id = ?
        ORDER BY created_at ASC
      `).all(d.id) as {
        id: string; name: string; organ: string; status: string;
        protocol: string | null; obtained_at: string | null; document_path: string | null;
      }[];

      return { ...d, certificates };
    });

    const totalCerts = dossiersWithCerts.reduce((acc, d) => acc + d.certificates.length, 0);
    const obtidas = dossiersWithCerts.reduce((acc, d) => acc + d.certificates.filter(c => c.status === 'Obtida').length, 0);
    const pendentes = dossiersWithCerts.reduce((acc, d) => acc + d.certificates.filter(c => c.status === 'Pendente').length, 0);

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

router.post('/:id/search', (req, res) => {
  try {
    const { id } = req.params;

    const person = db.prepare('SELECT id, name, cpf FROM persons WHERE id = ?').get(id) as {
      id: string; name: string; cpf: string | null;
    } | undefined;

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

router.get('/:id/search/:jobId', (req, res) => {
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

router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, cnpj, email, phone, cellPhone, rg, birthDate, motherName, fatherName, maritalStatus, nationality, zipCode, city, state, address, observation } = req.body;

    const existing = db.prepare('SELECT id FROM persons WHERE id = ?').get(id);
    if (!existing) {
      res.status(404).json({ error: 'Pessoa não encontrada' });
      return;
    }

    db.prepare(`
      UPDATE persons SET
        name = COALESCE(?, name),
        cnpj = COALESCE(?, cnpj),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        cell_phone = COALESCE(?, cell_phone),
        rg = COALESCE(?, rg),
        birth_date = COALESCE(?, birth_date),
        mother_name = COALESCE(?, mother_name),
        father_name = COALESCE(?, father_name),
        marital_status = COALESCE(?, marital_status),
        nationality = COALESCE(?, nationality),
        zip_code = COALESCE(?, zip_code),
        city = COALESCE(?, city),
        state = COALESCE(?, state),
        address = COALESCE(?, address),
        observation = COALESCE(?, observation)
      WHERE id = ?
    `).run(name, cnpj, email, phone, cellPhone, rg, birthDate, motherName, fatherName, maritalStatus, nationality, zipCode, city, state, address, observation, id);

    res.json({ success: true });
  } catch (error) {
    console.error('[People Update] Erro:', error);
    res.status(500).json({ error: 'Erro ao atualizar pessoa' });
  }
});

router.get('/:id/properties', (req, res) => {
  try {
    const { id } = req.params;
    const properties = db.prepare(`
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
      WHERE po.person_id = ?
      ORDER BY p.created_at DESC
    `).all(id) as {
      id: string; identifier: string; registration: string;
      type: string; address: string; status: string;
      participation: number; dossier_count: number;
    }[];

    res.json({ properties });
  } catch (error) {
    console.error('[People Properties] Erro:', error);
    res.status(500).json({ error: 'Erro ao carregar imóveis' });
  }
});

router.post('/:id/archive', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT id FROM persons WHERE id = ?').get(id);
    if (!existing) {
      res.status(404).json({ error: 'Pessoa não encontrada' });
      return;
    }
    // Archive by setting archived_at timestamp
    const current = db.prepare('SELECT archived_at FROM persons WHERE id = ?').get(id) as { archived_at: string | null } | undefined;
    if (!current?.archived_at) {
      db.prepare('UPDATE persons SET archived_at = ? WHERE id = ?').run(new Date().toISOString(), id);
    }
    res.json({ success: true });
  } catch (error) {
    console.error('[People Archive] Erro:', error);
    res.status(500).json({ error: 'Erro ao arquivar pessoa' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT id FROM persons WHERE id = ?').get(id);
    if (!existing) {
      res.status(404).json({ error: 'Pessoa não encontrada' });
      return;
    }
    db.prepare('DELETE FROM person_relationships WHERE person_id = ? OR related_person_id = ?').run(id, id);
    db.prepare('DELETE FROM persons WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    console.error('[People Delete] Erro:', error);
    res.status(500).json({ error: 'Erro ao deletar pessoa' });
  }
});

router.get('/:id/relationships', (req, res) => {
  try {
    const { id } = req.params;
    const rels = db.prepare(`
      SELECT pr.id, pr.relationship_type, pr.created_at,
        CASE WHEN pr.person_id = ? THEN pr.related_person_id ELSE pr.person_id END as other_id,
        p.name, p.cpf, p.cnpj, p.is_pre_cadastro
      FROM person_relationships pr
      JOIN persons p ON p.id = CASE WHEN pr.person_id = ? THEN pr.related_person_id ELSE pr.person_id END
      WHERE pr.person_id = ? OR pr.related_person_id = ?
    `).all(id, id, id, id);
    res.json({ relationships: rels });
  } catch (error) {
    console.error('[People Relationships] Erro:', error);
    res.status(500).json({ error: 'Erro ao carregar vínculos' });
  }
});

router.post('/:id/relationships', (req, res) => {
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
    const existing = db.prepare(
      'SELECT id FROM person_relationships WHERE (person_id = ? AND related_person_id = ?) OR (person_id = ? AND related_person_id = ?)'
    ).get(id, related_person_id, related_person_id, id);
    if (existing) {
      res.status(400).json({ error: 'Vínculo já existe' });
      return;
    }
    const relId = randomUUID();
    db.prepare(
      'INSERT INTO person_relationships (id, person_id, related_person_id, relationship_type) VALUES (?, ?, ?, ?)'
    ).run(relId, id, related_person_id, relationship_type || 'parental');
    res.json({ success: true, id: relId });
  } catch (error) {
    console.error('[People Relationship Create] Erro:', error);
    res.status(500).json({ error: 'Erro ao criar vínculo' });
  }
});

router.delete('/:id/relationships/:rid', (req, res) => {
  try {
    const { rid } = req.params;
    db.prepare('DELETE FROM person_relationships WHERE id = ?').run(rid);
    res.json({ success: true });
  } catch (error) {
    console.error('[People Relationship Delete] Erro:', error);
    res.status(500).json({ error: 'Erro ao remover vínculo' });
  }
});

export default router;
