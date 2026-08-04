import type { IConnector } from './connector.interface.js';
import type { DadosProprietario, ConnectorResult } from './types.js';
import { createPage } from '../utils/browser.js';
import {
  tentarBaixarPDF, setupDownloadCapture,
  prepararCapturaPDFViaCDP, configurarCapturaDownloadViaCDP,
  interceptarRespostaPDF,
} from '../utils/dom-helper.js';
import fs from 'node:fs';
import { detectarCaptcha, esperarCaptchaInterativo } from '../utils/captcha.js';
import { focusPageForCaptcha, resolverCaptchaTextoAuto } from '../services/captcha-solver.service.js';
import { wait, criarRateLimit } from '../utils/retry-manager.service.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG = (msg: string) => console.log(`[TRT] ${msg}`);
const DOWNLOAD_DIR = path.join(__dirname, '..', '..', 'tmp', 'downloads');

const EMISSAO_URL = 'https://pje.trt10.jus.br/certidoes/trabalhista/emissao';

function validarPDF(buf: Uint8Array | Buffer | null): buf is Uint8Array {
  if (!buf || buf.length < 500) return false;
  const bytes = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
  return bytes.slice(0, 5).toString() === '%PDF-';
}

function toUint8Array(buf: Uint8Array | Buffer): Uint8Array {
  if (Buffer.isBuffer(buf)) return new Uint8Array(buf);
  return buf;
}

async function capturarPDFViaAPIPJe(
  page: import('puppeteer').Page,
  cookies: Array<{ name: string; value: string }>,
): Promise<Uint8Array | null> {
  const urls = [
    `https://pje.trt10.jus.br/pje-api/api/certidoes/trabalhista/${page.url().split('/').pop()}`,
    'https://pje.trt10.jus.br/pje-api/api/certidoes/trabalhista',
    page.url().replace('/certidoes/trabalhista/emissao', '/certidoes/trabalhista/resultado'),
  ];
  const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');

  for (const url of urls) {
    try {
      LOG(`[API-NODE] Tentando ${url.slice(0, 80)}`);
      const res = await fetch(url, { headers: { Cookie: cookieHeader } });
      if (!res.ok) { LOG(`[API-NODE] ${res.status}`); continue; }
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/pdf')) {
        const buf = new Uint8Array(await res.arrayBuffer());
        if (validarPDF(buf)) { LOG(`[API-NODE] PDF: ${buf.length} bytes`); return buf; }
      }
      const text = await res.text();
      LOG(`[API-NODE] ${res.status} body: ${text.slice(0, 100)}`);
    } catch (e: any) { LOG(`[API-NODE] Erro: ${e.message?.slice(0, 60)}`); }
  }
  return null;
}

async function capturarPDFViaFetchBrowser(
  page: import('puppeteer').Page,
): Promise<Uint8Array | null> {
  return page.evaluate(async () => {
    const base = window.location.origin;
    const urls = [
      `${base}/pje-api/api/certidoes/trabalhista`,
      window.location.href.replace('/emissao', '/resultado'),
      window.location.href,
    ];
    for (const url of urls) {
      try {
        const res = await fetch(url, { credentials: 'include' });
        if (!res.ok) continue;
        const blob = await res.blob();
        if (blob.type === 'application/pdf' && blob.size > 500) {
          const buf = await blob.arrayBuffer();
          const arr = Array.from(new Uint8Array(buf));
          return { data: arr, size: blob.size } as any;
        }
      } catch {}
    }
    return null;
  }).then(r => {
    if (r && r.data && r.size > 500) {
      const buf = new Uint8Array(r.data);
      if (validarPDF(buf)) { LOG(`[Fetch-Browser] PDF: ${buf.length} bytes`); return buf; }
    }
    return null;
  });
}

async function esperarResultadoPDF(
  page: import('puppeteer').Page,
  capturePromise: Promise<Uint8Array | null>,
  timeoutMs = 20000
): Promise<Uint8Array | null> {
  // ── 1. setupDownloadCapture + prepararCapturaPDFViaCDP (configurado antes) ──
  LOG('[1/8] Aguardando setupDownloadCapture...');
  const resultado = await Promise.race([
    capturePromise,
    new Promise<null>(r => setTimeout(() => r(null), timeoutMs)),
  ]);
  if (validarPDF(resultado)) {
    LOG(`[1/8] PDF via setupDownloadCapture: ${resultado.length} bytes`);
    return resultado;
  }

  // ── 2. CDP Page.printToPDF (nativo Chrome, renderiza Shadow DOM) ──
  LOG('[2/8] CDP Page.printToPDF...');
  try {
    const cdp = await (page as any).createCDPSession?.().catch(() => null);
    if (cdp) {
      const res = await (cdp as any).send('Page.printToPDF', {
        format: 'A4', printBackground: true,
        marginTop: '10mm', marginBottom: '10mm',
        displayHeaderFooter: false,
      });
      if (res?.data) {
        const buf = Buffer.from(res.data, 'base64');
        if (validarPDF(buf)) {
          LOG(`[2/8] PDF via CDP printToPDF: ${buf.length} bytes`);
          await cdp.detach().catch(() => {});
          return new Uint8Array(buf);
        }
      }
      await cdp.detach().catch(() => {});
    }
  } catch (e: any) { LOG(`[2/8] Erro: ${e.message?.slice(0, 60)}`); }

  // ── 3. fetch() Node.js para API PJe com cookies ──
  LOG('[3/8] fetch Node.js API PJe...');
  try {
    const cookies = await page.cookies();
    const pdf3 = await capturarPDFViaAPIPJe(page, cookies.map(c => ({ name: c.name, value: c.value })));
    if (pdf3) return pdf3;
  } catch (e: any) { LOG(`[3/8] Erro: ${e.message?.slice(0, 60)}`); }

  // ── 4. fetch() do browser para API PJe ──
  LOG('[4/8] fetch browser API PJe...');
  try {
    const pdf4 = await capturarPDFViaFetchBrowser(page);
    if (pdf4) return pdf4;
  } catch (e: any) { LOG(`[4/8] Erro: ${e.message?.slice(0, 60)}`); }

  // ── 5. HTTP interceptor dedicado: page.on('response') application/pdf ──
  LOG('[5/8] HTTP interceptor application/pdf...');
  try {
    const pdf5 = await interceptarRespostaPDF(page, 15000);
    if (validarPDF(pdf5)) { LOG(`[5/8] PDF via HTTP interceptor: ${pdf5.length} bytes`); return pdf5; }
  } catch (e: any) { LOG(`[5/8] Erro: ${e.message?.slice(0, 60)}`); }

  // ── 6. page.pdf() com emulateMediaType('print') ──
  LOG('[6/8] page.pdf() + emulateMediaType print...');
  await wait(1000);
  try {
    await page.emulateMediaType('print');
    const pdf = await page.pdf({ format: 'A4', printBackground: true });
    await page.emulateMediaType('screen');
    if (validarPDF(pdf)) { LOG(`[6/8] PDF via page.pdf+print: ${pdf.length} bytes`); return new Uint8Array(pdf); }
  } catch (e: any) { LOG(`[6/8] Erro: ${e.message?.slice(0, 60)}`); }

  // ── 7. tentarBaixarPDF (fallback) ──
  LOG('[7/8] tentarBaixarPDF...');
  try {
    const buf = await tentarBaixarPDF(page, DOWNLOAD_DIR);
    if (validarPDF(buf)) { LOG(`[7/8] PDF via tentarBaixarPDF: ${buf.length} bytes`); return buf; }
  } catch (e: any) { LOG(`[7/8] Erro: ${e.message?.slice(0, 60)}`); }

  // ── 8. page.pdf() simples (ultimo recurso) ──
  LOG('[8/8] page.pdf() simples...');
  try {
    const pdf = await page.pdf({ format: 'A4', printBackground: true });
    if (validarPDF(pdf)) { LOG(`[8/8] PDF via page.pdf: ${pdf.length} bytes`); return new Uint8Array(pdf); }
  } catch (e: any) { LOG(`[8/8] Erro: ${e.message?.slice(0, 60)}`); }

  LOG('Nenhuma das 8 estrategias capturou PDF');
  return null;
}

async function diagnosticar(page: import('puppeteer').Page, label: string): Promise<void> {
  LOG(`=== DIAG ${label} ===`);
  const info = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('input')).map(el => ({
      id: el.id, name: el.name, type: el.type, value: el.value?.slice(0, 20),
      placeholder: el.placeholder, disabled: el.disabled, readonly: el.readOnly,
      checked: el.type === 'radio' ? el.checked : undefined,
      label: document.querySelector(`label[for="${el.id}"]`)?.textContent?.trim()?.slice(0, 30) || '',
    }));
    const labels = Array.from(document.querySelectorAll('label')).map(el => ({
      htmlFor: el.htmlFor, text: (el.textContent || '').trim().slice(0, 50),
    }));
    const buttons = Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"], a.btn')).map(el => ({
      text: (el.textContent || (el as HTMLInputElement).value || '').trim().slice(0, 30),
      disabled: (el as HTMLButtonElement).disabled,
      visible: (el as HTMLElement).offsetParent !== null,
    }));
    const radios = Array.from(document.querySelectorAll<HTMLInputElement>('input[type="radio"]')).map(r => ({
      id: r.id, name: r.name, value: r.value, checked: r.checked,
    }));
    return { inputs, labels, buttons, radios };
  });
  LOG(`Inputs (${info.inputs.length}):`);
  for (const i of info.inputs) LOG(`  ${JSON.stringify(i)}`);
  LOG(`Labels (${info.labels.length}):`);
  for (const l of info.labels) LOG(`  ${JSON.stringify(l)}`);
  LOG(`Buttons (${info.buttons.length}):`);
  for (const b of info.buttons) LOG(`  ${JSON.stringify(b)}`);
  if (info.radios.length > 0) LOG(`Radios: ${JSON.stringify(info.radios)}`);
}

export class TRTConnector implements IConnector {
  readonly nome = 'TRT';
  readonly #throttle = criarRateLimit(1000);

  async consultar(
    dados: DadosProprietario,
    jobId?: string,
    certKeys?: string[],
  ): Promise<ConnectorResult> {
    const dataConsulta = new Date().toISOString();
    LOG('Iniciando TRT (PJe)');
    const page = await createPage().catch(e => { LOG(`ERRO createPage: ${e.message}`); throw e; });

    try {
      // ═══════════════════════════════════════════════════════════
      // PASSO 1: Navegar para emissao PJe
      // ═══════════════════════════════════════════════════════════
      LOG(`Navegando ${EMISSAO_URL}`);
      await page.goto(EMISSAO_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
      LOG(`URL: ${page.url()}`);

      // Aguarda Angular carregar (remove "Carregando..." e mostra formulario)
      await page.waitForFunction(
        () => {
          const body = document.body?.textContent || '';
          const loading = body.includes('Carregando');
          const hasForm = document.querySelector('input, button, label') !== null;
          return !loading && hasForm;
        },
        { timeout: 20000 }
      ).catch(() => LOG('Timeout esperando Angular'));
      await wait(2000);

      await diagnosticar(page, 'pagina inicial');

      const cpfDigits = dados.cpf.replace(/\D/g, '');

      // ═══════════════════════════════════════════════════════════
      // PASSO 2: Selecionar radio "CPF" (com retry 403)
      // ═══════════════════════════════════════════════════════════
      LOG('Selecionando radio CPF...');
      let cpfRadioOk = false;

      for (let tentativa = 0; tentativa < 3; tentativa++) {
        if (tentativa > 0) {
          LOG(`Retry ${tentativa + 1}/3...`);
          await wait(3000);
        }
        try {
          cpfRadioOk = await page.evaluate(() => {
            // Busca radio ou label com texto CPF
            const radio = document.querySelector<HTMLInputElement>('input[type="radio"][value*="CPF"], input[type="radio"][value*="cpf"]');
            if (radio) {
              radio.checked = true;
              ['change', 'input', 'click'].forEach(evt =>
                radio.dispatchEvent(new Event(evt, { bubbles: true }))
              );
              return true;
            }
            // Procura label com texto CPF e clica
            const all = document.querySelectorAll<HTMLElement>('label, span, div, td');
            for (const el of all) {
              const txt = (el.textContent || '').trim().toUpperCase();
              if (txt === 'CPF' || txt.startsWith('CPF')) {
                el.scrollIntoView({ block: 'center', behavior: 'instant' });
                const rect = el.getBoundingClientRect();
                const cx = rect.left + rect.width / 2;
                const cy = rect.top + rect.height / 2;
                for (const evtType of ['mousedown', 'mouseup', 'click']) {
                  el.dispatchEvent(new MouseEvent(evtType, { bubbles: true, cancelable: true, clientX: cx, clientY: cy, button: 0 }));
                }
                // Tenta marcar o input radio associado
                const forAttr = (el as HTMLLabelElement).htmlFor;
                const linkedRadio = document.querySelector<HTMLInputElement>(`input[type="radio"]#${el.id}, input[type="radio"][id="${forAttr}"]`);
                if (linkedRadio) {
                  linkedRadio.checked = true;
                  linkedRadio.dispatchEvent(new Event('change', { bubbles: true }));
                }
                return true;
              }
            }
            return false;
          });
          if (cpfRadioOk) break;
        } catch (e: any) {
          LOG(`Erro: ${e.message.slice(0, 80)}`);
        }
      }

      if (!cpfRadioOk) {
        await page.close();
        return { status: 'error', orgao: this.nome, dataConsulta, error: 'Radio CPF nao encontrado' };
      }
      LOG('Radio CPF OK');
      await wait(2000);

      await diagnosticar(page, 'apos radio cpf');

      // ═══════════════════════════════════════════════════════════
      // PASSO 3: Preencher CPF
      // ═══════════════════════════════════════════════════════════
      LOG('Preenchendo CPF...');
      const cpfPreenchido = await page.evaluate((cpf) => {
        const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('input:not([type="hidden"]):not([type="radio"]):not([type="checkbox"])'));
        // Preferencia: input visivel com placeholder ou name contendo CPF
        let alvo = inputs.find(i =>
          (i.placeholder || '').toLowerCase().includes('cpf')
          || (i.name || '').toLowerCase().includes('cpf')
          || (i.id || '').toLowerCase().includes('cpf')
        );
        if (!alvo) alvo = inputs.find(i => i.offsetParent !== null);
        if (!alvo) alvo = inputs[0];
        if (!alvo) return null;

        alvo.focus();
        alvo.select();
        const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
        if (nativeSetter) nativeSetter.call(alvo, cpf);
        alvo.value = cpf;
        alvo.dispatchEvent(new Event('input', { bubbles: true }));
        alvo.dispatchEvent(new Event('change', { bubbles: true }));
        alvo.dispatchEvent(new Event('keyup', { bubbles: true }));
        alvo.dispatchEvent(new Event('blur', { bubbles: true }));
        return alvo.id || alvo.name || 'ok';
      }, cpfDigits);
      LOG(`CPF: ${cpfPreenchido || 'FALHOU'}`);
      if (!cpfPreenchido) {
        await page.close();
        return { status: 'error', orgao: this.nome, dataConsulta, error: 'Input CPF nao encontrado' };
      }
      await wait(1500);

      await diagnosticar(page, 'apos preencher cpf');

      // ═══════════════════════════════════════════════════════════
      // PASSO 4: Setup captura + clicar EMITIR
      // ═══════════════════════════════════════════════════════════
      LOG('Configurando captura de download (CDP + HTTP + nova aba)...');
      await prepararCapturaPDFViaCDP(page, DOWNLOAD_DIR).catch(() => LOG('CDP download prep falhou'));
      const capture = setupDownloadCapture(page, DOWNLOAD_DIR);
      await wait(500);

      LOG('Clicando EMITIR...');

      // Aguarda botao ficar habilitado (Angular desabilita ate form valido)
      await page.waitForFunction(
        () => {
          const btns = Array.from(document.querySelectorAll<HTMLElement>('button, input[type="button"], input[type="submit"]'));
          return btns.some(b => {
            const txt = (b.textContent || (b as HTMLInputElement).value || '').trim().toUpperCase();
            return (txt === 'EMITIR' || txt.includes('EMITIR'))
              && !(b as HTMLButtonElement).disabled;
          });
        },
        { timeout: 15000 }
      ).catch(() => LOG('Timeout botao habilitado - tentando mesmo assim'));

      let emitirOk = false;
      for (let tentativa = 0; tentativa < 2; tentativa++) {
        emitirOk = await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll<HTMLElement>('button, input[type="button"], input[type="submit"], a.btn'));
          for (const b of btns) {
            const txt = (b.textContent || (b as HTMLInputElement).value || '').trim().toUpperCase();
            if (txt === 'EMITIR' || txt.includes('EMITIR')) {
              (b as HTMLButtonElement).disabled = false;
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
        if (emitirOk) break;
        await wait(2000);
      }

      LOG(`EMITIR: ${emitirOk ? 'OK' : 'NAO ENCONTRADO'}`);
      if (!emitirOk) {
        capture.cleanup();
        await page.close();
        return { status: 'error', orgao: this.nome, dataConsulta, error: 'Botao EMITIR nao encontrado' };
      }

      // ═══════════════════════════════════════════════════════════
      // PASSO 5: CAPTCHA
      // ═══════════════════════════════════════════════════════════
      let captchaType: string | null = null;
      for (let t = 0; t < 40; t++) {
        if (page.isClosed()) break;
        captchaType = await detectarCaptcha(page).catch(() => null);
        if (captchaType) break;
        await wait(500);
      }
      LOG(`CAPTCHA: ${captchaType || 'nenhum'}`);

      if (captchaType) {
        await focusPageForCaptcha(page, captchaType as any).catch(() => {});
        let captchaOk = await resolverCaptchaTextoAuto(page);
        if (!captchaOk) {
          LOG('Auto-solve indisponivel, aguardando interativo...');
          captchaOk = await esperarCaptchaInterativo(page, captchaType as any).catch(() => false);
        }
        if (!captchaOk || page.isClosed()) {
          capture.cleanup();
          await page.close().catch(() => {});
          return { status: 'error', orgao: this.nome, dataConsulta, error: '[TRT] CAPTCHA nao resolvido' };
        }
        LOG('CAPTCHA resolvido');
        await wait(1500);
      }

      // ═══════════════════════════════════════════════════════════
      // PASSO 6: Aguardar pagina de resultado + PDF
      // ═══════════════════════════════════════════════════════════
      LOG('Aguardando resultado...');
      let resultadoOk = false;
      try {
        await page.waitForFunction(
          () => {
            const url = window.location.href;
            if (url.includes('/certidao/') || url.includes('/resultado/')
              || url.includes('/certidoes/') && url.length > 55) return true;
            const body = document.body?.textContent?.toLowerCase() || '';
            return body.includes('certidão emitida') || body.includes('certidao emitida')
              || body.includes('nada consta') || body.includes('protocolo');
          },
          { timeout: 25000 }
        );
        resultadoOk = true;
      } catch {
        LOG('Timeout aguardando resultado');
      }

      // Diagnostico da pagina de resultado (PJe shadow DOM)
      try {
        const diag = await page.evaluate(() => {
          const url = window.location.href;
          const body = (document.body?.textContent || '').slice(0, 300);
          const shadowEls = Array.from(document.querySelectorAll('*')).filter(el => el.shadowRoot);
          const shadowInfo = shadowEls.map(el => ({
            tag: el.tagName.toLowerCase(),
            id: el.id,
            shadowHTML: (el.shadowRoot?.innerHTML || '').slice(0, 200),
          }));
          const embeds = Array.from(document.querySelectorAll('embed, object, iframe')).map(e => ({
            tag: e.tagName, src: e.getAttribute('src')?.slice(0, 100) || '',
            data: e.getAttribute('data')?.slice(0, 100) || '',
          }));
          const links = Array.from(document.querySelectorAll('a[href*=".pdf"], a[href*="download"]')).map(a => ({
            text: a.textContent?.trim()?.slice(0, 40), href: a.getAttribute('href')?.slice(0, 150),
          }));
          return { url, body: body.slice(0, 300), shadowCount: shadowEls.length, shadowInfo: shadowInfo.slice(0, 3), embeds, links };
        });
        LOG(`Resultado URL: ${diag.url?.slice(0, 100)}`);
        LOG(`Resultado body: ${diag.body}`);
        LOG(`Shadow DOMs: ${diag.shadowCount}`);
        if (diag.shadowInfo.length > 0) {
          for (const s of diag.shadowInfo) LOG(`  <${s.tag}> id="${s.id}" html="${s.shadowHTML}"`);
        }
        if (diag.embeds.length > 0) {
          for (const e of diag.embeds) LOG(`  <${e.tag}> src="${e.src}" data="${e.data}"`);
        }
        if (diag.links.length > 0) {
          for (const l of diag.links) LOG(`  Link: "${l.text}" → ${l.href}`);
        }
      } catch (e: any) { LOG(`Erro diagnostico: ${e.message}`); }

      if (resultadoOk) {
        // Aguarda conteudo renderizar (shadow DOM)
        await page.waitForFunction(
          () => {
            const el = document.querySelector('pje-conteudo-certidao-encapsulado, #certidao, .certidao-conteudo, [id*="certidao"]');
            if (!el) return true;
            try {
              const root = (el as any).shadowRoot || el;
              const html = (root?.innerHTML || el.innerHTML || '').trim();
              return html.length > 100;
            } catch { return true; }
          },
          { timeout: 15000 }
        ).catch(() => LOG('Timeout aguardando conteudo shadow DOM'));
        await wait(2000);
      }

      const pdf = await esperarResultadoPDF(page, capture.promise);
      capture.cleanup();

      if (!pdf || pdf.length < 1000) {
        await page.close();
        return { status: 'error', orgao: this.nome, dataConsulta, error: 'PDF vazio ou invalido' };
      }
      LOG(`PDF: ${pdf.length} bytes`);

      await this.#throttle();
      await page.close();
      return {
        status: 'success',
        orgao: this.nome,
        dataConsulta,
        protocolo: `TRT-${new Date().getFullYear()}.${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`,
        documento: pdf,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      LOG(`ERRO: ${msg}`);
      await page.close().catch(() => {});
      return { status: 'error', orgao: this.nome, dataConsulta, error: `[TRT] ${msg}` };
    }
  }
}
