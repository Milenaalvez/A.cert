import { PrismaClient } from '../src/generated/prisma/client.js';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';

const prisma = new PrismaClient({} as any);

async function main() {
  console.log('🌱 Iniciando seed...');

  const now = new Date().toISOString();
  const pass = bcrypt.hashSync('123456', 10);

  // Cert templates
  const templates = [
    { id: 'cert_trf1_civel', key: 'TRF1_CIVEL', label: 'TRF1 Cível', category: 'pessoal', siteUrl: 'https://sistemas.trf1.jus.br/certidao/#/solicitacao', ordem: 1, requiresOrgao: 'SEÇÃO JUDICIÁRIA DO DF', type: 'pessoa_fisica' },
    { id: 'cert_trf1_criminal', key: 'TRF1_CRIMINAL', label: 'TRF1 Criminal', category: 'pessoal', siteUrl: 'https://sistemas.trf1.jus.br/certidao/#/solicitacao', ordem: 2, requiresOrgao: 'TRIBUNAL REGIONAL FEDERAL DA 1ª REGIÃO (2º Grau)', type: 'pessoa_fisica', intervalMs: 5000 },
    { id: 'cert_tst', key: 'TST', label: 'TST — Tribunal Superior do Trabalho', category: 'pessoal', siteUrl: 'https://www.tst.jus.br/certidao1', ordem: 3, type: 'ambos' },
    { id: 'cert_trt', key: 'TRT', label: 'TRT 10ª Região — Certidão Trabalhista', category: 'pessoal', siteUrl: 'https://www.trt10.jus.br/certidao_online/jsf/publico/certidaoOnline.jsf', ordem: 4, type: 'ambos' },
    { id: 'cert_tjdft', key: 'TJDFT', label: 'TJDFT — Certidão Especial (Cível+Criminal)', category: 'pessoal', siteUrl: 'https://cnc.tjdft.jus.br/solicitacao-externa', ordem: 5, type: 'pessoa_fisica' },
    { id: 'cert_rf', key: 'RF', label: 'Receita Federal — CPF', category: 'pessoal', siteUrl: 'https://servicos.receitafederal.gov.br/servico/certidoes/#/home/cpf', ordem: 6, type: 'ambos' },
    { id: 'cert_sefaz_pf', key: 'SEFAZ_PF', label: 'SEFAZ-DF — Pessoa Física', category: 'fiscal', siteUrl: 'https://ww1.receita.fazenda.df.gov.br/cidadao/certidoes/Certidao', ordem: 7, type: 'pessoa_fisica' },
    { id: 'cert_sefaz_pj', key: 'SEFAZ_PJ', label: 'SEFAZ-DF — Pessoa Jurídica', category: 'fiscal', siteUrl: 'https://ww1.receita.fazenda.df.gov.br/cidadao/certidoes/Certidao', ordem: 8, type: 'pessoa_juridica' },
    { id: 'cert_sefaz_imovel', key: 'SEFAZ_IMOVEL', label: 'SEFAZ-DF — Imóvel', category: 'fiscal', siteUrl: 'https://ww1.receita.fazenda.df.gov.br/cidadao/certidoes/Certidao', ordem: 9, requiresInscricao: 1, type: 'imovel' },
    { id: 'cert_ficha', key: 'FICHA_CADASTRAL', label: 'Ficha Cadastral do Imóvel', category: 'imovel', siteUrl: 'https://ww1.receita.fazenda.df.gov.br/cidadao/consulta/imoveis/iptu-tlp/FichaCadastral', ordem: 10, requiresInscricao: 1, type: 'imovel' },
    { id: 'cert_onr', key: 'ONR', label: 'Certidão de Ônus (ONR)', category: 'imovel', siteUrl: 'https://registradores.onr.org.br/', ordem: 11, requiresCartorio: 1, type: 'imovel' },
  ];

  for (const t of templates) {
    await prisma.certificateTemplate.upsert({
      where: { key: t.key },
      create: { ...t, createdAt: now },
      update: {},
    });
  }

  // Organs
  const organs = [
    { id: 'org_1', name: 'Receita Federal', status: 'online' },
    { id: 'org_2', name: 'TJDFT', status: 'online' },
    { id: 'org_3', name: 'TRF1', status: 'online' },
    { id: 'org_4', name: 'SEFAZ-DF', status: 'offline' },
    { id: 'org_5', name: 'Cartórios', status: 'unstable' },
    { id: 'org_6', name: 'TRT', status: 'online' },
    { id: 'org_7', name: 'TST', status: 'online' },
    { id: 'org_8', name: 'Certidão de Ônus (ONR)', status: 'online' },
  ];
  for (const o of organs) {
    await prisma.organ.upsert({
      where: { id: o.id },
      create: { ...o, updatedAt: now },
      update: {},
    });
  }

  // Settings
  const settings = [
    { key: 'company_name', value: 'DONNOS Docs' },
    { key: 'company_legal_name', value: 'Bloco Imobiliária LTDA' },
    { key: 'company_cnpj', value: '00.000.000/0001-00' },
    { key: 'company_email', value: 'contato@blocoimob.com.br' },
    { key: 'company_phone', value: '(61) 3000-0000' },
    { key: 'company_site', value: 'https://donnos.com.br' },
    { key: 'smtp_host', value: 'smtp.hostinger.com' },
    { key: 'smtp_port', value: '465' },
    { key: 'smtp_user', value: '' },
    { key: 'smtp_pass', value: '' },
    { key: 'smtp_from_email', value: '' },
    { key: 'smtp_from_name', value: 'A.CERT' },
    { key: 'logo_url', value: '' },
    { key: 'logo_small_url', value: '' },
    { key: 'favicon_url', value: '' },
    { key: 'last_backup_at', value: '' },
    { key: 'backup_size', value: '0' },
  ];
  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      create: { ...s, updatedAt: now },
      update: {},
    });
  }

  // Departments and Positions
  await prisma.department.upsert({ where: { id: 'dept_1' }, create: { id: 'dept_1', name: 'Tecnologia', createdAt: now }, update: {} });
  await prisma.department.upsert({ where: { id: 'dept_2' }, create: { id: 'dept_2', name: 'Recursos Humanos', createdAt: now }, update: {} });
  await prisma.department.upsert({ where: { id: 'dept_3' }, create: { id: 'dept_3', name: 'Administração', createdAt: now }, update: {} });
  await prisma.department.upsert({ where: { id: 'dept_4' }, create: { id: 'dept_4', name: 'Financeiro', createdAt: now }, update: {} });
  await prisma.department.upsert({ where: { id: 'dept_5' }, create: { id: 'dept_5', name: 'Operações', createdAt: now }, update: {} });

  const positions = [
    { id: 'pos_1', name: 'Desenvolvedor Full Stack', departmentId: 'dept_1' },
    { id: 'pos_2', name: 'Desenvolvedor Frontend', departmentId: 'dept_1' },
    { id: 'pos_3', name: 'Analista de RH', departmentId: 'dept_2' },
    { id: 'pos_4', name: 'Coordenador de RH', departmentId: 'dept_2' },
    { id: 'pos_5', name: 'Analista Administrativo', departmentId: 'dept_3' },
    { id: 'pos_6', name: 'Gerente Administrativo', departmentId: 'dept_3' },
    { id: 'pos_7', name: 'Analista Financeiro', departmentId: 'dept_4' },
    { id: 'pos_8', name: 'Assistente Operacional', departmentId: 'dept_5' },
  ];
  for (const p of positions) {
    await prisma.position.upsert({ where: { id: p.id }, create: { ...p, createdAt: now }, update: {} });
  }

  // Users
  const users = [
    { id: 'u1', name: 'Milena Santos', email: 'milena@acert.com', role: 'ADMIN', departmentId: 'dept_3', positionId: 'pos_6', weeklyHours: 44, registrationNumber: '1001', phone: '(61) 99999-0101', hireDate: '2023-01-15' },
    { id: 'u2', name: 'Carlos Almeida', email: 'carlos@acert.com', role: 'RH', departmentId: 'dept_2', positionId: 'pos_4', registrationNumber: '1002', phone: '(61) 99999-0102', hireDate: '2023-03-01' },
    { id: 'u3', name: 'Maria Fernandes', email: 'maria@acert.com', role: 'EMPLOYEE', departmentId: 'dept_5', positionId: 'pos_8', registrationNumber: '1003', phone: '(61) 99999-0103', hireDate: '2024-01-10' },
    { id: 'u4', name: 'João Oliveira', email: 'joao@acert.com', role: 'DEVELOPER', departmentId: 'dept_1', positionId: 'pos_1', contractType: 'PJ', registrationNumber: '1004', phone: '(61) 99999-0104', hireDate: '2024-02-05' },
    { id: 'u5', name: 'Ana Santos', email: 'ana@acert.com', role: 'EMPLOYEE', departmentId: 'dept_5', positionId: 'pos_8', registrationNumber: '1005', phone: '(61) 99999-0105', hireDate: '2024-03-15' },
    { id: 'u6', name: 'Pedro Costa', email: 'pedro@acert.com', role: 'DEVELOPER', departmentId: 'dept_1', positionId: 'pos_2', registrationNumber: '1006', phone: '(61) 99999-0106', hireDate: '2024-04-20' },
    { id: 'u7', name: 'Lucia Oliveira', email: 'lucia@acert.com', role: 'EMPLOYEE', departmentId: 'dept_4', positionId: 'pos_7', registrationNumber: '1007', phone: '(61) 99999-0107', hireDate: '2024-06-01' },
    { id: 'u8', name: 'Roberto Lima', email: 'roberto@acert.com', role: 'EMPLOYEE', departmentId: 'dept_5', positionId: 'pos_8', contractType: 'ESTAGIO', weeklyHours: 30, registrationNumber: '1008', phone: '(61) 99999-0108', hireDate: '2025-01-10' },
    { id: 'u9', name: 'Fernanda Rocha', email: 'fernanda@acert.com', role: 'RH', departmentId: 'dept_2', positionId: 'pos_3', registrationNumber: '1009', phone: '(61) 99999-0109', hireDate: '2025-02-01' },
    { id: 'u10', name: 'Thiago Martins', email: 'thiago@acert.com', role: 'EMPLOYEE', departmentId: 'dept_5', positionId: 'pos_8', emailVerified: 0, registrationNumber: '1010', phone: '(61) 99999-0110', hireDate: '2025-02-15' },
  ];
  for (const u of users) {
    await prisma.user.upsert({
      where: { id: u.id },
      create: { ...u, passwordHash: pass, emailVerified: u.emailVerified ?? 1, createdAt: now },
      update: {},
    });
  }

  // Persons
  const persons = [
    { id: 'p1', name: 'João da Silva', cpf: '123.456.789-01', email: 'joao@email.com', phone: '(61) 99999-0001' },
    { id: 'p2', name: 'Maria Aparecida Silva', cpf: '123.456.789-02', email: 'maria@email.com', phone: '(61) 99999-0002' },
    { id: 'p3', name: 'Carlos Alberto Santos', cpf: '123.456.789-03', email: 'carlos@email.com', phone: '(61) 99999-0003' },
    { id: 'p4', name: 'Fernando Lima', cpf: '123.456.789-04', email: 'fernando@email.com', phone: '(61) 99999-0004' },
    { id: 'p5', name: 'Ana Beatriz Costa', cpf: '123.456.789-05', email: 'ana@email.com', phone: '(61) 99999-0005' },
  ];
  for (const p of persons) {
    await prisma.person.upsert({
      where: { id: p.id },
      create: { ...p, createdAt: now },
      update: {},
    });
  }

  // Properties
  const properties = [
    { id: 'prop1', identifier: 'APT-101', registration: '123.456', type: 'Apartamento', address: 'Quadra 101, Lote 5, Apt 101', ownerId: 'p1', neighborhood: 'Asa Sul', city: 'Brasília', state: 'DF', area: '85m²', notaryOffice: 'Cartório do 1º Ofício de Brasília' },
    { id: 'prop2', identifier: 'CASA-002', registration: '789.012', type: 'Casa', address: 'Rua das Flores, 123', ownerId: 'p2', neighborhood: 'Jardim Botânico', city: 'Brasília', state: 'DF', area: '220m²', landArea: '450m²', notaryOffice: 'Cartório do 2º Ofício de Brasília' },
    { id: 'prop3', identifier: 'TERR-003', registration: '345.678', type: 'Terreno', address: 'Av. Brasil, 500', ownerId: 'p3', status: 'Pendente', neighborhood: 'Setor Comercial Sul', city: 'Brasília', state: 'DF', landArea: '1000m²', notaryOffice: 'Cartório do 3º Ofício de Brasília' },
    { id: 'prop4', identifier: 'SALA-502', registration: '901.234', type: 'Sala Comercial', address: 'Ed. Trade Center, Sala 502', ownerId: 'p4', neighborhood: 'Asa Norte', city: 'Brasília', state: 'DF', area: '45m²', notaryOffice: 'Cartório do 1º Ofício de Brasília' },
    { id: 'prop5', identifier: 'CHAC-001', registration: '567.890', type: 'Chácara', address: 'Chácara Recanto Feliz', ownerId: 'p5', status: 'Em análise', neighborhood: 'Brazlândia', city: 'Brasília', state: 'DF', area: '180m²', landArea: '5000m²', notaryOffice: 'Cartório do 2º Ofício de Brasília' },
    { id: 'prop6', identifier: 'APT-202', registration: '112.233', type: 'Apartamento', address: 'Quadra 202, Lote 3, Apt 202', ownerId: 'p1', neighborhood: 'Asa Sul', city: 'Brasília', state: 'DF', area: '72m²', notaryOffice: 'Cartório do 1º Ofício de Brasília' },
    { id: 'prop7', identifier: 'SALA-101', registration: '445.566', type: 'Sala Comercial', address: 'Ed. Central, Sala 101', ownerId: 'p2', neighborhood: 'Setor Comercial Sul', city: 'Brasília', state: 'DF', area: '38m²', notaryOffice: 'Cartório do 3º Ofício de Brasília' },
    { id: 'prop8', identifier: 'GALP-001', registration: '778.899', type: 'Galpão', address: 'Av. Industrial, 2000', ownerId: 'p3', neighborhood: 'Setor Industrial', city: 'Brasília', state: 'DF', area: '500m²', landArea: '1200m²', notaryOffice: 'Cartório do 1º Ofício de Brasília' },
  ];
  for (const p of properties) {
    await prisma.property.upsert({
      where: { id: p.id },
      create: { ...p, createdAt: now, updatedAt: now },
      update: {},
    });
  }

  // Property Owners
  const pOwners = [
    { id: 'po1', propertyId: 'prop1', personId: 'p1', participation: 50 },
    { id: 'po2', propertyId: 'prop1', personId: 'p2', participation: 50 },
    { id: 'po3', propertyId: 'prop2', personId: 'p2', participation: 100 },
    { id: 'po4', propertyId: 'prop3', personId: 'p3', participation: 100 },
    { id: 'po5', propertyId: 'prop4', personId: 'p4', participation: 100 },
    { id: 'po6', propertyId: 'prop5', personId: 'p5', participation: 100 },
    { id: 'po7', propertyId: 'prop6', personId: 'p1', participation: 100 },
    { id: 'po8', propertyId: 'prop7', personId: 'p2', participation: 50 },
    { id: 'po9', propertyId: 'prop7', personId: 'p4', participation: 50 },
    { id: 'po10', propertyId: 'prop8', personId: 'p3', participation: 100 },
  ];
  for (const po of pOwners) {
    await prisma.propertyOwner.upsert({
      where: { id: po.id },
      create: { ...po, createdAt: now },
      update: {},
    });
  }

  console.log('✅ Seed concluído!');
}

main()
  .catch((e) => {
    console.error('❌ Seed falhou:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
