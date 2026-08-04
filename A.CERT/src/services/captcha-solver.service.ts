import type { CaptchaType } from '../utils/captcha.js';
import type { Page, ElementHandle } from 'puppeteer';
import { scrollAteCaptcha } from '../utils/captcha.js';

const LOG = (msg: string) => console.log(`[CaptchaSolver] ${msg}`);
const API_KEY = process.env.CAPTCHA_API_KEY || '';
const BASE_URL = 'https://api.2captcha.com';

export async function focusPageForCaptcha(
  page: Page,
  tipo: CaptchaType,
): Promise<void> {
  if (typeof page.bringToFront === 'function') {
    try { await page.bringToFront(); } catch { /* ignore */ }
  }
  if (tipo) {
    await scrollAteCaptcha(page, tipo);
  }
}

async function capturarImagemCaptcha(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll<HTMLImageElement>('img'));
    for (const img of imgs) {
      const src = (img.getAttribute('src') || '').toLowerCase();
      const alt = (img.getAttribute('alt') || '').toLowerCase();
      if (src.includes('captcha') || alt.includes('captcha') || alt.includes('seguran')
        || alt.includes('codigo') || src.includes('securimage') || src.includes('kcaptcha')) {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 200;
        canvas.height = img.naturalHeight || img.height || 60;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        ctx.drawImage(img, 0, 0);
        return canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '');
      }
    }
    return null;
  });
}

async function enviarCaptcha2Captcha(base64: string): Promise<string> {
  const form = new URLSearchParams();
  form.append('key', API_KEY);
  form.append('method', 'base64');
  form.append('body', base64);
  form.append('json', '1');

  const res = await fetch(`${BASE_URL}/in.php`, {
    method: 'POST',
    body: form.toString(),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  const data = await res.json() as any;

  if (!data || data.status !== 1) {
    throw new Error(`2Captcha erro: ${data?.request || 'desconhecido'}`);
  }

  return data.request as string;
}

async function aguardarResposta2Captcha(taskId: string, timeoutMs = 60000): Promise<string> {
  const inicio = Date.now();

  for (let i = 0; i < 5; i++) {
    await new Promise(r => setTimeout(r, 4000 + i * 3000));
    if (Date.now() - inicio > timeoutMs) throw new Error('Timeout 2Captcha');

    const url = `${BASE_URL}/res.php?key=${API_KEY}&action=get&id=${taskId}&json=1`;
    const res = await fetch(url);
    const data = await res.json() as any;

    if (data?.status === 1) {
      LOG(`Resolvido: "${data.request}"`);
      return data.request as string;
    }

    if (data?.request !== 'CAPCHA_NOT_READY') {
      throw new Error(`2Captcha erro: ${data?.request || 'desconhecido'}`);
    }
  }

  throw new Error('2Captcha nao respondeu a tempo');
}

async function preencherRespostaCaptcha(page: Page, resposta: string): Promise<boolean> {
  return page.evaluate((texto) => {
    const inputs = Array.from(document.querySelectorAll<HTMLInputElement>(
      'input[type="text"], input:not([type])'
    ));
    for (const inp of inputs) {
      const name = (inp.getAttribute('name') || '').toLowerCase();
      const id = (inp.id || '').toLowerCase();
      const ph = (inp.getAttribute('placeholder') || '').toLowerCase();
      if (name.includes('captcha') || id.includes('captcha') || ph.includes('captcha')) {
        const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
        if (nativeSetter) nativeSetter.call(inp, texto);
        inp.value = texto;
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        inp.dispatchEvent(new Event('change', { bubbles: true }));
        inp.dispatchEvent(new Event('blur', { bubbles: true }));
        return true;
      }
    }
    return false;
  }, resposta);
}

export async function resolverCaptchaTextoAuto(page: Page): Promise<boolean> {
  if (!API_KEY) {
    LOG('CAPTCHA_API_KEY nao configurada');
    return false;
  }

  try {
    LOG('Capturando imagem do captcha...');
    const base64 = await capturarImagemCaptcha(page);
    if (!base64) {
      LOG('Imagem do captcha nao encontrada');
      return false;
    }
    LOG(`Imagem capturada (${base64.length} chars base64)`);

    LOG('Enviando para 2Captcha...');
    const taskId = await enviarCaptcha2Captcha(base64);
    LOG(`Task ${taskId} — aguardando resposta...`);

    const resposta = await aguardarResposta2Captcha(taskId);
    LOG(`Resposta recebida: "${resposta}"`);

    const ok = await preencherRespostaCaptcha(page, resposta);
    if (ok) {
      LOG('Resposta preenchida no campo captcha');
      return true;
    }

    LOG('Campo captcha nao encontrado para preencher');
    return false;
  } catch (err) {
    LOG(`Erro: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}
