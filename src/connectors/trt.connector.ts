import type { IConnector } from './connector.interface.js';
import type { DadosProprietario, ConnectorResult } from './types.js';
import { createPage } from '../utils/browser.js';
import { injectFillHelper, preencherInputRapido, tentarBaixarPDF, clicarBotaoPorTexto, aceitarCookies, preencherCampoRobusto, prepararCapturaPDFViaCDP } from '../utils/dom-helper.js';
import { detectarCaptcha, esperarCaptchaInterativo } from '../utils/captcha.js';
import { focusPageForCaptcha, esperarCaptchaComSuporteRemoto } from '../services/captcha-solver.service.js';
import { wait, criarRateLimit } from '../utils/retry-manager.service.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOWNLOAD_DIR = path.join(__dirname, '..', '..', 'tmp', 'downloads');

const LOG = (msg: string) => console.log(`[TRT] ${msg}`);
const DEBUG = process.env.DEBUG;

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
  return preencherCampoRobusto(page, sel, valor);
}

async function preencherInputFallback(page: import('puppeteer').Page, busca: string, valor: string): Promise<boolean> {
  const sel = await page.evaluate((b) => {
    const lb = b.toLowerCase();
    const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('input'));
    for (const inp of inputs) {
      const id = (inp.id || '').toLowerCase();
      const name = (inp.name || '').toLowerCase();
      const ph = (inp.placeholder || '').toLowerCase();
      if (id.includes(lb) || name.includes(lb) || ph.includes(lb)) {
        return inp.id ? `#${CSS.escape(inp.id)}` : inp.name ? `[name="${inp.name}"]` : 'input';
      }
    }
    return null;
  }, busca);
  if (!sel) return false;
  return preencherCampoRobusto(page, sel, valor);
}

export class TRTConnector implements IConnector {
  readonly nome = 'TRT';

  async consultar(
    dados: DadosProprietario,
    jobId?: string,
    certKeys?: string[],
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
      await aceitarCookies(page);

      if (DEBUG) await diagnosticarFormulario(page);
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
        LOG('Nenhum campo encontrado, abortando');
        await page.close();
        return { status: 'error', orgao: this.nome, dataConsulta, error: 'Campos CPF e Nome nao encontrados no formulario' };
      }

      await wait(1000);

      await prepararCapturaPDFViaCDP(page, DOWNLOAD_DIR);
      LOG('CDP preparado para captura de download');

      const submitOk = await clicarBotaoPorTexto(page, 'emitir')
        || await clicarBotaoPorTexto(page, 'consultar')
        || await clicarBotaoPorTexto(page, 'enviar')
        || await clicarBotaoPorTexto(page, 'solicitar')
        || await clicarBotaoPorTexto(page, 'ok')
        || await clicarBotaoPorTexto(page, 'gerar');
      LOG(`Submit: ${submitOk}`);

      if (!submitOk) {
        await page.close();
        return { status: 'error', orgao: this.nome, dataConsulta, error: 'Nenhum botao de submit encontrado' };
      }

      await wait(2000);

      const captchaType = await detectarCaptcha(page);
      LOG(`CAPTCHA: ${captchaType}`);

      if (captchaType) {
        await focusPageForCaptcha(page, captchaType);
        LOG('CAPTCHA detectado - enviando para resolucao remota...');
        const captchaOk = await esperarCaptchaComSuporteRemoto(page, captchaType, jobId || '', this.nome);
        if (!captchaOk) {
          LOG('CAPTCHA nao resolvido no tempo limite');
          await page.close();
          return { status: 'error', orgao: this.nome, dataConsulta, error: `[TRT] CAPTCHA nao resolvido no tempo limite` };
        }
        LOG('CAPTCHA resolvido, continuando...');
        await wait(3000);
      }

      if (pageClosed) throw new Error('Pagina fechada');

      const protocolo = `TRT-${new Date().getFullYear()}.${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`;
      const pdfBuffer = await tentarBaixarPDF(page, DOWNLOAD_DIR);
      if (!pdfBuffer || pdfBuffer.length < 1000) {
        await page.close();
        return { status: 'error', orgao: this.nome, dataConsulta, error: 'PDF inválido ou vazio' };
      }
      LOG(`PDF capturado (${pdfBuffer.length} bytes)`);

      await this.#throttle();
      await page.close();
      return { status: 'success', orgao: this.nome, dataConsulta, protocolo, documento: pdfBuffer };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      LOG(`ERRO: ${msg}`);
      await page.close().catch(() => {});
      return { status: 'error', orgao: this.nome, dataConsulta, error: `[TRT] ${msg}` };
    }
  }

  readonly #throttle = criarRateLimit(3000);
}
