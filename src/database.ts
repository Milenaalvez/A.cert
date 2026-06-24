import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'data', 'acert.db');

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    phone TEXT,
    uf TEXT DEFAULT '',
    email_confirmed INTEGER NOT NULL DEFAULT 0,
    confirmation_token TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

// Migrações: adicionar colunas se não existirem
try { db.exec('ALTER TABLE users ADD COLUMN uf TEXT DEFAULT \'\''); } catch {}
try { db.exec('ALTER TABLE users ADD COLUMN email_confirmed INTEGER NOT NULL DEFAULT 0'); } catch {}
try { db.exec('ALTER TABLE users ADD COLUMN confirmation_token TEXT'); } catch {}
try { db.exec('ALTER TABLE users ADD COLUMN reset_token TEXT'); } catch {}
try { db.exec('ALTER TABLE users ADD COLUMN reset_token_expires TEXT'); } catch {}
try { db.exec('ALTER TABLE certificates ADD COLUMN document_path TEXT'); } catch {}
try { db.exec('ALTER TABLE dossiers ADD COLUMN observation TEXT DEFAULT \'\''); } catch {}
try { db.exec('ALTER TABLE users ADD COLUMN role TEXT DEFAULT \'EMPLOYE\''); } catch {}
try { db.exec('ALTER TABLE users ADD COLUMN department_id TEXT'); } catch {}
try { db.exec('ALTER TABLE users ADD COLUMN position_id TEXT'); } catch {}
try { db.exec('ALTER TABLE users ADD COLUMN contract_type TEXT DEFAULT \'CLT\''); } catch {}
try { db.exec('ALTER TABLE users ADD COLUMN weekly_hours INTEGER DEFAULT 40'); } catch {}
try { db.exec('ALTER TABLE users ADD COLUMN work_schedule TEXT DEFAULT \'Seg-Sex\''); } catch {}
try { db.exec('ALTER TABLE users ADD COLUMN hire_date TEXT'); } catch {}
try { db.exec('ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1'); } catch {}
try { db.exec('ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0'); } catch {}
try { db.exec('ALTER TABLE users ADD COLUMN last_access_at TEXT'); } catch {}
try { db.exec('ALTER TABLE users ADD COLUMN company_id TEXT'); } catch {}
try { db.exec('ALTER TABLE users ADD COLUMN avatar TEXT'); } catch {}
try { db.exec('ALTER TABLE users ADD COLUMN registration_number TEXT'); } catch {}
try { db.exec('ALTER TABLE users ADD COLUMN employee_code TEXT'); } catch {}
try { db.exec('ALTER TABLE persons ADD COLUMN cell_phone TEXT'); } catch {}
try { db.exec('ALTER TABLE persons ADD COLUMN rg TEXT'); } catch {}
try { db.exec('ALTER TABLE persons ADD COLUMN birth_date TEXT'); } catch {}
try { db.exec('ALTER TABLE persons ADD COLUMN marital_status TEXT DEFAULT \'\''); } catch {}
try { db.exec('ALTER TABLE persons ADD COLUMN nationality TEXT DEFAULT \'Brasileiro(a)\''); } catch {}
try { db.exec('ALTER TABLE persons ADD COLUMN zip_code TEXT'); } catch {}
try { db.exec('ALTER TABLE persons ADD COLUMN city TEXT'); } catch {}
try { db.exec('ALTER TABLE persons ADD COLUMN state TEXT'); } catch {}
try { db.exec('ALTER TABLE persons ADD COLUMN address TEXT'); } catch {}
try { db.exec('ALTER TABLE persons ADD COLUMN observation TEXT'); } catch {}
try { db.exec('ALTER TABLE properties ADD COLUMN registration TEXT DEFAULT \'\''); } catch {}
try { db.exec('ALTER TABLE properties ADD COLUMN notary_office TEXT DEFAULT \'\''); } catch {}
try { db.exec('ALTER TABLE properties ADD COLUMN status TEXT DEFAULT \'Regular\''); } catch {}
try { db.exec('ALTER TABLE properties ADD COLUMN neighborhood TEXT DEFAULT \'\''); } catch {}
try { db.exec('ALTER TABLE properties ADD COLUMN city TEXT DEFAULT \'\''); } catch {}
try { db.exec('ALTER TABLE properties ADD COLUMN state TEXT DEFAULT \'\''); } catch {}
try { db.exec('ALTER TABLE properties ADD COLUMN zip_code TEXT DEFAULT \'\''); } catch {}
try { db.exec('ALTER TABLE properties ADD COLUMN area TEXT DEFAULT \'\''); } catch {}
try { db.exec('ALTER TABLE properties ADD COLUMN land_area TEXT DEFAULT \'\''); } catch {}
try { db.exec('ALTER TABLE properties ADD COLUMN description TEXT DEFAULT \'\''); } catch {}
try { db.exec('ALTER TABLE properties ADD COLUMN updated_at TEXT DEFAULT \'\''); } catch {}
try { db.exec('UPDATE properties SET registration = NULL WHERE registration = \'\''); } catch {}
try {
  const missingReg = db.prepare("SELECT id, identifier FROM properties WHERE registration IS NULL").all() as { id: string; identifier: string }[];
  for (const p of missingReg) {
    const ts = Date.now().toString(36).toUpperCase().slice(-4);
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    const reg = `REG-${ts}-${rand}`;
    db.prepare("UPDATE properties SET registration = ? WHERE id = ?").run(reg, p.id);
  }
} catch {}
try { db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_properties_registration ON properties(registration)'); } catch {}
try {
  db.exec(`
    UPDATE dossiers SET identifier = identifier || '-' || substr(id, 1, 6)
    WHERE identifier IN (SELECT identifier FROM dossiers GROUP BY identifier HAVING COUNT(*) > 1)
  `);
} catch {}
try { db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_dossiers_identifier ON dossiers(identifier)'); } catch {}

db.exec(`
  CREATE TABLE IF NOT EXISTS departments (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS positions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    department_id TEXT REFERENCES departments(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS justifications (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',
    rh_response TEXT,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS time_records (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    date TEXT NOT NULL,
    clock_in TEXT,
    clock_out TEXT,
    break_start TEXT,
    break_end TEXT,
    total_minutes INTEGER,
    review_status TEXT DEFAULT 'PENDING',
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS user_permissions (
    user_id TEXT REFERENCES users(id),
    permission TEXT NOT NULL,
    PRIMARY KEY (user_id, permission)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS team_activities (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    user_name TEXT NOT NULL,
    action TEXT NOT NULL,
    description TEXT,
    entity_type TEXT,
    entity_id TEXT,
    target_user_id TEXT,
    target_user_name TEXT,
    timestamp TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS persons (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    cpf TEXT UNIQUE,
    email TEXT,
    phone TEXT,
    cell_phone TEXT,
    rg TEXT,
    birth_date TEXT,
    marital_status TEXT DEFAULT '',
    nationality TEXT DEFAULT 'Brasileiro(a)',
    zip_code TEXT,
    city TEXT,
    state TEXT,
    address TEXT,
    observation TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

// Add missing columns (safe - ignores if already exist)
try { db.exec(`ALTER TABLE persons ADD COLUMN mother_name TEXT DEFAULT ''`); } catch {}
try { db.exec(`ALTER TABLE persons ADD COLUMN father_name TEXT DEFAULT ''`); } catch {}
try { db.exec(`ALTER TABLE persons ADD COLUMN cnpj TEXT`); } catch {}
try { db.exec(`ALTER TABLE persons ADD COLUMN is_pre_cadastro INTEGER DEFAULT 0`); } catch {}
try { db.exec(`ALTER TABLE persons ADD COLUMN archived_at TEXT`); } catch {}
try { db.exec(`ALTER TABLE properties ADD COLUMN cartorio TEXT DEFAULT ''`); } catch {}
try { db.exec(`ALTER TABLE certificates ADD COLUMN cert_type TEXT DEFAULT ''`); } catch {}

db.exec(`
  CREATE TABLE IF NOT EXISTS person_relationships (
    id TEXT PRIMARY KEY,
    person_id TEXT NOT NULL REFERENCES persons(id),
    related_person_id TEXT NOT NULL REFERENCES persons(id),
    relationship_type TEXT NOT NULL DEFAULT 'parental',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(person_id, related_person_id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS properties (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    registration TEXT DEFAULT '',
    type TEXT NOT NULL DEFAULT 'Apartamento',
    address TEXT NOT NULL,
    owner_id TEXT REFERENCES persons(id),
    notary_office TEXT DEFAULT '',
    status TEXT DEFAULT 'Regular',
    neighborhood TEXT DEFAULT '',
    city TEXT DEFAULT '',
    state TEXT DEFAULT '',
    zip_code TEXT DEFAULT '',
    area TEXT DEFAULT '',
    land_area TEXT DEFAULT '',
    description TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS property_owners (
    id TEXT PRIMARY KEY,
    property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    person_id TEXT NOT NULL REFERENCES persons(id),
    participation REAL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(property_id, person_id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS property_timeline (
    id TEXT PRIMARY KEY,
    property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS dossiers (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    person_id TEXT REFERENCES persons(id),
    property_id TEXT REFERENCES properties(id),
    status TEXT NOT NULL DEFAULT 'Em andamento',
    priority TEXT NOT NULL DEFAULT 'Regular',
    created_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS certificates (
    id TEXT PRIMARY KEY,
    dossier_id TEXT REFERENCES dossiers(id),
    name TEXT NOT NULL,
    organ TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pendente',
    protocol TEXT,
    obtained_at TEXT,
    document_path TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    user_name TEXT NOT NULL,
    action TEXT NOT NULL,
    reference TEXT,
    dossier_ref TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS organs (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'online',
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS certificate_templates (
    id TEXT PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    label TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'pessoal',
    site_url TEXT DEFAULT '',
    ordem INTEGER NOT NULL DEFAULT 0,
    requires_orgao TEXT DEFAULT '',
    requires_cartorio INTEGER DEFAULT 0,
    requires_inscricao INTEGER DEFAULT 0,
    type TEXT NOT NULL DEFAULT 'pessoa_fisica',
    interval_ms INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

// Seed certificate templates
const certTemplateCount = (db.prepare('SELECT COUNT(*) as count FROM certificate_templates').get() as { count: number }).count;
if (certTemplateCount === 0) {
  const templates = [
    { id: "cert_trf1_civel", key: "TRF1_CIVEL", label: "TRF1 Cível", category: "pessoal", site_url: "https://sistemas.trf1.jus.br/certidao/#/solicitacao", ordem: 1, requires_orgao: "SEÇÃO JUDICIÁRIA DO DF", type: "pessoa_fisica" },
    { id: "cert_trf1_criminal", key: "TRF1_CRIMINAL", label: "TRF1 Criminal", category: "pessoal", site_url: "https://sistemas.trf1.jus.br/certidao/#/solicitacao", ordem: 2, requires_orgao: "TRIBUNAL REGIONAL FEDERAL DA 1ª REGIÃO (2º Grau)", type: "pessoa_fisica", interval_ms: 5000 },
    { id: "cert_tst", key: "TST", label: "TST — Tribunal Superior do Trabalho", category: "pessoal", site_url: "https://www.tst.jus.br/certidao1", ordem: 3, type: "ambos" },
    { id: "cert_trt", key: "TRT", label: "TRT 10ª Região — Certidão Trabalhista", category: "pessoal", site_url: "https://www.trt10.jus.br/certidao_online/jsf/publico/certidaoOnline.jsf", ordem: 4, type: "ambos" },
    { id: "cert_tjdft", key: "TJDFT", label: "TJDFT — Certidão Especial (Cível+Criminal)", category: "pessoal", site_url: "https://cnc.tjdft.jus.br/solicitacao-externa", ordem: 5, type: "pessoa_fisica" },
    { id: "cert_rf", key: "RF", label: "Receita Federal — CPF", category: "pessoal", site_url: "https://servicos.receitafederal.gov.br/servico/certidoes/#/home/cpf", ordem: 6, type: "ambos" },
    { id: "cert_sefaz_pf", key: "SEFAZ_PF", label: "SEFAZ-DF — Pessoa Física", category: "fiscal", site_url: "https://ww1.receita.fazenda.df.gov.br/cidadao/certidoes/Certidao", ordem: 7, type: "pessoa_fisica" },
    { id: "cert_sefaz_pj", key: "SEFAZ_PJ", label: "SEFAZ-DF — Pessoa Jurídica", category: "fiscal", site_url: "https://ww1.receita.fazenda.df.gov.br/cidadao/certidoes/Certidao", ordem: 8, type: "pessoa_juridica" },
    { id: "cert_sefaz_imovel", key: "SEFAZ_IMOVEL", label: "SEFAZ-DF — Imóvel", category: "fiscal", site_url: "https://ww1.receita.fazenda.df.gov.br/cidadao/certidoes/Certidao", ordem: 9, requires_inscricao: 1, type: "imovel" },
    { id: "cert_ficha", key: "FICHA_CADASTRAL", label: "Ficha Cadastral do Imóvel", category: "imovel", site_url: "https://ww1.receita.fazenda.df.gov.br/cidadao/consulta/imoveis/iptu-tlp/FichaCadastral", ordem: 10, requires_inscricao: 1, type: "imovel" },
    { id: "cert_onr", key: "ONR", label: "Certidão de Ônus (ONR)", category: "imovel", site_url: "https://registradores.onr.org.br/", ordem: 11, requires_cartorio: 1, type: "imovel" },
  ];
  const insert = db.prepare(`INSERT OR IGNORE INTO certificate_templates (id, key, label, category, site_url, ordem, requires_orgao, requires_cartorio, requires_inscricao, type, interval_ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const t of templates) {
    insert.run(t.id, t.key, t.label, t.category, t.site_url, t.ordem, t.requires_orgao || "", t.requires_cartorio || 0, t.requires_inscricao || 0, t.type, t.interval_ms || 0);
  }
}

// Settings table
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

// Support tickets table
db.exec(`
  CREATE TABLE IF NOT EXISTS support_tickets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Problema técnico',
    message TEXT NOT NULL,
    protocol TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'Aberto',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT
  )
`);

// Audit log table
db.exec(`
  CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    user_name TEXT,
    action TEXT NOT NULL,
    module TEXT NOT NULL,
    detail TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

// Seed settings if empty
const settingsCount = (db.prepare('SELECT COUNT(*) as count FROM settings').get() as { count: number }).count;
if (settingsCount === 0) {
  const defaultSettings = [
    { key: 'company_name', value: 'DONNOS Docs' },
    { key: 'company_legal_name', value: 'Bloco Imobiliária LTDA' },
    { key: 'company_cnpj', value: '00.000.000/0001-00' },
    { key: 'company_email', value: 'contato@blocoimob.com.br' },
    { key: 'company_phone', value: '(61) 3000-0000' },
    { key: 'company_site', value: 'https://donnos.com.br' },
    { key: 'smtp_host', value: '' },
    { key: 'smtp_port', value: '587' },
    { key: 'smtp_user', value: '' },
    { key: 'smtp_pass', value: '' },
    { key: 'smtp_from_email', value: 'noreply@donnos.com.br' },
    { key: 'smtp_from_name', value: 'DONNOS Docs' },
    { key: 'logo_url', value: '' },
    { key: 'logo_small_url', value: '' },
    { key: 'favicon_url', value: '' },
    { key: 'last_backup_at', value: '' },
    { key: 'backup_size', value: '0' },
  ];
  const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  for (const s of defaultSettings) {
    insertSetting.run(s.key, s.value);
  }
}

// Seed data only if tables are empty
const dossierCount = (db.prepare('SELECT COUNT(*) as count FROM dossiers').get() as { count: number }).count;

if (dossierCount === 0) {
  const now = new Date();

  db.exec(`
    INSERT INTO organs (id, name, status, updated_at) VALUES
      ('org_1', 'Receita Federal', 'online', datetime('now')),
      ('org_2', 'TJDFT', 'online', datetime('now')),
      ('org_3', 'TRF1', 'online', datetime('now')),
      ('org_4', 'SEFAZ-DF', 'offline', datetime('now')),
      ('org_5', 'Cartórios', 'unstable', datetime('now')),
      ('org_6', 'TRT', 'online', datetime('now')),
      ('org_7', 'TST', 'online', datetime('now')),
      ('org_8', 'Certidão de Ônus (ONR)', 'online', datetime('now'))
  `);

  db.exec(`
    INSERT INTO persons (id, name, cpf, email, phone, created_at) VALUES
      ('p1', 'João da Silva', '123.456.789-01', 'joao@email.com', '(61) 99999-0001', datetime('now', '-30 days')),
      ('p2', 'Maria Aparecida Silva', '123.456.789-02', 'maria@email.com', '(61) 99999-0002', datetime('now', '-28 days')),
      ('p3', 'Carlos Alberto Santos', '123.456.789-03', 'carlos@email.com', '(61) 99999-0003', datetime('now', '-25 days')),
      ('p4', 'Fernando Lima', '123.456.789-04', 'fernando@email.com', '(61) 99999-0004', datetime('now', '-20 days')),
      ('p5', 'Ana Beatriz Costa', '123.456.789-05', 'ana@email.com', '(61) 99999-0005', datetime('now', '-15 days'))
  `);

  db.exec(`
    INSERT INTO properties (id, identifier, registration, type, address, owner_id, status, neighborhood, city, state, area, land_area, notary_office, created_at, updated_at) VALUES
      ('prop1', 'APT-101', '123.456', 'Apartamento', 'Quadra 101, Lote 5, Apt 101', 'p1', 'Regular', 'Asa Sul', 'Brasília', 'DF', '85m²', '—', 'Cartório do 1º Ofício de Brasília', datetime('now', '-30 days'), datetime('now', '-2 days')),
      ('prop2', 'CASA-002', '789.012', 'Casa', 'Rua das Flores, 123', 'p2', 'Regular', 'Jardim Botânico', 'Brasília', 'DF', '220m²', '450m²', 'Cartório do 2º Ofício de Brasília', datetime('now', '-28 days'), datetime('now', '-5 days')),
      ('prop3', 'TERR-003', '345.678', 'Terreno', 'Av. Brasil, 500', 'p3', 'Pendente', 'Setor Comercial Sul', 'Brasília', 'DF', '—', '1000m²', 'Cartório do 3º Ofício de Brasília', datetime('now', '-25 days'), datetime('now', '-10 days')),
      ('prop4', 'SALA-502', '901.234', 'Sala Comercial', 'Ed. Trade Center, Sala 502', 'p4', 'Regular', 'Asa Norte', 'Brasília', 'DF', '45m²', '—', 'Cartório do 1º Ofício de Brasília', datetime('now', '-20 days'), datetime('now', '-8 days')),
      ('prop5', 'CHAC-001', '567.890', 'Chácara', 'Chácara Recanto Feliz', 'p5', 'Em análise', 'Brazlândia', 'Brasília', 'DF', '180m²', '5000m²', 'Cartório do 2º Ofício de Brasília', datetime('now', '-15 days'), datetime('now', '-3 days')),
      ('prop6', 'APT-202', '112.233', 'Apartamento', 'Quadra 202, Lote 3, Apt 202', 'p1', 'Regular', 'Asa Sul', 'Brasília', 'DF', '72m²', '—', 'Cartório do 1º Ofício de Brasília', datetime('now', '-12 days'), datetime('now', '-3 days')),
      ('prop7', 'SALA-101', '445.566', 'Sala Comercial', 'Ed. Central, Sala 101', 'p2', 'Regular', 'Setor Comercial Sul', 'Brasília', 'DF', '38m²', '—', 'Cartório do 3º Ofício de Brasília', datetime('now', '-10 days'), datetime('now', '-4 days')),
      ('prop8', 'GALP-001', '778.899', 'Galpão', 'Av. Industrial, 2000', 'p3', 'Regular', 'Setor Industrial', 'Brasília', 'DF', '500m²', '1200m²', 'Cartório do 1º Ofício de Brasília', datetime('now', '-8 days'), datetime('now', '-2 days'))
  `);

  db.exec(`
    INSERT INTO property_owners (id, property_id, person_id, participation) VALUES
      ('po1', 'prop1', 'p1', 50.0),
      ('po2', 'prop1', 'p2', 50.0),
      ('po3', 'prop2', 'p2', 100.0),
      ('po4', 'prop3', 'p3', 100.0),
      ('po5', 'prop4', 'p4', 100.0),
      ('po6', 'prop5', 'p5', 100.0),
      ('po7', 'prop6', 'p1', 100.0),
      ('po8', 'prop7', 'p2', 50.0),
      ('po9', 'prop7', 'p4', 50.0),
      ('po10', 'prop8', 'p3', 100.0)
  `);

  db.exec(`
    INSERT INTO property_timeline (id, property_id, action, description, created_at) VALUES
      ('pt1', 'prop1', 'Imóvel cadastrado', 'Imóvel cadastrado no sistema A.CERT', datetime('now', '-30 days')),
      ('pt2', 'prop1', 'Dossiê criado', 'Dossiê #2024-001 vinculado ao imóvel', datetime('now', '-30 days')),
      ('pt3', 'prop1', 'Certidão emitida', 'Certidão Negativa de Débitos Federais emitida', datetime('now', '-15 days')),
      ('pt4', 'prop1', 'Documento anexado', 'Matrícula atualizada anexada ao dossiê', datetime('now', '-8 days')),
      ('pt5', 'prop1', 'Certidão emitida', 'Certidão de Protestos emitida com sucesso', datetime('now', '-3 days')),
      ('pt6', 'prop2', 'Imóvel cadastrado', 'Imóvel cadastrado no sistema A.CERT', datetime('now', '-28 days')),
      ('pt7', 'prop2', 'Dossiê criado', 'Dossiê #2024-002 vinculado ao imóvel', datetime('now', '-25 days')),
      ('pt8', 'prop2', 'Certidão emitida', 'Certidão de Propriedade emitida', datetime('now', '-10 days')),
      ('pt9', 'prop2', 'Dossiê concluído', 'Dossiê #2024-002 finalizado', datetime('now', '-5 days')),
      ('pt10', 'prop3', 'Imóvel cadastrado', 'Imóvel cadastrado no sistema A.CERT', datetime('now', '-25 days'))
  `);

  const insertDossier = db.prepare(
    'INSERT INTO dossiers (id, identifier, person_id, property_id, status, priority, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );

  const insertCert = db.prepare(
    'INSERT INTO certificates (id, dossier_id, name, organ, status, protocol, obtained_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );

  const insertActivity = db.prepare(
    'INSERT INTO activities (id, user_name, action, reference, dossier_ref, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  );

  const dossiers = [
    ['d1', '#2024-001', 'p1', 'prop1', 'Em andamento', 'Urgente', 'Milena Santos', now, new Date(now.getTime() - 2 * 86400000)],
    ['d2', '#2024-002', 'p2', 'prop2', 'Concluído', 'Regular', 'Milena Santos', new Date(now.getTime() - 5 * 86400000), new Date(now.getTime() - 1 * 86400000)],
    ['d3', '#2024-003', 'p3', 'prop3', 'Pendente', 'Regular', 'Carlos Almeida', new Date(now.getTime() - 7 * 86400000), new Date(now.getTime() - 3 * 86400000)],
    ['d4', '#2024-004', 'p4', 'prop4', 'Concluído', 'Preferencial', 'Milena Santos', new Date(now.getTime() - 10 * 86400000), new Date(now.getTime() - 4 * 86400000)],
    ['d5', '#2024-005', 'p5', 'prop5', 'Em andamento', 'Regular', 'João Oliveira', new Date(now.getTime() - 12 * 86400000), new Date(now.getTime() - 6 * 86400000)],
    ['d6', '#2024-006', 'p1', 'prop1', 'Em andamento', 'Urgente', 'Maria Fernandes', new Date(now.getTime() - 14 * 86400000), new Date(now.getTime() - 7 * 86400000)],
    ['d7', '#2024-007', 'p2', 'prop2', 'Pendente', 'Urgente', 'Carlos Almeida', new Date(now.getTime() - 15 * 86400000), new Date(now.getTime() - 2 * 86400000)],
    ['d8', '#2024-008', 'p3', 'prop3', 'Em andamento', 'Regular', 'Milena Santos', new Date(now.getTime() - 18 * 86400000), new Date(now.getTime() - 8 * 86400000)],
    ['d9', '#2024-009', 'p4', 'prop4', 'Pendente', 'Pendente', 'Ana Santos', new Date(now.getTime() - 20 * 86400000), new Date(now.getTime() - 10 * 86400000)],
    ['d10', '#2024-010', 'p5', 'prop5', 'Em andamento', 'Regular', 'João Oliveira', new Date(now.getTime() - 22 * 86400000), new Date(now.getTime() - 5 * 86400000)],
  ];

  for (const d of dossiers) {
    insertDossier.run(d[0], d[1], d[2], d[3], d[4], d[5], d[6], (d[7] as Date).toISOString(), (d[8] as Date).toISOString());
  }

  const certNames = [
    { name: 'Certidão Negativa de Débitos Federais', organ: 'Receita Federal' },
    { name: 'Certidão de Ações Cíveis e Criminais', organ: 'TJDFT' },
    { name: 'Certidão de Protestos', organ: 'Cartórios' },
    { name: 'Certidão Trabalhista', organ: 'TRF1' },
    { name: 'Certidão de Propriedade', organ: 'Cartórios' },
    { name: 'Certidão de Ônus Reais', organ: 'Cartórios' },
    { name: 'Certidão de Débitos Municipais', organ: 'SEFAZ-DF' },
    { name: 'Certidão FGTS', organ: 'Receita Federal' },
    { name: 'Certidão de Ações Penais', organ: 'TJDFT' },
    { name: 'Certidão Eleitoral', organ: 'TRF1' },
  ];

  const meses = [5, 4, 3, 2, 1, 0];
  let certIdx = 0;

  for (const dossierRef of ['d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8', 'd9', 'd10']) {
    const numCerts = 2 + Math.floor(Math.random() * 4);
    for (let c = 0; c < numCerts && certIdx < certNames.length; c++) {
      const cn = certNames[certIdx % certNames.length];
      const isObtida = Math.random() > 0.25;
      const diasAtras = Math.floor(Math.random() * 60);
      const obtidaDate = new Date(now.getTime() - diasAtras * 86400000);

      insertCert.run(
        `cert_${dossierRef}_${c}`,
        dossierRef,
        cn.name,
        cn.organ,
        isObtida ? 'Obtida' : 'Pendente',
        isObtida ? `PROT-${String(1000 + certIdx)}` : null,
        isObtida ? obtidaDate.toISOString() : null,
        new Date(obtidaDate.getTime() - 86400000).toISOString()
      );
      certIdx++;
    }
  }

  const activityData = [
    ['Carlos Almeida', 'atualizou o dossiê', '#2024-007', 'd7'],
    ['Maria Fernandes', 'obteve certidão de propriedade', null, 'd2'],
    ['João Oliveira', 'criou um novo dossiê', '#2024-028', 'd10'],
    ['Ana Santos', 'resolveu uma pendência documental', '#2024-015', 'd3'],
    ['Pedro Costa', 'solicitou certidão de ônus reais', '#2024-022', 'd5'],
    ['Milena Santos', 'atualizou certidões do dossiê', '#2024-001', 'd1'],
  ];

  for (let i = 0; i < activityData.length; i++) {
    const a = activityData[i];
    insertActivity.run(
      `act_${i + 1}`,
      a[0], a[1], a[2], a[3],
      new Date(now.getTime() - i * 15 * 60000).toISOString()
    );
  }

  // ─── Team seed data ───
  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count;

  if (userCount === 0) {
    const seedPass = bcrypt.hashSync('123456', 10);

    db.exec(`
      INSERT INTO departments (id, name) VALUES
        ('dept_1', 'Tecnologia'),
        ('dept_2', 'Recursos Humanos'),
        ('dept_3', 'Administração'),
        ('dept_4', 'Financeiro'),
        ('dept_5', 'Operações')
    `);

    db.exec(`
      INSERT INTO positions (id, name, department_id) VALUES
        ('pos_1', 'Desenvolvedor Full Stack', 'dept_1'),
        ('pos_2', 'Desenvolvedor Frontend', 'dept_1'),
        ('pos_3', 'Analista de RH', 'dept_2'),
        ('pos_4', 'Coordenador de RH', 'dept_2'),
        ('pos_5', 'Analista Administrativo', 'dept_3'),
        ('pos_6', 'Gerente Administrativo', 'dept_3'),
        ('pos_7', 'Analista Financeiro', 'dept_4'),
        ('pos_8', 'Assistente Operacional', 'dept_5')
    `);

    db.exec(`
      INSERT INTO users (id, name, email, password_hash, role, department_id, position_id, contract_type, weekly_hours, work_schedule, hire_date, is_active, email_verified, registration_number, phone, created_at) VALUES
        ('u1', 'Milena Santos', 'milena@acert.com', '${seedPass}', 'ADMIN', 'dept_3', 'pos_6', 'CLT', 44, 'Seg-Sex', '2023-01-15', 1, 1, '1001', '(61) 99999-0101', datetime('now', '-90 days')),
        ('u2', 'Carlos Almeida', 'carlos@acert.com', '${seedPass}', 'RH', 'dept_2', 'pos_4', 'CLT', 40, 'Seg-Sex', '2023-03-01', 1, 1, '1002', '(61) 99999-0102', datetime('now', '-80 days')),
        ('u3', 'Maria Fernandes', 'maria@acert.com', '${seedPass}', 'EMPLOYEE', 'dept_5', 'pos_8', 'CLT', 40, 'Seg-Sex', '2024-01-10', 1, 1, '1003', '(61) 99999-0103', datetime('now', '-60 days')),
        ('u4', 'João Oliveira', 'joao@acert.com', '${seedPass}', 'DEVELOPER', 'dept_1', 'pos_1', 'PJ', 40, 'Seg-Sex', '2024-02-05', 1, 1, '1004', '(61) 99999-0104', datetime('now', '-50 days')),
        ('u5', 'Ana Santos', 'ana@acert.com', '${seedPass}', 'EMPLOYEE', 'dept_5', 'pos_8', 'CLT', 40, 'Seg-Sex', '2024-03-15', 1, 1, '1005', '(61) 99999-0105', datetime('now', '-45 days')),
        ('u6', 'Pedro Costa', 'pedro@acert.com', '${seedPass}', 'DEVELOPER', 'dept_1', 'pos_2', 'CLT', 40, 'Seg-Sex', '2024-04-20', 1, 1, '1006', '(61) 99999-0106', datetime('now', '-40 days')),
        ('u7', 'Lucia Oliveira', 'lucia@acert.com', '${seedPass}', 'EMPLOYEE', 'dept_4', 'pos_7', 'CLT', 40, 'Seg-Sex', '2024-06-01', 1, 1, '1007', '(61) 99999-0107', datetime('now', '-30 days')),
        ('u8', 'Roberto Lima', 'roberto@acert.com', '${seedPass}', 'EMPLOYEE', 'dept_5', 'pos_8', 'ESTAGIO', 30, 'Seg-Sex', '2025-01-10', 1, 1, '1008', '(61) 99999-0108', datetime('now', '-20 days')),
        ('u9', 'Fernanda Rocha', 'fernanda@acert.com', '${seedPass}', 'RH', 'dept_2', 'pos_3', 'CLT', 40, 'Seg-Sex', '2025-02-01', 1, 1, '1009', '(61) 99999-0109', datetime('now', '-15 days')),
        ('u10', 'Thiago Martins', 'thiago@acert.com', '${seedPass}', 'EMPLOYEE', 'dept_5', 'pos_8', 'CLT', 40, 'Seg-Sex', '2025-02-15', 1, 0, '1010', '(61) 99999-0110', datetime('now', '-10 days'))
    `);

    // Time records for today
    const today = new Date().toISOString().split('T')[0];
    const insertTimeRecord = db.prepare(
      'INSERT INTO time_records (id, user_id, date, clock_in, clock_out, break_start, break_end, total_minutes, review_status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );

    const presentUsers = ['u1', 'u2', 'u4', 'u5', 'u7', 'u9'];
    for (const uid of presentUsers) {
      const clockIn = '08:00';
      const clockOut = uid === 'u2' ? '17:30' : '18:00';
      const breakStart = '12:00';
      const breakEnd = '13:00';
      const total = uid === 'u2' ? 510 : 540;
      insertTimeRecord.run(
        `tr_${uid}_today`, uid, today, clockIn, clockOut, breakStart, breakEnd, total, 'APPROVED', new Date().toISOString()
      );
    }

    // Late user
    insertTimeRecord.run('tr_u3_today', 'u3', today, '08:25', null, null, null, null, 'PENDING', new Date().toISOString());

    // Time records for previous days (month)
    const monthRecs = [
      ['u1', '08:00', '18:00', 540], ['u2', '08:00', '17:30', 510], ['u4', '08:15', '18:00', 525],
      ['u5', '07:50', '18:05', 555], ['u7', '08:05', '17:55', 530], ['u9', '08:10', '18:00', 530],
    ];
    for (let d = 1; d <= 20; d++) {
      const dayStr = `${today.slice(0, 8)}${String(d).padStart(2, '0')}`;
      const createdAt = new Date(now.getTime() - (21 - d) * 86400000).toISOString();
      for (const [uid, ci, co, tot] of monthRecs) {
        insertTimeRecord.run(
          `tr_${uid}_${d}`, uid, dayStr, ci as string, co as string, '12:00', '13:00', tot as number, 'APPROVED', createdAt
        );
      }
    }

    // Justifications
    const insertJust = db.prepare(
      'INSERT INTO justifications (id, user_id, reason, description, status, start_date, end_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );

    const twoDaysAgo = new Date(now.getTime() - 2 * 86400000).toISOString();
    const oneDayAgo = new Date(now.getTime() - 1 * 86400000).toISOString();
    insertJust.run('just_1', 'u3', 'Consulta médica', 'Atestado de 1 dia', 'PENDING', today, today, twoDaysAgo);
    insertJust.run('just_2', 'u5', 'Problema pessoal', null, 'PENDING', today, today, oneDayAgo);
    insertJust.run('just_3', 'u8', 'Acompanhamento familiar', 'Acompanhando filho ao médico', 'APPROVED', '2025-05-10', '2025-05-10', new Date(now.getTime() - 30 * 86400000).toISOString());
    insertJust.run('just_4', 'u8', 'Problema pessoal', null, 'REJECTED', '2025-05-15', '2025-05-15', new Date(now.getTime() - 25 * 86400000).toISOString());
    db.prepare('UPDATE justifications SET rh_response = \'Justificativa não atende aos critérios da empresa.\' WHERE id = \'just_4\'').run();

    // Pending time records for review
    insertTimeRecord.run('tr_u8_pending', 'u8', today, '07:55', '18:10', '12:00', '13:00', 555, 'PENDING', new Date().toISOString());

    // Team activities
    const insertTeamAct = db.prepare(
      'INSERT INTO team_activities (id, user_id, user_name, action, description, entity_type, entity_id, target_user_id, target_user_name, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );

    const teamActs = [
      ['u1', 'Milena Santos', 'CREATE_USER', 'Criou o colaborador Thiago Martins', 'user', 'u10', null, null],
      ['u1', 'Milena Santos', 'UPDATE_USER', 'Alterou o cargo de Ana Santos', 'user', 'u5', null, null],
      ['u2', 'Carlos Almeida', 'APPROVE_JUSTIFICATION', 'Aprovou justificativa de Roberto Lima', 'justification', 'just_3', 'u8', 'Roberto Lima'],
      ['u2', 'Carlos Almeida', 'DEACTIVATE_USER', 'Desativou o acesso de um colaborador', 'user', 'old_u1', null, null],
      ['u1', 'Milena Santos', 'RESET_PASSWORD', 'Redefiniu a senha de Lucia Oliveira', 'user', 'u7', 'u7', 'Lucia Oliveira'],
      ['u4', 'João Oliveira', 'UPDATE_USER', 'Atualizou dados do próprio perfil', 'user', 'u4', null, null],
      ['u1', 'Milena Santos', 'CREATE_USER', 'Criou o colaborador Fernanda Rocha', 'user', 'u9', null, null],
      ['u2', 'Carlos Almeida', 'REJECT_JUSTIFICATION', 'Recusou justificativa de Roberto Lima', 'justification', 'just_4', 'u8', 'Roberto Lima'],
    ];

    for (let i = 0; i < teamActs.length; i++) {
      const [uid, uname, action, desc, etype, eid, tgtUid, tgtUname] = teamActs[i];
      insertTeamAct.run(
        `tact_${i + 1}`, uid, uname, action, desc, etype, eid, tgtUid, tgtUname,
        new Date(now.getTime() - i * 86400000).toISOString()
      );
    }

    // Permissions for admin
    db.prepare('INSERT OR IGNORE INTO user_permissions (user_id, permission) VALUES (?, ?)').run('u1', 'manage_members');
    db.prepare('INSERT OR IGNORE INTO user_permissions (user_id, permission) VALUES (?, ?)').run('u2', 'manage_members');
    db.prepare('INSERT OR IGNORE INTO user_permissions (user_id, permission) VALUES (?, ?)').run('u4', 'access_team');
  }
}

export default db;
