import type { IConnector } from './connector.interface.js';
import type { DadosProprietario, ConnectorResult } from './types.js';
import type { CaptchaManager } from '../services/captcha-manager.service.js';
import { createPage } from '../utils/browser.js';
import { injectFillHelper } from '../utils/dom-helper.js';
import { detectarCaptcha } from '../utils/captcha.js';
import { wait } from '../utils/retry-manager.service.js';

const LOG = (msg: string) => console.log(`[TJDFT] ${msg}`);

function normalizar(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
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

  if (!inputId) return false;

  const sel = inputId ? `[id="${inputId}"]` : '';
  const el = sel ? await page.$(sel) : null;
  if (!el) return false;

  if (usarFallback) {
    const ok = await page.evaluate((s, v) => {
      const e = document.querySelector<HTMLInputElement>(s);
      if (!e) return false;
      try { (window as any).__fillInput(e, v); return true; } catch { return false; }
    }, sel, valor);
    LOG(`Input "${labelTexto}" via fillHelper: ${ok}`);
    return ok;
  }

  await el.click({ clickCount: 3 });
  await wait(100);
  await page.keyboard.type(valor, { delay: 8 });
  LOG(`Input "${labelTexto}" preenchido via keyboard`);
  return true;
}

async function clicarBotao(page: import('puppeteer').Page, texto: string): Promise<boolean> {
  return page.evaluate((txt) => {
    const txtNorm = txt.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const btns = document.querySelectorAll('button');
    for (const b of btns) {
      const t = (b.textContent?.trim() || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      if (t.includes(txtNorm)) { b.click(); return true; }
    }
    return false;
  }, texto);
}

export class TJDFTConnector implements IConnector {
  readonly nome = 'TJDFT';

  async consultar(
    dados: DadosProprietario,
    captchaManager?: CaptchaManager,
    jobId?: string,
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

      await clicarBotao(page, 'proximo');
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

      // Diagnostico da pagina de filiacao
      const diag = await page.evaluate(() => {
        const labels = Array.from(document.querySelectorAll('label')).map(l => `"${l.textContent?.trim()}" for="${l.htmlFor}"`);
        const inputs = Array.from(document.querySelectorAll('input')).map(i => `id="${i.id}" name="${i.name}" type="${i.type}" readonly="${i.readOnly}" disabled="${i.disabled}"`);
        const buttons = Array.from(document.querySelectorAll('button')).map(b => `"${b.textContent?.trim()}" type="${b.type}" visible="${b.offsetParent !== null}"`);
        const allText = Array.from(document.querySelectorAll('*')).filter(e => e.children.length === 0 && e.textContent?.trim()).slice(0, 30).map(e => `"${e.textContent?.trim()}"`);
        return { labels, inputs, buttons, allText };
      });
      LOG(`Labels filiacao: ${diag.labels.join(' | ')}`);
      LOG(`Inputs filiacao: ${diag.inputs.join(' | ')}`);
      LOG(`Botoes filiacao: ${diag.buttons.join(' | ')}`);
      LOG(`Textos visiveis: ${diag.allText.join(' | ')}`);

      // Preenche nome da mae e do pai (campos estao editaveis disabled=false)
      const maeOk = await preencherInputPorLabel(page, 'Nome da Mae', dados.nomeMae, true);
      LOG(`Mae: ${maeOk}`);

      if (dados.nomePai) {
        const paiOk = await preencherInputPorLabel(page, 'Nome do Pai', dados.nomePai, true);
        LOG(`Pai: ${paiOk}`);
      }

      await wait(1500);

      // Na pagina de filiacao, o botao de submit eh "Proximo"
      const proximoOk = await clicarBotao(page, 'proximo');
      LOG(`Proximo (submit) clicado: ${proximoOk}`);

      let formularioEnviado = proximoOk;

      if (!proximoOk) {
        const solicitou = await clicarBotao(page, 'solicitar');
        LOG(`Solicitar clicado: ${solicitou}`);
        formularioEnviado = solicitou;
      }

      if (!formularioEnviado) {
        LOG('Nenhum botao de envio encontrado. Tentando clique generico...');
        const genOk = await page.evaluate(() => {
          const btns = document.querySelectorAll('button');
          for (const b of btns) {
            if (b.offsetParent !== null) { b.click(); return b.textContent?.trim() || 'unknown'; }
          }
          return null;
        });
        LOG(`Clique generico: ${genOk}`);
        formularioEnviado = !!genOk;
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
        if (captchaManager && jobId) {
          const chave = `${jobId}-${this.nome}`;
          const img = await page.screenshot({ type: 'png' });

          LOG('Aguardando resolucao CAPTCHA...');
          await Promise.race([
            captchaManager.waitForSolution(chave, this.nome, img, captchaType),
            new Promise((_, reject) => {
              const check = () => {
                if (pageClosed) reject(new Error('Pagina fechada'));
                else page.once('close', check);
              };
              page.once('close', check);
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

      const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
      LOG('PDF capturado');

      const protocolo = `TJDFT-${new Date().getFullYear()}.${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`;
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
