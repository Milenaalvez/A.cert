import type { IConnector } from './connector.interface.js';
import type { DadosProprietario, ConnectorResult } from './types.js';
import type { CaptchaManager } from '../services/captcha-manager.service.js';
import { createPage } from '../utils/browser.js';
import { injectFillHelper, preencherInputRapido, tentarBaixarPDF, clicarBotaoPorTexto } from '../utils/dom-helper.js';
import { detectarCaptcha, esperarCaptchaInterativo } from '../utils/captcha.js';
import { focusPageForCaptcha } from '../services/captcha-solver.service.js';
import { wait, criarRateLimit } from '../utils/retry-manager.service.js';

const LOG = (msg: string) => console.log(`[TJDFT] ${msg}`);
const DEBUG = process.env.DEBUG;

function normalizar(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

async function diagnosticarFormulario(page: import('puppeteer').Page): Promise<void> {
  const info = await page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll('label')).map(l => `"${l.textContent?.trim()}" for="${l.htmlFor}"`);
    const inputs = Array.from(document.querySelectorAll('input')).map(i => `id="${i.id}" name="${i.name}" type="${i.type}" readonly="${i.readOnly}" disabled="${i.disabled}"`);
    const buttons = Array.from(document.querySelectorAll('button')).map(b => `"${b.textContent?.trim()}" type="${b.type}" visible="${b.offsetParent !== null}"`);
    const allText = Array.from(document.querySelectorAll('*')).filter(e => e.children.length === 0 && e.textContent?.trim()).slice(0, 30).map(e => `"${e.textContent?.trim()}"`);
    return { labels, inputs, buttons, allText };
  });
  LOG(`Labels: ${info.labels.join(' | ')}`);
  LOG(`Inputs: ${info.inputs.join(' | ')}`);
  LOG(`Botoes: ${info.buttons.join(' | ')}`);
  LOG(`Textos visiveis: ${info.allText.join(' | ')}`);
}

async function preencherInputPorLabel(
  page: import('puppeteer').Page,
  labelTexto: string,
  valor: string,
  usarFallback = false,
): Promise<boolean> {
  const lblNorm = normalizar(labelTexto).toLowerCase();
  const inputId = await page.evaluate((lbl) => {
    const labels = Array.from(document.querySelectorAll('label'));
    for (const label of labels) {
      const txt = (label.textContent?.trim() || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      if (!txt.includes(lbl)) continue;
      const field = label.closest('.q-field');
      if (field) {
        const inp = field.querySelector('input');
        if (inp) return inp.id;
      }
      const parent = label.parentElement;
      if (parent) {
        const inp = parent.querySelector('input');
        if (inp) return inp.id;
      }
    }
    return null;
  }, lblNorm);

  let sel: string;
  if (inputId) {
    sel = `#${CSS.escape(inputId)}`;
  } else {
    // Fallback: busca por placeholder ou name
    const fallbackSel = await page.evaluate((lbl) => {
      const lb = lbl.toLowerCase();
      const inputs = document.querySelectorAll<HTMLInputElement>('input');
      for (const inp of inputs) {
        const ph = (inp.placeholder || '').toLowerCase();
        const nm = (inp.name || '').toLowerCase();
        if (ph.includes(lb) || nm.includes(lb)) {
          return inp.id ? `#${CSS.escape(inp.id)}` : nm ? `[name="${nm}"]` : 'input';
        }
      }
      return null;
    }, labelTexto);
    if (!fallbackSel) return false;
    sel = fallbackSel;
    LOG(`Input "${labelTexto}" encontrado via fallback: ${sel}`);
  }

  if (usarFallback) {
    const ok = await page.evaluate((s, v) => {
      const e = document.querySelector<HTMLInputElement>(s);
      if (!e) return false;
      try { (window as any).__fillInput(e, v); return true; } catch { return false; }
    }, sel, valor);
    LOG(`Input "${labelTexto}" via fillHelper: ${ok}`);
    return ok;
  }

  return preencherInputRapido(page, sel, valor);
}

export class TJDFTConnector implements IConnector {
  readonly nome = 'TJDFT';

  readonly #throttle = criarRateLimit(3000);

  async consultar(
    dados: DadosProprietario,
    captchaManager?: CaptchaManager,
    jobId?: string,
    certKeys?: string[],
  ): Promise<ConnectorResult> {
    const dataConsulta = new Date().toISOString();
    LOG('Iniciando consulta');
    const page = await createPage().catch(e => { LOG(`ERRO createPage: ${e.message}`); throw e; });

    try {
      let pageClosed = false;
      page.once('close', () => { pageClosed = true; });

      const url = 'https://cnc.tjdft.jus.br/solicitacao-externa';

      LOG('Navegando...');
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      await wait(3000);
      LOG('Pagina carregada');

      if (DEBUG) await diagnosticarFormulario(page);
      await injectFillHelper(page);

      const cpfDigits = dados.cpf.replace(/\D/g, '');
      const primeiroNome = dados.nome.split(' ')[0];

      // ----- STEP 1: dados basicos -----
      const cpfOk = await preencherInputPorLabel(page, 'CPF/CNPJ', cpfDigits);
      const nomeOk = await preencherInputPorLabel(page, 'Primeiro Nome', primeiroNome);
      LOG(`CPF: ${cpfOk}, Nome: ${nomeOk}`);

      if (!cpfOk || !nomeOk) {
        LOG('Tentando fallback fillHelper...');
        await preencherInputPorLabel(page, 'CPF/CNPJ', cpfDigits, true);
        await preencherInputPorLabel(page, 'Primeiro Nome', primeiroNome, true);
      }

      // radio "Especial"
      await page.evaluate(() => {
        const labels = Array.from(document.querySelectorAll('.q-radio__label'));
        for (const label of labels) {
          const txt = (label.textContent?.trim() || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
          if (txt.includes('especial')) {
            const radio = label.closest('.q-radio');
            if (radio) { (radio as HTMLElement).click(); return; }
          }
        }
        for (const label of labels) {
          const txt = (label.textContent?.trim() || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
          if (txt.includes('civel')) {
            const radio = label.closest('.q-radio');
            if (radio) { (radio as HTMLElement).click(); return; }
          }
        }
      });
      await wait(500);

      await clicarBotaoPorTexto(page, 'proximo');
      LOG('Proximo clicado');

      // Aguarda nova pagina carregar (espera label "Nome da Mae" aparecer)
      try {
        await page.waitForFunction(
          () => {
            const labels = Array.from(document.querySelectorAll('label'));
            return labels.some(l => (l.textContent?.toLowerCase() || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes('nome da m'));
          },
          { timeout: 15000 },
        );
        LOG('Pagina de filiacao carregada');
      } catch {
        LOG('Timeout esperando pagina de filiacao, continuando...');
      }
      await wait(1000);

      // ----- STEP 2: filiacao -----
      LOG('Pagina de filiacao carregada');

      if (DEBUG) await diagnosticarFormulario(page);

      // Preenche nome da mae e do pai (campos estao editaveis disabled=false)
      const maeOk = await preencherInputPorLabel(page, 'Nome da Mae', dados.nomeMae, true);
      LOG(`Mae: ${maeOk}`);

      if (dados.nomePai) {
        const paiOk = await preencherInputPorLabel(page, 'Nome do Pai', dados.nomePai, true);
        LOG(`Pai: ${paiOk}`);
      }

      await wait(1500);

      // Na pagina de filiacao, o botao de submit eh "Proximo"
      const proximoOk = await clicarBotaoPorTexto(page, 'proximo');
      LOG(`Proximo (submit) clicado: ${proximoOk}`);

      let formularioEnviado = proximoOk;

      if (!proximoOk) {
        const solicitou = await clicarBotaoPorTexto(page, 'solicitar');
        LOG(`Solicitar clicado: ${solicitou}`);
        formularioEnviado = solicitou;
      }

      if (!formularioEnviado) {
        await page.close();
        return { status: 'error', orgao: this.nome, dataConsulta, error: 'Nenhum botao de submit encontrado' };
      }

      // Aguarda resultado se formulario foi enviado
      if (formularioEnviado) {
        try {
          await page.waitForNetworkIdle({ idleTime: 500, timeout: 10000 });
        } catch {}
      }
      await wait(3000);

      // ----- CAPTCHA -----
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
            new Promise<void>((resolve) => {
              const check = () => { if (pageClosed) resolve(); };
              page.on('close', check);
              setTimeout(() => { page.off('close', check); resolve(); }, 300000).unref();
            }),
          ]);
          LOG('CAPTCHA resolvido');
          await wait(2000);
        } else {
          await page.close();
          return { status: 'captcha_required', orgao: this.nome, dataConsulta, error: 'CAPTCHA presente.' };
        }
      }

      if (pageClosed) throw new Error('Pagina fechada');

      if (!formularioEnviado) {
        await page.close();
        return { status: 'error', orgao: this.nome, dataConsulta, error: 'Formulario nao enviado: nenhum botao de submit clicado' };
      }

      const protocolo = `TJDFT-${new Date().getFullYear()}.${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`;
      const pdfBuffer = await tentarBaixarPDF(page);
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
      return { status: 'error', orgao: this.nome, dataConsulta, error: `[TJDFT] ${msg}` };
    }
  }
}
