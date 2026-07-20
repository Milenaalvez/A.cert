import type { IConnector } from './connector.interface.js';
import type { DadosProprietario, ConnectorResult } from './types.js';
import { createPage } from '../utils/browser.js';
import { tentarBaixarPDF, setupDownloadCapture } from '../utils/dom-helper.js';
import { detectarCaptcha, esperarCaptchaInterativo } from '../utils/captcha.js';
import { focusPageForCaptcha } from '../services/captcha-solver.service.js';
import { wait, criarRateLimit } from '../utils/retry-manager.service.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG = (msg: string) => console.log(`[TRT] ${msg}`);
const DOWNLOAD_DIR = path.join(__dirname, '..', '..', 'tmp', 'downloads');

const EMISSAO_URL = 'https://pje.trt10.jus.br/certidoes/trabalhista/emissao';

async function esperarResultadoPDF(
  page: import('puppeteer').Page,
  capturePromise: Promise<Uint8Array | null>,
  timeoutMs = 30000
): Promise<Uint8Array | null> {
  LOG('Aguardando captura...');
  const resultado = await Promise.race([
    capturePromise,
    new Promise<null>(r => setTimeout(() => r(null), timeoutMs)),
  ]);
  if (resultado && resultado.length > 500) {
    LOG(`PDF via setupDownloadCapture: ${resultado.length} bytes`);
    return resultado;
  }
  LOG('Tentando page.pdf()...');
  await wait(2000);
  try {
    const pdf = await page.pdf({ format: 'A4', printBackground: true });
    if (pdf.length > 500 && pdf.slice(0, 5).toString() === '%PDF-') {
      LOG(`PDF page.pdf: ${pdf.length} bytes`);
      return new Uint8Array(pdf);
    }
  } catch (e: any) { LOG(`page.pdf() falhou: ${e.message}`); }
  const buf = await tentarBaixarPDF(page, DOWNLOAD_DIR).catch(() => null);
  if (buf && buf.length > 500) { LOG(`PDF tentarBaixarPDF: ${buf.length} bytes`); return buf; }
  LOG('Nenhum PDF capturado');
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
  readonly #throttle = criarRateLimit(3000);

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
        { timeout: 35000 }
      ).catch(() => LOG('Timeout esperando Angular'));
      await wait(4000);

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
      LOG('Configurando captura de download...');
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
        const ok = await esperarCaptchaInterativo(page, captchaType as any).catch(() => false);
        if (!ok || page.isClosed()) {
          capture.cleanup();
          await page.close().catch(() => {});
          return { status: 'error', orgao: this.nome, dataConsulta, error: '[TRT] CAPTCHA nao resolvido' };
        }
        LOG('CAPTCHA resolvido');
        await wait(3000);
      }

      // ═══════════════════════════════════════════════════════════
      // PASSO 6: Aguardar pagina de resultado + PDF
      // ═══════════════════════════════════════════════════════════
      LOG('Aguardando resultado...');
      try {
        await page.waitForFunction(
          () => {
            const url = window.location.href;
            if (url.includes('/certidao/') || url.includes('/resultado/')) return true;
            const body = document.body?.textContent?.toLowerCase() || '';
            return body.includes('certidão emitida') || body.includes('certidao emitida')
              || body.includes('nada consta') || body.includes('protocolo');
          },
          { timeout: 35000 }
        );
      } catch {
        LOG('Timeout aguardando resultado');
      }
      await wait(3000);

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
