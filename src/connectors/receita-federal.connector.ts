import type { IConnector } from './connector.interface.js';
import type { DadosProprietario, ConnectorResult } from './types.js';
import { createPage } from '../utils/browser.js';
import { injectFillHelper, preencherInputRapido, tentarBaixarPDF, aceitarCookies } from '../utils/dom-helper.js';
import { detectarCaptcha, esperarCaptchaInterativo } from '../utils/captcha.js';
import { focusPageForCaptcha } from '../services/captcha-solver.service.js';
import { wait, criarRateLimit } from '../utils/retry-manager.service.js';

const LOG = (msg: string) => console.log(`[RF] ${msg}`);
const DEBUG = process.env.DEBUG;

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

    try {
      let pageClosed = false;
      page.once('close', () => { pageClosed = true; });

      await page.goto('https://servicos.receitafederal.gov.br/servico/certidoes/#/home/cpf', { waitUntil: 'networkidle2', timeout: 30000 });
      await wait(4000);
      await aceitarCookies(page);

      if (DEBUG) await diagnosticarInputs(page);
      await injectFillHelper(page);

      const cpfDigits = dados.cpf.replace(/\D/g, '');
      const [ano, mes, dia] = dados.dataNascimento.split('-');

      const cpfSel = await page.evaluate(() => {
        const sels = [
          'input[name="niContribuinte"]',
          'input[placeholder*="CPF"]',
          'input[placeholder*="cpf"]',
          'input[formcontrolname="niContribuinte"]',
          'input[inputmode="numeric"]',
        ];
        for (const sel of sels) {
          const el = document.querySelector<HTMLInputElement>(sel);
          if (el) return sel;
        }
        return null;
      });

      if (cpfSel) {
        const el = await page.$(cpfSel);
        if (el) {
          await el.focus();
          await page.keyboard.type(cpfDigits, { delay: 0 });
          LOG(`CPF preenchido via: ${cpfSel}`);
        }
      } else {
        LOG('ERRO: Input CPF nao encontrado');
        await page.close();
        return { status: 'error', orgao: this.nome, dataConsulta, error: '[RF] Input CPF nao encontrado no formulario' };
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
          await el.focus();
          await page.keyboard.type(dataFormatada, { delay: 0 });
          LOG(`Data preenchida: ${dataFormatada}`);
        }
      } else {
        LOG('ERRO: Input data nao encontrado');
        await page.close();
        return { status: 'error', orgao: this.nome, dataConsulta, error: '[RF] Input data de nascimento nao encontrado' };
      }

      await wait(500);

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
        LOG('CAPTCHA detectado - resolva na janela do navegador...');
        await esperarCaptchaInterativo(page, captchaType);
        LOG('CAPTCHA resolvido, continuando...');
        await wait(3000);
      }

      if (pageClosed) throw new Error('Pagina fechada');

      // Verifica se houve erro ou sucesso antes de capturar PDF
      const pageText = await page.evaluate(() => document.body.textContent?.toLowerCase() || '');
      if (pageText.includes('cpf inválido') || pageText.includes('cpf invalido') || pageText.includes('não foi possível') || pageText.includes('erro ao')) {
        await page.close();
        return { status: 'error', orgao: this.nome, dataConsulta, error: '[RF] Erro na consulta: ' + pageText.slice(0, 200) };
      }

      const protocolo = `RF-${new Date().getFullYear()}.${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`;
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
      return { status: 'error', orgao: this.nome, dataConsulta, error: `[RF] ${msg}` };
    }
  }
}
