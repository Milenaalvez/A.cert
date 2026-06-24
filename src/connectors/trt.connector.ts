import type { IConnector } from './connector.interface.js';
import type { DadosProprietario, ConnectorResult } from './types.js';
import type { CaptchaManager } from '../services/captcha-manager.service.js';
import { createPage } from '../utils/browser.js';
import { injectFillHelper } from '../utils/dom-helper.js';
import { detectarCaptcha, esperarCaptchaInterativo } from '../utils/captcha.js';
import { focusPageForCaptcha } from '../services/captcha-solver.service.js';
import { wait } from '../utils/retry-manager.service.js';

const LOG = (msg: string) => console.log(`[TRT] ${msg}`);

async function diagnosticarFormulario(page: import('puppeteer').Page): Promise<void> {
  const info = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('input')).map(el => ({
      id: el.id,
      name: el.name,
      type: el.type,
      placeholder: el.placeholder,
      className: el.className.slice(0, 50),
    }));
    const labels = Array.from(document.querySelectorAll('label')).map(el => ({
      htmlFor: el.htmlFor,
      text: (el.textContent || '').trim().slice(0, 80),
    }));
    const buttons = Array.from(document.querySelectorAll('button, a[class*="button"], a[class*="btn"], input[type="submit"], input[type="button"]')).map(el => {
      const text = (el as HTMLElement).textContent?.trim() || (el as HTMLInputElement).value || '';
      return { tag: el.tagName, text: text.slice(0, 60), type: (el as HTMLInputElement).type || '', class: el.className.slice(0, 40) };
    });
    const select = Array.from(document.querySelectorAll('select')).map(el => ({
      id: el.id,
      name: el.name,
      options: Array.from(el.options).map(o => o.text.trim()).slice(0, 10),
    }));
    const allText: string[] = [];
    document.querySelectorAll('h1, h2, h3, h4, h5, p, span, td, div.panel, div.content, .texto, .mensagem').forEach(el => {
      const t = (el as HTMLElement).textContent?.trim();
      if (t && t.length > 3 && t.length < 100) allText.push(t);
    });
    return { inputs, labels, buttons, select, allText: allText.slice(0, 30) };
  });

  LOG(`Inputs (${info.inputs.length}):`);
  for (const i of info.inputs) LOG(`  id="${i.id}" name="${i.name}" type="${i.type}" placeholder="${i.placeholder}" class="${i.className}"`);
  LOG(`Labels (${info.labels.length}):`);
  for (const l of info.labels) LOG(`  for="${l.htmlFor}" text="${l.text}"`);
  LOG(`Botoes (${info.buttons.length}):`);
  for (const b of info.buttons) LOG(`  <${b.tag}> "${b.text}" type="${b.type}" class="${b.class}"`);
  if (info.select.length > 0) LOG(`Selects: ${JSON.stringify(info.select)}`);
  LOG(`Textos: ${info.allText.join(' | ')}`);
}

async function clicarBotaoPorTexto(page: import('puppeteer').Page, texto: string): Promise<boolean> {
  return page.evaluate((txt) => {
    const txtNorm = txt.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const botoes = document.querySelectorAll('button, a.btn, a[class*="button"], input[type="submit"], input[type="button"]');
    for (const b of botoes) {
      const content = (b as HTMLElement).textContent?.trim() || (b as HTMLInputElement).value || '';
      const norm = content.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      if (norm.includes(txtNorm)) { (b as HTMLElement).click(); return true; }
    }
    return false;
  }, texto);
}

async function preencherInputPorLabel(page: import('puppeteer').Page, labelTexto: string, valor: string): Promise<boolean> {
  const lblNorm = labelTexto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const sel = await page.evaluate((lbl) => {
    const labels = Array.from(document.querySelectorAll('label'));
    for (const label of labels) {
      const txt = (label.textContent?.trim() || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      if (!txt.includes(lbl)) continue;
      if (label.htmlFor) return `#${CSS.escape(label.htmlFor)}`;
      const parent = label.closest('.field, .p-field, .form-group, .q-field, div') || label.parentElement;
      if (parent) {
        const inp = parent.querySelector<HTMLInputElement>('input, select, textarea');
        if (inp && inp.id) return `#${CSS.escape(inp.id)}`;
        if (inp && inp.name) return `[name="${inp.name}"]`;
      }
    }
    return null;
  }, lblNorm);

  if (!sel) return false;
  const el = await page.$(sel);
  if (!el) return false;

  await el.click();
  await wait(100);
  await page.keyboard.type(valor, { delay: 8 });
  LOG(`Input "${labelTexto}"="${valor}" via ${sel}`);
  return true;
}

async function preencherInputFallback(page: import('puppeteer').Page, busca: string, valor: string): Promise<boolean> {
  const result = await page.evaluate((b, v) => {
    const lb = b.toLowerCase();
    const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('input'));
    for (const inp of inputs) {
      const id = (inp.id || '').toLowerCase();
      const name = (inp.name || '').toLowerCase();
      const ph = (inp.placeholder || '').toLowerCase();
      if (id.includes(lb) || name.includes(lb) || ph.includes(lb)) {
        const proto = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
        const setter = proto?.set;
        if (setter) {
          setter.call(inp, v);
          inp.dispatchEvent(new Event('input', { bubbles: true }));
          inp.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
          inp.value = v;
        }
        return inp.id || inp.name || 'unknown';
      }
    }
    return null;
  }, busca, valor);
  return result !== null;
}

export class TRTConnector implements IConnector {
  readonly nome = 'TRT';

  async consultar(
    dados: DadosProprietario,
    captchaManager?: CaptchaManager,
    jobId?: string,
  ): Promise<ConnectorResult> {
    const dataConsulta = new Date().toISOString();
    LOG('Iniciando consulta TRT10');
    const page = await createPage().catch(e => { LOG(`ERRO createPage: ${e.message}`); throw e; });

    try {
      let pageClosed = false;
      page.once('close', () => { pageClosed = true; });

      const url = 'https://www.trt10.jus.br/certidao_online/jsf/publico/certidaoOnline.jsf';
      LOG('Navegando...');
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      await wait(3000);

      await diagnosticarFormulario(page);
      await injectFillHelper(page);

      const cpfDigits = dados.cpf.replace(/\D/g, '');
      const nomeCompleto = dados.nome;

      LOG('Preenchendo formulario...');

      const cpfOk = await preencherInputPorLabel(page, 'CPF', cpfDigits)
        || await preencherInputPorLabel(page, 'Número', cpfDigits)
        || await preencherInputFallback(page, 'cpf', cpfDigits)
        || await preencherInputFallback(page, 'ni', cpfDigits);
      LOG(`CPF: ${cpfOk || 'nao encontrado'}`);

      const nomeOk = await preencherInputPorLabel(page, 'Nome', nomeCompleto)
        || await preencherInputFallback(page, 'nome', nomeCompleto);
      LOG(`Nome: ${nomeOk || 'nao encontrado'}`);

      if (!cpfOk && !nomeOk) {
        LOG('Nenhum campo encontrado, tentando fallback generico...');
        await page.evaluate((cpf, nome) => {
          const inputs = document.querySelectorAll<HTMLInputElement>('input[type="text"]');
          if (inputs.length >= 1) {
            const proto = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
            const setter = proto?.set;
            if (setter) { setter.call(inputs[0], cpf); inputs[0].dispatchEvent(new Event('input', { bubbles: true })); }
          }
          if (inputs.length >= 2) {
            const proto = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
            const setter = proto?.set;
            if (setter) { setter.call(inputs[1], nome); inputs[1].dispatchEvent(new Event('input', { bubbles: true })); }
          }
        }, cpfDigits, nomeCompleto);
      }

      await wait(1000);

      const submitOk = await clicarBotaoPorTexto(page, 'emitir')
        || await clicarBotaoPorTexto(page, 'consultar')
        || await clicarBotaoPorTexto(page, 'enviar')
        || await clicarBotaoPorTexto(page, 'solicitar')
        || await clicarBotaoPorTexto(page, 'ok')
        || await clicarBotaoPorTexto(page, 'gerar');
      LOG(`Submit: ${submitOk}`);

      if (!submitOk) {
        const genOk = await page.evaluate(() => {
          const botoes = document.querySelectorAll('button, input[type="submit"], input[type="button"]');
          for (const b of botoes) {
            if ((b as HTMLElement).offsetParent !== null) { (b as HTMLElement).click(); return (b as HTMLElement).textContent?.trim() || 'generic'; }
          }
          const links = document.querySelectorAll('a');
          for (const a of links) {
            if (a.textContent?.trim().toLowerCase().includes('certid') && a.offsetParent !== null) { a.click(); return a.textContent?.trim() || 'link'; }
          }
          return null;
        });
        LOG(`Submit generico: ${genOk}`);
        if (!genOk) {
          await page.close();
          return { status: 'error', orgao: this.nome, dataConsulta, error: 'Nenhum botao de submit encontrado' };
        }
      }

      await wait(2000);

      const captchaType = await detectarCaptcha(page);
      LOG(`CAPTCHA: ${captchaType}`);

      if (captchaType) {
        await focusPageForCaptcha(page, captchaType);

        if (captchaManager && jobId) {
          const chave = `${jobId}-${this.nome}`;
          const img = await page.screenshot({ type: 'png' });

          LOG('Aguardando resolucao CAPTCHA...');
          const waitPromise = captchaManager.waitForSolution(chave, this.nome, img, captchaType, page.url());
          esperarCaptchaInterativo(page, captchaType).then(ok => {
            if (ok) captchaManager.resolveCaptcha(chave, 'resolved');
          });
          await Promise.race([
            waitPromise,
            new Promise((_, reject) => {
              const check = () => {
                if (pageClosed) reject(new Error('Pagina fechada'));
                else page.once('close', check);
              };
              page.once('close', check);
            }),
          ]);
          LOG('CAPTCHA resolvido');
          await wait(3000);
        } else {
          await page.close();
          return { status: 'captcha_required', orgao: this.nome, dataConsulta, error: 'CAPTCHA presente' };
        }
      }

      if (pageClosed) throw new Error('Pagina fechada');

      await wait(3000);

      const protocolo = `TRT-${new Date().getFullYear()}.${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`;
      const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
      LOG('PDF capturado');

      await page.close();
      return { status: 'success', orgao: this.nome, dataConsulta, protocolo, documento: pdfBuffer };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      LOG(`ERRO: ${msg}`);
      await page.close().catch(() => {});
      return { status: 'error', orgao: this.nome, dataConsulta, error: `[TRT] ${msg}` };
    }
  }
}
