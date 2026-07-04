import 'dotenv/config';
import { executeRaw } from '../src/lib/prisma.js';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';

async function main() {
  console.log('🌱 Iniciando seed...');

  const now = new Date().toISOString();
  const pass = bcrypt.hashSync('123456', 10);

  const templates = [
    ['cert_trf1_civel', 'TRF1_CIVEL', 'TRF1 Cível', 'pessoal', 'https://sistemas.trf1.jus.br/certidao/#/solicitacao', 1, 'SEÇÃO JUDICIÁRIA DO DF', 0, 0, 'pessoa_fisica', 0],
    ['cert_trf1_criminal', 'TRF1_CRIMINAL', 'TRF1 Criminal', 'pessoal', 'https://sistemas.trf1.jus.br/certidao/#/solicitacao', 2, 'TRIBUNAL REGIONAL FEDERAL DA 1ª REGIÃO (2º Grau)', 0, 0, 'pessoa_fisica', 5000],
    ['cert_tst', 'TST', 'TST — Tribunal Superior do Trabalho', 'pessoal', 'https://www.tst.jus.br/certidao1', 3, '', 0, 0, 'ambos', 0],
    ['cert_trt', 'TRT', 'TRT 10ª Região — Certidão Trabalhista', 'pessoal', 'https://www.trt10.jus.br/certidao_online/jsf/publico/certidaoOnline.jsf', 4, '', 0, 0, 'ambos', 0],
    ['cert_tjdft', 'TJDFT', 'TJDFT — Certidão Especial (Cível+Criminal)', 'pessoal', 'https://cnc.tjdft.jus.br/solicitacao-externa', 5, '', 0, 0, 'pessoa_fisica', 0],
    ['cert_rf', 'RF', 'Receita Federal — CPF', 'pessoal', 'https://servicos.receitafederal.gov.br/servico/certidoes/#/home/cpf', 6, '', 0, 0, 'ambos', 0],
    ['cert_sefaz_pf', 'SEFAZ_PF', 'SEFAZ-DF — Pessoa Física', 'fiscal', 'https://ww1.receita.fazenda.df.gov.br/cidadao/certidoes/Certidao', 7, '', 0, 0, 'pessoa_fisica', 0],
    ['cert_sefaz_pj', 'SEFAZ_PJ', 'SEFAZ-DF — Pessoa Jurídica', 'fiscal', 'https://ww1.receita.fazenda.df.gov.br/cidadao/certidoes/Certidao', 8, '', 0, 0, 'pessoa_juridica', 0],
    ['cert_sefaz_imovel', 'SEFAZ_IMOVEL', 'SEFAZ-DF — Imóvel', 'fiscal', 'https://ww1.receita.fazenda.df.gov.br/cidadao/certidoes/Certidao', 9, '', 0, 1, 'imovel', 0],
    ['cert_ficha', 'FICHA_CADASTRAL', 'Ficha Cadastral do Imóvel', 'imovel', 'https://ww1.receita.fazenda.df.gov.br/cidadao/consulta/imoveis/iptu-tlp/FichaCadastral', 10, '', 0, 1, 'imovel', 0],
    ['cert_onr', 'ONR', 'Certidão de Ônus (ONR)', 'imovel', 'https://registradores.onr.org.br/', 11, '', 1, 0, 'imovel', 0],
  ];

  for (const t of templates) {
    await executeRaw(
      `INSERT INTO certificate_templates (id, key, label, category, site_url, ordem, requires_orgao, requires_cartorio, requires_inscricao, type, interval_ms, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT (key) DO NOTHING`,
      ...t, now
    );
  }
  console.log('  ✓ Templates de certidão');

  const organs = [
    ['org_1', 'Receita Federal', 'online'],
    ['org_2', 'TJDFT', 'online'],
    ['org_3', 'TRF1', 'online'],
    ['org_4', 'SEFAZ-DF', 'offline'],
    ['org_5', 'Cartórios', 'unstable'],
    ['org_6', 'TRT', 'online'],
    ['org_7', 'TST', 'online'],
    ['org_8', 'Certidão de Ônus (ONR)', 'online'],
  ];
  for (const o of organs) {
    await executeRaw(
      `INSERT INTO organs (id, name, status, updated_at) VALUES ($1,$2,$3,$4) ON CONFLICT (id) DO NOTHING`,
      ...o, now
    );
  }
  console.log('  ✓ Órgãos');

  const settings = [
    ['company_name', 'DONNOS Docs'],
    ['company_legal_name', 'Bloco Imobiliária LTDA'],
    ['company_cnpj', '00.000.000/0001-00'],
    ['company_email', 'contato@blocoimob.com.br'],
    ['company_phone', '(61) 3000-0000'],
    ['company_site', 'https://donnos.com.br'],
    ['smtp_host', 'smtp.hostinger.com'],
    ['smtp_port', '465'],
    ['smtp_user', ''],
    ['smtp_pass', ''],
    ['smtp_from_email', ''],
    ['smtp_from_name', 'A.CERT'],
    ['logo_url', ''],
    ['logo_small_url', ''],
    ['favicon_url', ''],
    ['last_backup_at', ''],
    ['backup_size', '0'],
  ];
  for (const s of settings) {
    await executeRaw(
      `INSERT INTO settings (key, value, updated_at) VALUES ($1,$2,$3) ON CONFLICT (key) DO NOTHING`,
      ...s, now
    );
  }
  console.log('  ✓ Configurações');

  const depts = [
    ['dept_1', 'Tecnologia'],
    ['dept_2', 'Recursos Humanos'],
    ['dept_3', 'Administração'],
    ['dept_4', 'Financeiro'],
    ['dept_5', 'Operações'],
  ];
  for (const d of depts) {
    await executeRaw(`INSERT INTO departments (id, name, created_at) VALUES ($1,$2,$3) ON CONFLICT (id) DO NOTHING`, ...d, now);
  }

  const positions = [
    ['pos_1', 'Desenvolvedor Full Stack', 'dept_1'],
    ['pos_2', 'Desenvolvedor Frontend', 'dept_1'],
    ['pos_3', 'Analista de RH', 'dept_2'],
    ['pos_4', 'Coordenador de RH', 'dept_2'],
    ['pos_5', 'Analista Administrativo', 'dept_3'],
    ['pos_6', 'Gerente Administrativo', 'dept_3'],
    ['pos_7', 'Analista Financeiro', 'dept_4'],
    ['pos_8', 'Assistente Operacional', 'dept_5'],
  ];
  for (const p of positions) {
    await executeRaw(`INSERT INTO positions (id, name, department_id, created_at) VALUES ($1,$2,$3,$4) ON CONFLICT (id) DO NOTHING`, ...p, now);
  }
  console.log('  ✓ Departamentos e cargos');

  const users = [
    ['u1', 'Milena Santos', 'milena@acert.com', 'ADMIN', 'dept_3', 'pos_6', 44, '1001', '(61) 99999-0101', '2023-01-15'],
    ['u2', 'Carlos Almeida', 'carlos@acert.com', 'RH', 'dept_2', 'pos_4', 40, '1002', '(61) 99999-0102', '2023-03-01'],
    ['u3', 'Maria Fernandes', 'maria@acert.com', 'EMPLOYEE', 'dept_5', 'pos_8', 40, '1003', '(61) 99999-0103', '2024-01-10'],
    ['u4', 'João Oliveira', 'joao@acert.com', 'DEVELOPER', 'dept_1', 'pos_1', 40, '1004', '(61) 99999-0104', '2024-02-05'],
    ['u5', 'Ana Santos', 'ana@acert.com', 'EMPLOYEE', 'dept_5', 'pos_8', 40, '1005', '(61) 99999-0105', '2024-03-15'],
    ['u6', 'Pedro Costa', 'pedro@acert.com', 'DEVELOPER', 'dept_1', 'pos_2', 40, '1006', '(61) 99999-0106', '2024-04-20'],
    ['u7', 'Lucia Oliveira', 'lucia@acert.com', 'EMPLOYEE', 'dept_4', 'pos_7', 40, '1007', '(61) 99999-0107', '2024-06-01'],
    ['u8', 'Roberto Lima', 'roberto@acert.com', 'EMPLOYEE', 'dept_5', 'pos_8', 30, '1008', '(61) 99999-0108', '2025-01-10'],
    ['u9', 'Fernanda Rocha', 'fernanda@acert.com', 'RH', 'dept_2', 'pos_3', 40, '1009', '(61) 99999-0109', '2025-02-01'],
    ['u10', 'Thiago Martins', 'thiago@acert.com', 'EMPLOYEE', 'dept_5', 'pos_8', 40, '1010', '(61) 99999-0110', '2025-02-15'],
  ];
  for (const u of users) {
    await executeRaw(
      `INSERT INTO users (id, name, email, password_hash, role, department_id, position_id, weekly_hours, contract_type, work_schedule, registration_number, phone, hire_date, email_confirmed, email_verified, is_active, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'CLT','Seg-Sex',$9,$10,$11,1,1,1,$12) ON CONFLICT (id) DO NOTHING`,
      u[0], u[1], u[2], pass, u[3], u[4], u[5], u[6], u[7], u[8], u[9], now
    );
  }
  console.log('  ✓ Usuários');

  const persons = [
    ['p1', 'João da Silva', '123.456.789-01', 'joao@email.com', '(61) 99999-0001'],
    ['p2', 'Maria Aparecida Silva', '123.456.789-02', 'maria@email.com', '(61) 99999-0002'],
    ['p3', 'Carlos Alberto Santos', '123.456.789-03', 'carlos@email.com', '(61) 99999-0003'],
    ['p4', 'Fernando Lima', '123.456.789-04', 'fernando@email.com', '(61) 99999-0004'],
    ['p5', 'Ana Beatriz Costa', '123.456.789-05', 'ana@email.com', '(61) 99999-0005'],
  ];
  for (const p of persons) {
    await executeRaw(`INSERT INTO persons (id, name, cpf, email, phone, created_at) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING`, ...p, now);
  }
  console.log('  ✓ Pessoas');

  const properties = [
    ['prop1', 'APT-101', '123.456', 'Apartamento', 'Quadra 101, Lote 5, Apt 101', 'p1', 'Asa Sul', 'Brasília', 'DF', '85m²', '', 'Cartório do 1º Ofício de Brasília'],
    ['prop2', 'CASA-002', '789.012', 'Casa', 'Rua das Flores, 123', 'p2', 'Jardim Botânico', 'Brasília', 'DF', '220m²', '450m²', 'Cartório do 2º Ofício de Brasília'],
    ['prop3', 'TERR-003', '345.678', 'Terreno', 'Av. Brasil, 500', 'p3', 'Setor Comercial Sul', 'Brasília', 'DF', '', '1000m²', 'Cartório do 3º Ofício de Brasília'],
    ['prop4', 'SALA-502', '901.234', 'Sala Comercial', 'Ed. Trade Center, Sala 502', 'p4', 'Asa Norte', 'Brasília', 'DF', '45m²', '', 'Cartório do 1º Ofício de Brasília'],
    ['prop5', 'CHAC-001', '567.890', 'Chácara', 'Chácara Recanto Feliz', 'p5', 'Brazlândia', 'Brasília', 'DF', '180m²', '5000m²', 'Cartório do 2º Ofício de Brasília'],
    ['prop6', 'APT-202', '112.233', 'Apartamento', 'Quadra 202, Lote 3, Apt 202', 'p1', 'Asa Sul', 'Brasília', 'DF', '72m²', '', 'Cartório do 1º Ofício de Brasília'],
    ['prop7', 'SALA-101', '445.566', 'Sala Comercial', 'Ed. Central, Sala 101', 'p2', 'Setor Comercial Sul', 'Brasília', 'DF', '38m²', '', 'Cartório do 3º Ofício de Brasília'],
    ['prop8', 'GALP-001', '778.899', 'Galpão', 'Av. Industrial, 2000', 'p3', 'Setor Industrial', 'Brasília', 'DF', '500m²', '1200m²', 'Cartório do 1º Ofício de Brasília'],
  ];
  for (const p of properties) {
    await executeRaw(
      `INSERT INTO properties (id, identifier, registration, type, address, owner_id, neighborhood, city, state, area, land_area, notary_office, status, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'Regular',$13,$13) ON CONFLICT (id) DO NOTHING`,
      ...p, now
    );
  }
  console.log('  ✓ Imóveis');

  const pOwners = [
    ['po1', 'prop1', 'p1', 50], ['po2', 'prop1', 'p2', 50], ['po3', 'prop2', 'p2', 100],
    ['po4', 'prop3', 'p3', 100], ['po5', 'prop4', 'p4', 100], ['po6', 'prop5', 'p5', 100],
    ['po7', 'prop6', 'p1', 100], ['po8', 'prop7', 'p2', 50], ['po9', 'prop7', 'p4', 50],
    ['po10', 'prop8', 'p3', 100],
  ];
  for (const po of pOwners) {
    await executeRaw(
      `INSERT INTO property_owners (id, property_id, person_id, participation, created_at) VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING`,
      ...po, now
    );
  }

  console.log('✅ Seed concluído!');
}

main()
  .catch((e) => {
    console.error('❌ Seed falhou:', e);
    process.exit(1);
  })
  .finally(() => process.exit(0));
