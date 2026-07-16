import type { IConnector } from './connector.interface.js';
import type { DadosProprietario, ConnectorResult } from './types.js';
import { createPage } from '../utils/browser.js';
import { injectFillHelper, preencherInputRapido, tentarBaixarPDF, clicarBotaoPorTexto, aceitarCookies, prepararCapturaPDFViaCDP } from '../utils/dom-helper.js';
import { detectarCaptcha, esperarCaptchaInterativo } from '../utils/captcha.js';
import { focusPageForCaptcha } from '../services/captcha-solver.service.js';
import { wait, criarRateLimit } from '../utils/retry-manager.service.js';
import path from 'path';
import { fileURLToPath } from 'url';

const LOG = (msg: string) => console.log(`[TJDFT] ${msg}`);
const DEBUG = process.env.DEBUG;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOWNLOAD_DIR = path.join(__dirname, '..', '..', 'tmp', 'downloads');

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
    sel = `[id="${inputId}"]`;
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
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForSelector('.q-field, .q-input, input, button', { timeout: 15000 }).catch(() => {});
      await wait(2000);
      await aceitarCookies(page);
      LOG('Pagina carregada');

      if (DEBUG) await diagnosticarFormulario(page);
      await injectFillHelper(page);

      const cpfDigits = dados.cpf.replace(/\D/g, '');
      const primeiroNome = dados.nome.split(' ')[0];

      // ----- STEP 1: dados basicos (Quasar/Vue - usar fillInput primeiro) -----
      const cpfOk = await preencherInputPorLabel(page, 'CPF/CNPJ', cpfDigits, true)
        || await preencherInputPorLabel(page, 'CPF/CNPJ', cpfDigits);
      const nomeOk = await preencherInputPorLabel(page, 'Primeiro Nome', primeiroNome, true)
        || await preencherInputPorLabel(page, 'Primeiro Nome', primeiroNome);
      LOG(`CPF: ${cpfOk}, Nome: ${nomeOk}`);

      // radio "Cível e Criminal" (prioridade sobre "Cível" sozinho)
      const radioOk = await page.evaluate(() => {
        const labels = Array.from(document.querySelectorAll('.q-radio__label, .q-radio label, label'));

        // Pass 1: especial (cobre civel e criminal)
        for (let i = 0; i < labels.length; i++) {
          const label = labels[i];
          const txt = (label.textContent?.trim() || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
          if (txt.includes('especial')) {
            const radio = label.closest('.q-radio, .q-option-group, div') || label.parentElement;
            if (radio) {
              const clickable = radio.querySelector('.q-radio__inner, .q-radio__bg, input[type="radio"]') || radio;
              (clickable as HTMLElement).click();
              const inp = radio.querySelector('input[type="radio"]');
              if (inp) {
                (inp as HTMLInputElement).checked = true;
                inp.dispatchEvent(new Event('change', { bubbles: true }));
                inp.dispatchEvent(new Event('input', { bubbles: true }));
              }
              return txt;
            }
          }
        }

        // Pass 2: civel / especial
        for (let i = 0; i < labels.length; i++) {
          const label = labels[i];
          const txt = (label.textContent?.trim() || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
          if (txt.includes('civel') || txt.includes('especial')) {
            const radio = label.closest('.q-radio, .q-option-group, div') || label.parentElement;
            if (radio) {
              const clickable = radio.querySelector('.q-radio__inner, .q-radio__bg, input[type="radio"]') || radio;
              (clickable as HTMLElement).click();
              const inp = radio.querySelector('input[type="radio"]');
              if (inp) {
                (inp as HTMLInputElement).checked = true;
                inp.dispatchEvent(new Event('change', { bubbles: true }));
                inp.dispatchEvent(new Event('input', { bubbles: true }));
              }
              return txt;
            }
          }
        }

        return null;
      });
      LOG(`Radio: ${radioOk || 'nao encontrado'}`);
      await wait(500);

      const proximoClicado = await clicarBotaoPorTexto(page, 'proximo');
      if (!proximoClicado) {
        await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll('button, .q-btn'));
          for (const b of btns) {
            const t = (b.textContent?.trim() || '').toLowerCase();
            if (t.includes('proximo') || t.includes('próximo') || t.includes('avancar') || t.includes('avançar') || t.includes('continuar')) {
              (b as HTMLElement).click();
              return;
            }
          }
        });
      }
      LOG('Proximo clicado - aguardando wizard step 2...');

      try {
        await page.waitForFunction(
          () => {
            const labels = Array.from(document.querySelectorAll('label'));
            return labels.some(l => (l.textContent?.toLowerCase() || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes('nome da m'));
          },
          { timeout: 15000 },
        );
        await wait(1500);
        LOG('Wizard step 2 carregado');
      } catch {
        LOG('Timeout esperando step 2, tentando continuar...');
        await wait(2000);
      }

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

      await wait(1000);

      // STEP 2 submit - procura botoes Quasar q-btn com texto de submit
      const btnClicado = await page.evaluate(() => {
        const botoes = Array.from(document.querySelectorAll('button.q-btn, button, .q-btn'));
        for (const b of botoes) {
          const txt = (b.textContent?.trim() || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
          if (txt.includes('solicitar') || txt.includes('emitir') || txt.includes('gerar')) {
            (b as HTMLElement).click();
            return txt;
          }
        }
        return null;
      });
      LOG(`Botao encontrado: ${btnClicado || 'nenhum'}`);

      let formularioEnviado = !!btnClicado;

      if (!formularioEnviado) {
        formularioEnviado = await clicarBotaoPorTexto(page, 'proximo')
          || await clicarBotaoPorTexto(page, 'solicitar')
          || await clicarBotaoPorTexto(page, 'emitir');
      }

      LOG(`Submit step 2: ${formularioEnviado}`);

      if (!formularioEnviado) {
        await page.close();
        return { status: 'error', orgao: this.nome, dataConsulta, error: 'Nenhum botao de submit encontrado' };
      }

      // Aguarda navegação ou resultado após submit
      try {
        await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 25000 }).catch(() => {});
        await wait(2000);
        LOG(`URL apos submit: ${page.url()}`);
      } catch {}

      // Aguarda resultado ou mensagem de erro
      try {
        await page.waitForFunction(
          () => {
            const body = document.body.textContent?.toLowerCase() || '';
            if (body.includes('certidão') || body.includes('protocolo') || body.includes('resultado')) return true;
            if (body.includes('não consta') || body.includes('nao consta') || body.includes('nada consta')) return true;
            const alerta = document.querySelector('.q-banner, .q-notification, [role="alert"], .text-negative');
            if (alerta && (alerta.textContent?.length || 0) > 5) return true;
            return false;
          },
          { timeout: 20000 },
        );
      } catch {
        LOG('Timeout aguardando resultado...');
      }
      await wait(2000);

      // ----- CAPTCHA -----
      const captchaType = await detectarCaptcha(page);
      LOG(`CAPTCHA: ${captchaType}`);

      if (captchaType) {
        await focusPageForCaptcha(page, captchaType);
        LOG('CAPTCHA detectado - enviando para resolucao remota...');
        const captchaOk = await esperarCaptchaInterativo(page, captchaType);
        if (!captchaOk) {
          LOG('CAPTCHA nao resolvido no tempo limite');
          await page.close();
          return { status: 'error', orgao: this.nome, dataConsulta, error: `[TJDFT] CAPTCHA nao resolvido no tempo limite` };
        }
        LOG('CAPTCHA resolvido, continuando...');
        await wait(2000);
      }

      if (pageClosed) throw new Error('Pagina fechada');

      // Verifica se houve erro antes de capturar PDF
      const erroMsg = await page.evaluate(() => {
        const body = document.body.textContent?.toLowerCase() || '';
        if (body.includes('cpf inválido') || body.includes('cpf invalido') || body.includes('cpf não') || body.includes('não foi possível')) {
          return body.slice(0, 300);
        }
        const alertas = document.querySelectorAll('.q-banner--error, .text-negative, [role="alert"], .q-field__messages--error, .q-notification--error');
        for (const el of alertas) {
          const txt = el.textContent?.trim();
          if (txt && txt.length > 5) return txt.slice(0, 300);
        }
        return null;
      });

      if (erroMsg) {
        LOG(`Erro detectado: ${erroMsg.slice(0, 150)}`);
        await page.close();
        return { status: 'error', orgao: this.nome, dataConsulta, error: `[TJDFT] ${erroMsg}` };
      }

      await prepararCapturaPDFViaCDP(page, DOWNLOAD_DIR);
      LOG('CDP preparado para captura de download');

      // Aguarda mais tempo para o download iniciar
      await wait(3000);

      const protocolo = `TJDFT-${new Date().getFullYear()}.${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`;

      let pdfBuffer: Buffer | Uint8Array | null = null;

      // Tenta capturar download via CDP
      try {
        pdfBuffer = await tentarBaixarPDF(page, DOWNLOAD_DIR);
        if (pdfBuffer && pdfBuffer.length > 1000) {
          LOG(`PDF via CDP/download (${pdfBuffer.length} bytes)`);
        }
      } catch (e: any) {
        LOG(`CDP falhou: ${e.message}`);
      }

      // Fallback 1: procura botao de download na pagina e clica (MouseEvent real)
      if (!pdfBuffer || pdfBuffer.length < 1000) {
        try {
          if (!pageClosed) {
            await page.evaluate(() => {
              const links = document.querySelectorAll<HTMLElement>('a[href*="pdf"], a[href*="download"], button');
              for (const el of links) {
                const txt = (el.textContent || '').toLowerCase();
                if (txt.includes('baixar') || txt.includes('download') || txt.includes('pdf') || txt.includes('imprimir') || txt.includes('certidao')) {
                  el.scrollIntoView({ block: 'center', behavior: 'instant' });
                  const rect = el.getBoundingClientRect();
                  const cx = rect.left + rect.width / 2;
                  const cy = rect.top + rect.height / 2;
                  for (const evtType of ['mousedown', 'mouseup', 'click']) {
                    el.dispatchEvent(new MouseEvent(evtType, { bubbles: true, cancelable: true, clientX: cx, clientY: cy, button: 0 }));
                  }
                  return;
                }
              }
            });
            await wait(3000);
            pdfBuffer = await tentarBaixarPDF(page, DOWNLOAD_DIR);
            if (pdfBuffer && pdfBuffer.length > 1000) {
              LOG(`PDF via botao download (${pdfBuffer.length} bytes)`);
            }
          }
        } catch {}
      }

      // Fallback 2: busca links de PDF na pagina
      if (!pdfBuffer || pdfBuffer.length < 1000) {
        try {
          if (!pageClosed) {
            const pdfLinkBuf = await page.evaluate(async () => {
              const links = document.querySelectorAll<HTMLAnchorElement>('a[href]');
              for (const a of links) {
                const href = a.href || '';
                if (!href.includes('.pdf')) continue;
                try {
                  const r = await fetch(href);
                  const buf = await r.arrayBuffer();
                  if (buf.byteLength > 1000) return Array.from(new Uint8Array(buf));
                } catch {}
              }
              return null;
            });
            if (pdfLinkBuf && pdfLinkBuf.length > 0) {
              pdfBuffer = new Uint8Array(pdfLinkBuf);
              LOG(`PDF via link fetch (${pdfBuffer.length} bytes)`);
            }
          }
        } catch {}
      }

      if (!pdfBuffer || pdfBuffer.length < 1000) {
        await page.close().catch(() => {});
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
