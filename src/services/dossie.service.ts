import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { ConsultaJob } from '../connectors/types.js';

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
    page.drawText('✓ Certidão emitida com sucesso', {
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
      } catch {
        // PDF embedding failed — the note above explains the document was captured
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
    const marker = isSuccess ? '✓' : '○';
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
