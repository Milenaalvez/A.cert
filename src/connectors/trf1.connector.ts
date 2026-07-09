import type { IConnector } from './connector.interface.js';
import type { DadosProprietario, ConnectorResult } from './types.js';
import { createPage } from '../utils/browser.js';
import { injectFillHelper, preencherInputRapido, tentarBaixarPDF, aceitarCookies } from '../utils/dom-helper.js';
import { detectarCaptcha, esperarCaptchaInterativo } from '../utils/captcha.js';
import { focusPageForCaptcha } from '../services/captcha-solver.service.js';
import { PDFDocument } from 'pdf-lib';
import { wait, criarRateLimit } from '../utils/retry-manager.service.js';



const LOG = (msg: string) => console.log(`[TRF1] ${msg}`);
const DEBUG = process.env.DEBUG;

const FORM_URL = 'https://sistemas.trf1.jus.br/certidao/#/solicitacao';

async function diagnosticarFormulario(page: import('puppeteer').Page): Promise<void> {
  const info = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('input')).map(el => ({
      id: el.id,
      type: el.type,
      name: el.name,
      placeholder: el.placeholder,
      className: el.className.slice(0, 50),
      role: el.getAttribute('role') || '',
    }));
    const labels = Array.from(document.querySelectorAll('label')).map(el => ({
      htmlFor: el.htmlFor,
      text: (el.textContent || '').trim().slice(0, 60),
      class: el.className.slice(0, 30),
    }));
    const buttons = Array.from(document.querySelectorAll('button')).map(el => ({
      text: (el.textContent || '').trim().slice(0, 60),
      class: el.className.slice(0, 30),
      type: el.type,
    }));
    return { inputs, labels, buttons };
  });

  LOG(`Inputs (${info.inputs.length}):`);
  for (const i of info.inputs) LOG(`  id="${i.id}" name="${i.name}" type="${i.type}" placeholder="${i.placeholder}" class="${i.className}" role="${i.role}"`);
  LOG(`Labels (${info.labels.length}):`);
  for (const l of info.labels) LOG(`  for="${l.htmlFor}" text="${l.text}" class="${l.class}"`);
  LOG(`Botoes (${info.buttons.length}):`);
  for (const b of info.buttons) LOG(`  text="${b.text}" type="${b.type}" class="${b.class}"`);
}

async function preencherAutocomplete(
  page: import('puppeteer').Page,
  labelTexto: string,
  valor: string,
): Promise<boolean> {
  const lblNormalizado = labelTexto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const inputSel = await page.evaluate((lbl) => {
    const lblLow = lbl.toLowerCase();
    if (lblLow.normalize('NFD').replace(/[\u0300-\u036f]/g, '') === 'orgaos') {
      const inp = document.querySelector('input[name="orgaos"]');
      if (inp && inp.id) return `#${CSS.escape(inp.id)}`;
      if (inp) return 'input[name="orgaos"]';
      return null;
    }
    const labels = Array.from(document.querySelectorAll('label'));
    for (const label of labels) {
      const txt = (label.textContent?.trim() || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      if (txt.includes(lblLow.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))) {
        const container = label.closest('.p-field, .field, .p-float-label') || label.parentElement;
        if (!container) continue;
        const inp = container.querySelector('input');
        if (!inp) continue;
        if (inp.id) return `#${CSS.escape(inp.id)}`;
        if (inp.name) return `input[name="${inp.name}"]`;
        return `input[role="${inp.getAttribute('role') || 'listbox'}"]`;
      }
    }
    return null;
  }, labelTexto);

  if (!inputSel) {
    LOG(`Label "${labelTexto}" nao encontrado`);
    return false;
  }

  LOG(`Autocomplete "${labelTexto}" encontrado: ${inputSel}`);

  // Foca o input via evaluate para evitar __name do esbuild
  const focused = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return false;
    (el as HTMLInputElement).value = '';
    (el as HTMLInputElement).focus();
    el.dispatchEvent(new Event('focus', { bubbles: true }));
    return true;
  }, inputSel);
  if (!focused) {
    LOG(`Falha ao focar "${inputSel}"`);
    return false;
  }
  await wait(200);
  await page.keyboard.type(valor, { delay: 30 });
  return true;
}

async function selecionarDropdown(
  page: import('puppeteer').Page,
  filtro: (t: string) => boolean,
): Promise<string | null> {
  const filtroStr = filtro.toString();

  await wait(2000);
  await page.keyboard.press('ArrowDown');
  await wait(300);
  await page.keyboard.press('Enter');
  await wait(500);

  const selected = await page.evaluate(() => {
    const input = document.querySelector('.p-autocomplete input[type="text"], .p-autocomplete-token-label, p-autocomplete input');
    if (input) return (input as HTMLInputElement).value || input.textContent?.trim() || null;
    return null;
  });
  if (selected && selected.length > 0) {
    LOG(`Selecionado via ArrowDown+Enter: ${selected}`);
    return selected;
  }

  // Fallback: clicar no item dentro do painel
  await page.waitForSelector('.p-autocomplete-panel, ul.p-autocomplete-items, [role="listbox"]', { timeout: 5000 }).catch(() => {});
  await wait(500);

  const clicked = await page.evaluate((filtroS: string) => {
    const fn = new Function('t', `return ${filtroS}`) as (t: string) => boolean;
    const panels = document.querySelectorAll('.p-autocomplete-panel, ul.p-autocomplete-items, [role="listbox"], p-autocomplete .p-autocomplete-items, .p-autocomplete-items-wrapper');
    for (const panel of panels) {
      const items = panel.querySelectorAll<HTMLElement>('li, [role="option"], .p-autocomplete-item, .p-element');
      for (const item of items) {
        const t = item.textContent?.trim().toLowerCase() || '';
        if (fn(t)) {
          item.click();
          return item.textContent?.trim() || '';
        }
      }
    }
    return null;
  }, filtroStr);

  if (clicked) {
    LOG(`Clicou no item do painel: ${clicked}`);
    return clicked;
  }

  LOG(`Nenhum item encontrado para o filtro: ${filtroStr.slice(0, 60)}`);
  return null;
}

async function preencherInputKeyboard(
  page: import('puppeteer').Page,
  selector: string,
  valor: string,
): Promise<boolean> {
  const el = await page.$(selector);
  if (!el) return false;
  await page.evaluate((s) => {
    const e = document.querySelector<HTMLInputElement>(s);
    if (e) { e.value = ''; e.focus(); }
  }, selector);
  await wait(100);
  await page.keyboard.type(valor, { delay: 6 });
  return true;
}

async function preencherEEnviar(
  page: import('puppeteer').Page,
  dados: DadosProprietario,
  tipo: string,
  orgao: string,
  filtroTipo: (t: string) => boolean,
  filtroOrgao: (t: string) => boolean,
): Promise<void> {
  const cpfDigits = dados.cpf.replace(/\D/g, '');
  const emailReal = dados.email;

  LOG(`Navegando para formulario (${tipo} + ${orgao})...`);
  await page.goto(FORM_URL, { waitUntil: 'networkidle2', timeout: 30000 }).catch(async () => {
    await wait(2000);
    await page.goto(FORM_URL, { waitUntil: 'networkidle2', timeout: 30000 });
  });
  await wait(3000);

  if (DEBUG) await diagnosticarFormulario(page);
  await injectFillHelper(page);

  await preencherAutocomplete(page, 'Tipo de certidão', tipo);
  const tipoSel = await selecionarDropdown(page, filtroTipo);
  LOG(`[${tipo}] Tipo: ${tipoSel}`);

  await preencherAutocomplete(page, 'Órgãos', orgao);
  const orgaoSel = await selecionarDropdown(page, filtroOrgao);
  LOG(`[${orgao}] Orgao: ${orgaoSel}`);

  await page.evaluate(() => {
    const radio = document.querySelector<HTMLElement>('#cpf');
    if (radio) radio.click();
  });

  const cpfOk = await preencherInputKeyboard(page, 'input[name="cpfCnpj"]', cpfDigits);
  LOG(`CPF: ${cpfOk}`);

  const emailOk = await preencherInputKeyboard(page, '#email', emailReal);
  LOG(`Email: ${emailOk}`);

  const emailConfOk = await preencherInputKeyboard(page, '#emailConfirmacao', emailReal);
  LOG(`Email Confirmacao: ${emailConfOk}`);

  await wait(500);

  const submitOk = await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const b of btns) {
      const t = b.textContent?.trim() || '';
      if (t.includes('Solicitar certidão') || t.includes('Solicitar') || t.includes('Emitir') || t.includes('solicitar')) {
        b.click();
        return t.slice(0, 40);
      }
    }
    return null;
  });
  LOG(`Submit: ${submitOk || 'nenhum'}`);
}

async function preencherEEnviarMulti(
  page: import('puppeteer').Page,
  dados: DadosProprietario,
  tipo: string,
  orgaos: string[],
  filtroTipo: (t: string) => boolean,
  filtrosOrgao: ((t: string) => boolean)[],
): Promise<void> {
  const cpfDigits = dados.cpf.replace(/\D/g, '');
  const emailReal = dados.email;

  LOG(`Navegando para formulario (${tipo} + ${orgaos.join('/')})...`);
  await page.goto(FORM_URL, { waitUntil: 'networkidle2', timeout: 30000 }).catch(async () => {
    await wait(2000);
    await page.goto(FORM_URL, { waitUntil: 'networkidle2', timeout: 30000 });
  });
  await wait(3000);
  await aceitarCookies(page);

  if (DEBUG) await diagnosticarFormulario(page);
  await injectFillHelper(page);

  // Seleciona Tipo de certidão
  await preencherAutocomplete(page, 'Tipo de certidão', tipo);
  const tipoSel = await selecionarDropdown(page, filtroTipo);
  LOG(`[${tipo}] Tipo: ${tipoSel}`);

  // Seleciona múltiplos Órgãos (multi-select PrimeNG)
  for (let i = 0; i < orgaos.length; i++) {
    await preencherAutocomplete(page, 'Órgãos', orgaos[i]);
    const orgaoSel = await selecionarDropdown(page, filtrosOrgao[i]);
    LOG(`[${orgaos[i]}] Orgao ${i + 1}/${orgaos.length}: ${orgaoSel}`);
  }

  await page.evaluate(() => {
    const radio = document.querySelector<HTMLElement>('#cpf');
    if (radio) radio.click();
  });

  const cpfOk = await preencherInputKeyboard(page, 'input[name="cpfCnpj"]', cpfDigits);
  LOG(`CPF: ${cpfOk}`);

  const emailOk = await preencherInputKeyboard(page, '#email', emailReal);
  LOG(`Email: ${emailOk}`);

  const emailConfOk = await preencherInputKeyboard(page, '#emailConfirmacao', emailReal);
  LOG(`Email Confirmacao: ${emailConfOk}`);

  await wait(500);

  const submitOk = await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const b of btns) {
      const t = b.textContent?.trim() || '';
      if (t.includes('Solicitar certidão') || t.includes('Solicitar') || t.includes('Emitir') || t.includes('solicitar')) {
        b.click();
        return t.slice(0, 40);
      }
    }
    return null;
  });
  LOG(`Submit: ${submitOk || 'nenhum'}`);
}

async function capturarPDF(page: import('puppeteer').Page): Promise<Uint8Array | null> {
  await wait(3000);
  if (page.isClosed()) return null;
  const buf = await tentarBaixarPDF(page);
  if (buf) LOG(`PDF capturado (${buf.length} bytes)`);
  return buf;
}

export class TRF1Connector implements IConnector {
  readonly nome = 'TRF1';

  async consultar(
    dados: DadosProprietario,
    jobId?: string,
    certKeys?: string[],
  ): Promise<ConnectorResult> {
    const dataConsulta = new Date().toISOString();
    LOG('Iniciando consulta');

  const runs = [
    {
      tipo: 'Cível',
      chave: 'TRF1_CIVEL',
      orgaos: ['SJDF', 'TRF1'],
      filtroTipo: (t: string) => t.includes('cível'),
      filtrosOrgao: [
        (t: string) => {
          const norm = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
          return norm.includes('secao judiciaria') && (norm.includes('df') || norm.includes('distrito federal'));
        },
        (t: string) => {
          const norm = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
          return norm.includes('tribunal regional federal') && norm.includes('1');
        },
      ],
    },
    {
      tipo: 'Criminal',
      chave: 'TRF1_CRIMINAL',
      orgaos: ['SJDF', 'TRF1'],
      filtroTipo: (t: string) => t.includes('criminal'),
      filtrosOrgao: [
        (t: string) => {
          const norm = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
          return norm.includes('secao judiciaria') && (norm.includes('df') || norm.includes('distrito federal'));
        },
        (t: string) => {
          const norm = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
          return norm.includes('tribunal regional federal') && norm.includes('1');
        },
      ],
    },
  ].filter(r => !certKeys || certKeys.length === 0 || certKeys.includes(r.chave));

  const pdfs: Uint8Array[] = [];
  const errors: string[] = [];
  const throttle = criarRateLimit(4000);

  for (let i = 0; i < runs.length; i++) {
    const run = runs[i];
    if (i > 0) {
      LOG(`Aguardando 5s antes do proximo orgao...`);
      await wait(5000);
    }

    const page = await createPage().catch(e => { errors.push(`${run.tipo}: ${e.message}`); return null; });
    if (!page) continue;

    try {
      await throttle();

      LOG(`--- ${run.tipo} (${run.orgaos.join(' + ')}) ---`);
      await preencherEEnviarMulti(page, dados, run.tipo, run.orgaos, run.filtroTipo, run.filtrosOrgao);

      let captchaType = null;
      for (let tentativa = 0; tentativa < 30; tentativa++) {
        if (page.isClosed()) break;
        captchaType = await detectarCaptcha(page);
        if (captchaType) break;
        await wait(500);
      }
      LOG(`CAPTCHA: ${captchaType}`);

      if (captchaType) {
        await focusPageForCaptcha(page, captchaType);
        LOG('CAPTCHA detectado - resolva na janela do navegador...');
        const captchaOk = await esperarCaptchaInterativo(page, captchaType);
        if (!captchaOk) {
          LOG('CAPTCHA nao resolvido no tempo limite');
          await page.close();
          return { status: 'error', orgao: this.nome, dataConsulta, error: `[TRF1] CAPTCHA nao resolvido no tempo limite` };
        }
        LOG('CAPTCHA resolvido, continuando...');
        await wait(2000);
      }

      const pdf = await capturarPDF(page);
      if (pdf && pdf.length > 100 && !page.isClosed()) {
        pdfs.push(pdf);
        LOG(`PDF adicionado (${pdf.length} bytes)`);
      } else {
        errors.push(`${run.tipo}/${run.orgaos.join('+')}: PDF vazio`);
      }
    } catch (err: unknown) {
      const m = err instanceof Error ? err.message : 'Erro';
      errors.push(`${run.tipo}/${run.orgaos.join('+')}: ${m}`);
      LOG(`ERRO: ${m}`);
    }
    await page.close().catch(() => {});
  }

      if (pdfs.length === 0) {
        return { status: 'error', orgao: this.nome, dataConsulta, error: `Nenhuma certidao. ${errors.join('; ')}` };
      }

      LOG(`Mesclando ${pdfs.length} PDF(s)...`);
      const mergedPdf = await PDFDocument.create();
      for (const pdfBytes of pdfs) {
        try {
          const doc = await PDFDocument.load(pdfBytes);
          const pages = await mergedPdf.copyPages(doc, doc.getPageIndices());
          for (const p of pages) mergedPdf.addPage(p);
        } catch (e) { LOG(`Erro merge: ${e}`); }
      }
      const mergedBytes = await mergedPdf.save();

      return { status: 'success', orgao: this.nome, dataConsulta, protocolo: `TRF1-${new Date().getFullYear()}.${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`, documento: mergedBytes };
  }
}
