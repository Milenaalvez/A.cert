import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { ConsultaJob } from '../connectors/types.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

function formatarCPF(cpf: string): string {
  const d = cpf.replace(/\D/g, '');
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9,11)}`;
}

function formatarDataISO(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

export async function gerarDossiePDF(job: ConsultaJob): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const pageW = 595;
  const pageH = 842;
  const margin = 50;
  const w = pageW - 2 * margin;

  function addFooter(page: import('pdf-lib').PDFPage, num: number, total: number) {
    const { height } = page.getSize();
    page.drawLine({
      start: { x: margin, y: 45 },
      end: { x: pageW - margin, y: 45 },
      thickness: 0.5,
      color: rgb(0.42, 0.45, 0.5),
    });
    page.drawText('DONNOS Docs — Central de Certidões Imobiliárias', {
      x: margin, y: 32, size: 7, font, color: rgb(0.42, 0.45, 0.5),
    });
    page.drawText(`Página ${num} de ${total}`, {
      x: pageW - margin - 50, y: 32, size: 7, font, color: rgb(0.42, 0.45, 0.5),
    });
  }

  // ----- PAGE 1: Cover -----
  let page = doc.addPage([pageW, pageH]);
  const { height } = page.getSize();

  // Orange block
  page.drawRectangle({
    x: 0, y: height - 200, width: pageW, height: 200,
    color: rgb(0.91, 0.39, 0.10),
  });

  page.drawText('DONNOS Docs', {
    x: margin, y: height - 90, size: 34, font: fontBold, color: rgb(1, 1, 1),
  });
  page.drawText('Central de Certidões Imobiliárias', {
    x: margin, y: height - 118, size: 14, font, color: rgb(1, 1, 1),
  });
  page.drawText('Dossiê Consolidado de Certidões', {
    x: margin, y: height - 138, size: 11, font, color: rgb(1, 1, 1),
  });

  const lineY = height - 150;
  page.drawLine({
    start: { x: margin, y: lineY }, end: { x: pageW - margin, y: lineY },
    thickness: 0.5, color: rgb(1, 1, 1),
  });

  const numeroDossie = `DOSSIE-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`;
  page.drawText(`Nº do Dossiê: ${numeroDossie}`, {
    x: margin, y: height - 170, size: 10, font, color: rgb(1, 1, 1),
  });
  page.drawText(`Data: ${new Date().toLocaleDateString('pt-BR')}`, {
    x: margin, y: height - 184, size: 10, font, color: rgb(1, 1, 1),
  });

  // Owner data section
  let y = height - 240;
  page.drawText('Dados do Proprietário', {
    x: margin, y, size: 16, font: fontBold, color: rgb(0.10, 0.10, 0.18),
  });
  y -= 20;

  page.drawLine({
    start: { x: margin, y }, end: { x: pageW - margin, y },
    thickness: 1, color: rgb(0.9, 0.88, 0.85),
  });
  y -= 16;

  const fields = [
    { label: 'Nome Completo', value: job.dados.nome },
    { label: 'CPF', value: formatarCPF(job.dados.cpf) },
    { label: 'Data de Nascimento', value: formatarDataISO(job.dados.dataNascimento) },
    { label: 'Nome da Mãe', value: job.dados.nomeMae },
    { label: 'E-mail', value: job.dados.email },
  ];

  fields.forEach(f => {
    page.drawText(f.label, { x: margin, y, size: 9, font, color: rgb(0.42, 0.45, 0.5) });
    page.drawText(f.value, { x: margin + 120, y, size: 11, font: fontBold, color: rgb(0.10, 0.10, 0.18) });
    y -= 18;
  });

  addFooter(page, 1, 2 + job.resultados.filter(r => r.status === 'success').length);

  // ----- Certidão pages -----
  const sucessos = job.resultados.filter(r => r.status === 'success');
  for (let i = 0; i < sucessos.length; i++) {
    const res = sucessos[i];
    page = doc.addPage([pageW, pageH]);
    const h2 = page.getSize().height;

    // Header bar
    page.drawRectangle({
      x: 0, y: h2 - 40, width: pageW, height: 40,
      color: rgb(0.91, 0.39, 0.10),
    });

    page.drawText(`${i + 1}. ${res.orgao}`, {
      x: margin, y: h2 - 26, size: 13, font: fontBold, color: rgb(1, 1, 1),
    });

    page.drawText(`Protocolo: ${res.protocolo || 'N/A'}`, {
      x: pageW - margin - 100, y: h2 - 14, size: 8, font, color: rgb(1, 1, 1),
    });

    page.drawText('Status: Certidão emitida', {
      x: pageW - margin - 100, y: h2 - 26, size: 8, font, color: rgb(1, 1, 1),
    });

    // Info
    y = h2 - 70;
    page.drawText('Dados da Consulta', {
      x: margin, y, size: 13, font: fontBold, color: rgb(0.10, 0.10, 0.18),
    });
    y -= 20;
    page.drawLine({
      start: { x: margin, y }, end: { x: pageW - margin, y },
      thickness: 0.5, color: rgb(0.9, 0.88, 0.85),
    });
    y -= 16;

    const consultaFields = [
      { label: 'Órgão', value: res.orgao },
      { label: 'Proprietário', value: job.dados.nome },
      { label: 'CPF', value: formatarCPF(job.dados.cpf) },
      { label: 'Data da Consulta', value: formatarDataISO(res.dataConsulta) },
      { label: 'Protocolo', value: res.protocolo || 'N/A' },
    ];

    consultaFields.forEach(f => {
      page.drawText(f.label, { x: margin, y, size: 9, font, color: rgb(0.42, 0.45, 0.5) });
      page.drawText(f.value, { x: margin + 120, y, size: 11, font: fontBold, color: rgb(0.10, 0.10, 0.18) });
      y -= 18;
    });

    // Success badge
    y -= 8;
    page.drawRectangle({
      x: margin, y: y - 4, width: 200, height: 22,
      color: rgb(0.93, 0.98, 0.96),
    });
    page.drawText('[OK] Certidão emitida com sucesso', {
      x: margin + 8, y: y + 4, size: 10, font: fontBold, color: rgb(0.06, 0.73, 0.51),
    });
    y -= 36;

    // Embedded document note
    if (res.documento) {
      page.drawRectangle({
        x: margin, y: y - 4, width: w, height: 50,
        color: rgb(0.97, 0.95, 0.92),
      });
      page.drawText('Documento digital anexado a este dossiê', {
        x: margin + 10, y: y + 28, size: 10, font: fontBold, color: rgb(0.10, 0.10, 0.18),
      });
      page.drawText(`O PDF original emitido por ${res.orgao} foi incorporado ao dossiê consolidado.`, {
        x: margin + 10, y: y + 14, size: 9, font, color: rgb(0.42, 0.45, 0.5),
      });
      page.drawText(`Para visualizar o documento individualmente, utilize a opção "Visualizar" na tela de resultados.`, {
        x: margin + 10, y: y + 2, size: 9, font, color: rgb(0.42, 0.45, 0.5),
      });

      try {
        const certDoc = await PDFDocument.load(res.documento);
        const certPages = await doc.copyPages(certDoc, certDoc.getPageIndices());
        certPages.forEach(p => doc.addPage(p));
      } catch (e) {
        console.log(`[DossiePDF] Falha ao embedar PDF ${res.orgao}:`, e);
      }
    }

    const totalPages = doc.getPageCount();
    addFooter(page, 2 + i, totalPages);
  }

  // ----- Final page: Summary -----
  page = doc.addPage([pageW, pageH]);
  const h3 = page.getSize().height;

  page.drawRectangle({
    x: 0, y: h3 - 60, width: pageW, height: 60,
    color: rgb(0.91, 0.39, 0.10),
  });
  page.drawText('Resumo do Dossiê', {
    x: margin, y: h3 - 32, size: 18, font: fontBold, color: rgb(1, 1, 1),
  });
  page.drawText(numeroDossie, {
    x: margin, y: h3 - 48, size: 10, font, color: rgb(1, 1, 1),
  });

  y = h3 - 100;

  // Summary stats
  page.drawRectangle({
    x: margin, y: y - 10, width: w, height: 60,
    color: rgb(0.97, 0.95, 0.92),
  });

  const found = job.resultados.filter(r => r.status === 'success').length;
  const error = job.resultados.filter(r => r.status === 'error').length;
  const captcha = job.resultados.filter(r => r.status === 'captcha_required').length;

  page.drawText(String(found), {
    x: margin + 20, y: y + 32, size: 24, font: fontBold, color: rgb(0.91, 0.39, 0.10),
  });
  page.drawText('certidões emitidas', {
    x: margin + 20, y: y + 14, size: 10, font, color: rgb(0.42, 0.45, 0.5),
  });

  page.drawText(String(error + captcha), {
    x: margin + w - 70, y: y + 32, size: 24, font: fontBold, color: rgb(0.91, 0.39, 0.10),
  });
  page.drawText('certidões pendentes', {
    x: margin + w - 70, y: y + 14, size: 10, font, color: rgb(0.42, 0.45, 0.5),
  });

  y -= 80;

  // List
  page.drawText('Órgãos Consultados', {
    x: margin, y, size: 13, font: fontBold, color: rgb(0.10, 0.10, 0.18),
  });
  y -= 20;
  page.drawLine({
    start: { x: margin, y }, end: { x: pageW - margin, y },
    thickness: 0.5, color: rgb(0.9, 0.88, 0.85),
  });
  y -= 16;

  job.resultados.forEach(res => {
    const isSuccess = res.status === 'success';
    const marker = isSuccess ? 'OK' : '..';
    const statusText = isSuccess ? 'Inclusa' : res.status === 'captcha_required' ? 'CAPTCHA' : 'Indisponível';

    page.drawText(marker, { x: margin, y, size: 11, font, color: isSuccess ? rgb(0.06, 0.73, 0.51) : rgb(0.6, 0.6, 0.6) });
    page.drawText(res.orgao, { x: margin + 16, y, size: 11, font: fontBold, color: rgb(0.10, 0.10, 0.18) });
    page.drawText(statusText, { x: pageW - margin - 60, y, size: 10, font, color: isSuccess ? rgb(0.06, 0.73, 0.51) : rgb(0.6, 0.6, 0.6) });
    y -= 18;
  });

  y -= 20;
  page.drawLine({
    start: { x: margin, y }, end: { x: pageW - margin, y },
    thickness: 0.5, color: rgb(0.9, 0.88, 0.85),
  });
  y -= 14;

  page.drawText(`Dossiê gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, {
    x: margin, y, size: 8, font, color: rgb(0.6, 0.6, 0.6),
  });
  y -= 12;
  page.drawText('DONNOS Docs — Central de Certidões Imobiliárias', {
    x: margin, y, size: 8, font, color: rgb(0.6, 0.6, 0.6),
  });

  const total = doc.getPageCount();
  addFooter(page, total, total);

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}

export async function gerarDossiePDFFromDB(data: {
  identifier: string; status: string; priority: string; responsible: string;
  transactionType?: string;
  observation: string; createdAt: string; updatedAt: string;
  person: { id: string; name: string; cpf: string | null; rg: string | null; mother_name?: string; father_name?: string; email?: string } | null;
  property: { identifier: string; type: string; address: string; registration: string | null; cartorio?: string } | null;
  certificateCount: number; certificatesObtidas: number; certificatesPendentes: number; progress: number;
  certificates: { id: string; name: string; organ: string; status: string; protocol: string | null; obtained_at: string | null; created_at: string; person_id?: string; document_path?: string }[];
  participants?: { id: string; name: string; cpf: string | null; role: string; certTotal: number; certObtidas: number }[];
  documents?: { id: string; dossier_id: string; person_id: string | null; name: string; label: string; file_path: string; file_type: string; file_size: number; uploaded_at: string }[];
}): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const pageW = 595;
  const pageH = 842;
  const margin = 50;
  const w = pageW - 2 * margin;

  // Load logo
  let logoImage: import('pdf-lib').PDFImage | null = null;
  try {
    const logoPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'frontend', 'public', 'images', 'logo.png');
    if (fs.existsSync(logoPath)) {
      const logoBytes = fs.readFileSync(logoPath);
      logoImage = await doc.embedPng(logoBytes);
    }
  } catch { /* logo not found */ }

  function addFooter(page: import('pdf-lib').PDFPage, num: number, total: number) {
    page.drawLine({
      start: { x: margin, y: 45 }, end: { x: pageW - margin, y: 45 },
      thickness: 0.5, color: rgb(0.42, 0.45, 0.5),
    });
    page.drawText('A.CERT — Automação de Certidões Imobiliárias', {
      x: margin, y: 32, size: 7, font, color: rgb(0.42, 0.45, 0.5),
    });
    page.drawText(`Página ${num} de ${total}`, {
      x: pageW - margin - 50, y: 32, size: 7, font, color: rgb(0.42, 0.45, 0.5),
    });
  }

  function checkPageBreak(pg: import('pdf-lib').PDFPage, yy: number, needed = 60): { page: import('pdf-lib').PDFPage; y: number } {
    if (yy < needed + 50) {
      const newPg = doc.addPage([pageW, pageH]);
      pageNum++;
      return { page: newPg, y: pageH - 50 };
    }
    return { page: pg, y: yy };
  }

  function drawSectionHeader(page: import('pdf-lib').PDFPage, title: string, y: number) {
    page.drawText(title, { x: margin, y, size: 14, font: fontBold, color: rgb(0.91, 0.39, 0.10) });
    page.drawLine({ start: { x: margin, y: y - 4 }, end: { x: pageW - margin, y: y - 4 }, thickness: 0.5, color: rgb(0.91, 0.39, 0.10) });
    return y - 18;
  }

  function drawField(page: import('pdf-lib').PDFPage, label: string, value: string, y: number) {
    page.drawText(label, { x: margin, y, size: 8, font, color: rgb(0.42, 0.45, 0.5) });
    page.drawText(value || '—', { x: margin + 120, y, size: 10, font: fontBold, color: rgb(0.10, 0.10, 0.18) });
    return y - 16;
  }

  const transactionLabel = data.transactionType === 'locacao' ? 'Locação' : 'Compra e Venda';
  const participantCount = data.participants?.length || 1;
  let total = 999; // placeholder, recalculated at the end
  let pageNum = 0;

  // ----- PAGE 1: Cover with logo -----
  let page = doc.addPage([pageW, pageH]);
  const { height } = page.getSize();
  pageNum++;
  total++;

  let y = height - 60;

  // Logo
  if (logoImage) {
    const logoW = 64;
    const logoH = 64;
    page.drawImage(logoImage, { x: (pageW - logoW) / 2, y: y - logoH + 12, width: logoW, height: logoH });
    y -= logoH + 16;
  } else {
    y -= 30;
  }

  // Title
  page.drawText('A', { x: margin + (w - 95) / 2, y, size: 30, font: fontBold, color: rgb(0.10, 0.10, 0.18) });
  page.drawText('CERT', { x: margin + (w - 95) / 2 + 20, y, size: 30, font: fontBold, color: rgb(0.91, 0.39, 0.10) });
  y -= 38;

  page.drawText('Dossiê Consolidado de Certidões', {
    x: margin, y, size: 14, font: fontBold, color: rgb(0.10, 0.10, 0.18),
  });
  y -= 24;

  // Divider
  page.drawLine({ start: { x: margin, y }, end: { x: pageW - margin, y }, thickness: 1, color: rgb(0.91, 0.39, 0.10) });
  y -= 20;

  // Info block
  const infoItems = [
    `Nº do Dossiê: ${data.identifier}`,
    `Tipo: ${transactionLabel}`,
    `Data de Emissão: ${new Date(data.createdAt).toLocaleDateString('pt-BR')}`,
    `Status: ${data.status}   |   ${participantCount} participante${participantCount > 1 ? 's' : ''}`,
    `Responsável: ${data.responsible || 'N/A'}`,
  ];
  infoItems.forEach(item => {
    page.drawText(item, { x: margin + 10, y, size: 10, font, color: rgb(0.42, 0.45, 0.5) });
    y -= 16;
  });

  y -= 10;
  page.drawLine({ start: { x: margin, y }, end: { x: pageW - margin, y }, thickness: 0.5, color: rgb(0.9, 0.88, 0.85) });
  y -= 18;

  // Summary
  page.drawText('SUMÁRIO', { x: margin, y, size: 13, font: fontBold, color: rgb(0.10, 0.10, 0.18) });
  y -= 20;

  let summaryItems = [
    `1. Participantes (${participantCount})`,
  ];
  if (data.property) summaryItems.push('2. Informações do Imóvel');
  if (data.documents && data.documents.length > 0) summaryItems.push(`${data.property ? '3' : '2'}. Documentos Anexados (${data.documents.length})`);
  const certsNumIdx = data.property ? (data.documents && data.documents.length > 0 ? '4' : '3') : (data.documents && data.documents.length > 0 ? '3' : '2');
  summaryItems.push(`${certsNumIdx}. Certidões (${data.certificateCount} ${data.certificateCount === 1 ? 'registro' : 'registros'})`);
  const summaryNumIdx = String(parseInt(certsNumIdx) + 1);
  summaryItems.push(`${summaryNumIdx}. Resumo e Estatísticas`);
  summaryItems.forEach(item => {
    page.drawText(item, { x: margin + 10, y, size: 10, font, color: rgb(0.10, 0.10, 0.18) });
    y -= 16;
  });

  y -= 30; // spacing after sumário

  // Before participants: check if we need a new page
  const capaBrk = checkPageBreak(page, y, 100);
  page = capaBrk.page; y = capaBrk.y;

  // ----- Participants pages -----
  if (data.participants && data.participants.length > 0) {
    for (const participant of data.participants) {
      const participantNeeded = 100 + (data.certificates.filter(c => c.person_id === participant.id).length * 15);
      const pBrk = checkPageBreak(page, y, participantNeeded);
      page = pBrk.page; y = pBrk.y;

      const roleLabel: Record<string, string> = {
        proprietario: 'Proprietário', comprador: 'Comprador', vendedor: 'Vendedor',
        locador: 'Locador', locatario: 'Locatário',
      };
      y = drawSectionHeader(page, `PARTICIPANTE: ${participant.name.toUpperCase()}`, y);

      const pFields = [
        { label: 'Papel', value: roleLabel[participant.role] || participant.role },
        { label: 'CPF', value: participant.cpf || '—' },
        { label: 'Certidões Obtidas', value: `${participant.certObtidas} de ${participant.certTotal}` },
      ];
      pFields.forEach(f => { y = drawField(page, f.label, f.value, y); });

      y -= 12;
      page.drawLine({ start: { x: margin, y }, end: { x: pageW - margin, y }, thickness: 0.5, color: rgb(0.91, 0.39, 0.10) });
      y -= 14;

      const personCerts = data.certificates.filter(c => c.person_id === participant.id);
      if (personCerts.length > 0) {
        page.drawText('Certidões desta pessoa:', { x: margin, y, size: 10, font: fontBold, color: rgb(0.10, 0.10, 0.18) });
        y -= 16;
        personCerts.forEach(cert => {
          const brk = checkPageBreak(page, y, 30);
          page = brk.page; y = brk.y;
          const isObtida = cert.status === 'Obtida';
          page.drawText(isObtida ? 'OK' : '..', { x: margin, y, size: 9, font: fontBold, color: isObtida ? rgb(0.06, 0.73, 0.51) : rgb(0.6, 0.6, 0.6) });
          page.drawText(`${cert.name} — ${cert.protocol || 'Sem protocolo'}`, { x: margin + 14, y, size: 9, font, color: rgb(0.10, 0.10, 0.18) });
          y -= 14;
        });
      }
      y -= 24; // spacing after participant
    }
  } else if (data.person) {
    const pBrk = checkPageBreak(page, y, 140);
    page = pBrk.page; y = pBrk.y;

    y = drawSectionHeader(page, '1. DADOS DO CLIENTE', y);

    const personFields = [
      { label: 'Nome Completo', value: data.person.name || '—' },
      { label: 'CPF', value: data.person.cpf || '—' },
      { label: 'RG', value: data.person.rg || '—' },
      { label: 'Nome da Mãe', value: data.person.mother_name || '—' },
      { label: 'Nome do Pai', value: data.person.father_name || '—' },
      { label: 'E-mail', value: data.person.email || '—' },
    ];
    personFields.forEach(f => { y = drawField(page, f.label, f.value, y); });

    y -= 20;
    page.drawRectangle({
      x: margin, y: y - 4, width: w, height: 40,
      color: rgb(0.97, 0.95, 0.92),
    });
    page.drawText('Dossiê vinculado ao titular acima', {
      x: margin + 10, y: y + 20, size: 9, font: fontBold, color: rgb(0.10, 0.10, 0.18),
    });
    page.drawText(`Cadastrado em: ${new Date(data.createdAt).toLocaleDateString('pt-BR')}`, {
      x: margin + 10, y: y + 8, size: 8, font, color: rgb(0.42, 0.45, 0.5),
    });

  }

  // ----- Property page -----
  if (data.property) {
    const propBrk = checkPageBreak(page, y, 120);
    page = propBrk.page; y = propBrk.y;

    y = drawSectionHeader(page, 'INFORMAÇÕES DO IMÓVEL', y);

    const propFields = [
      { label: 'Identificador', value: data.property.identifier || '—' },
      { label: 'Tipo', value: data.property.type || '—' },
      { label: 'Matrícula', value: data.property.registration || 'Não informada' },
      { label: 'Endereço', value: data.property.address || '—' },
    ];
    if (data.property.cartorio) {
      propFields.push({ label: 'Cartório', value: data.property.cartorio });
    }
    propFields.forEach(f => { y = drawField(page, f.label, f.value, y); });

    y -= 24; // spacing after property
  }

  // ----- Per-document pages (title + embed) -----
  if (data.documents && data.documents.length > 0) {
    const roleLabel: Record<string, string> = {
      proprietario: 'Proprietário', comprador: 'Comprador', vendedor: 'Vendedor',
      locador: 'Locador', locatario: 'Locatário',
    };

    for (const docItem of data.documents) {
      const docBrk = checkPageBreak(page, y, 200);
      page = docBrk.page; y = docBrk.y;

      let docOwner = '';
      if (docItem.person_id && data.participants) {
        const p = data.participants.find(pp => pp.id === docItem.person_id);
        if (p) docOwner = ` — ${roleLabel[p.role] || p.role}: ${p.name}`;
      } else if (!docItem.person_id) {
        docOwner = ' — Imóvel';
      }

      page.drawText('DOCUMENTO', { x: margin, y, size: 10, font: fontBold, color: rgb(0.91, 0.39, 0.10) });
      y -= 18;
      page.drawText(docItem.name, { x: margin, y, size: 16, font: fontBold, color: rgb(0.10, 0.10, 0.18) });
      y -= 22;
      page.drawLine({ start: { x: margin, y }, end: { x: pageW - margin, y }, thickness: 0.5, color: rgb(0.91, 0.39, 0.10) });
      y -= 18;

      const docFields = [
        { label: 'Arquivo', value: docItem.label || '-' },
        { label: 'Origem', value: docOwner ? docOwner.replace(/^ — /, '') : 'Imóvel' },
        { label: 'Data', value: new Date(docItem.uploaded_at).toLocaleDateString('pt-BR') },
        { label: 'Enviado por', value: (docItem as any).uploaded_by || (docItem as any).uploadedBy || '—' },
      ];
      if ((docItem as any).description) {
        docFields.push({ label: 'Descrição', value: (docItem as any).description });
      }
      docFields.forEach(f => { y = drawField(page, f.label, f.value, y); });

      y -= 20;
      page.drawText('O conteúdo deste documento está incorporado nas páginas seguintes.', {
        x: margin, y, size: 8, font, color: rgb(0.6, 0.6, 0.6),
      });

      // Embed the document PDF
      if (docItem.file_type === 'application/pdf' || docItem.file_path?.endsWith('.pdf')) {
        try {
          const absPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', docItem.file_path);
          if (fs.existsSync(absPath)) {
            const docPdf = await PDFDocument.load(fs.readFileSync(absPath));
            const docPages = await doc.copyPages(docPdf, docPdf.getPageIndices());
            docPages.forEach((p: import('pdf-lib').PDFPage) => doc.addPage(p));
            pageNum += docPages.length;
          }
        } catch {}
      }
      y -= 24; // spacing after document
    }
  }

  // ----- Per-cert pages (title + embed) -----
  const certsWithPDF = data.certificates.filter(c => c.status === 'Obtida' && c.document_path) as typeof data.certificates & { document_path: string }[];
  if (certsWithPDF.length > 0) {
    const baseDir = path.dirname(fileURLToPath(import.meta.url));
    for (const cert of certsWithPDF) {
      const certBrk = checkPageBreak(page, y, 200);
      page = certBrk.page; y = certBrk.y;

      page.drawText('CERTIDÃO', { x: margin, y, size: 10, font: fontBold, color: rgb(0.06, 0.73, 0.51) });
      y -= 18;
      page.drawText(cert.name, { x: margin, y, size: 16, font: fontBold, color: rgb(0.10, 0.10, 0.18) });
      y -= 22;
      page.drawLine({ start: { x: margin, y }, end: { x: pageW - margin, y }, thickness: 0.5, color: rgb(0.06, 0.73, 0.51) });
      y -= 18;

      const certFields = [
        { label: 'Órgão', value: cert.organ || '—' },
        { label: 'Protocolo', value: cert.protocol || '—' },
        { label: 'Status', value: 'Obtida' },
        { label: 'Data de obtenção', value: cert.obtained_at ? new Date(cert.obtained_at).toLocaleDateString('pt-BR') : '—' },
      ];
      if (cert.person_id && data.participants) {
        const person = data.participants.find(p => p.id === cert.person_id);
        if (person) certFields.push({ label: 'Pessoa', value: person.name });
      }
      certFields.forEach(f => { y = drawField(page, f.label, f.value, y); });

      y -= 20;
      page.drawText('O documento oficial está incorporado nas páginas seguintes.', {
        x: margin, y, size: 8, font, color: rgb(0.6, 0.6, 0.6),
      });

      // Embed the cert PDF
      try {
        const certAbsPath = path.join(baseDir, '..', '..', cert.document_path);
        if (fs.existsSync(certAbsPath)) {
          const certDoc = await PDFDocument.load(fs.readFileSync(certAbsPath));
          if (certDoc.getPageCount() > 0) {
            const certPages = await doc.copyPages(certDoc, certDoc.getPageIndices());
            certPages.forEach(p => doc.addPage(p));
            pageNum += certPages.length;
          }
        }
      } catch (e) {
        console.log(`[DossiePDF] Falha ao embedar certidão ${cert.name}:`, e);
      }
      y -= 24; // spacing after cert
    }
  }

  // ----- Certificate summary page -----
  if (data.certificates.length > 0) {
    const certSumBrk = checkPageBreak(page, y, 180);
    page = certSumBrk.page; y = certSumBrk.y;

    y = drawSectionHeader(page, `CERTIDÕES (${data.certificateCount} ${data.certificateCount === 1 ? 'registro' : 'registros'})`, y);

    page.drawText('Resumo', { x: margin, y, size: 10, font: fontBold, color: rgb(0.10, 0.10, 0.18) });
    y -= 16;
    page.drawText(`Obtidas: ${data.certificatesObtidas}   |   Pendentes: ${data.certificatesPendentes}   |   Progresso: ${data.progress}%`, {
      x: margin, y, size: 9, font, color: rgb(0.42, 0.45, 0.5),
    });
    y -= 20;

    page.drawLine({ start: { x: margin, y }, end: { x: pageW - margin, y }, thickness: 0.3, color: rgb(0.9, 0.88, 0.85) });
    y -= 14;

    function truncateText(text: string, maxWidth: number, fontSize: number): string {
      let w = 0;
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        const cw = ch >= 'A' && ch <= 'Z' || ch >= 'À' && ch <= 'Ú' ? 0.65 : ch >= 'a' && ch <= 'z' || ch >= 'à' && ch <= 'ú' ? 0.5 : ch >= '0' && ch <= '9' ? 0.55 : 0.3;
        w += cw * fontSize;
        if (w > maxWidth) return text.slice(0, Math.max(0, i - 3)) + '...';
      }
      return text;
    }

    const nameColW = 205, protColW = 95, statusColW = 65, dateColW = 75;
    const nameColX = margin;
    const protColX = nameColX + nameColW;
    const statusColX = protColX + protColW;
    const dateColX = statusColX + statusColW;

    const headers = ['Certidão', 'Protocolo', 'Status', 'Data'];
    headers.forEach((h, i) => {
      const cx = [nameColX, protColX, statusColX, dateColX][i];
      page.drawText(h, { x: cx, y, size: 8, font: fontBold, color: rgb(0.42, 0.45, 0.5) });
    });
    y -= 12;
    page.drawLine({ start: { x: margin, y }, end: { x: pageW - margin, y }, thickness: 0.3, color: rgb(0.9, 0.88, 0.85) });
    y -= 12;

    data.certificates.forEach(cert => {
      const isObtida = cert.status === 'Obtida';

      page.drawText(truncateText(cert.name, nameColW - 6, 8), { x: nameColX, y, size: 8, font: fontBold, color: rgb(0.10, 0.10, 0.18) });
      page.drawText(cert.protocol || '—', { x: protColX, y, size: 8, font, color: rgb(0.10, 0.10, 0.18) });
      page.drawText(isObtida ? 'Obtida' : 'Pendente', { x: statusColX, y, size: 8, font, color: isObtida ? rgb(0.06, 0.73, 0.51) : rgb(0.6, 0.6, 0.6) });
      page.drawText(cert.obtained_at ? new Date(cert.obtained_at).toLocaleDateString('pt-BR') : '—', { x: dateColX, y, size: 8, font, color: rgb(0.10, 0.10, 0.18) });

      y -= 14;

      if (y < 70) {
        page = doc.addPage([pageW, pageH]);
        pageNum++;
        y = height - 50;

        // Repeat table headers on new page
        headers.forEach((h, i) => {
          const cx = [nameColX, protColX, statusColX, dateColX][i];
          page.drawText(h, { x: cx, y, size: 8, font: fontBold, color: rgb(0.42, 0.45, 0.5) });
        });
        y -= 12;
        page.drawLine({ start: { x: margin, y }, end: { x: pageW - margin, y }, thickness: 0.3, color: rgb(0.9, 0.88, 0.85) });
        y -= 12;
      }
    });

    y -= 24; // spacing after cert table
  }

  // ----- Final page: Summary -----
  const finalBrk = checkPageBreak(page, y, 300);
  page = finalBrk.page; y = finalBrk.y;

  y = drawSectionHeader(page, '4. RESUMO E ESTATÍSTICAS', y);

  const boxY = y - 10;
  page.drawRectangle({
    x: margin, y: boxY - 60, width: w, height: 70,
    color: rgb(0.97, 0.95, 0.92),
  });

  page.drawText(String(data.certificatesObtidas), {
    x: margin + 20, y: boxY - 10, size: 24, font: fontBold, color: rgb(0.91, 0.39, 0.10),
  });
  page.drawText('certidões emitidas', {
    x: margin + 20, y: boxY - 28, size: 10, font, color: rgb(0.42, 0.45, 0.5),
  });

  page.drawText(String(data.certificatesPendentes), {
    x: margin + w - 80, y: boxY - 10, size: 24, font: fontBold, color: rgb(0.91, 0.39, 0.10),
  });
  page.drawText('certidões pendentes', {
    x: margin + w - 80, y: boxY - 28, size: 10, font, color: rgb(0.42, 0.45, 0.5),
  });

  y = boxY - 85;

  page.drawText('Informações Gerais', {
    x: margin, y, size: 11, font: fontBold, color: rgb(0.10, 0.10, 0.18),
  });
  y -= 18;
  page.drawLine({ start: { x: margin, y }, end: { x: pageW - margin, y }, thickness: 0.3, color: rgb(0.9, 0.88, 0.85) });
  y -= 14;

  const summaryFields = [
    { label: 'Nº do Dossiê', value: data.identifier },
    { label: 'Status', value: data.status },
    { label: 'Prioridade', value: data.priority || '—' },
    { label: 'Responsável', value: data.responsible || '—' },
    { label: 'Data de Criação', value: new Date(data.createdAt).toLocaleDateString('pt-BR') },
    { label: 'Última Atualização', value: new Date(data.updatedAt).toLocaleDateString('pt-BR') },
    { label: 'Total de Certidões', value: String(data.certificateCount) },
  ];
  summaryFields.forEach(f => { y = drawField(page, f.label, f.value, y); });

  y -= 20;
  page.drawLine({ start: { x: margin, y }, end: { x: pageW - margin, y }, thickness: 0.5, color: rgb(0.9, 0.88, 0.85) });
  y -= 14;
  page.drawText(`Documento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, {
    x: margin, y, size: 8, font, color: rgb(0.6, 0.6, 0.6),
  });
  y -= 12;
  page.drawText('A.CERT — Automação de Certidões Imobiliárias', {
    x: margin, y, size: 8, font, color: rgb(0.6, 0.6, 0.6),
  });

  // Recalculate total after all embeds
  total = doc.getPageCount();

  // Add footers to all pages
  const allPages = doc.getPages();
  for (let i = 0; i < allPages.length; i++) {
    allPages[i].drawLine({
      start: { x: margin, y: 45 }, end: { x: pageW - margin, y: 45 },
      thickness: 0.5, color: rgb(0.42, 0.45, 0.5),
    });
    allPages[i].drawText('A.CERT — Automação de Certidões Imobiliárias', {
      x: margin, y: 32, size: 7, font, color: rgb(0.42, 0.45, 0.5),
    });
    allPages[i].drawText(`Página ${i + 1} de ${total}`, {
      x: pageW - margin - 50, y: 32, size: 7, font, color: rgb(0.42, 0.45, 0.5),
    });
  }

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}
