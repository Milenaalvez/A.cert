import type { IConnector } from './connector.interface.js';
import type { DadosProprietario, ConnectorResult } from './types.js';
import { createPage } from '../utils/browser.js';
import { tentarBaixarPDF, preencherCampoRobusto, prepararCapturaPDFViaCDP, setupDownloadCapture } from '../utils/dom-helper.js';
import { detectarCaptcha, esperarCaptchaInterativo } from '../utils/captcha.js';
import { wait, criarRateLimit } from '../utils/retry-manager.service.js';
import path from 'path';
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

      // ═══ PASSO 1: Ir direto pro iframe CNDT ═══
      await page.goto('https://cndt-certidao.tst.jus.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await wait(5000);
      LOG(`URL: ${page.url()}`);

      // ═══ PASSO 2: Clicar "Emitir Certidão" ═══
      LOG('Procurando botao Emitir Certidão no iframe CNDT...');
      const btnFound = await page.evaluate(() => {
        const btn = document.getElementById('gerarCertidaoForm:btnEmitirCertidao');
        if (btn) { (btn as HTMLInputElement).click(); return 'id'; }
        const all = document.querySelectorAll<HTMLInputElement>('input[type="button"], input[type="submit"], button');
        for (const el of all) {
          const txt = (el.value || el.textContent || '').toLowerCase();
          if (txt.includes('emitir')) { (el as HTMLElement).click(); return 'texto'; }
        }
        return null;
      });
      LOG(`Botao: ${btnFound || 'NAO ENCONTRADO'}`);

      if (!btnFound) {
        LOG('=== DIAGNOSTICO ===');
        const d = await page.evaluate(() => ({
          inputs: Array.from(document.querySelectorAll<HTMLInputElement>('input:not([type="hidden"])')).map(i => ({ id: i.id, name: i.name, value: i.value })),
          btns: Array.from(document.querySelectorAll('button, input[type=button], input[type=submit]')).map(b => ({ id: b.id, value: (b as HTMLInputElement).value || '', text: (b.textContent || '').trim().substring(0, 60) })),
        }));
        LOG(`Inputs (${d.inputs.length}):`);
        d.inputs.forEach((i: any) => LOG(`  id="${i.id}" name="${i.name}" value="${i.value}"`));
        LOG(`Botoes (${d.btns.length}):`);
        d.btns.forEach((b: any) => LOG(`  id="${b.id}" value="${b.value}" text="${b.text}"`));
        await page.close();
        return { status: 'error', orgao: this.nome, dataConsulta, error: 'Botao Emitir nao encontrado no iframe CNDT' };
      }

      await wait(3000);

      // ═══ PASSO 3: Aguardar input CPF ═══
      const cpfReady = await page.waitForSelector(SEL_CPF, { visible: true, timeout: 30000 }).catch(() => null);
      if (!cpfReady) {
        await page.close();
        return { status: 'error', orgao: this.nome, dataConsulta, error: 'Form CPF nao apareceu' };
      }
      LOG('Formulario pronto');

      // ═══ PASSO 4: Captcha ═══
      let captchaType: string | null = null;
      for (let i = 0; i < 5; i++) {
        try { captchaType = await detectarCaptcha(page); } catch {}
        if (captchaType) break;
        await wait(500);
      }
      LOG(`CAPTCHA: ${captchaType || 'nao'}`);

      // ═══ PASSO 5: Preencher CPF ═══
      const cpfDigits = dados.cpf.replace(/\D/g, '');
      LOG(`CPF: ${cpfDigits}`);
      const cpfOk = await preencherCampoRobusto(page, SEL_CPF, cpfDigits, 'formataCnpjCpf');
      LOG(`CPF: ${cpfOk ? 'OK' : 'FALHOU'}`);
      if (!cpfOk) {
        await page.close();
        return { status: 'error', orgao: this.nome, dataConsulta, error: 'Falha ao preencher CPF' };
      }

      // ═══ PASSO 6: Resolver captcha ═══
      if (!captchaType) {
        for (let i = 0; i < 5; i++) {
          try { captchaType = await detectarCaptcha(page); } catch {}
          if (captchaType) break;
          await wait(1000);
        }
      }
      if (captchaType) {
        try { await page.bringToFront(); } catch {}
        LOG('>>> CAPTCHA — aguardando...');
        const ok = await esperarCaptchaInterativo(page, captchaType as any);
        if (!ok) {
          await page.close();
          return { status: 'error', orgao: this.nome, dataConsulta, error: 'CAPTCHA nao resolvido' };
        }
        LOG('CAPTCHA resolvido!');
        await wait(1000);
      }

      if (pageClosed) throw new Error('Pagina fechada');

      // ═══ PASSO 7: Submeter ═══
      LOG('Configurando captura de download...');
      const tstCapture = setupDownloadCapture(page, DOWNLOAD_DIR);
      await prepararCapturaPDFViaCDP(page, DOWNLOAD_DIR);
      LOG('Submetendo...');
      await page.click(SEL_SUBMIT);
      try { await page.waitForNetworkIdle({ idleTime: 3000, timeout: 30000 }); } catch {}
      await wait(3000);

      if (pageClosed) throw new Error('Pagina fechada');

      // ═══ PASSO 8: PDF ═══
      const protocolo = `TST-${new Date().getFullYear()}.${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`;
      let pdfBuffer: Uint8Array | null = null;

      // Aguarda captura (setupDownloadCapture rodando)
      const capturado = await Promise.race([
        tstCapture.promise,
        new Promise<null>(r => setTimeout(() => r(null), 30000)),
      ]);
      if (capturado && capturado.length > 500) {
        pdfBuffer = capturado;
        LOG(`PDF via setupDownloadCapture (${pdfBuffer.length} bytes)`);
      }

      if (!pdfBuffer || pdfBuffer.length < 1000) {
        pdfBuffer = await tentarBaixarPDF(page, DOWNLOAD_DIR);
        if (pdfBuffer && pdfBuffer.length > 500) LOG(`PDF via tentarBaixarPDF (${pdfBuffer.length} bytes)`);
      }
      if (!pdfBuffer || pdfBuffer.length < 1000) {
        pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
        if (pdfBuffer && pdfBuffer.length > 500) LOG(`PDF via page.pdf (${pdfBuffer.length} bytes)`);
      }
      tstCapture.cleanup();
      if (!pdfBuffer || pdfBuffer.length < 1000) {
        await page.close();
        return { status: 'error', orgao: this.nome, dataConsulta, error: 'PDF invalido' };
      }
      LOG(`PDF: ${pdfBuffer.length} bytes`);

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
