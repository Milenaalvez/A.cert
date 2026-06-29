import type { IConnector } from './connector.interface.js';
import type { DadosProprietario, ConnectorResult } from './types.js';
import type { CaptchaManager } from '../services/captcha-manager.service.js';
import { createPage } from '../utils/browser.js';
import { injectFillHelper, preencherInputRapido, tentarBaixarPDF, clicarBotaoPorTexto } from '../utils/dom-helper.js';
import { detectarCaptcha, esperarCaptchaInterativo } from '../utils/captcha.js';
import { focusPageForCaptcha } from '../services/captcha-solver.service.js';
import { wait, criarRateLimit } from '../utils/retry-manager.service.js';

const LOG = (msg: string) => console.log(`[ONR] ${msg}`);
const DEBUG = process.env.DEBUG;

const BASE_URL = 'https://registradores.onr.org.br';
const LOGIN_EMAIL = process.env.ONR_EMAIL || 'vendas@blocoimob.com.br';
const LOGIN_SENHA = process.env.ONR_PASSWORD || 'Bloco100%';

async function diagnosticarFormulario(page: import('puppeteer').Page): Promise<void> {
  const info = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('input')).map(el => ({
      id: el.id, name: el.name, type: el.type, placeholder: el.placeholder, className: el.className.slice(0, 50),
    }));
    const labels = Array.from(document.querySelectorAll('label')).map(el => ({
      htmlFor: el.htmlFor, text: (el.textContent || '').trim().slice(0, 80),
    }));
    const buttons = Array.from(document.querySelectorAll('button, a.btn, a[class*="button"], input[type="submit"], input[type="button"]')).map(el => {
      const text = (el as HTMLElement).textContent?.trim() || (el as HTMLInputElement).value || '';
      return { tag: el.tagName, text: text.slice(0, 60), type: (el as HTMLInputElement).type || '', class: el.className.slice(0, 40) };
    });
    const selects = Array.from(document.querySelectorAll<HTMLSelectElement>('select')).map(el => ({
      id: el.id, name: el.name, options: Array.from(el.options).map(o => ({ text: o.text.trim(), value: o.value })),
    }));
    const allText: string[] = [];
    document.querySelectorAll('h1, h2, h3, h4, h5, p, span, td, a, strong, .title, .texto, .mensagem, .panel-heading, .card-title').forEach(el => {
      const t = (el as HTMLElement).textContent?.trim();
      if (t && t.length > 2 && t.length < 120) allText.push(t);
    });
    return { inputs, labels, buttons, selects, allText: allText.slice(0, 50) };
  });
  LOG(`Inputs (${info.inputs.length}):`);
  for (const i of info.inputs) LOG(`  id="${i.id}" name="${i.name}" type="${i.type}" placeholder="${i.placeholder}" class="${i.className}"`);
  LOG(`Labels (${info.labels.length}):`);
  for (const l of info.labels) LOG(`  for="${l.htmlFor}" text="${l.text}"`);
  LOG(`Botoes (${info.buttons.length}):`);
  for (const b of info.buttons) LOG(`  <${b.tag}> "${b.text}" type="${b.type}" class="${b.class}"`);
  if (info.selects.length > 0) LOG(`Selects: ${JSON.stringify(info.selects)}`);
  LOG(`Textos: ${info.allText.join(' | ')}`);
}

async function clicarLinkPorTexto(page: import('puppeteer').Page, texto: string): Promise<boolean> {
  const result = await page.evaluate((txt) => {
    const txtNorm = txt.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const links = document.querySelectorAll('a, button, span, div[role="button"], [onclick]');
    for (const el of links) {
      const content = (el as HTMLElement).textContent?.trim() || '';
      const norm = content.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      if (norm.includes(txtNorm)) { (el as HTMLElement).click(); return content; }
    }
    return null;
  }, texto);
  return result !== null;
}

async function preencherInputPorLabel(page: import('puppeteer').Page, labelTexto: string, valor: string): Promise<boolean> {
  const lblNorm = labelTexto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const sel = await page.evaluate((lbl) => {
    const labels = Array.from(document.querySelectorAll('label'));
    for (const label of labels) {
      const txt = (label.textContent?.trim() || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      if (!txt.includes(lbl)) continue;
      if (label.htmlFor) return `#${CSS.escape(label.htmlFor)}`;
      const parent = label.closest('.field, .p-field, .form-group, .input-group, div') || label.parentElement;
      if (parent) {
        const inp = parent.querySelector<HTMLInputElement>('input, select, textarea');
        if (inp && inp.id) return `#${CSS.escape(inp.id)}`;
        if (inp && inp.name) return `[name="${inp.name}"]`;
      }
    }
    return null;
  }, lblNorm);

  if (!sel) return false;
  return preencherInputRapido(page, sel, valor);
}

async function preencherInputFallback(page: import('puppeteer').Page, busca: string, valor: string): Promise<boolean> {
  const sel = await page.evaluate((b) => {
    const lb = b.toLowerCase();
    const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('input:not([type="hidden"])'));
    for (const inp of inputs) {
      const id = (inp.id || '').toLowerCase();
      const name = (inp.name || '').toLowerCase();
      const ph = (inp.placeholder || '').toLowerCase();
      if (id.includes(lb) || name.includes(lb) || ph.includes(lb)) {
        return inp.id ? `#${CSS.escape(inp.id)}` : inp.name ? `[name="${inp.name}"]` : 'input';
      }
    }
    return null;
  }, busca);
  if (!sel) return false;
  return preencherInputRapido(page, sel, valor);
}

async function selecionarSelectPorTexto(page: import('puppeteer').Page, busca: string, valorTexto: string): Promise<boolean> {
  const lb = busca.toLowerCase();
  const valNorm = valorTexto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const result = await page.evaluate((lbl, vn) => {
    const selects = Array.from(document.querySelectorAll<HTMLSelectElement>('select'));
    for (const sel of selects) {
      const id = (sel.id || '').toLowerCase();
      const name = (sel.name || '').toLowerCase();
      if (!id.includes(lbl) && !name.includes(lbl)) continue;
      for (let i = 0; i < sel.options.length; i++) {
        const optNorm = sel.options[i].text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        if (optNorm.includes(vn)) {
          sel.selectedIndex = i;
          sel.dispatchEvent(new Event('change', { bubbles: true }));
          return sel.options[i].text;
        }
      }
    }
    return null;
  }, lb, valNorm);
  return result !== null;
}

export class ONRConnector implements IConnector {
  readonly nome = 'Certidão de Ônus (ONR)';

  readonly #throttle = criarRateLimit(3000);

  async consultar(
    dados: DadosProprietario,
    captchaManager?: CaptchaManager,
    jobId?: string,
    certKeys?: string[],
  ): Promise<ConnectorResult> {
    const dataConsulta = new Date().toISOString();
    LOG('Iniciando consulta ONR');
    const page = await createPage().catch(e => { LOG(`ERRO createPage: ${e.message}`); throw e; });

    try {
      let pageClosed = false;
      page.once('close', () => { pageClosed = true; });

      // ----- STEP 1: Login -----
      LOG('Navegando para login...');
      await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
      await wait(3000);

      LOG('--- Diagnostico pagina inicial ---');
      if (DEBUG) await diagnosticarFormulario(page);
      await injectFillHelper(page);

      // Try to find login form - may be on the homepage or a /login page
      const temFormLogin = await page.evaluate(() => {
        return document.querySelector('input[type="email"], input[name="email"], input[name="login"], input[name="username"], input[placeholder*="email"], input[placeholder*="Email"]') !== null;
      });

      if (temFormLogin) {
        LOG('Formulario de login encontrado na pagina inicial');
        const emailOk = await preencherInputPorLabel(page, 'Email', LOGIN_EMAIL)
          || await preencherInputPorLabel(page, 'E-mail', LOGIN_EMAIL)
          || await preencherInputPorLabel(page, 'Usuário', LOGIN_EMAIL)
          || await preencherInputPorLabel(page, 'Usuario', LOGIN_EMAIL)
          || await preencherInputFallback(page, 'email', LOGIN_EMAIL)
          || await preencherInputFallback(page, 'login', LOGIN_EMAIL)
          || await preencherInputFallback(page, 'usuario', LOGIN_EMAIL)
          || await preencherInputFallback(page, 'user', LOGIN_EMAIL);
        LOG(`Email: ${emailOk || 'nao encontrado'}`);

        const senhaOk = await preencherInputPorLabel(page, 'Senha', LOGIN_SENHA)
          || await preencherInputPorLabel(page, 'Password', LOGIN_SENHA)
          || await preencherInputFallback(page, 'senha', LOGIN_SENHA)
          || await preencherInputFallback(page, 'password', LOGIN_SENHA)
          || await preencherInputFallback(page, 'pass', LOGIN_SENHA);
        LOG(`Senha: ${senhaOk || 'nao encontrado'}`);

        await wait(500);

        const loginOk = await clicarBotaoPorTexto(page, 'entrar')
          || await clicarBotaoPorTexto(page, 'login')
          || await clicarBotaoPorTexto(page, 'acessar')
          || await clicarBotaoPorTexto(page, 'log in')
          || await clicarBotaoPorTexto(page, 'sign in')
          || await clicarBotaoPorTexto(page, 'ok');
        LOG(`Login click: ${loginOk}`);

        if (!loginOk) {
          LOG('Nenhum botao de login encontrado, tentando continuar...');
        }

        try { await page.waitForNetworkIdle({ idleTime: 1000, timeout: 10000 }); } catch {}
        await wait(1000);

        // Check for CAPTCHA after login
        const captchaLogin = await detectarCaptcha(page);
        if (captchaLogin) {
          LOG(`CAPTCHA no login: ${captchaLogin}`);
          if (captchaManager && jobId) {
            const chave = `${jobId}-${this.nome}-login`;
            const img = await page.screenshot({ type: 'png' });
            const waitPromise = captchaManager.waitForSolution(chave, `${this.nome} (login)`, img, captchaLogin, page.url());
            esperarCaptchaInterativo(page, captchaLogin).then(ok => {
              if (ok) captchaManager.resolveCaptcha(chave, 'resolved');
            });
            await Promise.race([
              waitPromise,
              new Promise<void>((resolve) => {
                const check = () => { if (pageClosed) resolve(); };
                page.on('close', check);
                setTimeout(() => { page.off('close', check); resolve(); }, 300000).unref();
              }),
            ]);
            LOG('CAPTCHA do login resolvido');
            await wait(3000);
          }
        }
      } else {
        LOG('Formulario de login nao encontrado, tentando navegar para /login');
        try {
          await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: 15000 });
          await wait(2000);
          if (DEBUG) await diagnosticarFormulario(page);

          const emailOk = await preencherInputPorLabel(page, 'Email', LOGIN_EMAIL)
            || await preencherInputPorLabel(page, 'E-mail', LOGIN_EMAIL)
            || await preencherInputFallback(page, 'email', LOGIN_EMAIL)
            || await preencherInputFallback(page, 'login', LOGIN_EMAIL);
          LOG(`Email (pagina login): ${emailOk}`);

          const senhaOk = await preencherInputPorLabel(page, 'Senha', LOGIN_SENHA)
            || await preencherInputFallback(page, 'senha', LOGIN_SENHA)
            || await preencherInputFallback(page, 'password', LOGIN_SENHA);
          LOG(`Senha (pagina login): ${senhaOk}`);

          await wait(500);
          await clicarBotaoPorTexto(page, 'entrar')
            || await clicarBotaoPorTexto(page, 'login')
            || await clicarBotaoPorTexto(page, 'acessar');
          try { await page.waitForNetworkIdle({ idleTime: 1000, timeout: 10000 }); } catch {}
          await wait(1000);
        } catch {
          LOG('Falha ao acessar pagina de login');
        }
      }

      // ----- STEP 2: Navigate to "Certidão Digital" -----
      LOG('Navegando para certidao digital...');

      const naDashboard = await page.evaluate(() => {
        const body = document.body.textContent?.toLowerCase() || '';
        return body.includes('dashboard') || body.includes('painel') || body.includes('bem-vindo') || body.includes('inicio');
      });
      LOG(`Esta no dashboard: ${naDashboard}`);

      // Try clicking on "Certidão Digital" link
      const certidaoDigitalClick = await clicarLinkPorTexto(page, 'Certidão Digital')
        || await clicarLinkPorTexto(page, 'Certidao Digital')
        || await clicarLinkPorTexto(page, 'Certidão')
        || await clicarLinkPorTexto(page, 'Certidao')
        || await clicarLinkPorTexto(page, 'certidão')
        || await clicarLinkPorTexto(page, 'certidao');
      LOG(`Click Certidão Digital: ${certidaoDigitalClick || 'nao encontrado'}`);
      await wait(3000);

      // ----- STEP 3: "Novo Pedido" -----
      LOG('Procurando Novo Pedido...');
      const novoPedidoClick = await clicarLinkPorTexto(page, 'Novo Pedido')
        || await clicarLinkPorTexto(page, 'novo pedido')
        || await clicarLinkPorTexto(page, 'Novo')
        || await clicarLinkPorTexto(page, 'novo')
        || await clicarBotaoPorTexto(page, 'novo pedido')
        || await clicarBotaoPorTexto(page, 'novo');
      LOG(`Click Novo Pedido: ${novoPedidoClick || 'nao encontrado'}`);
      await wait(3000);

      // ----- STEP 4: Select state "DF" -----
      LOG('Selecionando estado DF...');
      const estadoOk = await selecionarSelectPorTexto(page, 'estado', 'DF')
        || await selecionarSelectPorTexto(page, 'uf', 'DF')
        || await selecionarSelectPorTexto(page, 'estado', 'Distrito Federal')
        || await selecionarSelectPorTexto(page, 'uf', 'Distrito Federal')
        || await selecionarSelectPorTexto(page, 'state', 'DF');
      LOG(`Estado DF: ${estadoOk || 'nao selecionado'}`);
      await wait(1000);

      // ----- STEP 5: Select "Matrícula Inteiro Teor" -----
      LOG('Selecionando tipo de certidao...');
      const tipoOk = await clicarLinkPorTexto(page, 'Matrícula Inteiro Teor')
        || await clicarLinkPorTexto(page, 'Matricula Inteiro Teor')
        || await clicarLinkPorTexto(page, 'Inteiro Teor')
        || await clicarLinkPorTexto(page, 'inteiro teor')
        || await selecionarSelectPorTexto(page, 'tipo', 'Matrícula Inteiro Teor')
        || await selecionarSelectPorTexto(page, 'tipo', 'Matricula Inteiro Teor')
        || await selecionarSelectPorTexto(page, 'certidao', 'Matrícula Inteiro Teor')
        || await selecionarSelectPorTexto(page, 'certidao', 'Matricula Inteiro Teor');
      LOG(`Tipo certidao: ${tipoOk || 'nao selecionado'}`);
      await wait(1000);

      // ----- STEP 6: Check for CAPTCHA and handle -----
      const captchaType = await detectarCaptcha(page);
      LOG(`CAPTCHA: ${captchaType}`);

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
            new Promise<void>((resolve) => {
              const check = () => { if (pageClosed) resolve(); };
              page.on('close', check);
              setTimeout(() => { page.off('close', check); resolve(); }, 300000).unref();
            }),
          ]);
          LOG('CAPTCHA resolvido');
          await wait(3000);
        } else {
          await page.close();
          return { status: 'captcha_required', orgao: this.nome, dataConsulta, error: 'CAPTCHA presente' };
        }
      }

      if (pageClosed) throw new Error('Pagina fechada');

      // Take PDF of the current state
      const protocolo = `ONR-${new Date().getFullYear()}.${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`;
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
      return { status: 'error', orgao: this.nome, dataConsulta, error: `[ONR] ${msg}` };
    }
  }
}
