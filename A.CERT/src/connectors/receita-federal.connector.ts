import type { IConnector } from './connector.interface.js';
import type { DadosProprietario, ConnectorResult } from './types.js';
import { createPage } from '../utils/browser.js';
import { injectFillHelper, preencherInputRapido, tentarBaixarPDF, aceitarCookies, prepararCapturaPDFViaCDP } from '../utils/dom-helper.js';
import { detectarCaptcha, esperarCaptchaInterativo } from '../utils/captcha.js';
import { focusPageForCaptcha } from '../services/captcha-solver.service.js';
import { wait, criarRateLimit } from '../utils/retry-manager.service.js';
import path from 'path';
import { fileURLToPath } from 'url';

const LOG = (msg: string) => console.log(`[RF] ${msg}`);
const DEBUG = process.env.DEBUG;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOWNLOAD_DIR = path.join(__dirname, '..', '..', 'tmp', 'downloads');

async function diagnosticarInputs(page: import('puppeteer').Page): Promise<void> {
  const inputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll<HTMLInputElement>('input')).map(el => ({
      id: el.id,
      name: el.name,
      type: el.type,
      placeholder: el.placeholder,
      className: el.className.slice(0, 50),
    }));
  });
  LOG(`Inputs na pagina (${inputs.length}):`);
  for (const inp of inputs) {
    LOG(`  id="${inp.id}" name="${inp.name}" type="${inp.type}" placeholder="${inp.placeholder}" class="${inp.className}"`);
  }

  const textos = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, p, span, label, div')).slice(0, 30).map(el => ({
      tag: el.tagName.toLowerCase(),
      text: (el as HTMLElement).textContent?.trim().slice(0, 80) || '',
    })).filter(e => e.text.length > 3);
  });
  LOG(`Textos visiveis (${textos.length}):`);
  for (const t of textos) {
    LOG(`  <${t.tag}> "${t.text}"`);
  }
}

export class ReceitaFederalConnector implements IConnector {
  readonly nome = 'Receita Federal';

  readonly #throttle = criarRateLimit(3000);

  async consultar(
    dados: DadosProprietario,
    jobId?: string,
    certKeys?: string[],
  ): Promise<ConnectorResult> {
    const dataConsulta = new Date().toISOString();
    LOG('Iniciando consulta');
    const page = await createPage().catch(e => { LOG(`ERRO createPage: ${e.message}`); throw e; });

    // Desabilita bypass CSP (pode trigger deteccao de bot na RF)
    await page.setBypassCSP(false);

    try {
      let pageClosed = false;
      page.once('close', () => { pageClosed = true; });

      // Tenta URL principal, fallback pra alternativa
      await page.goto('https://servicos.receitafederal.gov.br/servico/certidoes/#/home/cpf', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await wait(2000);

      // Se a pagina redirecionou ou esta vazia, tenta URL alternativa
      const hasInputs = await page.$('input:not([type="hidden"])').catch(() => null);
      if (!hasInputs) {
        LOG('Pagina sem inputs, tentando URL alternativa...');
        await page.goto('https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/certidoes', { waitUntil: 'domcontentloaded', timeout: 30000 });
        await wait(3000);
      }
      
      // Scroll pra baixo lentamente (humano)
      await page.evaluate(() => {
        window.scrollTo({ top: 200, behavior: 'smooth' });
      });
      await wait(1000);
      await page.evaluate(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      await wait(1000);

      await aceitarCookies(page);
      await wait(1000);

      // Movimento de mouse aleatorio
      await page.mouse.move(400, 300);
      await wait(300);
      await page.mouse.move(500, 350);
      await wait(300);
      await page.mouse.move(350, 280);
      await wait(500);

      if (DEBUG) await diagnosticarInputs(page);
      await injectFillHelper(page);

      // Aguarda Angular renderizar (a pagina pode demorar)
      try {
        await page.waitForSelector('input:not([type="hidden"])', { timeout: 15000 });
      } catch {}
      await wait(1000);

      const cpfDigits = dados.cpf.replace(/\D/g, '');
      const [ano, mes, dia] = dados.dataNascimento.split('-');

      const cpfSel = await page.evaluate(() => {
        const sels = [
          'input[name="niContribuinte"]',
          'input[placeholder*="CPF"]',
          'input[placeholder*="cpf"]',
          'input[formcontrolname="niContribuinte"]',
          'input[formcontrolname*="cpf"]',
          'input[formcontrolname*="Cpf"]',
          'input[inputmode="numeric"]',
          'input[type="text"]', // ultimo fallback
        ];
        for (const sel of sels) {
          const el = document.querySelector<HTMLInputElement>(sel);
          if (el && el.offsetParent !== null) return sel;
        }
        return null;
      });

      if (!cpfSel) {
        LOG('=== DIAGNOSTICO (CPF nao encontrado) ===');
        LOG(`URL: ${page.url()}`);
        const inputs = await page.evaluate(() => {
          return Array.from(document.querySelectorAll<HTMLInputElement>('input:not([type="hidden"])')).map(i => ({
            name: i.name, id: i.id, type: i.type,
            placeholder: (i as HTMLInputElement).placeholder || '',
            formcontrolname: i.getAttribute('formcontrolname') || '',
            visible: i.offsetParent !== null ? 'sim' : 'nao'
          }));
        }).catch(() => []);
        LOG(`Inputs visiveis (${inputs.length}):`);
        inputs.forEach((i: any) => LOG(`  name="${i.name}" id="${i.id}" placeholder="${i.placeholder}" formcontrolname="${i.formcontrolname}" visible="${i.visible}"`));
        await page.close();
        return { status: 'error', orgao: this.nome, dataConsulta, error: '[RF] Input CPF nao encontrado no formulario' };
      }

      // Preenche CPF via Angular + teclado
      {
        const el = await page.$(cpfSel);
        if (el) {
          await el.click();
          await wait(400);

          // Força o Angular a reconhecer o valor
          await page.evaluate((sel, val) => {
            const inp = document.querySelector<HTMLInputElement>(sel);
            if (!inp) return;
            const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
            if (nativeSetter) nativeSetter.call(inp, val);
            inp.dispatchEvent(new Event('input', { bubbles: true }));
            inp.dispatchEvent(new Event('change', { bubbles: true }));
            // Trigger Angular change detection
            if (inp && (inp as any).dispatchEvent) {
              inp.dispatchEvent(new Event('blur', { bubbles: true }));
            }
          }, cpfSel, cpfDigits);

          // Depois digita normalmente pra parecer humano
          await el.type(cpfDigits, { delay: 60 + Math.floor(Math.random() * 40) });
          LOG(`CPF preenchido: ${cpfDigits}`);
        }
      }

      await wait(500);

      const dataFormatada = `${dia}/${mes}/${ano}`;
      const dataSel = await page.evaluate(() => {
        const sels = [
          'input[name="dataNascimento"]',
          'input[placeholder*="nascimento"]',
          'input[placeholder*="Nascimento"]',
          'input[placeholder*="data"]',
          'input[placeholder*="Data"]',
          'input[type="date"]',
        ];
        for (const sel of sels) {
          const el = document.querySelector<HTMLInputElement>(sel);
          if (el) return sel;
        }
        return null;
      });

      if (dataSel) {
        const el = await page.$(dataSel);
        if (el) {
          await el.click();
          await wait(400);

          // Seta valor via Angular + nativo
          await page.evaluate((sel, val) => {
            const inp = document.querySelector<HTMLInputElement>(sel);
            if (!inp) return;
            const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
            if (nativeSetter) nativeSetter.call(inp, val);
            inp.dispatchEvent(new Event('input', { bubbles: true }));
            inp.dispatchEvent(new Event('change', { bubbles: true }));
            inp.dispatchEvent(new Event('blur', { bubbles: true }));
          }, dataSel, dataFormatada);

          // Digita normalmente
          await el.type(dataFormatada, { delay: 50 + Math.floor(Math.random() * 40) });
          LOG(`Data preenchida: ${dataFormatada}`);
        }
      } else {
        LOG('ERRO: Input data nao encontrado');
        await page.close();
        return { status: 'error', orgao: this.nome, dataConsulta, error: '[RF] Input data de nascimento nao encontrado' };
      }

      await wait(800); // pausa humana antes de submeter

      const btnClicado = await page.evaluate(() => {
        const textos = ['Consultar Certidão', 'Emitir Certidão', 'Consultar', 'consultar', 'CONSULTAR',
          'Emitir', 'emitir', 'EMITIR', 'Prosseguir', 'prosseguir', 'Avançar', 'avançar', 'OK', 'ok',
          'Solicitar', 'solicitar'];
        const btns = document.querySelectorAll('button, a.btn, [role="button"], input[type="submit"]');
        for (const b of btns) {
          const t = (b.textContent?.trim() || (b as HTMLInputElement).value || '').toLowerCase();
          for (const txt of textos) {
            if (t.includes(txt.toLowerCase())) {
              (b as HTMLElement).click();
              return txt;
            }
          }
        }
        return null;
      });
      LOG(`Botao clicado: ${btnClicado || 'nenhum'}`);

      if (!btnClicado) {
        await page.close();
        return { status: 'error', orgao: this.nome, dataConsulta, error: '[RF] Botao de consulta nao encontrado' };
      }

      // Aguarda modal de confirmacao ("ja tem certidao, emitir nova?")
      await wait(2000);
      const modalOk = await page.evaluate(() => {
        const modals = document.querySelectorAll('.modal, .dialog, .swal2-container, .p-dialog, .ui-dialog, [role="dialog"]');
        for (const m of modals) {
          if (!(m as HTMLElement).offsetParent && getComputedStyle(m).display === 'none') continue;
          const btns = m.querySelectorAll('button, a, .btn');
          for (const b of btns) {
            const txt = ((b.textContent?.trim() || '')).toLowerCase();
            if (txt.includes('sim') || txt.includes('emitir') || txt.includes('nova') || txt.includes('confirmar') || txt.includes('ok') || txt.includes('continuar')) {
              (b as HTMLElement).click();
              return txt;
            }
          }
        }
        return null;
      });
      LOG(`Modal confirmacao: ${modalOk || 'nao encontrado'}`);
      if (modalOk) await wait(2000);

      let erroMsg = '';
      const captchaType = await (async () => {
        for (let i = 0; i < 60; i++) {
          if (pageClosed) throw new Error('Pagina fechada');
          const t = await detectarCaptcha(page);
          if (t) return t;

          const msgs = await page.evaluate(() => {
            const errs = document.querySelectorAll(
              '.error, .alert, .msg-erro, [role="alert"], .mensagem, .notificacao, .toast, .p-toast-message, ' +
              '.p-message, .ui-message, .invalid-feedback, .text-danger, .erro, .alerta'
            );
            for (const e of errs) {
              const txt = e.textContent?.trim();
              if (txt && txt.length > 5) return txt;
            }
            return null;
          });
          if (msgs) {
            erroMsg = msgs;
            LOG(`Mensagem: ${msgs.slice(0, 150)}`);
          }

          if (erroMsg && i > 5) break;

          await wait(500);
        }
        return null;
      })();

      LOG(`CAPTCHA: ${captchaType} | Erro: ${erroMsg.slice(0, 100)}`);

      if (erroMsg && !captchaType) {
        await page.close();
        return { status: 'error', orgao: this.nome, dataConsulta, error: `[RF] ${erroMsg}` };
      }

      if (captchaType) {
        await focusPageForCaptcha(page, captchaType);
        LOG('CAPTCHA detectado - enviando para resolucao remota...');
        const captchaOk = await esperarCaptchaInterativo(page, captchaType);
        if (!captchaOk) {
          LOG('CAPTCHA nao resolvido no tempo limite');
          await page.close();
          return { status: 'error', orgao: this.nome, dataConsulta, error: `[RF] CAPTCHA nao resolvido no tempo limite` };
        }
        LOG('CAPTCHA resolvido, submetendo novamente...');
        await wait(2000);

        // Clica no botao de submit NOVAMENTE apos captcha resolvido
        await page.evaluate(() => {
          const textos = ['consultar certidão', 'emitir certidão', 'consultar', 'emitir', 'gerar', 'prosseguir', 'avançar', 'solicitar', 'ok'];
          const btns = document.querySelectorAll('button, a.btn, [role="button"], input[type="submit"]');
          for (const b of btns) {
            const t = ((b.textContent?.trim() || (b as HTMLInputElement).value || '').toLowerCase());
            for (const txt of textos) {
              if (t.includes(txt)) { (b as HTMLElement).click(); return; }
            }
          }
        });
        await wait(4000);

        // Verifica resultado apos re-submit
        try {
          await page.waitForFunction(
            () => {
              const body = document.body.textContent?.toLowerCase() || '';
              return body.includes('certidão') || body.includes('protocolo') || body.includes('resultado')
                  || body.includes('nada consta') || body.includes('nao consta');
            },
            { timeout: 20000 },
          );
        } catch { LOG('Timeout aguardando resultado...'); }
      }

      if (pageClosed) throw new Error('Pagina fechada');

      // Verifica se houve erro ou sucesso antes de capturar PDF
      const pageText = await page.evaluate(() => document.body.textContent?.toLowerCase() || '');
      if (pageText.includes('cpf inválido') || pageText.includes('cpf invalido') || pageText.includes('não foi possível') || pageText.includes('erro ao')) {
        await page.close();
        return { status: 'error', orgao: this.nome, dataConsulta, error: '[RF] Erro na consulta: ' + pageText.slice(0, 200) };
      }

      await prepararCapturaPDFViaCDP(page, DOWNLOAD_DIR);
      LOG('CDP preparado');

      const protocolo = `RF-${new Date().getFullYear()}.${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`;

      let pdfBuffer: Buffer | Uint8Array | null = null;

      try {
        pdfBuffer = await tentarBaixarPDF(page, DOWNLOAD_DIR);
        if (pdfBuffer && pdfBuffer.length > 1000) LOG(`PDF via CDP (${pdfBuffer.length} bytes)`);
      } catch (e: any) { LOG(`CDP falhou: ${e.message}`); }

      if (!pdfBuffer || pdfBuffer.length < 1000) {
        try {
          if (!pageClosed) {
            pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
            if (pdfBuffer && pdfBuffer.length > 1000) LOG(`PDF via page.pdf (${pdfBuffer.length} bytes)`);
          }
        } catch (e: any) { LOG(`page.pdf falhou: ${e.message}`); }
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
      return { status: 'error', orgao: this.nome, dataConsulta, error: `[RF] ${msg}` };
    }
  }
}
