import type { IConnector } from './connector.interface.js';
import type { DadosProprietario, ConnectorResult } from './types.js';
import { createPage } from '../utils/browser.js';
import { aceitarCookies, tentarBaixarPDF } from '../utils/dom-helper.js';
import { detectarCaptcha, esperarCaptchaInterativo } from '../utils/captcha.js';
import { focusPageForCaptcha } from '../services/captcha-solver.service.js';
import { wait, criarRateLimit } from '../utils/retry-manager.service.js';

const LOG = (msg: string) => console.log(`[TRT] ${msg}`);

const FORM_URL = 'https://www.trt10.jus.br/certidao_online/jsf/publico/certidaoOnline.jsf';

// ============================================================
// DIAGNOSTICO (sempre roda)
// ============================================================
async function diagnosticarFormulario(page: import('puppeteer').Page): Promise<void> {
  const info = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('input')).map(el => ({
      id: el.id, name: el.name, type: el.type, placeholder: el.placeholder,
    }));
    const labels = Array.from(document.querySelectorAll('label')).map(el => ({
      htmlFor: el.htmlFor, text: (el.textContent || '').trim().slice(0, 80),
    }));
    const buttons = Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"], a.btn')).map(el => ({
      tag: el.tagName,
      text: (el as HTMLElement).textContent?.trim() || (el as HTMLInputElement).value || '',
    }));
    const selects = Array.from(document.querySelectorAll('select')).map(el => ({
      id: el.id, name: el.name, options: Array.from(el.options).map(o => o.text.trim()).slice(0, 10),
    }));
    return { inputs, labels, buttons, selects };
  });
  LOG('=== DIAGNOSTICO DA PAGINA ===');
  LOG(`Inputs (${info.inputs.length}):`);
  for (const i of info.inputs) LOG(`  id="${i.id}" name="${i.name}" type="${i.type}" placeholder="${i.placeholder}"`);
  LOG(`Labels (${info.labels.length}):`);
  for (const l of info.labels) LOG(`  for="${l.htmlFor}" text="${l.text}"`);
  LOG(`Botoes (${info.buttons.length}):`);
  for (const b of info.buttons) LOG(`  <${b.tag}> "${b.text}"`);
  if (info.selects.length > 0) {
    LOG(`Selects (${info.selects.length}):`);
    for (const s of info.selects) LOG(`  id="${s.id}" name="${s.name}" options: ${s.options.join(' | ')}`);
  }
}

// ============================================================
// CAPTURA PDF direto (page.pdf = "Salvar como PDF")
// ============================================================
async function capturarPDFAposEmitir(page: import('puppeteer').Page): Promise<Uint8Array | null> {
  LOG('Aguardando pagina de resultado...');
  try { await page.waitForNetworkIdle({ idleTime: 2000, timeout: 25000 }); } catch {}
  await wait(2000);

  if (page.isClosed()) { LOG('Pagina fechada'); return null; }

  try {
    const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '10mm', bottom: '10mm' } });
    if (pdf.length > 1000) { LOG(`PDF capturado: ${pdf.length} bytes`); return pdf; }
  } catch (e: any) { LOG(`page.pdf() falhou: ${e.message}`); }

  const buf = await tentarBaixarPDF(page).catch(() => null);
  if (buf && buf.length > 1000) { LOG(`PDF tentarBaixarPDF: ${buf.length} bytes`); return buf; }

  LOG('Nenhum PDF capturado');
  return null;
}

// ============================================================
// CONNECTOR
// ============================================================
export class TRTConnector implements IConnector {
  readonly nome = 'TRT';
  readonly #throttle = criarRateLimit(3000);

  async consultar(
    dados: DadosProprietario,
    jobId?: string,
    certKeys?: string[],
  ): Promise<ConnectorResult> {
    const dataConsulta = new Date().toISOString();
    LOG('Iniciando TRT');
    const page = await createPage().catch(e => { LOG(`ERRO createPage: ${e.message}`); throw e; });

    try {
      LOG(`Navegando...`);
      await page.goto(FORM_URL, { waitUntil: 'networkidle0', timeout: 45000 }).catch(async () => {
        await wait(5000);
        await page.goto(FORM_URL, { waitUntil: 'networkidle0', timeout: 45000 });
      });
      await wait(2000);
      await aceitarCookies(page);

      LOG('Aguardando pagina carregar...');
      await page.waitForFunction(
        () => {
          const body = document.body?.textContent || '';
          return !body.includes('Processando') && !body.includes('aguarde');
        },
        { timeout: 25000 }
      ).catch(() => LOG('timeout aguardando loading'));
      await wait(3000);

      // ---- PASSO 1: Clicar na aba "Emissão de Certidão" (MouseEvent real para JSF/PrimeFaces) ----
      LOG('Procurando aba Emissao...');
      const abaClicada = await page.evaluate(() => {
        const links = document.querySelectorAll<HTMLElement>('a, li[role="tab"], .ui-tabs-nav a, .ui-tabs-nav li');
        for (const el of links) {
          const t = (el.textContent || '').toLowerCase();
          if (t.includes('emissão') || t.includes('emissao') || t.includes('emitir')) {
            el.scrollIntoView({ block: 'center', behavior: 'instant' });
            const rect = el.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            for (const evtType of ['mousedown', 'mouseup', 'click']) {
              el.dispatchEvent(new MouseEvent(evtType, { bubbles: true, cancelable: true, clientX: cx, clientY: cy, button: 0 }));
            }
            return t.trim();
          }
        }
        return null;
      });
      LOG(`Aba emissao: ${abaClicada || 'NAO ENCONTRADA'}`);
      await wait(2000);

      // Aguarda o form de emissao aparecer
      if (abaClicada) {
        LOG('Aguardando formulario de emissao...');
        await page.waitForFunction(
          () => {
            const inputs = document.querySelectorAll('input[type="text"], input:not([type="hidden"])');
            return inputs.length >= 1;
          },
          { timeout: 15000 }
        ).catch(() => LOG('timeout'));
        await wait(1000);
      }

      await diagnosticarFormulario(page);

      const cpfDigits = dados.cpf.replace(/\D/g, '');

      // PASSO 1: Clicar no radio/label CPF (MouseEvent real)
      LOG('Selecionando opcao CPF...');
      await page.evaluate(() => {
        const labels = Array.from(document.querySelectorAll<HTMLElement>('label'));
        for (const l of labels) {
          if ((l.textContent || '').trim() === 'CPF') {
            l.scrollIntoView({ block: 'center', behavior: 'instant' });
            const rect = l.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            for (const evtType of ['mousedown', 'mouseup', 'click']) {
              l.dispatchEvent(new MouseEvent(evtType, { bubbles: true, cancelable: true, clientX: cx, clientY: cy, button: 0 }));
            }
            return;
          }
        }
      });
      await wait(1000);

      // Debug: verifica estado apos click no radio
      await diagnosticarFormulario(page);

      // PASSO 2: Preencher CPF
      LOG('Buscando input CPF...');
      let cpfSel = '#mat-input-0';
      let cpfInput = await page.$(cpfSel);
      if (!cpfInput) {
        // Fallback: qualquer input text visivel
        cpfSel = await page.evaluate(() => {
          const inputs = document.querySelectorAll<HTMLInputElement>('input[type="text"]:not([readonly])');
          for (const inp of Array.from(inputs)) {
            if (inp.offsetParent !== null) {
              if (inp.id) return `#${CSS.escape(inp.id)}`;
              if (inp.name) return `input[name="${inp.name}"]`;
              return 'input[type="text"]';
            }
          }
          return null;
        }) || '';
        cpfInput = await page.$(cpfSel);
      }

      if (!cpfInput || !cpfSel) {
        await page.close();
        return { status: 'error', orgao: this.nome, dataConsulta, error: 'Input CPF nao encontrado' };
      }
      LOG(`Input CPF: ${cpfSel}`);

      await cpfInput.focus();
      await wait(200);
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyA');
      await page.keyboard.up('Control');
      await page.keyboard.press('Backspace');
      await wait(100);
      await page.keyboard.type(cpfDigits, { delay: 25 });

      const valor = await page.evaluate((sel) => {
        const el = document.querySelector<HTMLInputElement>(sel);
        return el?.value || '(vazio)';
      }, cpfSel);
      LOG(`CPF digitado: ${valor}`);

      await wait(500);

      // PASSO 3: Emitir (MouseEvent real)
      LOG('Clicando Emitir...');
      const submitOk = await page.evaluate(() => {
        const btns = document.querySelectorAll<HTMLElement>('button');
        for (const b of btns) {
          if ((b.textContent || '').trim() === 'Emitir') {
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
      LOG(`Submit: ${submitOk ? 'clicado' : 'nao encontrado'}`);

      if (!submitOk) {
        await page.close();
        return { status: 'error', orgao: this.nome, dataConsulta, error: 'Botao Emitir nao encontrado' };
      }

      // CAPTCHA
      let captchaType: string | null = null;
      for (let t = 0; t < 30; t++) {
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
          await page.close().catch(() => {});
          return { status: 'error', orgao: this.nome, dataConsulta, error: '[TRT] CAPTCHA nao resolvido' };
        }
        LOG('CAPTCHA resolvido');
        await wait(2000);
      }

      // PDF
      const pdf = await capturarPDFAposEmitir(page);
      if (!pdf || pdf.length < 1000) {
        await page.close();
        return { status: 'error', orgao: this.nome, dataConsulta, error: 'PDF vazio ou invalido' };
      }
      LOG(`PDF capturado: ${pdf.length} bytes`);

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
