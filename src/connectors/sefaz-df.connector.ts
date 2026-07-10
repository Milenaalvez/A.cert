import type { IConnector } from './connector.interface.js';
import type { DadosProprietario, ConnectorResult } from './types.js';
import { createPage } from '../utils/browser.js';
import { injectFillHelper, preencherInputRapido, tentarBaixarPDF, clicarBotaoPorTexto, aceitarCookies, preencherCampoRobusto, prepararCapturaPDFViaCDP } from '../utils/dom-helper.js';
import { detectarCaptcha, esperarCaptchaInterativo } from '../utils/captcha.js';
import { focusPageForCaptcha } from '../services/captcha-solver.service.js';
import { wait, criarRateLimit } from '../utils/retry-manager.service.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOWNLOAD_DIR = path.join(__dirname, '..', '..', 'tmp', 'downloads');

const LOG = (msg: string) => console.log(`[SEFAZ-DF] ${msg}`);
const DEBUG = process.env.DEBUG;

async function diagnosticarFormulario(page: import('puppeteer').Page): Promise<void> {
  const info = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('input')).map(el => ({
      id: el.id, name: el.name, type: el.type, placeholder: el.placeholder, className: el.className.slice(0, 50),
    }));
    const labels = Array.from(document.querySelectorAll('label')).map(el => ({
      htmlFor: el.htmlFor, text: (el.textContent || '').trim().slice(0, 80),
    }));
    const buttons = Array.from(document.querySelectorAll('button, a.btn, a[class*="button"], input[type="submit"], input[type="button"]')).map(el => {
      const text = (el as HTMLElement).textContent?.trim() || (el as HTMLInputElement).value || '';
      return { tag: el.tagName, text: text.slice(0, 60), type: (el as HTMLInputElement).type || '', class: el.className.slice(0, 40) };
    });
    const selects = Array.from(document.querySelectorAll<HTMLSelectElement>('select')).map(el => ({
      id: el.id, name: el.name, options: Array.from(el.options).map(o => ({ text: o.text.trim(), value: o.value })),
    }));
    const radios = Array.from(document.querySelectorAll<HTMLInputElement>('input[type="radio"]')).map(el => ({
      id: el.id, name: el.name, value: el.value, label: document.querySelector<HTMLLabelElement>(`label[for="${el.id}"]`)?.textContent?.trim() || '',
    }));
    const checkboxes = Array.from(document.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')).map(el => ({
      id: el.id, name: el.name, value: el.value, label: document.querySelector<HTMLLabelElement>(`label[for="${el.id}"]`)?.textContent?.trim() || '',
    }));
    const allText: string[] = [];
    document.querySelectorAll('h1, h2, h3, h4, h5, p, span, td, .mensagem, .alert, .panel, .content, .texto, strong').forEach(el => {
      const t = (el as HTMLElement).textContent?.trim();
      if (t && t.length > 3 && t.length < 120) allText.push(t);
    });
    return { inputs, labels, buttons, selects, radios, checkboxes, allText: allText.slice(0, 40) };
  });
  LOG(`Inputs (${info.inputs.length}):`);
  for (const i of info.inputs) LOG(`  id="${i.id}" name="${i.name}" type="${i.type}" placeholder="${i.placeholder}" class="${i.className}"`);
  LOG(`Labels (${info.labels.length}):`);
  for (const l of info.labels) LOG(`  for="${l.htmlFor}" text="${l.text}"`);
  LOG(`Botoes (${info.buttons.length}):`);
  for (const b of info.buttons) LOG(`  <${b.tag}> "${b.text}" type="${b.type}" class="${b.class}"`);
  if (info.selects.length > 0) LOG(`Selects: ${JSON.stringify(info.selects)}`);
  if (info.radios.length > 0) LOG(`Radios: ${JSON.stringify(info.radios)}`);
  if (info.checkboxes.length > 0) LOG(`Checkboxes: ${JSON.stringify(info.checkboxes)}`);
  LOG(`Textos: ${info.allText.join(' | ')}`);
}

const CERTIDAO_URL = 'https://ww1.receita.fazenda.df.gov.br/ciadadao/certidoes/Certidao';
const FINALIDADE = 'LAVRAR ESCRITURA PÚBLICA';

async function preencherInputPorLabel(page: import('puppeteer').Page, labelTexto: string, valor: string): Promise<boolean> {
  const lblNorm = labelTexto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const sel = await page.evaluate((lbl) => {
    const labels = Array.from(document.querySelectorAll('label'));
    for (const label of labels) {
      const txt = (label.textContent?.trim() || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      if (!txt.includes(lbl)) continue;
      if (label.htmlFor) return `#${CSS.escape(label.htmlFor)}`;
      const parent = label.closest('.field, .p-field, .form-group, .input-group, div') || label.parentElement;
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

async function selecionarSelectPorTexto(page: import('puppeteer').Page, busca: string, valorTexto: string): Promise<boolean> {
  const valNorm = valorTexto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const lb = busca.toLowerCase();
  const result = await page.evaluate((lbl, vn) => {
    const selects = Array.from(document.querySelectorAll<HTMLSelectElement>('select'));
    for (const sel of selects) {
      const id = (sel.id || '').toLowerCase();
      const name = (sel.name || '').toLowerCase();
      if (!id.includes(lbl) && !name.includes(lbl)) continue;
      for (let i = 0; i < sel.options.length; i++) {
        const optNorm = sel.options[i].text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        if (optNorm.includes(vn) || vn.includes(optNorm)) {
          sel.selectedIndex = i;
          sel.dispatchEvent(new Event('change', { bubbles: true }));
          return sel.options[i].text;
        }
      }
    }
    return null;
  }, lb, valNorm);
  return result !== null;
}

async function marcarRadioPorLabel(page: import('puppeteer').Page, labelTexto: string): Promise<boolean> {
  const lblNorm = labelTexto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const result = await page.evaluate((lbl) => {
    const labels = Array.from(document.querySelectorAll('label'));
    for (const label of labels) {
      const txt = (label.textContent?.trim() || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      if (!txt.includes(lbl)) continue;
      if (label.htmlFor) {
        const radio = document.querySelector<HTMLInputElement>(`#${CSS.escape(label.htmlFor)}`);
        if (radio && radio.type === 'radio') { radio.click(); radio.dispatchEvent(new Event('change', { bubbles: true })); return label.htmlFor; }
      }
      const parent = label.closest('div, .radio, .form-check, label');
      if (parent) {
        const radio = parent.querySelector<HTMLInputElement>('input[type="radio"]');
        if (radio) { radio.click(); radio.dispatchEvent(new Event('change', { bubbles: true })); return radio.id; }
      }
    }
    return null;
  }, lblNorm);
  return result !== null;
}

export class SefazDFConnector implements IConnector {
  readonly nome = 'SEFAZ-DF';

  readonly #throttle = criarRateLimit(3000);

  async consultar(
    dados: DadosProprietario,
    jobId?: string,
    certKeys?: string[],
  ): Promise<ConnectorResult> {
    const dataConsulta = new Date().toISOString();
    LOG('Iniciando consulta SEFAZ-DF');
    const page = await createPage().catch(e => { LOG(`ERRO createPage: ${e.message}`); throw e; });

    try {
      let pageClosed = false;
      page.once('close', () => { pageClosed = true; });

      LOG('Navegando para certidao...');
      await page.goto(CERTIDAO_URL, { waitUntil: 'networkidle2', timeout: 30000 });
      await wait(3000);
      await aceitarCookies(page);

      if (DEBUG) await diagnosticarFormulario(page);
      await injectFillHelper(page);

      const cpfDigits = dados.cpf.replace(/\D/g, '');

      LOG('Preenchendo CPF...');
      const cpfOk = await preencherInputPorLabel(page, 'CPF', cpfDigits)
        || await preencherInputPorLabel(page, 'CPF/CNPJ', cpfDigits)
        || await preencherInputPorLabel(page, 'Documento', cpfDigits)
        || await preencherInputPorLabel(page, 'Número', cpfDigits)
        || await preencherInputFallback(page, 'cpf', cpfDigits)
        || await preencherInputFallback(page, 'ni', cpfDigits)
        || await preencherInputFallback(page, 'documento', cpfDigits);
      LOG(`CPF: ${cpfOk || 'nao encontrado'}`);

      // Try to select or fill "finalidade"
      LOG('Configurando finalidade...');
      const finalidadeOk = await selecionarSelectPorTexto(page, 'finalidade', FINALIDADE)
        || await selecionarSelectPorTexto(page, 'motivo', FINALIDADE)
        || await selecionarSelectPorTexto(page, 'razao', FINALIDADE)
        || await marcarRadioPorLabel(page, 'LAVRAR')
        || await marcarRadioPorLabel(page, 'ESCRITURA');
      LOG(`Finalidade: ${finalidadeOk || 'nao configurada'}`);

      await wait(500);

      await prepararCapturaPDFViaCDP(page, DOWNLOAD_DIR);
      LOG('CDP preparado para captura de download');

      const submitOk = await clicarBotaoPorTexto(page, 'emitir')
        || await clicarBotaoPorTexto(page, 'consultar')
        || await clicarBotaoPorTexto(page, 'gerar')
        || await clicarBotaoPorTexto(page, 'solicitar')
        || await clicarBotaoPorTexto(page, 'enviar')
        || await clicarBotaoPorTexto(page, 'ok')
        || await clicarBotaoPorTexto(page, 'certidão')
        || await clicarBotaoPorTexto(page, 'certidao')
        || await clicarBotaoPorTexto(page, 'prosseguir');
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
        const captchaOk = await esperarCaptchaInterativo(page, captchaType);
        if (!captchaOk) {
          LOG('CAPTCHA nao resolvido no tempo limite');
          await page.close();
          return { status: 'error', orgao: this.nome, dataConsulta, error: `[SEFAZ-DF] CAPTCHA nao resolvido no tempo limite` };
        }
        LOG('CAPTCHA resolvido, continuando...');
        await wait(3000);
      }

      if (pageClosed) throw new Error('Pagina fechada');

      // Check for error messages after submit
      const erroMsg = await page.evaluate(() => {
        const errs = document.querySelectorAll('.error, .alert, .msg-erro, [role="alert"], .mensagem, .notificacao, .toast, .erro, .text-danger');
        for (const e of errs) {
          const txt = e.textContent?.trim();
          if (txt && txt.length > 5) return txt;
        }
        const body = document.body.textContent?.toLowerCase() || '';
        if (body.includes('cpf inválido') || body.includes('cpf invalido') || body.includes('não foi possivel') || body.includes('erro')) {
          return body.slice(0, 300);
        }
        return null;
      });
      if (erroMsg) {
        LOG(`Erro detectado: ${erroMsg.slice(0, 150)}`);
        await page.close();
        return { status: 'error', orgao: this.nome, dataConsulta, error: `[SEFAZ-DF] ${erroMsg}` };
      }

      const protocolo = `SEFAZ-DF-${new Date().getFullYear()}.${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`;
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
      return { status: 'error', orgao: this.nome, dataConsulta, error: `[SEFAZ-DF] ${msg}` };
    }
  }
}
