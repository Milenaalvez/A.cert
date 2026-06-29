import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import prisma, { queryRaw, queryRawOne, executeRaw } from '../lib/prisma.js';

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

router.get('/cartorios', async (_req, res) => {
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

router.get('/', async (_req, res) => {
  try {
    const categories = await queryRaw(`
      SELECT
        p.type,
        COUNT(*) as total,
        COALESCE(SUM(CASE WHEN p.created_at >= NOW() - INTERVAL '7 days' THEN 1 ELSE 0 END), 0) as novos,
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
    `);

    const totalProperties = await queryRawOne('SELECT COUNT(*) as count FROM properties');

    const allProperties = await queryRaw(`
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
    `);

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

router.get('/search', async (req, res) => {
  try {
    const q = ((req.query.q as string) || '').trim();
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    if (!q) { res.json({ properties: [] }); return; }

    const properties = await queryRaw(`
      SELECT id, identifier, registration, type, address, neighborhood, city, status
      FROM properties
      WHERE (identifier LIKE $1 OR address LIKE $2 OR registration LIKE $3 OR neighborhood LIKE $4 OR city LIKE $5)
        AND (deleted_at IS NULL OR deleted_at = '')
      ORDER BY updated_at DESC
      LIMIT $6
    `, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, limit);

    res.json({ properties });
  } catch (error) {
    console.error('[Properties Search] Erro:', error);
    res.status(500).json({ error: 'Erro ao pesquisar imóveis' });
  }
});

router.get('/category/:type', async (req, res) => {
  try {
    const { type } = req.params;

    const properties = await queryRaw(`
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
      WHERE p.type = $1
      ORDER BY p.created_at DESC
    `, type);

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

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const property = await queryRawOne(`
      SELECT * FROM properties WHERE id = $1
    `, id);

    if (!property) {
      res.status(404).json({ error: 'Imóvel não encontrado' });
      return;
    }

    const owners = await queryRaw(`
      SELECT
        po.id as link_id,
        po.participation,
        p.id as person_id,
        p.name,
        p.cpf,
        (SELECT COUNT(*) FROM dossiers d WHERE d.person_id = p.id AND d.property_id = $1) as dossier_count,
        (SELECT COALESCE(SUM(CASE WHEN c.status = 'Obtida' THEN 1 ELSE 0 END), 0) FROM certificates c JOIN dossiers d ON d.id = c.dossier_id WHERE d.person_id = p.id AND d.property_id = $2) as cert_obtidas,
        (SELECT COUNT(*) FROM certificates c JOIN dossiers d ON d.id = c.dossier_id WHERE d.person_id = p.id AND d.property_id = $3) as cert_total
      FROM property_owners po
      JOIN persons p ON p.id = po.person_id
      WHERE po.property_id = $4
      ORDER BY po.participation DESC
    `, id, id, id, id);

    const dossiers = await queryRaw(`
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
      WHERE d.property_id = $1
      ORDER BY d.created_at DESC
    `, id);

    const certificates = await queryRaw(`
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
      WHERE d.property_id = $1
      ORDER BY c.obtained_at DESC NULLS LAST, c.created_at DESC
    `, id);

    const timeline = await queryRaw(`
      SELECT id, action, description, created_at
      FROM property_timeline
      WHERE property_id = $1
      ORDER BY created_at DESC
    `, id);

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

router.post('/', async (req, res) => {
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
      const dup = await queryRawOne('SELECT id FROM properties WHERE registration = $1', registration);
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

    await executeRaw(`
      INSERT INTO properties (id, identifier, registration, type, address, owner_id, notary_office, status, neighborhood, city, state, zip_code, area, land_area, description, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    `,
      id, identifier, finalRegistration, finalType, address, ownerId || null,
      notaryOffice || '', status || 'Regular', neighborhood || '', city || '',
      state || '', zipCode || '', area || '', landArea || '', description || '',
      created_at, created_at
    );

    if (ownerId) {
      await executeRaw(`
        INSERT INTO property_owners (id, property_id, person_id, participation)
        VALUES ($1, $2, $3, $4)
      `, randomUUID(), id, ownerId, 100.0);

      await executeRaw(`
        INSERT INTO property_timeline (id, property_id, action, description, created_at)
        VALUES ($1, $2, $3, $4, $5)
      `, randomUUID(), id, 'Imóvel cadastrado', 'Imóvel cadastrado no sistema A.CERT', created_at);
    }

    res.status(201).json({ success: true, id });
  } catch (error) {
    console.error('[Properties Create] Erro:', error);
    res.status(500).json({ error: 'Erro ao criar imóvel' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      identifier, registration, type, address, ownerId,
      notaryOffice, cartorio, status, neighborhood, city, state,
      zipCode, area, landArea, description,
    } = req.body;

    const existing = await queryRawOne('SELECT id FROM properties WHERE id = $1', id);
    if (!existing) {
      res.status(404).json({ error: 'Imóvel não encontrado' });
      return;
    }

    if (registration) {
      const dup = await queryRawOne('SELECT id FROM properties WHERE registration = $1 AND id != $2', registration, id);
      if (dup) {
        res.status(409).json({ error: 'Matrícula já cadastrada para outro imóvel' });
        return;
      }
    }

    const validTypes = ['Apartamento', 'Casa', 'Sala Comercial', 'Terreno', 'Galpão', 'Condomínio', 'Chácara', 'Outros'];
    const finalType = type && validTypes.includes(type) ? type : undefined;

    await executeRaw(`
      UPDATE properties SET
        identifier = COALESCE($1, identifier),
        registration = COALESCE($2, registration),
        type = COALESCE($3, type),
        address = COALESCE($4, address),
        owner_id = COALESCE($5, owner_id),
        notary_office = COALESCE($6, notary_office),
        cartorio = COALESCE($7, cartorio),
        status = COALESCE($8, status),
        neighborhood = COALESCE($9, neighborhood),
        city = COALESCE($10, city),
        state = COALESCE($11, state),
        zip_code = COALESCE($12, zip_code),
        area = COALESCE($13, area),
        land_area = COALESCE($14, land_area),
        description = COALESCE($15, description),
        updated_at = NOW()
      WHERE id = $16
    `,
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

router.post('/:id/owners', async (req, res) => {
  try {
    const { id } = req.params;
    const { personId, participation } = req.body;

    if (!personId) {
      res.status(400).json({ error: 'personId é obrigatório' });
      return;
    }

    const property = await queryRawOne('SELECT id FROM properties WHERE id = $1', id);
    if (!property) {
      res.status(404).json({ error: 'Imóvel não encontrado' });
      return;
    }

    const person = await queryRawOne('SELECT id FROM persons WHERE id = $1', personId);
    if (!person) {
      res.status(404).json({ error: 'Pessoa não encontrada' });
      return;
    }

    const existing = await queryRawOne(
      'SELECT id FROM property_owners WHERE property_id = $1 AND person_id = $2', id, personId
    );

    if (existing) {
      await executeRaw('UPDATE property_owners SET participation = $1 WHERE id = $2',
        participation || 0, (existing as { id: string }).id
      );
    } else {
      await executeRaw(`
        INSERT INTO property_owners (id, property_id, person_id, participation)
        VALUES ($1, $2, $3, $4)
      `, randomUUID(), id, personId, participation || 0);
    }

    await executeRaw(`
      INSERT INTO property_timeline (id, property_id, action, description, created_at)
      VALUES ($1, $2, $3, $4, NOW())
    `, randomUUID(), id, 'Proprietário vinculado', 'Novo proprietário vinculado ao imóvel');

    res.json({ success: true });
  } catch (error) {
    console.error('[Properties Add Owner] Erro:', error);
    res.status(500).json({ error: 'Erro ao adicionar proprietário' });
  }
});

router.delete('/:id/owners/:ownerLinkId', async (req, res) => {
  try {
    const { id, ownerLinkId } = req.params;
    await executeRaw('DELETE FROM property_owners WHERE id = $1 AND property_id = $2', ownerLinkId, id);
    res.json({ success: true });
  } catch (error) {
    console.error('[Properties Remove Owner] Erro:', error);
    res.status(500).json({ error: 'Erro ao remover proprietário' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await queryRawOne('SELECT id FROM properties WHERE id = $1', id);
    if (!existing) { res.status(404).json({ error: 'Imóvel não encontrado' }); return; }
    await executeRaw('UPDATE properties SET deleted_at = NOW() WHERE id = $1', id);
    res.json({ success: true });
  } catch (error) {
    console.error('[Properties Delete] Erro:', error);
    res.status(500).json({ error: 'Erro ao mover imóvel para lixeira' });
  }
});

router.post('/:id/archive', async (req, res) => {
  try {
    const { id } = req.params;
    await executeRaw('UPDATE properties SET archived_at = NOW() WHERE id = $1', id);
    res.json({ success: true });
  } catch (error) {
    console.error('[Properties Archive] Erro:', error);
    res.status(500).json({ error: 'Erro ao arquivar imóvel' });
  }
});

export default router;
