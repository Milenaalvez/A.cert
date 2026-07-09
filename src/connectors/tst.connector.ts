import type { IConnector } from './connector.interface.js';
import type { DadosProprietario, ConnectorResult } from './types.js';
import { createPage } from '../utils/browser.js';
import { tentarBaixarPDF, aceitarCookies, preencherCampoRobusto, prepararCapturaPDFViaCDP } from '../utils/dom-helper.js';
import { detectarCaptcha, esperarCaptchaInterativo } from '../utils/captcha.js';
import { esperarCaptchaComSuporteRemoto } from '../services/captcha-solver.service.js';
import { wait, criarRateLimit } from '../utils/retry-manager.service.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOWNLOAD_DIR = path.join(__dirname, '..', '..', 'tmp', 'downloads');

const LOG = (msg: string) => console.log(`[TST] ${msg}`);

// Seletores exatos extraidos do HTML real do TST (Jun/2026)
// IDs com ":" precisam ser escapados ou usar [id="..."]
const SEL_CPF     = '[id="gerarCertidaoForm:cpfCnpj"]';
const SEL_SUBMIT  = '[id="gerarCertidaoForm:btnEmitirCertidao"]';
const SEL_EMAIL   = '[id="gerarCertidaoForm:btnEmitirCertidaoEEnviarPorEmail"]';

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

      // 1. Navega + aguarda carregamento
      await page.goto('https://www.tst.jus.br/certidao1', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await wait(3000);
      await aceitarCookies(page);
      LOG(`URL: ${page.url()}`);

      // 2. Aguarda input CPF aparecer (max 60s — usuario aceita cookies)
      LOG('Aguardando formulario (aceite cookies na janela se necessario)...');
      const cpfReady = await page.waitForSelector(SEL_CPF, { visible: true, timeout: 60000 }).catch(() => null);
      if (!cpfReady) {
        await page.close();
        return { status: 'error', orgao: this.nome, dataConsulta, error: 'Input CPF nao encontrado' };
      }
      LOG('Formulario pronto');

      // 3. CAPTCHA pre-preenchimento (pode ja estar visivel)
      LOG('Verificando CAPTCHA antes de preencher...');
      let captchaType: string | null = null;
      for (let i = 0; i < 5; i++) {
        try { captchaType = await detectarCaptcha(page); } catch {}
        if (captchaType) break;
        await wait(500);
      }
      LOG(`CAPTCHA pre: ${captchaType || 'nao'}`);

      // 4. Preenche CPF usando preencherCampoRobusto (foco real + digitacao + fallback JSF)
      const cpfDigits = dados.cpf.replace(/\D/g, '');
      LOG(`CPF: ${cpfDigits}`);
      const cpfOk = await preencherCampoRobusto(page, SEL_CPF, cpfDigits, 'formataCnpjCpf');
      LOG(`CPF: ${cpfOk ? 'OK' : 'FALHOU'}`);

      if (!cpfOk) {
        await page.close();
        return { status: 'error', orgao: this.nome, dataConsulta, error: 'Input CPF nao encontrado ou preenchimento falhou' };
      }

      // Verifica visualmente se o valor foi aceito
      const valorConfirmado = await page.evaluate(() => {
        const inp = document.querySelector<HTMLInputElement>('[id="gerarCertidaoForm:cpfCnpj"]');
        return inp?.value || '(vazio)';
      });
      LOG(`Valor no input: ${valorConfirmado}`);

      // 5. CAPTCHA (ja tentamos detectar antes, verifica de novo)
      if (!captchaType) {
        LOG('Re-verificando CAPTCHA apos preencher CPF...');
        for (let i = 0; i < 5; i++) {
          try { captchaType = await detectarCaptcha(page); } catch {}
          if (captchaType) break;
          await wait(1000);
        }
      }
      LOG(`CAPTCHA: ${captchaType || 'nao detectado'}`);

      if (captchaType) {
        try { await page.bringToFront(); } catch {}
        LOG('>>> CAPTCHA detectado - enviando para resolucao remota...');
        const ok = await esperarCaptchaComSuporteRemoto(page, captchaType as any, jobId || '', this.nome, 300000);
        if (!ok) {
          await page.close();
          return { status: 'error', orgao: this.nome, dataConsulta, error: 'CAPTCHA nao resolvido' };
        }
        LOG('CAPTCHA resolvido!');
        await wait(1000);
      }

      if (pageClosed) throw new Error('Pagina fechada');

      // 5. Prepara CDP para capturar download antes de clicar
      await prepararCapturaPDFViaCDP(page, DOWNLOAD_DIR);
      LOG('CDP preparado para captura de download');

      // 6. Clica "Emitir Certidão" (AJAX via A4J, nao submit HTTP)
      LOG('Clicando Emitir Certidão...');
      await page.click(SEL_SUBMIT);
      LOG('Botao clicado, aguardando AJAX + download...');

      // 7. Aguarda: network idle (AJAX terminou) + texto resultado ou download
      try { await page.waitForNetworkIdle({ idleTime: 3000, timeout: 30000 }); } catch {}
      await wait(2000);

      // Verifica se apareceu texto de sucesso/erro
      const resultText = await page.evaluate(() => {
        const body = document.body?.textContent?.toLowerCase() || '';
        if (body.includes('nada consta') || body.includes('não consta')) return 'nada_consta';
        if (body.includes('certidão') || body.includes('protocolo') || body.includes('emitida')) return 'ok';
        return null;
      });
      LOG(`Resultado: ${resultText || 'aguardando...'}`);

      if (pageClosed) throw new Error('Pagina fechada');

      // 8. Captura PDF (fazerDownload() do TST pode ja ter rodado)
      const protocolo = `TST-${new Date().getFullYear()}.${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`;

      // Tenta CDP primeiro (Nivel 0), fallback: niveis 1-3 existentes
      let pdfBuffer = await tentarBaixarPDF(page, DOWNLOAD_DIR);
      if (!pdfBuffer || pdfBuffer.length < 1000) {
        pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
      }
      if (!pdfBuffer || pdfBuffer.length < 1000) {
        await page.close();
        return { status: 'error', orgao: this.nome, dataConsulta, error: 'PDF invalido ou vazio' };
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
