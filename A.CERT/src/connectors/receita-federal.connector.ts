import type { IConnector } from './connector.interface.js';
import type { DadosProprietario, ConnectorResult } from './types.js';
import type { CaptchaManager } from '../services/captcha-manager.service.js';
import { createPage } from '../utils/browser.js';
import { injectFillHelper } from '../utils/dom-helper.js';
import { detectarCaptcha, esperarCaptchaInterativo } from '../utils/captcha.js';
import { focusPageForCaptcha } from '../services/captcha-solver.service.js';
import { wait } from '../utils/retry-manager.service.js';

const LOG = (msg: string) => console.log(`[RF] ${msg}`);

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

      await page.goto('https://servicos.receitafederal.gov.br/servico/certidoes/#/home/cpf', { waitUntil: 'networkidle2', timeout: 30000 });
      await wait(4000);

      await diagnosticarInputs(page);
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
          await el.click();
          await new Promise(r => setTimeout(r, 100));
          await page.keyboard.type(cpfDigits, { delay: 10 });
          LOG(`CPF preenchido via: ${cpfSel}`);
        }
      } else {
        LOG('ERRO: Input CPF nao encontrado');
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
          await new Promise(r => setTimeout(r, 100));
          await page.keyboard.type(dataFormatada, { delay: 6 });
          LOG(`Data preenchida: ${dataFormatada}`);
        }
      } else {
        LOG('ERRO: Input data nao encontrado');
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
        }
      }

      if (pageClosed) throw new Error('Pagina fechada');

      await wait(3000);

      const protocolo = `RF-${new Date().getFullYear()}.${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`;
      const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
      LOG('PDF capturado');

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
