import type { IConnector } from './connector.interface.js';
import type { DadosProprietario, ConnectorResult } from './types.js';
import { createPage } from '../utils/browser.js';
import { tentarBaixarPDF, setupDownloadCapture, prepararCapturaPDFViaCDP } from '../utils/dom-helper.js';
import { detectarCaptcha } from '../utils/captcha.js';
import { focusPageForCaptcha } from '../services/captcha-solver.service.js';
import { wait, criarRateLimit } from '../utils/retry-manager.service.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG = (msg: string) => console.log(`[TRT] ${msg}`);
const DOWNLOAD_DIR = path.join(__dirname, '..', '..', 'tmp', 'downloads');
const DEBUG_DIR = path.join(__dirname, '..', '..', 'tmp', 'debug');

const EMISSAO_URL = 'https://pje.trt10.jus.br/certidoes/trabalhista/emissao';

async function salvarDebug(page: import('puppeteer').Page, label: string): Promise<void> {
  try {
    if (!fs.existsSync(DEBUG_DIR)) fs.mkdirSync(DEBUG_DIR, { recursive: true });
    const ts = Date.now();
    await page.screenshot({ path: path.join(DEBUG_DIR, `trt-${label}-${ts}.png`), fullPage: false }).catch(() => {});
    const html = await page.content().catch(() => '');
    fs.writeFileSync(path.join(DEBUG_DIR, `trt-${label}-${ts}.html`), html, 'utf-8');
    console.log(`[TRT] Debug salvo: trt-${label}-${ts}`);
  } catch { /* ignore */ }
}

async function verificarCaptchaResolvido(page: import('puppeteer').Page, tipo: string): Promise<boolean> {
  return page.evaluate((t: string) => {
    // Busca ampla: qualquer textarea, input hidden ou input com token de CAPTCHA
    const elementos = document.querySelectorAll('textarea, input[type="hidden"], input[name*="captcha" i], input[id*="captcha" i]');
    for (const el of elementos) {
      const val = (el as HTMLTextAreaElement | HTMLInputElement).value || '';
      const id = (el.id || '').toLowerCase();
      const name = ((el as any).name || '').toLowerCase();

      if (t === 'hcaptcha' && (id.includes('h-captcha') || name.includes('h-captcha') || id.includes('captcha-response') || name.includes('captcha-response'))) {
        if (val.length > 20) return true;
      }
      if (t === 'recaptcha' && (id.includes('g-recaptcha') || name.includes('g-recaptcha') || id.includes('recaptcha-response') || name.includes('recaptcha-response'))) {
        if (val.length > 20) return true;
      }
      if (t === 'texto' && (name.includes('captcha') || id.includes('captcha'))) {
        if (val.length >= 4) return true;
      }
      // Fallback: se o tipo nao bateu, mas tem token CAPTCHA com valor longo
      if (val.length > 100 && (id.includes('captcha') || name.includes('captcha') || id.includes('token') || name.includes('token'))) {
        return true;
      }
    }
    return false;
  }, tipo);
}

async function diagnosticar(page: import('puppeteer').Page, label: string): Promise<void> {
  LOG(`=== DIAG ${label} ===`);
  const info = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('input')).map(el => ({
      id: el.id, name: el.name, type: el.type, value: el.value?.slice(0, 20),
      placeholder: el.placeholder, disabled: el.disabled, readonly: el.readOnly,
      checked: el.type === 'radio' ? el.checked : undefined,
      label: document.querySelector(`label[for="${el.id}"]`)?.textContent?.trim()?.slice(0, 30) || '',
    }));
    const labels = Array.from(document.querySelectorAll('label')).map(el => ({
      htmlFor: el.htmlFor, text: (el.textContent || '').trim().slice(0, 50),
    }));
    const buttons = Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"], a.btn')).map(el => ({
      text: (el.textContent || (el as HTMLInputElement).value || '').trim().slice(0, 30),
      disabled: (el as HTMLButtonElement).disabled,
      visible: (el as HTMLElement).offsetParent !== null,
    }));
    const radios = Array.from(document.querySelectorAll<HTMLInputElement>('input[type="radio"]')).map(r => ({
      id: r.id, name: r.name, value: r.value, checked: r.checked,
    }));
    return { inputs, labels, buttons, radios };
  });
  LOG(`Inputs (${info.inputs.length}):`);
  for (const i of info.inputs) LOG(`  ${JSON.stringify(i)}`);
  LOG(`Labels (${info.labels.length}):`);
  for (const l of info.labels) LOG(`  ${JSON.stringify(l)}`);
  LOG(`Buttons (${info.buttons.length}):`);
  for (const b of info.buttons) LOG(`  ${JSON.stringify(b)}`);
  if (info.radios.length > 0) LOG(`Radios: ${JSON.stringify(info.radios)}`);
}

export class TRTConnector implements IConnector {
  readonly nome = 'TRT';
  readonly #throttle = criarRateLimit(3000);

  async consultar(
    dados: DadosProprietario,
    jobId?: string,
    certKeys?: string[],
  ): Promise<ConnectorResult> {
    const dataConsulta = new Date().toISOString();
    LOG('Iniciando TRT (PJe)');
    const page = await createPage().catch(e => { LOG(`ERRO createPage: ${e.message}`); throw e; });

    let pageClosed = false;
    page.once('close', () => { pageClosed = true; });
    const emitirUrl = EMISSAO_URL;

    try {
      // ═══════════════════════════════════════════════════════════
      // PASSO 1: Navegar para emissao PJe
      // ═══════════════════════════════════════════════════════════
      LOG(`Navegando ${EMISSAO_URL}`);
      await page.goto(EMISSAO_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
      LOG(`URL: ${page.url()}`);

      // Aguarda Angular carregar (remove "Carregando..." e mostra formulario)
      await page.waitForFunction(
        () => {
          const body = document.body?.textContent || '';
          const loading = body.includes('Carregando');
          const hasForm = document.querySelector('input, button, label') !== null;
          return !loading && hasForm;
        },
        { timeout: 35000 }
      ).catch(() => LOG('Timeout esperando Angular'));
      await wait(4000);

      await diagnosticar(page, 'pagina inicial');

      const cpfDigits = dados.cpf.replace(/\D/g, '');

      // ═══════════════════════════════════════════════════════════
      // PASSO 2: Selecionar radio "CPF" (com retry 403)
      // ═══════════════════════════════════════════════════════════
      LOG('Selecionando radio CPF...');
      let cpfRadioOk = false;

      for (let tentativa = 0; tentativa < 3; tentativa++) {
        if (tentativa > 0) {
          LOG(`Retry ${tentativa + 1}/3...`);
          await wait(3000);
        }
        try {
          cpfRadioOk = await page.evaluate(() => {
            // Busca radio ou label com texto CPF
            const radio = document.querySelector<HTMLInputElement>('input[type="radio"][value*="CPF"], input[type="radio"][value*="cpf"]');
            if (radio) {
              radio.checked = true;
              ['change', 'input', 'click'].forEach(evt =>
                radio.dispatchEvent(new Event(evt, { bubbles: true }))
              );
              return true;
            }
            // Procura label com texto CPF e clica
            const all = document.querySelectorAll<HTMLElement>('label, span, div, td');
            for (const el of all) {
              const txt = (el.textContent || '').trim().toUpperCase();
              if (txt === 'CPF' || txt.startsWith('CPF')) {
                el.scrollIntoView({ block: 'center', behavior: 'instant' });
                const rect = el.getBoundingClientRect();
                const cx = rect.left + rect.width / 2;
                const cy = rect.top + rect.height / 2;
                for (const evtType of ['mousedown', 'mouseup', 'click']) {
                  el.dispatchEvent(new MouseEvent(evtType, { bubbles: true, cancelable: true, clientX: cx, clientY: cy, button: 0 }));
                }
                // Tenta marcar o input radio associado
                const forAttr = (el as HTMLLabelElement).htmlFor;
                const linkedRadio = document.querySelector<HTMLInputElement>(`input[type="radio"]#${el.id}, input[type="radio"][id="${forAttr}"]`);
                if (linkedRadio) {
                  linkedRadio.checked = true;
                  linkedRadio.dispatchEvent(new Event('change', { bubbles: true }));
                }
                return true;
              }
            }
            return false;
          });
          if (cpfRadioOk) break;
        } catch (e: any) {
          LOG(`Erro: ${e.message.slice(0, 80)}`);
        }
      }

      if (!cpfRadioOk) {
        await page.close();
        return { status: 'error', orgao: this.nome, dataConsulta, error: 'Radio CPF nao encontrado' };
      }
      LOG('Radio CPF OK');
      await wait(2000);

      await diagnosticar(page, 'apos radio cpf');

      // ═══════════════════════════════════════════════════════════
      // PASSO 3: Preencher CPF
      // ═══════════════════════════════════════════════════════════
      LOG('Preenchendo CPF...');
      const cpfPreenchido = await page.evaluate((cpf) => {
        const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('input:not([type="hidden"]):not([type="radio"]):not([type="checkbox"])'));
        // Preferencia: input visivel com placeholder ou name contendo CPF
        let alvo = inputs.find(i =>
          (i.placeholder || '').toLowerCase().includes('cpf')
          || (i.name || '').toLowerCase().includes('cpf')
          || (i.id || '').toLowerCase().includes('cpf')
        );
        if (!alvo) alvo = inputs.find(i => i.offsetParent !== null);
        if (!alvo) alvo = inputs[0];
        if (!alvo) return null;

        alvo.focus();
        alvo.select();
        const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
        if (nativeSetter) nativeSetter.call(alvo, cpf);
        alvo.value = cpf;
        alvo.dispatchEvent(new Event('input', { bubbles: true }));
        alvo.dispatchEvent(new Event('change', { bubbles: true }));
        alvo.dispatchEvent(new Event('keyup', { bubbles: true }));
        alvo.dispatchEvent(new Event('blur', { bubbles: true }));
        return alvo.id || alvo.name || 'ok';
      }, cpfDigits);
      LOG(`CPF: ${cpfPreenchido || 'FALHOU'}`);
      if (!cpfPreenchido) {
        await page.close();
        return { status: 'error', orgao: this.nome, dataConsulta, error: 'Input CPF nao encontrado' };
      }
      await wait(1500);

      await diagnosticar(page, 'apos preencher cpf');

      // ═══════════════════════════════════════════════════════════
      // PASSO 4: Setup captura + clicar EMITIR
      // ═══════════════════════════════════════════════════════════
      LOG('Configurando captura de download...');
      const capture = setupDownloadCapture(page, DOWNLOAD_DIR);
      await prepararCapturaPDFViaCDP(page, DOWNLOAD_DIR);
      await wait(500);

      LOG('Clicando EMITIR...');

      // Aguarda botao ficar habilitado (Angular desabilita ate form valido)
      await page.waitForFunction(
        () => {
          const btns = Array.from(document.querySelectorAll<HTMLElement>('button, input[type="button"], input[type="submit"]'));
          return btns.some(b => {
            const txt = (b.textContent || (b as HTMLInputElement).value || '').trim().toUpperCase();
            return (txt === 'EMITIR' || txt.includes('EMITIR'))
              && !(b as HTMLButtonElement).disabled;
          });
        },
        { timeout: 15000 }
      ).catch(() => LOG('Timeout botao habilitado - tentando mesmo assim'));

      let emitirOk = false;
      for (let tentativa = 0; tentativa < 2; tentativa++) {
        emitirOk = await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll<HTMLElement>('button, input[type="button"], input[type="submit"], a.btn'));
          for (const b of btns) {
            const txt = (b.textContent || (b as HTMLInputElement).value || '').trim().toUpperCase();
            if (txt === 'EMITIR' || txt.includes('EMITIR')) {
              (b as HTMLButtonElement).disabled = false;
              b.scrollIntoView({ block: 'center', behavior: 'instant' });
              const rect = b.getBoundingClientRect();
              const cx = rect.left + rect.width / 2;
              const cy = rect.top + rect.height / 2;
              for (const evtType of ['mousedown', 'mouseup', 'click']) {
                b.dispatchEvent(new MouseEvent(evtType, { bubbles: true, cancelable: true, clientX: cx, clientY: cy, button: 0 }));
              }
              return true;
            }
          }
          return false;
        });
        if (emitirOk) break;
        await wait(2000);
      }

      LOG(`EMITIR: ${emitirOk ? 'OK' : 'NAO ENCONTRADO'}`);
      if (!emitirOk) {
        capture.cleanup();
        await page.close();
        return { status: 'error', orgao: this.nome, dataConsulta, error: 'Botao EMITIR nao encontrado' };
      }

      // ═══════════════════════════════════════════════════════════
      // PASSO 5: CAPTCHA
      // ═══════════════════════════════════════════════════════════
      let captchaType: string | null = null;
      for (let t = 0; t < 40; t++) {
        if (page.isClosed()) break;
        captchaType = await detectarCaptcha(page).catch(() => null);
        if (captchaType) break;
        await wait(500);
      }
      LOG(`CAPTCHA detectado: ${captchaType || 'nenhum'}`);

      if (captchaType) {
        try { await page.bringToFront(); } catch {}
        await focusPageForCaptcha(page, captchaType as any).catch(() => {});
        const urlAntes = page.url();

        LOG('>>> Aguardando CAPTCHA (VNC/Extension)...');

        // Poll combinado: verifica token + mudanca de URL
        let capResolvido = false;
        let tentativasRestantes = Math.floor(120000 / 1000); // 120 iterações de 1s
        while (tentativasRestantes > 0 && !capResolvido) {
          if (page.isClosed() || pageClosed) break;
          tentativasRestantes--;

          // 1. Verifica via funcao ampla (busca token em qualquer elemento)
          capResolvido = await verificarCaptchaResolvido(page, captchaType).catch(() => false);
          if (!capResolvido) {
            // 2. Verifica via funcao padrao (esperarCaptchaInterativo usa selectors especificos)
            capResolvido = await page.evaluate((t: string) => {
              if (t === 'hcaptcha') {
                const ta = document.querySelector('textarea[id*="h-captcha-response"], textarea[name*="h-captcha-response"], textarea[id*="h-captcha"], textarea[name*="h-captcha"]');
                return !!(ta && (ta as HTMLTextAreaElement).value.length > 3);
              }
              if (t === 'recaptcha') {
                const ta = document.querySelector('textarea[id*="g-recaptcha-response"], textarea[name*="g-recaptcha-response"], textarea[id*="g-recaptcha"], textarea[name*="g-recaptcha"]');
                return !!(ta && (ta as HTMLTextAreaElement).value.length > 3);
              }
              if (t === 'texto') {
                const inputs = document.querySelectorAll('input[type="text"], input:not([type])');
                for (const inp of inputs) {
                  const name = (inp.getAttribute('name') || '').toLowerCase();
                  const id = (inp.id || '').toLowerCase();
                  if ((name.includes('captcha') || id.includes('captcha')) && (inp as HTMLInputElement).value.length >= 4) return true;
                }
              }
              return false;
            }, captchaType).catch(() => false);
          }
          if (!capResolvido) {
            // 3. Fallback: URL mudou? Se sim, o CAPTCHA foi resolvido e a pagina avancou
            const urlAtual = page.url();
            if (urlAtual !== urlAntes && !urlAtual.includes('emissao') && !urlAtual.includes('captcha')) {
              LOG(`URL mudou: ${urlAtual.slice(0, 100)} → CAPTCHA provavelmente resolvido`);
              capResolvido = true;
              break;
            }
          }

          if (!capResolvido) await wait(1000);
        }

        if (!capResolvido || page.isClosed() || pageClosed) {
          LOG('CAPTCHA NAO resolvido - salvando debug...');
          await salvarDebug(page, 'captcha-fail');
          capture.cleanup();
          await page.close().catch(() => {});
          return { status: 'error', orgao: this.nome, dataConsulta, error: '[TRT] CAPTCHA nao resolvido' };
        }
        LOG('CAPTCHA resolvido');
        await wait(3000);
      }

      // ═══════════════════════════════════════════════════════════
      // PASSO 6: Aguardar pagina de resultado + capturar PDF
      //
      // O PJe renderiza a certidao via Shadow DOM dentro do componente
      // pje-conteudo-certidao-encapsulado. page.content() nao captura
      // shadow DOM, mas CDP Page.printToPDF e page.pdf() capturam a
      // renderizacao visual. O botao Imprimir dispara window.print().
      //
      // Estrategia (ordem de tentativa):
      // 1. API direta (Node fetch com cookies + browser fetch com credenciais)
      // 2. CDP Browser.setDownloadBehavior + clique Imprimir = captura download
      // 3. HTTP response interceptor para PDF
      // 4. CDP Page.printToPDF (nativo, respeita @media print CSS)
      // 5. page.pdf() com emulateMediaType('print')
      // 6. tentarBaixarPDF (clica botoes download/imprimir)
      // ═══════════════════════════════════════════════════════════
      LOG('Aguardando resultado...');
      await salvarDebug(page, 'pos-captcha');

      try {
        await page.waitForFunction(
          () => {
            const url = window.location.href;
            if (url.includes('/certidao/') || url.includes('/resultado/')) return true;
            const body = document.body?.textContent?.toLowerCase() || '';
            return body.includes('certidão emitida') || body.includes('certidao emitida')
              || body.includes('nada consta') || body.includes('protocolo');
          },
          { timeout: 45000 }
        );
      } catch {
        LOG('Timeout aguardando resultado - salvando debug...');
        await salvarDebug(page, 'timeout-resultado');
      }

      await wait(2000);
      const certId = page.url().match(/\/certidao\/(\d+)/)?.[1] || '';
      LOG(`Certidao ID: ${certId || 'nao encontrado'}`);
      await salvarDebug(page, 'resultado');

      let pdfBuffer: Uint8Array | null = null;

      // -- NETWORK LOG: loga requisicoes relevantes para debug --
      page.on('request', (req) => {
        const url = req.url();
        if (url.includes('certidao') || url.includes('pdf') || url.includes('api/')) {
          LOG(`[NET-REQ] ${req.method()} ${url.slice(0, 130)}`);
        }
      });
      page.on('response', (resp) => {
        const url = resp.url();
        if (url.includes('certidao') || url.includes('pdf') || url.includes('api/')) {
          const ct = resp.headers()['content-type'] || '';
          const cd = resp.headers()['content-disposition'] || '';
          LOG(`[NET-RES] ${resp.status()} ct=${ct.slice(0, 40)} cd=${cd.slice(0, 40)} ${url.slice(0, 130)}`);
        }
      });

      // ═══════════════════════════════════════════════════════════
      // 6.1: API direta do PJe (Node.js + browser-side fetch)
      // ═══════════════════════════════════════════════════════════
      if (certId) {
        LOG(`API: tentando certidao ${certId}...`);
        const cookies = await page.cookies();
        const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');

        const apiUrls = [
          `https://pje.trt10.jus.br/certidoes/trabalhista/certidao/${certId}/pdf`,
          `https://pje.trt10.jus.br/certidoes/api/certidao/${certId}/pdf`,
          `https://pje.trt10.jus.br/certidoes/api/certidoes/trabalhista/${certId}/pdf`,
          `https://pje.trt10.jus.br/certidoes/trabalhista/certidao/${certId}?format=pdf`,
          `https://pje.trt10.jus.br/certidoes/api/certidao/${certId}?format=pdf`,
          `https://pje.trt10.jus.br/certidoes/trabalhista/certidao/${certId}/download`,
        ];

        for (const url of apiUrls) {
          if (pdfBuffer) break;
          try {
            const r = await fetch(url, {
              headers: { Cookie: cookieHeader, Accept: 'application/pdf,*/*', 'User-Agent': 'Mozilla/5.0' },
              redirect: 'follow',
            });
            LOG(`[API-NODE] ${r.status} ${url.slice(0, 100)}`);
            if (r.ok) {
              const buf = new Uint8Array(await r.arrayBuffer());
              if (buf.length > 500 && buf[0] === 0x25 && buf[1] === 0x50) {
                pdfBuffer = buf;
                LOG(`PDF via API Node: ${buf.length} bytes`);
              }
            }
          } catch {}
        }

        // Browser-side fetch (credenciais automaticas, headers corretos)
        if (!pdfBuffer) {
          try {
            const result = await page.evaluate(async (id: string) => {
              const urls = [
                `/certidoes/trabalhista/certidao/${id}/pdf`,
                `/certidoes/api/certidao/${id}/pdf`,
                `/certidoes/api/certidoes/trabalhista/${id}/pdf`,
                `/certidoes/trabalhista/certidao/${id}?format=pdf`,
                `/certidoes/api/certidao/${id}?format=pdf`,
              ];
              for (const u of urls) {
                try {
                  const r = await fetch(u, { credentials: 'include' });
                  if (!r.ok) continue;
                  const buf = await r.arrayBuffer();
                  if (buf.byteLength > 500) {
                    const arr = new Uint8Array(buf);
                    if (arr[0] === 0x25 && arr[1] === 0x50) return Array.from(arr);
                  }
                } catch {}
              }
              return null;
            }, certId);
            if (result && result.length > 500) {
              pdfBuffer = new Uint8Array(result);
              LOG(`PDF via API browser: ${pdfBuffer.length} bytes`);
            }
          } catch {}
        }
      }

      // ═══════════════════════════════════════════════════════════
      // 6.2: CDP download behavior + clique Imprimir + aguarda download
      // ═══════════════════════════════════════════════════════════
      if (!pdfBuffer) {
        LOG('CDP: configurando download capture + clique Imprimir...');

        // Override window.print para evitar o dialogo nativo
        await page.evaluate(() => {
          (window as any).__origPrint = window.print;
          (window as any).__printCalled = false;
          window.print = () => { (window as any).__printCalled = true; };
        }).catch(() => {});

        // Configura CDP com behavior: allowAndName + eventsEnabled
        let cdpGuid = '';
        let cdpResolved = false;
        const cdpDownloadPromise = new Promise<Uint8Array | null>((resolve) => {
          const timeout = setTimeout(() => { if (!cdpResolved) { cdpResolved = true; resolve(null); } }, 35000);

          page.target().createCDPSession().then(async (client) => {
            try {
              await client.send('Browser.setDownloadBehavior', {
                behavior: 'allowAndName',
                downloadPath: DOWNLOAD_DIR,
                eventsEnabled: true,
              });
            } catch {}

            client.on('Browser.downloadProgress', (params: any) => {
              const { guid, state } = params;
              if (state === 'inProgress') cdpGuid = guid;
              if (state === 'completed' && guid === cdpGuid && !cdpResolved) {
                cdpResolved = true;
                clearTimeout(timeout);
                setTimeout(() => {
                  try {
                    const files = fs.readdirSync(DOWNLOAD_DIR);
                    let newest = '', newestTime = 0;
                    for (const f of files) {
                      if (f.endsWith('.crdownload')) continue;
                      const st = fs.statSync(path.join(DOWNLOAD_DIR, f));
                      if (st.mtimeMs > newestTime) { newestTime = st.mtimeMs; newest = f; }
                    }
                    if (newest) {
                      const buf = fs.readFileSync(path.join(DOWNLOAD_DIR, newest));
                      if (buf.length > 500 && buf[0] === 0x25 && buf[1] === 0x50) {
                        resolve(new Uint8Array(buf));
                        LOG(`PDF via CDP download: ${buf.length} bytes`);
                        return;
                      }
                    }
                  } catch {}
                  resolve(null);
                }, 1500);
              }
              if (state === 'canceled' && !cdpResolved) {
                cdpResolved = true; clearTimeout(timeout); resolve(null);
              }
            });
          }).catch(() => { if (!cdpResolved) { cdpResolved = true; resolve(null); } });
        });

        // Clica Imprimir (Angular: pje-botao-imprimir > button)
        LOG('Clicando Imprimir para disparar download...');
        await page.evaluate(() => {
          // Tenta via Angular component
          const btns = document.querySelectorAll<HTMLElement>(
            'pje-botao-imprimir button, button mat-stroked-button, button'
          );
          for (const b of btns) {
            const txt = (b.textContent || '').trim();
            if (txt === 'Imprimir' || txt === 'IMPRIMIR') {
              b.scrollIntoView({ block: 'center', behavior: 'instant' });
              const rect = b.getBoundingClientRect();
              const cx = rect.left + rect.width / 2;
              const cy = rect.top + rect.height / 2;
              for (const evtType of ['mousedown', 'mouseup', 'click']) {
                b.dispatchEvent(new MouseEvent(evtType, { bubbles: true, cancelable: true, clientX: cx, clientY: cy, button: 0 }));
              }
              b.click();
              return;
            }
          }
        });
        LOG('Clique Imprimir executado, aguardando download CDP...');

        pdfBuffer = await cdpDownloadPromise;
        if (pdfBuffer) {
          LOG(`PDF via CDP download + Imprimir: ${pdfBuffer.length} bytes`);
        } else {
          LOG('CDP download nao detectou PDF');
        }
      }

      // ═══════════════════════════════════════════════════════════
      // 6.3: HTTP response interceptor (PDF content-type)
      // ═══════════════════════════════════════════════════════════
      if (!pdfBuffer) {
        LOG('HTTP interceptor: monitorando respostas PDF...');
        const pdfFromResponse = await new Promise<Uint8Array | null>((resolve) => {
          const timeout = setTimeout(() => resolve(null), 15000);

          const handler = async (resp: import('puppeteer').HTTPResponse) => {
            try {
              const ct = (resp.headers()['content-type'] || '').toLowerCase();
              const cd = (resp.headers()['content-disposition'] || '').toLowerCase();
              if (ct.includes('application/pdf') || (cd.includes('attachment') && (ct.includes('octet') || resp.url().endsWith('.pdf')))) {
                const buf = await resp.buffer();
                const arr = new Uint8Array(buf);
                if (arr.length > 500 && arr[0] === 0x25 && arr[1] === 0x50) {
                  clearTimeout(timeout);
                  page.off('response', handler);
                  resolve(arr);
                  LOG(`PDF via HTTP interceptor: ${arr.length} bytes`);
                }
              }
            } catch {}
          };

          page.on('response', handler);
        });

        if (pdfFromResponse) pdfBuffer = pdfFromResponse;
      }

      // ═══════════════════════════════════════════════════════════
      // 6.4: CDP Page.printToPDF (nativo, respeita @media print)
      // ═══════════════════════════════════════════════════════════
      if (!pdfBuffer) {
        try {
          LOG('CDP Page.printToPDF...');
          await page.emulateMediaType('print');
          await wait(1000);
          const client = await page.target().createCDPSession();
          const result = await client.send('Page.printToPDF', {
            format: 'A4',
            printBackground: true,
            marginTop: '0.4in',
            marginBottom: '0.4in',
            marginLeft: '0.4in',
            marginRight: '0.4in',
          } as any);
          const buf = new Uint8Array((result as any).data);
          if (buf.length > 500 && buf[0] === 0x25 && buf[1] === 0x50) {
            pdfBuffer = buf;
            LOG(`PDF via CDP printToPDF: ${buf.length} bytes`);
          }
          client.detach().catch(() => {});
        } catch (e: any) {
          LOG(`CDP printToPDF falhou: ${e.message}`);
        }
      }

      // 6.5: page.pdf() fallback
      if (!pdfBuffer) {
        LOG('Fallback page.pdf()...');
        await wait(2000);
        try {
          await page.emulateMediaType('print');
          const buf = await page.pdf({ format: 'A4', printBackground: true });
          if (buf.length > 500 && String.fromCharCode(...buf.slice(0, 5)) === '%PDF-') {
            pdfBuffer = new Uint8Array(buf);
            LOG(`PDF via page.pdf: ${pdfBuffer.length} bytes`);
          }
        } catch (e: any) {
          LOG(`page.pdf() falhou: ${e.message}`);
        }
      }

      // 6.6: Ultimo fallback — tentarBaixarPDF
      if (!pdfBuffer) {
        pdfBuffer = await tentarBaixarPDF(page, DOWNLOAD_DIR).catch(() => null);
        if (pdfBuffer && pdfBuffer.length > 500) LOG(`PDF via tentarBaixarPDF: ${pdfBuffer.length} bytes`);
      }

      capture.cleanup();

      if (!pdfBuffer || pdfBuffer.length < 1000) {
        LOG('PDF nao capturado - salvando debug...');
        await salvarDebug(page, 'pdf-fail');
        await page.close();
        return { status: 'error', orgao: this.nome, dataConsulta, error: 'PDF vazio ou invalido' };
      }
      LOG(`PDF: ${pdfBuffer.length} bytes`);

      await this.#throttle();
      await page.close();
      return {
        status: 'success',
        orgao: this.nome,
        dataConsulta,
        protocolo: `TRT-${new Date().getFullYear()}.${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`,
        documento: pdfBuffer,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      LOG(`ERRO: ${msg}`);
      try { await salvarDebug(page, 'erro'); } catch {}
      await page.close().catch(() => {});
      return { status: 'error', orgao: this.nome, dataConsulta, error: `[TRT] ${msg}` };
    }
  }
}
