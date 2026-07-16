import type { IConnector } from './connector.interface.js';
import type { DadosProprietario, ConnectorResult } from './types.js';
import { createPage } from '../utils/browser.js';
import { tentarBaixarPDF, aceitarCookies } from '../utils/dom-helper.js';
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

  // PASSO 4: EMITIR (MouseEvent real para Angular Material)
  await wait(300);
  const emitiu = await page.evaluate(() => {
    const btns = document.querySelectorAll<HTMLElement>('button');
    for (const b of btns) {
      if ((b.textContent || '').trim() === 'Emitir Certidão') {
        b.scrollIntoView({ block: 'center', behavior: 'instant' });
        const rect = b.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        for (const evtType of ['mousedown', 'mouseup', 'click']) {
          b.dispatchEvent(new MouseEvent(evtType, { bubbles: true, cancelable: true, clientX: cx, clientY: cy, button: 0 }));
        }
        return true;
      }
    }
    return false;
  });
  LOG(`Emitir: ${emitiu ? 'clicado' : 'nao encontrado'}`);
}

// ============================================================
// UTIL: clique real via MouseEvent (necessario para Angular/Zone.js)
// ============================================================
async function clicarComMouseEvent(page: import('puppeteer').Page, selector: string): Promise<boolean> {
  return page.evaluate((sel) => {
    const el = document.querySelector<HTMLElement>(sel);
    if (!el) return false;
    el.scrollIntoView({ block: 'center', behavior: 'instant' });
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    for (const evtType of ['mousedown', 'mouseup', 'click']) {
      el.dispatchEvent(new MouseEvent(evtType, { bubbles: true, cancelable: true, clientX: cx, clientY: cy, button: 0 }));
    }
    return true;
  }, selector);
}

// ============================================================
// UTIL: procurar e clicar botao por texto usando MouseEvent real
// ============================================================
async function clicarBotaoPorTextoReal(page: import('puppeteer').Page, termos: string[]): Promise<string | null> {
  return page.evaluate((termosEval) => {
    const normTermos = termosEval.map(t => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase());
    const btns = document.querySelectorAll<HTMLElement>(
      'button, a, span[role="button"], div[role="button"], input[type="button"], input[type="submit"], .mat-mdc-raised-button, .mat-mdc-button, .mat-mdc-outlined-button, .mat-mdc-unelevated-button, [mat-raised-button], [mat-button], .p-button, .ui-button, .btn'
    );
    for (const el of btns) {
      const t = (el.textContent || (el as HTMLInputElement).value || '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      for (const termo of normTermos) {
        if (t.includes(termo)) {
          el.scrollIntoView({ block: 'center', behavior: 'instant' });
          const rect = el.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          for (const evtType of ['mousedown', 'mouseup', 'click']) {
            el.dispatchEvent(new MouseEvent(evtType, { bubbles: true, cancelable: true, clientX: cx, clientY: cy, button: 0 }));
          }
          return el.textContent?.trim() || t;
        }
      }
    }
    return null;
  }, termos);
}

// ============================================================
// UTIL: tentar capturar PDF de embed/iframe na pagina atual
// ============================================================
async function capturarPDFEmbedNaPagina(page: import('puppeteer').Page): Promise<Uint8Array | null> {
  try {
    const pdfData = await page.evaluate(async () => {
      const candidates: string[] = [];
      for (const el of document.querySelectorAll<HTMLElement>('embed[src], object[data], iframe[src], a[href]')) {
        const src = (el as any).src || (el as any).data || (el as any).href || '';
        if (src.includes('.pdf') || (el.tagName === 'EMBED' && (el as HTMLEmbedElement).type?.includes('pdf'))) {
          candidates.push(src);
        }
      }
      for (const url of candidates) {
        try {
          const r = await fetch(url);
          const buf = await r.arrayBuffer();
          if (buf.byteLength > 500) {
            const arr = new Uint8Array(buf);
            const header = String.fromCharCode(...arr.slice(0, 5));
            if (header === '%PDF-') return Array.from(arr);
          }
        } catch {}
      }
      return null;
    });
    if (pdfData && pdfData.length > 0) {
      const buf = new Uint8Array(pdfData);
      if (buf.length > 500) return buf;
    }
  } catch {}
  return null;
}

// ============================================================
// CAPTURA PDF REAL via API do TRF1 (extrai ID/codigo da certidao)
// ============================================================
async function capturarPDFAposEmitir(page: import('puppeteer').Page): Promise<Uint8Array | null> {
  LOG('Verificando pagina de resultado...');

  try { await page.waitForFunction(() => document.readyState === 'complete', { timeout: 20000 }); } catch {}
  await wait(1500);
  if (page.isClosed()) { LOG('Pagina fechada'); return null; }

  // PDF embutido
  const pdfEmbed = await capturarPDFEmbedNaPagina(page);
  if (pdfEmbed && pdfEmbed.length > 500) { LOG(`PDF embed: ${pdfEmbed.length} bytes`); return pdfEmbed; }

  // Extrai ID e codigo do DOM
  const { certId, certCodigo } = await page.evaluate(() => {
    let id = '', codigo = '';
    document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach(a => {
      const h = a.href || '';
      const m = h.match(/[?&]id=(\d+)/); if (m) id = m[1];
      const c = h.match(/[?&]codigo=([A-Fa-f0-9]+)/); if (c) codigo = c[1];
    });
    return { certId: id, certCodigo: codigo };
  });

  if (!certId || !certCodigo) {
    LOG(`ID ou codigo nao encontrados no DOM`);
    return null;
  }
  LOG(`Certidao ID=${certId} Codigo=${certCodigo.slice(0, 10)}...`);

  // Cookies da sessao
  const cookies = await page.cookies();
  const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
  const headers = {
    Cookie: cookieHeader,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/134.0.0.0',
    'Accept': 'application/pdf,*/*',
  };

  // Tenta varias APIs (GET + POST)
  const bases = [
    'https://sistemas.trf1.jus.br/certidao',
    'https://certidao-unificada.cjf.jus.br',
  ];

  for (const base of bases) {
    const urls = [
      `${base}/api/certidao/pdf?id=${certId}&codigo=${certCodigo}`,
      `${base}/api/certidao/${certId}/pdf?codigo=${certCodigo}`,
      `${base}/api/pdf/${certId}?codigo=${certCodigo}`,
      `${base}/api/certidao/imprimir/${certId}?codigo=${certCodigo}`,
      `${base}/api/imprimir/${certId}?codigo=${certCodigo}`,
      `${base}/certidao/api/pdf?id=${certId}&codigo=${certCodigo}`,
      `${base}/certidao/${certId}/pdf?codigo=${certCodigo}`,
    ];
    for (const url of urls) {
      try {
        const r = await fetch(url, { headers, redirect: 'follow' });
        if (r.ok) {
          const buf = new Uint8Array(await r.arrayBuffer());
          if (buf.length > 500 && String.fromCharCode(...buf.slice(0, 5)) === '%PDF-') {
            LOG(`PDF via API: ${url.slice(0, 80)} → ${buf.length} bytes`);
            return buf;
          }
        }
      } catch {}
    }
    // POST
    try {
      const r = await fetch(`${base}/api/certidao/pdf`, {
        method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: certId, codigo: certCodigo }), redirect: 'follow',
      });
      if (r.ok) {
        const buf = new Uint8Array(await r.arrayBuffer());
        if (buf.length > 500 && String.fromCharCode(...buf.slice(0, 5)) === '%PDF-') {
          LOG(`PDF via POST: ${buf.length} bytes`);
          return buf;
        }
      }
    } catch {}
  }

  // Debug
  LOG('Nenhum PDF encontrado via APIs');
  try {
    const debugDir = path.join(DOWNLOAD_DIR, '..', 'debug');
    if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });
    const ts = Date.now();
    await page.screenshot({ path: path.join(debugDir, `trf1-${ts}.png`), fullPage: true }).catch(() => {});
    const html = await page.content().catch(() => '');
    fs.writeFileSync(path.join(debugDir, `trf1-${ts}.html`), html, 'utf-8');
  } catch {}
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
          // Aguarda navegacao para pagina de resultado
          try { await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }); } catch {}
          await wait(1000);

          // Aguarda elementos da pagina de resultado aparecerem (Angular render)
          LOG('Aguardando render da pagina de resultado...');
          const resultSelectors = [
            'button',                          // botoes (Imprimir, Baixar, etc)
            '.mat-mdc-card',                   // card do Angular Material
            'table',                           // tabela de dados
            '.certidao-conteudo',              // container de certidao
            '[class*="result"]',               // qualquer div com "result" na classe
            '.container',                      // container Bootstrap
            'mat-card',                        // card do Angular Material (antigo)
          ];
          let resultRendered = false;
          for (const sel of resultSelectors) {
            try {
              await page.waitForSelector(sel, { visible: true, timeout: 10000 });
              LOG(`Elemento "${sel}" encontrado na pagina`);
              resultRendered = true;
              break;
            } catch {}
          }
          if (!resultRendered) {
            LOG('Nenhum elemento esperado encontrado, continuando mesmo assim...');
            // Tira screenshot pra debug
            const debugDir = path.join(DOWNLOAD_DIR, '..', 'debug');
            if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });
            await page.screenshot({ path: path.join(debugDir, `trf1-resultado-${Date.now()}.png`), fullPage: true }).catch(() => {});
          }
          await wait(1500);
        }

        const url = page.url();
        LOG(`URL atual: ${url}`);

        const pdf = await capturarPDFAposEmitir(page);
        if (pdf && pdf.length > 500 && new TextDecoder().decode(pdf.slice(0, 5)) === '%PDF-') {
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
