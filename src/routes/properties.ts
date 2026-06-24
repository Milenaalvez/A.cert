import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import db from '../database.js';

const router = Router();

const CATEGORY_ICONS: Record<string, string> = {
  Apartamento: '🏢',
  Casa: '🏠',
  'Sala Comercial': '🏬',
  Terreno: '🌳',
  Galpão: '🏭',
  Condomínio: '🏘️',
  Chácara: '🌿',
  Outros: '📋',
};

router.get('/cartorios', (_req, res) => {
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
    const results = q
      ? all.filter(c => c.toLowerCase().includes(q))
      : all;
    res.json(results.map(name => ({ name })));
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar cartórios' });
  }
});

router.get('/', (_req, res) => {
  try {
    const categories = db.prepare(`
      SELECT
        p.type,
        COUNT(*) as total,
        COALESCE(SUM(CASE WHEN p.created_at >= datetime('now', '-7 days') THEN 1 ELSE 0 END), 0) as novos,
        (
          SELECT COUNT(*) FROM dossiers d WHERE d.property_id IN (
            SELECT id FROM properties WHERE type = p.type
          )
        ) as dossier_count,
        (
          SELECT COUNT(*) FROM property_owners po WHERE po.property_id IN (
            SELECT id FROM properties WHERE type = p.type
          )
        ) as owner_count
      FROM properties p
      GROUP BY p.type
      ORDER BY
        CASE p.type
          WHEN 'Apartamento' THEN 1
          WHEN 'Casa' THEN 2
          WHEN 'Sala Comercial' THEN 3
          WHEN 'Terreno' THEN 4
          WHEN 'Galpão' THEN 5
          WHEN 'Condomínio' THEN 6
          WHEN 'Chácara' THEN 7
          ELSE 99
        END
    `).all() as {
      type: string; total: number; novos: number;
      dossier_count: number; owner_count: number;
    }[];

    const totalProperties = db.prepare('SELECT COUNT(*) as count FROM properties').get() as { count: number };

    const allProperties = db.prepare(`
      SELECT
        p.id, p.identifier, p.registration, p.type, p.address,
        p.status, p.neighborhood, p.created_at, p.updated_at,
        (SELECT name FROM persons WHERE id = p.owner_id) as owner_name,
        (SELECT COUNT(*) FROM dossiers d WHERE d.property_id = p.id) as dossier_count,
        9 as cert_count,
        (SELECT COALESCE(SUM(CASE WHEN c.status = 'Obtida' THEN 1 ELSE 0 END), 0) FROM certificates c JOIN dossiers d ON d.id = c.dossier_id WHERE d.property_id = p.id) as cert_obtidas
      FROM properties p
      ORDER BY p.updated_at DESC
      LIMIT 50
    `).all() as any[];

    const result = categories.map(c => ({
      type: c.type,
      icon: CATEGORY_ICONS[c.type] || '🏠',
      total: c.total,
      novos: c.novos,
      dossierCount: c.dossier_count,
      ownerCount: c.owner_count,
    }));

    res.json({
      categories: result,
      total: totalProperties.count,
      allProperties: allProperties.map(p => ({
        id: p.id, identifier: p.identifier, registration: p.registration,
        type: p.type, address: p.address, status: p.status,
        neighborhood: p.neighborhood, createdAt: p.created_at, updatedAt: p.updated_at,
        ownerName: p.owner_name, dossierCount: p.dossier_count,
        certCount: 9, certObtidas: p.cert_obtidas,
        progress: Math.round((p.cert_obtidas / 9) * 100),
      })),
    });
  } catch (error) {
    console.error('[Properties] Erro:', error);
    res.status(500).json({ error: 'Erro ao carregar imóveis' });
  }
});

router.get('/category/:type', (req, res) => {
  try {
    const { type } = req.params;

    const properties = db.prepare(`
      SELECT
        p.id,
        p.identifier,
        p.registration,
        p.type,
        p.address,
        p.status,
        p.neighborhood,
        p.city,
        p.state,
        p.area,
        p.created_at,
        p.updated_at,
        (SELECT name FROM persons WHERE id = p.owner_id) as owner_name,
        (SELECT COUNT(*) FROM dossiers d WHERE d.property_id = p.id) as dossier_count,
        9 as cert_count,
        (SELECT COALESCE(SUM(CASE WHEN c.status = 'Obtida' THEN 1 ELSE 0 END), 0) FROM certificates c JOIN dossiers d ON d.id = c.dossier_id WHERE d.property_id = p.id) as cert_obtidas
      FROM properties p
      WHERE p.type = ?
      ORDER BY p.created_at DESC
    `).all(type) as {
      id: string; identifier: string; registration: string;
      type: string; address: string; status: string;
      neighborhood: string; city: string; state: string;
      area: string; created_at: string; updated_at: string;
      owner_name: string | null; dossier_count: number;
      cert_count: number; cert_obtidas: number;
    }[];

    res.json({
      type,
      icon: CATEGORY_ICONS[type] || '🏠',
      properties: properties.map(p => ({
        id: p.id,
        identifier: p.identifier,
        registration: p.registration,
        type: p.type,
        address: p.address,
        status: p.status,
        neighborhood: p.neighborhood,
        city: p.city,
        state: p.state,
        area: p.area,
        ownerName: p.owner_name,
        dossierCount: p.dossier_count,
        certCount: 9,
        certObtidas: p.cert_obtidas,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        progress: Math.round((p.cert_obtidas / 9) * 100),
      })),
    });
  } catch (error) {
    console.error('[Properties Category] Erro:', error);
    res.status(500).json({ error: 'Erro ao carregar categoria' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const property = db.prepare(`
      SELECT * FROM properties WHERE id = ?
    `).get(id) as {
      id: string; identifier: string; registration: string;
      type: string; address: string; owner_id: string | null;
      notary_office: string; cartorio: string; status: string;
      neighborhood: string; city: string; state: string;
      zip_code: string; area: string; land_area: string;
      description: string; created_at: string; updated_at: string;
    } | undefined;

    if (!property) {
      res.status(404).json({ error: 'Imóvel não encontrado' });
      return;
    }

    const owners = db.prepare(`
      SELECT
        po.id as link_id,
        po.participation,
        p.id as person_id,
        p.name,
        p.cpf,
        (SELECT COUNT(*) FROM dossiers d WHERE d.person_id = p.id AND d.property_id = ?) as dossier_count,
        (SELECT COALESCE(SUM(CASE WHEN c.status = 'Obtida' THEN 1 ELSE 0 END), 0) FROM certificates c JOIN dossiers d ON d.id = c.dossier_id WHERE d.person_id = p.id AND d.property_id = ?) as cert_obtidas,
        (SELECT COUNT(*) FROM certificates c JOIN dossiers d ON d.id = c.dossier_id WHERE d.person_id = p.id AND d.property_id = ?) as cert_total
      FROM property_owners po
      JOIN persons p ON p.id = po.person_id
      WHERE po.property_id = ?
      ORDER BY po.participation DESC
    `).all(id, id, id, id) as {
      link_id: string; participation: number;
      person_id: string; name: string; cpf: string | null;
      dossier_count: number; cert_obtidas: number; cert_total: number;
    }[];

    const dossiers = db.prepare(`
      SELECT
        d.id,
        d.identifier,
        d.status,
        d.priority,
        d.created_at,
        d.updated_at,
        d.person_id,
        p.name as person_name,
        (SELECT COUNT(*) FROM certificates c WHERE c.dossier_id = d.id) as cert_total,
        (SELECT COALESCE(SUM(CASE WHEN c.status = 'Obtida' THEN 1 ELSE 0 END), 0) FROM certificates c WHERE c.dossier_id = d.id) as cert_obtidas
      FROM dossiers d
      LEFT JOIN persons p ON p.id = d.person_id
      WHERE d.property_id = ?
      ORDER BY d.created_at DESC
    `).all(id) as {
      id: string; identifier: string; status: string;
      priority: string; created_at: string; updated_at: string;
      person_id: string; person_name: string | null;
      cert_total: number; cert_obtidas: number;
    }[];

    const certificates = db.prepare(`
      SELECT
        c.id,
        c.name,
        c.organ,
        c.status,
        c.protocol,
        c.obtained_at,
        c.document_path,
        d.identifier as dossier_identifier
      FROM certificates c
      JOIN dossiers d ON d.id = c.dossier_id
      WHERE d.property_id = ?
      ORDER BY c.obtained_at DESC NULLS LAST, c.created_at DESC
    `).all(id) as {
      id: string; name: string; organ: string;
      status: string; protocol: string | null;
      obtained_at: string | null; document_path: string | null;
      dossier_identifier: string;
    }[];

    const timeline = db.prepare(`
      SELECT id, action, description, created_at
      FROM property_timeline
      WHERE property_id = ?
      ORDER BY created_at DESC
    `).all(id) as {
      id: string; action: string; description: string; created_at: string;
    }[];

    const totalCerts = certificates.length;
    const obtidas = certificates.filter(c => c.status === 'Obtida').length;

    res.json({
      property: {
        id: property.id,
        identifier: property.identifier,
        registration: property.registration,
        type: property.type,
        address: property.address,
        notaryOffice: property.notary_office,
        cartorio: property.cartorio || property.notary_office,
        status: property.status,
        neighborhood: property.neighborhood,
        city: property.city,
        state: property.state,
        zipCode: property.zip_code,
        area: property.area,
        landArea: property.land_area,
        description: property.description,
        ownerId: property.owner_id,
        createdAt: property.created_at,
        updatedAt: property.updated_at,
        progress: Math.round((obtidas / 9) * 100),
        certObtidas: obtidas,
        certTotal: 9,
      },
      owners,
      dossiers: dossiers.map(d => ({
        id: d.id,
        identifier: d.identifier,
        status: d.status,
        priority: d.priority,
        personName: d.person_name,
        personId: d.person_id,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
        progress: d.cert_total > 0 ? Math.round((d.cert_obtidas / d.cert_total) * 100) : 0,
      })),
      certificates: certificates.map(c => ({
        id: c.id,
        name: c.name,
        organ: c.organ,
        status: c.status,
        protocol: c.protocol,
        obtainedAt: c.obtained_at,
        documentPath: c.document_path,
        dossierIdentifier: c.dossier_identifier,
      })),
      timeline,
    });
  } catch (error) {
    console.error('[Properties Detail] Erro:', error);
    res.status(500).json({ error: 'Erro ao carregar detalhes do imóvel' });
  }
});

router.post('/', (req, res) => {
  try {
    const {
      identifier, registration, type, address, ownerId,
      notaryOffice, status, neighborhood, city, state,
      zipCode, area, landArea, description,
    } = req.body;

    if (!identifier || !address) {
      res.status(400).json({ error: 'Identificador e endereço são obrigatórios' });
      return;
    }

    if (registration) {
      const dup = db.prepare('SELECT id FROM properties WHERE registration = ?').get(registration);
      if (dup) {
        res.status(409).json({ error: 'Matrícula já cadastrada para outro imóvel' });
        return;
      }
    }

    const id = randomUUID();
    const created_at = new Date().toISOString();
    const validTypes = ['Apartamento', 'Casa', 'Sala Comercial', 'Terreno', 'Galpão', 'Condomínio', 'Chácara', 'Outros'];
    const finalType = validTypes.includes(type) ? type : 'Outros';

    const finalRegistration = registration || (() => {
      const d = new Date();
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yy = String(d.getFullYear()).slice(2);
      const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
      return `REG-${yy}${mm}${dd}-${rand}`;
    })();

    db.prepare(`
      INSERT INTO properties (id, identifier, registration, type, address, owner_id, notary_office, status, neighborhood, city, state, zip_code, area, land_area, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, identifier, finalRegistration, finalType, address, ownerId || null,
      notaryOffice || '', status || 'Regular', neighborhood || '', city || '',
      state || '', zipCode || '', area || '', landArea || '', description || '',
      created_at, created_at
    );

    if (ownerId) {
      db.prepare(`
        INSERT INTO property_owners (id, property_id, person_id, participation)
        VALUES (?, ?, ?, ?)
      `).run(randomUUID(), id, ownerId, 100.0);

      db.prepare(`
        INSERT INTO property_timeline (id, property_id, action, description, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(randomUUID(), id, 'Imóvel cadastrado', 'Imóvel cadastrado no sistema A.CERT', created_at);
    }

    res.status(201).json({ success: true, id });
  } catch (error) {
    console.error('[Properties Create] Erro:', error);
    res.status(500).json({ error: 'Erro ao criar imóvel' });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const {
      identifier, registration, type, address, ownerId,
      notaryOffice, cartorio, status, neighborhood, city, state,
      zipCode, area, landArea, description,
    } = req.body;

    const existing = db.prepare('SELECT id FROM properties WHERE id = ?').get(id) as { id: string } | undefined;
    if (!existing) {
      res.status(404).json({ error: 'Imóvel não encontrado' });
      return;
    }

    if (registration) {
      const dup = db.prepare('SELECT id FROM properties WHERE registration = ? AND id != ?').get(registration, id) as { id: string } | undefined;
      if (dup) {
        res.status(409).json({ error: 'Matrícula já cadastrada para outro imóvel' });
        return;
      }
    }

    const validTypes = ['Apartamento', 'Casa', 'Sala Comercial', 'Terreno', 'Galpão', 'Condomínio', 'Chácara', 'Outros'];
    const finalType = type && validTypes.includes(type) ? type : undefined;

    db.prepare(`
      UPDATE properties SET
        identifier = COALESCE(?, identifier),
        registration = COALESCE(?, registration),
        type = COALESCE(?, type),
        address = COALESCE(?, address),
        owner_id = COALESCE(?, owner_id),
        notary_office = COALESCE(?, notary_office),
        cartorio = COALESCE(?, cartorio),
        status = COALESCE(?, status),
        neighborhood = COALESCE(?, neighborhood),
        city = COALESCE(?, city),
        state = COALESCE(?, state),
        zip_code = COALESCE(?, zip_code),
        area = COALESCE(?, area),
        land_area = COALESCE(?, land_area),
        description = COALESCE(?, description),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      identifier, registration, finalType, address, ownerId,
      notaryOffice, cartorio, status, neighborhood, city, state,
      zipCode, area, landArea, description, id
    );

    res.json({ success: true });
  } catch (error) {
    console.error('[Properties Update] Erro:', error);
    res.status(500).json({ error: 'Erro ao atualizar imóvel' });
  }
});

router.post('/:id/owners', (req, res) => {
  try {
    const { id } = req.params;
    const { personId, participation } = req.body;

    if (!personId) {
      res.status(400).json({ error: 'personId é obrigatório' });
      return;
    }

    const property = db.prepare('SELECT id FROM properties WHERE id = ?').get(id);
    if (!property) {
      res.status(404).json({ error: 'Imóvel não encontrado' });
      return;
    }

    const person = db.prepare('SELECT id FROM persons WHERE id = ?').get(personId);
    if (!person) {
      res.status(404).json({ error: 'Pessoa não encontrada' });
      return;
    }

    const existing = db.prepare(
      'SELECT id FROM property_owners WHERE property_id = ? AND person_id = ?'
    ).get(id, personId);

    if (existing) {
      db.prepare('UPDATE property_owners SET participation = ? WHERE id = ?').run(
        participation || 0, (existing as { id: string }).id
      );
    } else {
      db.prepare(`
        INSERT INTO property_owners (id, property_id, person_id, participation)
        VALUES (?, ?, ?, ?)
      `).run(randomUUID(), id, personId, participation || 0);
    }

    db.prepare(`
      INSERT INTO property_timeline (id, property_id, action, description, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).run(randomUUID(), id, 'Proprietário vinculado', 'Novo proprietário vinculado ao imóvel');

    res.json({ success: true });
  } catch (error) {
    console.error('[Properties Add Owner] Erro:', error);
    res.status(500).json({ error: 'Erro ao adicionar proprietário' });
  }
});

router.delete('/:id/owners/:ownerLinkId', (req, res) => {
  try {
    const { id, ownerLinkId } = req.params;
    db.prepare('DELETE FROM property_owners WHERE id = ? AND property_id = ?').run(ownerLinkId, id);
    res.json({ success: true });
  } catch (error) {
    console.error('[Properties Remove Owner] Erro:', error);
    res.status(500).json({ error: 'Erro ao remover proprietário' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT id FROM properties WHERE id = ?').get(id);
    if (!existing) { res.status(404).json({ error: 'Imóvel não encontrado' }); return; }
    db.prepare('DELETE FROM property_owners WHERE property_id = ?').run(id);
    db.prepare('DELETE FROM properties WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    console.error('[Properties Delete] Erro:', error);
    res.status(500).json({ error: 'Erro ao deletar imóvel' });
  }
});

router.post('/:id/archive', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('UPDATE properties SET status = ? WHERE id = ?').run('Arquivado', id);
    res.json({ success: true });
  } catch (error) {
    console.error('[Properties Archive] Erro:', error);
    res.status(500).json({ error: 'Erro ao arquivar imóvel' });
  }
});

export default router;
