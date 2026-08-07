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
  // 1. Abre o painel clicando no input — tenta varios IDs (muda entre iterações)
  const clicou = await page.evaluate(() => {
    const inputs = document.querySelectorAll<HTMLInputElement>(
      'input[id*="chip-list-input"], input[aria-autocomplete="list"], input.mat-mdc-chip-input'
    );
    for (const inp of inputs) {
      if (inp.offsetParent !== null) {
        (inp as HTMLElement).click();
        return inp.id || 'ok';
      }
    }
    // fallback: clica no chip-list todo
    const chipList = document.querySelector('.mat-mdc-chip-list, mat-chip-list');
    if (chipList) { (chipList as HTMLElement).click(); return 'chip-list'; }
    return null;
  });
  if (!clicou) {
    LOG('[Órgão] input do chip-list nao encontrado');
    return null;
  }

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
  for (const o of opcoes.slice(0, 20)) LOG(`  [${o.index}] "${o.text}"`);

  if (opcoes.length === 0) return null;

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
  await wait(800);
  await aceitarCookies(page);

  LOG('Aguardando formulario...');
  let formLoaded = await page.waitForSelector('input[id*="chip-list-input"], input[id*="mat-input"], input[type="text"]:not([readonly])', {
    visible: true, timeout: 20000,
  }).then(() => true).catch(() => false);

  if (!formLoaded) {
    LOG('Form nao carregou, recarregando...');
    await page.goto(FORM_URL, { waitUntil: 'networkidle0', timeout: 30000 }).catch(() => {});
    await wait(3000);
    await aceitarCookies(page);
    await page.waitForSelector('input[id*="chip-list-input"], input[id*="mat-input"], input[type="text"]:not([readonly])', {
      visible: true, timeout: 30000,
    }).catch(() => LOG('timeout recarga'));
  }
  await wait(500);

  // PASSO 1: TIPO DE CERTIDÃO
  await selecionarMatSelect(page, 'Tipo de Certidão', tipo);
  await wait(200);

  // PASSO 2: ÓRGÃOS
  const orgaosAlvo = ['distrito federal', 'tribunal regional federal'];
  for (let i = 0; i < 2; i++) {
    const sel = await selecionarOrgaoAutocomplete(page, orgaosAlvo[i]);
    LOG(`[Órgão ${i + 1}/2]: ${sel || 'FALHOU'}`);
    await wait(200);
  }

  // PASSO 3: CPF — encontra o input pelo label ou pela classe do Angular
  const cpfInputId = await page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll('label'));
    for (const l of labels) {
      if ((l.textContent || '').trim() === 'CPF') {
        (l as HTMLElement).click();
        return null; // label clicked, input will focus
      }
    }
    return null;
  });
  await wait(300);
  // Encontra o input de CPF (id pode variar entre iterações)
  const cpfClicked = await page.evaluate(() => {
    const inputs = document.querySelectorAll<HTMLInputElement>('input[id*="mat-input"]');
    for (const inp of inputs) {
      if (inp.offsetParent !== null && !(inp.readOnly)) {
        inp.focus(); inp.click();
        return inp.id;
      }
    }
    return null;
  });
  if (!cpfClicked) {
    throw new Error('Input CPF nao encontrado');
  }
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
  if (page.isClosed()) { LOG('Pagina fechada'); return null; }

  // Extrai ID e codigo do DOM (1ª estratégia)
  const { certId, certCodigo } = await page.evaluate(() => {
    let id = '', codigo = '';
    document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach(a => {
      const h = a.href || '';
      const m = h.match(/[?&]id=(\d+)/); if (m) id = m[1];
      const c = h.match(/[?&]codigo=([A-Fa-f0-9]+)/); if (c) codigo = c[1];
    });
    return { certId: id, certCodigo: codigo };
  });

  if (certId && certCodigo) {
    LOG(`Certidao ID=${certId} Codigo=${certCodigo.slice(0, 10)}...`);

    // 2ª estratégia: fetch() Node.js para 7 URLs (GET + POST) em 2 domínios
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
  }

  // 3ª estratégia: PDF embutido (embed/object/iframe)
  const pdfEmbed = await capturarPDFEmbedNaPagina(page);
  if (pdfEmbed && pdfEmbed.length > 500) { LOG(`PDF embed: ${pdfEmbed.length} bytes`); return pdfEmbed; }

  // Debug
  LOG('Nenhum PDF encontrado via APIs nem embed');
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
    const throttle = criarRateLimit(500);

    let page = await createPage();

    for (let i = 0; i < tipos.length; i++) {
      const tipo = tipos[i];
      if (i > 0) {
        LOG('Aguardando 1s (recovery)...');
        await wait(1000);
      }

      const cleanupRef: { fn: (() => void) | null } = { fn: null };

      try {
        await throttle();
        LOG(`--- [${i + 1}/${tipos.length}] ${tipo} ---`);
        await preencherFormulario(page, dados, tipo);

        if (page.isClosed()) {
          errors.push(`${tipo}: pagina fechada apos submit`);
          page = await createPage();
          continue;
        }

        // ── ANTES do CAPTCHA: intercepta respostas PDF ──
        // O segredo: o servidor TRF1 retorna o PDF como resposta
        // HTTP direta quando o form e submetido apos CAPTCHA.
        // Capturamos ANTES da navegacao acontecer.
        const responsePromise = new Promise<Uint8Array | null>((resolve) => {
          const timeout = setTimeout(() => resolve(null), 45000);
          const handler = async (response: import('puppeteer').HTTPResponse) => {
            const url = response.url();
            const ct = (response.headers()['content-type'] || '');
            const cd = (response.headers()['content-disposition'] || '');
            if (url.includes('api/certidao/pdf') || url.includes('/pdf') || ct.includes('pdf') || cd.includes('attachment')) {
              try {
                const buf = await response.buffer();
                if (buf.length > 500 && buf[0] === 0x25) {
                  clearTimeout(timeout);
                  page.off('response', handler);
                  resolve(new Uint8Array(buf));
                }
              } catch {}
            }
          };
          page.on('response', handler);
          cleanupRef.fn = (() => { clearTimeout(timeout); page.off('response', handler); }) as () => void;
        });

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
            errors.push(`${tipo}: CAPTCHA nao resolvido`);
            cleanupRef.fn?.();
            page = await createPage();
            continue;
          }
          LOG('CAPTCHA resolvido');
          try { await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }); } catch {}
        }

        // Verifica se o interceptor ja capturou o PDF da resposta direta
        const intercepted = await responsePromise;
        if (intercepted && intercepted.length > 500) {
          pdfs.push(intercepted);
          LOG(`PDF via waitForResponse: ${intercepted.length} bytes`);
          cleanupRef.fn?.();
          continue;
        }

        cleanupRef.fn?.();

        const pdf = await capturarPDFAposEmitir(page);
        if (pdf && pdf.length > 500 && new TextDecoder().decode(pdf.slice(0, 5)) === '%PDF-') {
          pdfs.push(pdf);
          LOG(`PDF ${tipo}: ${pdf.length} bytes`);
        } else {
          errors.push(`${tipo}: PDF vazio`);
        }
      } catch (err: unknown) {
        cleanupRef.fn?.();
        const m = err instanceof Error ? err.message : 'Erro';
        errors.push(`${tipo}: ${m}`);
        LOG(`ERRO ${tipo}: ${m}`);
        // Recria página pra nao reusar página quebrada
        await page.close().catch(() => {});
        page = await createPage();
      }
    }

    await page.close().catch(() => {});
    page = null as any;

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
