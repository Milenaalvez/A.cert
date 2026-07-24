import type { IConnector } from './connector.interface.js';
import type { DadosProprietario, ConnectorResult } from './types.js';
import { createPage } from '../utils/browser.js';
import { tentarBaixarPDF, preencherCampoRobusto, prepararCapturaPDFViaCDP, setupDownloadCapture } from '../utils/dom-helper.js';
import { detectarCaptcha } from '../utils/captcha.js';
import { focusPageForCaptcha } from '../services/captcha-solver.service.js';
import { wait, criarRateLimit } from '../utils/retry-manager.service.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOWNLOAD_DIR = path.join(__dirname, '..', '..', 'tmp', 'downloads');

const LOG = (msg: string) => console.log(`[TST] ${msg}`);

const SEL_CPF     = '[id="gerarCertidaoForm:cpfCnpj"]';
const SEL_SUBMIT  = '[id="gerarCertidaoForm:btnEmitirCertidao"]';

export class TSTConnector implements IConnector {
  readonly nome = 'TST';

  readonly #throttle = criarRateLimit(3000);

  async consultar(
    dados: DadosProprietario,
    jobId?: string,
    certKeys?: string[],
  ): Promise<ConnectorResult> {
    const dataConsulta = new Date().toISOString();
    LOG('Iniciando consulta TST');
    const page = await createPage().catch(e => { LOG(`ERRO createPage: ${e.message}`); throw e; });

    try {
      let pageClosed = false;
      page.once('close', () => { pageClosed = true; });

      // ═══ PASSO 1: Ir para CNDT ═══
      await page.goto('https://cndt-certidao.tst.jus.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await wait(5000);
      LOG(`URL: ${page.url()}`);

      // ═══ PASSO 2: Clicar "Emitir Certidão" ═══
      LOG('Procurando botao Emitir Certidão...');
      const btnFound = await page.evaluate(() => {
        const btn = document.getElementById('gerarCertidaoForm:btnEmitirCertidao');
        if (btn) { (btn as HTMLInputElement).click(); return 'id'; }
        const all = document.querySelectorAll<HTMLElement>('input[type="button"], input[type="submit"], button');
        for (const el of all) {
          const txt = ((el as HTMLInputElement).value || el.textContent || '').toLowerCase();
          if (txt.includes('emitir')) { el.click(); return 'texto'; }
        }
        return null;
      });
      LOG(`Botao: ${btnFound || 'NAO ENCONTRADO'}`);

      if (!btnFound) {
        const d = await page.evaluate(() => ({
          btns: Array.from(document.querySelectorAll('button, input[type=button], input[type=submit]')).map(b => ({
            id: b.id, value: (b as HTMLInputElement).value || '', text: (b.textContent || '').trim().slice(0, 60),
          })),
        }));
        LOG(`Botoes: ${JSON.stringify(d.btns)}`);
        await page.close();
        return { status: 'error', orgao: this.nome, dataConsulta, error: 'Botao Emitir nao encontrado' };
      }

      await wait(3000);

      // ═══ PASSO 3: Aguardar input CPF ═══
      const cpfReady = await page.waitForSelector(SEL_CPF, { visible: true, timeout: 30000 }).catch(() => null);
      if (!cpfReady) {
        await page.close();
        return { status: 'error', orgao: this.nome, dataConsulta, error: 'Form CPF nao apareceu' };
      }
      LOG('Formulario pronto');

      // ═══ PASSO 4: Preencher CPF ═══
      const cpfDigits = dados.cpf.replace(/\D/g, '');
      LOG(`CPF: ${cpfDigits}`);
      const cpfOk = await preencherCampoRobusto(page, SEL_CPF, cpfDigits, 'formataCnpjCpf');
      LOG(`CPF: ${cpfOk ? 'OK' : 'FALHOU'}`);
      if (!cpfOk) {
        await page.close();
        return { status: 'error', orgao: this.nome, dataConsulta, error: 'Falha ao preencher CPF' };
      }

      await wait(500);

      // ═══ PASSO 5: CAPTCHA — detectar e resolver ANTES de submeter ═══
      // No CNDT/TST, o CAPTCHA de texto (6 caracteres) aparece junto com o form.
      // Precisamos resolver antes de clicar Emitir, senao o submit falha.
      let captchaType: string | null = null;
      for (let t = 0; t < 40; t++) {
        if (page.isClosed()) break;
        captchaType = await detectarCaptcha(page).catch(() => null);
        if (captchaType) break;
        await wait(500);
      }
      LOG(`CAPTCHA: ${captchaType || 'nenhum'}`);

      if (captchaType) {
        try { await page.bringToFront(); } catch {}
        await focusPageForCaptcha(page, captchaType as any).catch(() => {});
        const urlAntes = page.url();

        LOG(`>>> Aguardando CAPTCHA ${captchaType} (VNC/Extension)...`);

        let capResolvido = false;
        let tentativasRestantes = Math.floor(120000 / 1000);
        while (tentativasRestantes > 0 && !capResolvido) {
          if (page.isClosed() || pageClosed) break;
          tentativasRestantes--;

          capResolvido = await page.evaluate((t: string) => {
            // Busca ampla: qualquer input/textarea com valor preenchido
            // TST/CNDT usa CAPTCHA de texto com 6 caracteres
            if (t === 'texto') {
              const all = document.querySelectorAll<HTMLInputElement>('input[type="text"], input:not([type])');
              for (const inp of all) {
                const name = (inp.getAttribute('name') || '').toLowerCase();
                const id = (inp.id || '').toLowerCase();
                const val = inp.value.trim();
                if (val.length >= 4 && (name.includes('captcha') || id.includes('captcha') || name.includes('resposta') || id.includes('resposta'))) return true;
              }
            }
            // hcaptcha
            if (t === 'hcaptcha') {
              const ta = document.querySelector('textarea[id*="h-captcha-response"], textarea[name*="h-captcha-response"]');
              if (ta && (ta as HTMLTextAreaElement).value.length > 3) return true;
            }
            // recaptcha
            if (t === 'recaptcha') {
              const ta = document.querySelector('textarea[id*="g-recaptcha-response"]');
              if (ta && (ta as HTMLTextAreaElement).value.length > 3) return true;
            }
            return false;
          }, captchaType).catch(() => false);

          if (!capResolvido) {
            const urlAtual = page.url();
            if (urlAtual !== urlAntes) {
              LOG(`URL mudou → CAPTCHA provavelmente resolvido`);
              capResolvido = true;
              break;
            }
          }

          if (!capResolvido) await wait(1000);
        }

        if (!capResolvido || page.isClosed() || pageClosed) {
          LOG('CAPTCHA NAO resolvido');
          await page.close().catch(() => {});
          return { status: 'error', orgao: this.nome, dataConsulta, error: '[TST] CAPTCHA nao resolvido' };
        }
        LOG('CAPTCHA resolvido');
        await wait(2000);
      }

      if (pageClosed) throw new Error('Pagina fechada');

      // ═══ PASSO 6: Configurar captura + submeter (APOS CAPTCHA resolvido) ═══
      LOG('Configurando captura de download...');
      const arquivosAntes = new Set(
        fs.existsSync(DOWNLOAD_DIR) ? fs.readdirSync(DOWNLOAD_DIR).filter(f => !f.endsWith('.crdownload')) : []
      );
      const tstCapture = setupDownloadCapture(page, DOWNLOAD_DIR);
      await prepararCapturaPDFViaCDP(page, DOWNLOAD_DIR);
      await wait(500);

      LOG('Submetendo formulario...');
      await page.click(SEL_SUBMIT).catch(() => {
        // Fallback: clica via evaluate
        page.evaluate(() => {
          const btn = document.getElementById('gerarCertidaoForm:btnEmitirCertidao');
          if (btn) (btn as HTMLElement).click();
        }).catch(() => {});
      });
      LOG('Submit OK, aguardando resultado/download...');

      // ═══ PASSO 7: Aguardar PDF ═══
      const protocolo = `TST-${new Date().getFullYear()}.${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`;
      let pdfBuffer: Uint8Array | null = null;

      // 7.1: setupDownloadCapture (CDP + HTTP + nova aba)
      LOG('Aguardando setupDownloadCapture...');
      const capturado = await Promise.race([
        tstCapture.promise,
        new Promise<null>(r => setTimeout(() => r(null), 45000)),
      ]);
      if (capturado && capturado.length > 500 && capturado[0] === 0x25) {
        pdfBuffer = capturado;
        LOG(`PDF via setupDownloadCapture: ${pdfBuffer.length} bytes`);
      }

      // 7.2: Directory polling (fallback confiavel do codigo antigo)
      if (!pdfBuffer) {
        LOG('Polling diretorio de download...');
        for (let i = 0; i < 24; i++) {
          await wait(5000);
          if (pageClosed || page.isClosed()) break;
          try {
            const files = fs.readdirSync(DOWNLOAD_DIR).filter(f => !f.endsWith('.crdownload'));
            const novos = files.filter(f => !arquivosAntes.has(f));
            for (const f of novos) {
              const fullPath = path.join(DOWNLOAD_DIR, f);
              // Aguarda arquivo terminar de escrever
              let lastSize = 0;
              for (let w = 0; w < 5; w++) {
                await wait(300);
                try {
                  const st = fs.statSync(fullPath);
                  if (st.size === lastSize && st.size > 500) {
                    const buf = fs.readFileSync(fullPath);
                    if (buf.length > 500 && buf[0] === 0x25 && buf[1] === 0x50) {
                      pdfBuffer = new Uint8Array(buf);
                      break;
                    }
                  }
                  lastSize = st.size;
                } catch {}
              }
              if (pdfBuffer) break;
            }
          } catch {}
          if (pdfBuffer) break;
        }
        if (pdfBuffer) LOG(`PDF via directory polling: ${pdfBuffer.length} bytes`);
      }

      // 7.3: tentarBaixarPDF
      if (!pdfBuffer) {
        pdfBuffer = await tentarBaixarPDF(page, DOWNLOAD_DIR).catch(() => null);
        if (pdfBuffer && pdfBuffer.length > 500) LOG(`PDF via tentarBaixarPDF: ${pdfBuffer.length} bytes`);
      }

      // 7.4: page.pdf() ultimo recurso
      if (!pdfBuffer) {
        await wait(2000);
        try {
          const buf = await page.pdf({ format: 'A4', printBackground: true });
          if (buf.length > 500 && buf[0] === 0x25 && buf[1] === 0x50) {
            pdfBuffer = new Uint8Array(buf);
            LOG(`PDF via page.pdf: ${pdfBuffer.length} bytes`);
          }
        } catch (e: any) { LOG(`page.pdf() falhou: ${e.message}`); }
      }

      tstCapture.cleanup();

      if (!pdfBuffer) {
        await page.close();
        return { status: 'error', orgao: this.nome, dataConsulta, error: 'PDF nao encontrado' };
      }
      LOG(`PDF capturado: ${pdfBuffer.length} bytes`);

      await this.#throttle();
      await page.close();
      return { status: 'success', orgao: this.nome, dataConsulta, protocolo, documento: pdfBuffer };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      LOG(`ERRO: ${msg}`);
      await page.close().catch(() => {});
      return { status: 'error', orgao: this.nome, dataConsulta, error: `[TST] ${msg}` };
    }
  }
}
