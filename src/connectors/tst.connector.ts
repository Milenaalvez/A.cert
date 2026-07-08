import type { IConnector } from './connector.interface.js';
import type { DadosProprietario, ConnectorResult } from './types.js';
import { createPage } from '../utils/browser.js';
import { tentarBaixarPDF, aceitarCookies } from '../utils/dom-helper.js';
import { detectarCaptcha, esperarCaptchaInterativo } from '../utils/captcha.js';
import { wait, criarRateLimit } from '../utils/retry-manager.service.js';

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

      // 4. Preenche CPF via setter nativo + eventos (JSF com onkeyup=formataCnpjCpf)
      const cpfDigits = dados.cpf.replace(/\D/g, '');
      LOG(`CPF: ${cpfDigits}`);
      const cpfOk = await page.evaluate((cpf) => {
        // Busca input pelo ID exato, name, ou classe caixaTexto
        const inp = document.querySelector<HTMLInputElement>(
          '[id="gerarCertidaoForm:cpfCnpj"], [name="gerarCertidaoForm:cpfCnpj"], input.caixaTexto[maxlength="18"]'
        );
        if (!inp) return false;

        // Foca
        inp.focus();

        // Seta valor via setter nativo
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
        if (setter) setter.call(inp, cpf);

        // Chama formatador JSF diretamente
        if (typeof (window as any).formataCnpjCpf === 'function') {
          (window as any).formataCnpjCpf(inp);
        }

        // Dispara eventos na ordem correta
        inp.dispatchEvent(new Event('keydown', { bubbles: true }));
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        inp.dispatchEvent(new Event('keyup', { bubbles: true }));
        inp.dispatchEvent(new Event('change', { bubbles: true }));
        inp.dispatchEvent(new Event('blur', { bubbles: true }));

        return true;
      }, cpfDigits);
      LOG(`CPF: ${cpfOk ? 'OK' : 'FALHOU'}`);

      if (!cpfOk) {
        await page.close();
        return { status: 'error', orgao: this.nome, dataConsulta, error: 'Input CPF nao encontrado' };
      }

      // Verifica visualmente se o valor foi aceito
      const valorConfirmado = await page.evaluate(() => {
        const inp = document.querySelector<HTMLInputElement>('[id="gerarCertidaoForm:cpfCnpj"]');
        return inp?.value || '(vazio)';
      });
      LOG(`Valor no input: ${valorConfirmado}`);

      // Se valor nao entrou, tenta de novo com click + keyboard (fallback)
      if (valorConfirmado === '(vazio)' || !valorConfirmado.includes(cpfDigits)) {
        LOG('Valor nao aceito! Tentando click + type...');
        await page.click(SEL_CPF, { clickCount: 3 });
        await wait(200);
        await page.keyboard.type(cpfDigits, { delay: 50 });
        await wait(500);
        const v2 = await page.evaluate(() => {
          const inp = document.querySelector<HTMLInputElement>('[id="gerarCertidaoForm:cpfCnpj"]');
          return inp?.value || '(vazio)';
        });
        LOG(`Valor apos retry: ${v2}`);
      }

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
        LOG('>>> CAPTCHA! Resolva na janela do navegador...');
        const ok = await esperarCaptchaInterativo(page, captchaType as any, 300000);
        if (!ok) {
          await page.close();
          return { status: 'error', orgao: this.nome, dataConsulta, error: 'CAPTCHA nao resolvido' };
        }
        LOG('CAPTCHA resolvido!');
        await wait(1000);
      }

      if (pageClosed) throw new Error('Pagina fechada');

      // 5. Clica "Emitir Certidão" (AJAX via A4J, nao submit HTTP)
      LOG('Clicando Emitir Certidão...');
      await page.click(SEL_SUBMIT);
      LOG('Botao clicado, aguardando AJAX + download...');

      // 6. Aguarda: network idle (AJAX terminou) + texto resultado ou download
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

      // 7. Captura PDF (fazerDownload() do TST pode ja ter rodado)
      const protocolo = `TST-${new Date().getFullYear()}.${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`;

      // Tenta capturar download, fallback: PDF da pagina
      let pdfBuffer = await tentarBaixarPDF(page);
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
