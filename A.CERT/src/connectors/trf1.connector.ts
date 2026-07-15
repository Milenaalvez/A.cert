import type { IConnector } from './connector.interface.js';
import type { DadosProprietario, ConnectorResult } from './types.js';
import { createPage } from '../utils/browser.js';
import { tentarBaixarPDF, aceitarCookies, prepararCapturaPDFViaCDP, aguardarDownloadCDP } from '../utils/dom-helper.js';
import { detectarCaptcha, esperarCaptchaInterativo } from '../utils/captcha.js';
import { focusPageForCaptcha } from '../services/captcha-solver.service.js';
import { PDFDocument } from 'pdf-lib';
import { wait, criarRateLimit } from '../utils/retry-manager.service.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOWNLOAD_DIR = path.join(__dirname, '..', '..', 'tmp', 'downloads');

const LOG = (msg: string) => console.log(`[TRF1] ${msg}`);

const FORM_URL = 'https://sistemas.trf1.jus.br/certidao/#/solicitacao';

// ============================================================
// UTIL: clicar no mat-select pelo label e selecionar a opção
// ============================================================
async function selecionarMatSelect(
  page: import('puppeteer').Page,
  labelTexto: string,
  opcaoTexto: string,
): Promise<boolean> {
  // Abre o mat-select clicando no label
  const labelClicada = await page.evaluate((lbl) => {
    const l = lbl.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const labels = Array.from(document.querySelectorAll('label'));
    for (const label of labels) {
      const txt = (label.textContent || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      if (txt.includes(l)) { (label as HTMLElement).click(); return true; }
    }
    return false;
  }, labelTexto);

  if (!labelClicada) {
    // Fallback: clica no trigger do mat-select
    await page.evaluate(() => {
      const trigger = document.querySelector('.mat-mdc-select-trigger, .mat-mdc-select-value');
      if (trigger) { (trigger as HTMLElement).click(); return; }
      // Ou no primeiro elemento clicavel com "Selecionar" no texto
      const spans = document.querySelectorAll('span');
      for (const s of spans) {
        if ((s.textContent || '').toLowerCase().includes('selecionar um tipo')) {
          (s as HTMLElement).click(); return;
        }
      }
    });
  }

  await wait(800);

  // Loga todas as opções visíveis pra debug
  const opcoes = await page.evaluate(() => {
    return Array.from(document.querySelectorAll(
      '.mat-mdc-select-panel mat-option, .mat-mdc-option, [role="listbox"] [role="option"], .mat-mdc-autocomplete-panel mat-option'
    )).map(el => (el.textContent || '').trim()).filter(t => t.length > 0);
  });
  LOG(`Opções do mat-select "${labelTexto}": [${opcoes.join(' | ')}]`);

  // Clica na opção certa
  const opcao = opcaoTexto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const clicou = await page.evaluate((opt) => {
    const options = document.querySelectorAll(
      'mat-option, .mat-mdc-option, [role="option"], .mat-option'
    );
    for (const el of options) {
      const t = (el.textContent || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      if (t.includes(opt)) {
        (el as HTMLElement).click();
        return t;
      }
    }
    return null;
  }, opcao);

  if (clicou) {
    LOG(`[mat-select] "${labelTexto}" → "${clicou}" OK`);
    return true;
  }
  LOG(`[mat-select] "${labelTexto}" → "${opcaoTexto}" NAO ENCONTRADO entre: ${opcoes.join(', ')}`);
  return false;
}

// ============================================================
// UTIL: selecionar item no autocomplete mat-chip (Órgãos)
// NÃO filtra digitando → precisa scrollar e clicar na opção certa
// ============================================================
async function selecionarOrgaoAutocomplete(
  page: import('puppeteer').Page,
  termo: string,
): Promise<string | null> {
  // 1. Abre o painel clicando no input
  await page.click('#mat-mdc-chip-list-input-0');
  await wait(600);

  // Aguarda o painel
  await page.waitForSelector(
    '.mat-mdc-autocomplete-panel, .mat-autocomplete-panel, .cdk-overlay-pane',
    { visible: true, timeout: 8000 }
  ).catch(() => LOG('[Órgão] painel nao abriu'));

  // 2. Lê TODAS as opções do painel
  const opcoes = await page.evaluate(() => {
    return Array.from(document.querySelectorAll(
      'mat-option, .mat-mdc-option, [role="option"]'
    )).map((el, i) => ({
      index: i,
      text: (el.textContent || '').trim(),
    })).filter(o => o.text.length > 1);
  });
  LOG(`[Órgão] ${opcoes.length} opções no painel, buscando "${termo}"`);
  for (const o of opcoes) LOG(`  [${o.index}] "${o.text}"`);

  // 3. Clica na opção que contém o termo
  const termoLower = termo.toLowerCase();
  const encontrado = await page.evaluate((t: string) => {
    const options = document.querySelectorAll(
      'mat-option, .mat-mdc-option, [role="option"]'
    );
    for (const el of options) {
      const text = (el.textContent || '').trim().toLowerCase();
      if (text.length < 2) continue;
      if (text.includes(t)) {
        (el as HTMLElement).scrollIntoView({ block: 'center' });
        (el as HTMLElement).click();
        return el.textContent?.trim() || null;
      }
    }
    return null;
  }, termoLower);

  if (encontrado) {
    LOG(`[Órgão] "${termo}" → "${encontrado}"`);
    return encontrado;
  }

  LOG(`[Órgão] "${termo}" → NÃO ENCONTRADO`);
  return null;
}

// ============================================================
// PREENCHE O FORMULÁRIO
// ============================================================
async function preencherFormulario(
  page: import('puppeteer').Page,
  dados: DadosProprietario,
  tipo: string,
): Promise<void> {
  const cpfDigits = dados.cpf.replace(/\D/g, '');

  LOG(`Navegando...`);
  await page.goto(FORM_URL, { waitUntil: 'networkidle0', timeout: 45000 }).catch(async () => {
    await wait(5000);
    await page.goto(FORM_URL, { waitUntil: 'networkidle0', timeout: 45000 });
  });
  await wait(2000);
  await aceitarCookies(page);

  LOG('Aguardando formulario...');
  await page.waitForSelector('#mat-mdc-chip-list-input-0, #mat-input-0', {
    visible: true, timeout: 20000,
  }).catch(() => LOG('timeout'));
  await wait(2000);

  // PASSO 1: TIPO DE CERTIDÃO
  await selecionarMatSelect(page, 'Tipo de Certidão', tipo);
  await wait(500);

  // PASSO 2: ÓRGÃOS
  const orgaosAlvo = ['distrito federal', 'tribunal regional federal'];
  for (let i = 0; i < 2; i++) {
    const sel = await selecionarOrgaoAutocomplete(page, orgaosAlvo[i]);
    LOG(`[Órgão ${i + 1}/2]: ${sel || 'FALHOU'}`);
    await wait(600);
  }

  // PASSO 3: CPF
  await page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll('label'));
    for (const l of labels) {
      if ((l.textContent || '').trim() === 'CPF') { (l as HTMLElement).click(); return; }
    }
  });
  await wait(300);
  await page.click('#mat-input-0');
  await wait(200);
  await page.keyboard.type(cpfDigits, { delay: 15 });
  LOG(`CPF: ${cpfDigits}`);

  // PASSO 4: EMITIR
  await wait(300);
  const emitiu = await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const b of btns) {
      if ((b.textContent || '').trim() === 'Emitir Certidão') {
        (b as HTMLElement).click(); return true;
      }
    }
    return false;
  });
  LOG(`Emitir: ${emitiu ? 'clicado' : 'nao encontrado'}`);
}

// ============================================================
// CAPTURA PDF real: Imprimir → nova aba OU CDP download → fallback page.pdf()
// ============================================================
async function capturarPDFAposEmitir(page: import('puppeteer').Page): Promise<Uint8Array | null> {
  LOG('Aguardando pagina de resultado...');
  try { await page.waitForNetworkIdle({ idleTime: 2000, timeout: 25000 }); } catch {}
  await wait(2000);

  if (page.isClosed()) { LOG('Pagina fechada'); return null; }

  // --- camada 1: prepara CDP para capturar download ---
  await prepararCapturaPDFViaCDP(page, DOWNLOAD_DIR);
  LOG('CDP preparado para download');

  // --- camada 2: listener de nova aba ANTES de clicar Imprimir ---
  const newPagePromise = new Promise<import('puppeteer').Page | null>((resolve) => {
    const timeout = setTimeout(() => {
      page.browser().off('targetcreated', handler);
      resolve(null);
    }, 20000);

    const handler = async (target: import('puppeteer').Target) => {
      if (target.type() === 'page') {
        clearTimeout(timeout);
        page.browser().off('targetcreated', handler);
        try {
          const np = await target.page();
          if (np && !np.isClosed()) {
            await np.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {});
            await wait(2000);
            resolve(np);
          } else { resolve(null); }
        } catch { resolve(null); }
      }
    };
    page.browser().on('targetcreated', handler);
  });

  // --- clica Imprimir ---
  LOG('Procurando botao Imprimir...');
  const imprimiu = await page.evaluate(() => {
    const elementos = document.querySelectorAll('button, a, span[role="button"], div[role="button"]');
    for (const el of elementos) {
      const t = (el.textContent || '').trim().toLowerCase();
      if (t === 'imprimir' || t.includes('imprimir')) {
        (el as HTMLElement).click(); return true;
      }
    }
    return false;
  }).catch(() => false);

  // --- verifica CDP download (Imprimir pode ter disparado download direto) ---
  LOG('Verificando CDP download...');
  const cdpPath = await aguardarDownloadCDP(DOWNLOAD_DIR, { timeoutMs: 12000, pollMs: 500 });
  if (cdpPath) {
    try {
      const buf = fs.readFileSync(cdpPath);
      if (buf.length > 1000) {
        LOG(`PDF via CDP download: ${buf.length} bytes`);
        return new Uint8Array(buf);
      }
    } catch (e: any) { LOG(`Erro lendo CDP: ${e.message}`); }
  }

  // --- verifica nova aba ---
  if (imprimiu) {
    LOG('Imprimir clicado, aguardando nova aba...');
    const newPage = await newPagePromise;
    if (newPage && !newPage.isClosed()) {
      LOG('Nova aba detectada!');

      // Verifica se a aba tem PDF embed direto
      const pdfUrl = await newPage.evaluate(() => {
        const embed = document.querySelector('embed[type="application/pdf"], embed[src*=".pdf"], object[data*=".pdf"], iframe[src*=".pdf"]');
        if (embed) return (embed as any).src || (embed as any).data || null;
        if (window.location.href.endsWith('.pdf')) return window.location.href;
        return null;
      }).catch(() => null);

      if (pdfUrl) {
        LOG(`PDF URL: ${pdfUrl}`);
        try {
          const pdfResp = await newPage.evaluate(async (url: string) => {
            const r = await fetch(url); const buf = await r.arrayBuffer();
            return Array.from(new Uint8Array(buf));
          }, pdfUrl).catch(() => null);
          if (pdfResp && pdfResp.length > 1000) {
            await newPage.close().catch(() => {});
            LOG(`PDF via fetch embed: ${pdfResp.length} bytes`);
            return new Uint8Array(pdfResp);
          }
        } catch {}
      }

      // Captura como page.pdf()
      try {
        const pdf = await newPage.pdf({ format: 'A4', printBackground: true });
        await newPage.close().catch(() => {});
        if (pdf.length > 1000) { LOG(`PDF via nova aba: ${pdf.length} bytes`); return pdf; }
      } catch (e: any) { LOG(`Erro nova aba: ${e.message}`); await newPage.close().catch(() => {}); }
    } else {
      LOG('Nenhuma nova aba (CDP pode ter capturado)');
    }
  } else {
    LOG('Botao Imprimir nao encontrado');
  }

  // --- camada 3: fallback page.pdf() na pagina de resultado ---
  if (!page.isClosed()) {
    LOG('Fallback page.pdf()...');
    try {
      const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '10mm', bottom: '10mm' } });
      if (pdf.length > 1000) { LOG(`PDF fallback: ${pdf.length} bytes`); return pdf; }
    } catch {}
  }

  const buf = await tentarBaixarPDF(page).catch(() => null);
  if (buf && buf.length > 1000) { LOG(`PDF tentarBaixarPDF: ${buf.length} bytes`); return buf; }

  return null;
}

// ============================================================
// CONNECTOR
// ============================================================
export class TRF1Connector implements IConnector {
  readonly nome = 'TRF1';

  async consultar(
    dados: DadosProprietario,
    jobId?: string,
    certKeys?: string[],
  ): Promise<ConnectorResult> {
    const dataConsulta = new Date().toISOString();
    LOG('Iniciando TRF1');

    const tipos: string[] = [];
    const temCivil = !certKeys || certKeys.length === 0 || certKeys.includes('TRF1_CIVEL');
    const temCriminal = !certKeys || certKeys.length === 0 || certKeys.includes('TRF1_CRIMINAL');
    if (temCivil) tipos.push('Cível');
    if (temCriminal) tipos.push('Criminal');

    LOG(`Tipos: ${tipos.join(', ')}`);

    const pdfs: Uint8Array[] = [];
    const errors: string[] = [];
    const throttle = criarRateLimit(4000);

    for (let i = 0; i < tipos.length; i++) {
      const tipo = tipos[i];
      if (i > 0) {
        LOG('Aguardando 8s (browser recovery)...');
        await wait(8000);
      }

      let page: import('puppeteer').Page | null = null;
      // Retry createPage ate 3x
      for (let retry = 0; retry < 3 && !page; retry++) {
        try {
          page = await createPage();
        } catch (e: any) {
          if (retry < 2) { LOG(`createPage tentativa ${retry + 1} falhou: ${e.message}`); await wait(3000); }
          else { errors.push(`${tipo}: criar pagina: ${e.message}`); }
        }
      }

      if (!page) {
        errors.push(`${tipo}: nao conseguiu criar pagina`);
        continue;
      }

      try {
        await throttle();
        LOG(`--- [${i + 1}/${tipos.length}] ${tipo} ---`);
        await preencherFormulario(page, dados, tipo);

        // Verifica se a página ainda está viva após o submit
        if (page.isClosed()) {
          errors.push(`${tipo}: pagina fechada apos submit`);
          continue;
        }

        let captchaType = null;
        for (let t = 0; t < 30; t++) {
          if (page.isClosed()) break;
          captchaType = await detectarCaptcha(page).catch(() => null);
          if (captchaType) break;
          await wait(500);
        }
        LOG(`CAPTCHA: ${captchaType || 'nenhum'}`);

        if (captchaType) {
          await focusPageForCaptcha(page, captchaType).catch(() => {});
          const ok = await esperarCaptchaInterativo(page, captchaType).catch(() => false);
          if (!ok || page.isClosed()) {
            await page.close().catch(() => {});
            errors.push(`${tipo}: CAPTCHA nao resolvido`);
            continue;
          }
          LOG('CAPTCHA resolvido');
          await wait(2000);
        }

        const pdf = await capturarPDFAposEmitir(page);
        if (pdf && pdf.length > 100) {
          pdfs.push(pdf);
          LOG(`PDF ${tipo}: ${pdf.length} bytes`);
        } else {
          errors.push(`${tipo}: PDF vazio`);
        }
      } catch (err: unknown) {
        const m = err instanceof Error ? err.message : 'Erro';
        // "detached Frame" ou "Target closed" = browser crash, pulamos pra próxima run
        if (m.includes('detached Frame') || m.includes('Target closed') || m.includes('Target.closed')) {
          LOG(`[${tipo}] Browser crash, pulando run: ${m}`);
        } else {
          errors.push(`${tipo}: ${m}`);
        }
        LOG(`ERRO ${tipo}: ${m}`);
      }
      await page.close().catch(() => {});
      page = null;
    }

    if (pdfs.length === 0) {
      return { status: 'error', orgao: this.nome, dataConsulta, error: `Nenhuma certidao. ${errors.join('; ')}` };
    }

    LOG(`Merge ${pdfs.length} PDF(s)...`);
    const mergedPdf = await PDFDocument.create();
    for (const pdfBytes of pdfs) {
      try {
        const doc = await PDFDocument.load(pdfBytes);
        const pages = await mergedPdf.copyPages(doc, doc.getPageIndices());
        for (const p of pages) mergedPdf.addPage(p);
      } catch {}
    }
    const mergedBytes = await mergedPdf.save();
    return {
      status: 'success',
      orgao: this.nome,
      dataConsulta,
      protocolo: `TRF1-${new Date().getFullYear()}.${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`,
      documento: mergedBytes,
    };
  }
}
