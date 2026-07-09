import type { CaptchaType } from '../utils/captcha.js';
import type { Page } from 'puppeteer';
import { scrollAteCaptcha } from '../utils/captcha.js';
import { randomUUID } from 'node:crypto';

export interface CaptchaEntry {
  orgao: string;
  screenshot: string;
  chave: string;
  resolvido: boolean;
  solution?: string;
}

const captchaPages = new Map<string, Page>();
const captchaSolutions = new Map<string, string>();
export const captchaStore = new Map<string, CaptchaEntry>();

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

export async function tirarScreenshotCaptcha(
  page: Page,
  jobId: string,
  orgao: string,
): Promise<CaptchaEntry> {
  const chave = `${jobId}-${randomUUID().slice(0, 8)}`;
  const screenshot = await page.screenshot({ encoding: 'base64', type: 'png' });

  const entry: CaptchaEntry = {
    orgao,
    screenshot: `data:image/png;base64,${screenshot}`,
    chave,
    resolvido: false,
  };

  captchaStore.set(chave, entry);
  captchaPages.set(chave, page);

  return entry;
}

export function resolverCaptcha(chave: string, solution: string): boolean {
  const page = captchaPages.get(chave);
  if (!page || page.isClosed()) return false;

  captchaSolutions.set(chave, solution);

  // Type the solution into captcha input fields on the page
  (async () => {
    try {
      await page.evaluate((sol) => {
        const inputs = document.querySelectorAll<HTMLInputElement>('input[type="text"], input:not([type])');
        for (const inp of inputs) {
          const name = (inp.getAttribute('name') || '').toLowerCase();
          const id = (inp.id || '').toLowerCase();
          const ph = (inp.getAttribute('placeholder') || '').toLowerCase();
          if (name.includes('captcha') || id.includes('captcha') || ph.includes('captcha')) {
            const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
            if (setter) setter.call(inp, sol);
            inp.dispatchEvent(new Event('input', { bubbles: true }));
            inp.dispatchEvent(new Event('change', { bubbles: true }));
            break;
          }
        }
      }, solution);

      // Try clicking submit/verify button
      await page.evaluate(() => {
        const textos = ['verificar', 'confirmar', 'ok', 'continuar', 'enviar'];
        const botoes = document.querySelectorAll<HTMLElement>('button, input[type="submit"]');
        for (const b of botoes) {
          const txt = (b.textContent?.trim() || (b as HTMLInputElement).value || '').toLowerCase();
          if (textos.some(t => txt.includes(t))) {
            b.click();
            break;
          }
        }
      });
    } catch {}
  })();

  return true;
}

export function isCaptchaSolved(chave: string): boolean {
  return captchaSolutions.has(chave);
}

export function limparCaptcha(chave: string): void {
  captchaPages.delete(chave);
  captchaSolutions.delete(chave);
}

export async function esperarCaptchaComSuporteRemoto(
  page: import('puppeteer').Page,
  tipo: import('../utils/captcha.js').CaptchaType,
  jobId: string,
  orgao: string,
  timeoutMs = 300000,
): Promise<boolean> {
  const info = await tirarScreenshotCaptcha(page, jobId, orgao);
  const inicio = Date.now();

  while (Date.now() - inicio < timeoutMs) {
    try {
      if (page.isClosed()) return false;

      if (isCaptchaSolved(info.chave)) {
        limparCaptcha(info.chave);
        captchaStore.delete(info.chave);
        return true;
      }

      const resolvidoLocal = await page.evaluate((t: string) => {
        if (t === 'hcaptcha') {
          const ta = document.querySelector('textarea[id*="h-captcha-response"]');
          if (ta && (ta as HTMLTextAreaElement).value.length > 3) return true;
        }
        if (t === 'recaptcha') {
          const ta = document.querySelector('textarea[id*="g-recaptcha-response"]');
          if (ta && (ta as HTMLTextAreaElement).value.length > 3) return true;
        }
        if (t === 'texto') {
          const inputs = document.querySelectorAll('input[type="text"], input:not([type])');
          for (const inp of inputs) {
            const name = (inp.getAttribute('name') || '').toLowerCase();
            const id = (inp.id || '').toLowerCase();
            const ph = (inp.getAttribute('placeholder') || '').toLowerCase();
            if (name.includes('captcha') || id.includes('captcha') || ph.includes('captcha')) {
              if ((inp as HTMLInputElement).value.length >= 3) return true;
            }
          }
        }
        return false;
      }, tipo!);

      if (resolvidoLocal) {
        limparCaptcha(info.chave);
        captchaStore.delete(info.chave);
        return true;
      }
    } catch {}

    await new Promise(r => setTimeout(r, 500));
  }

  limparCaptcha(info.chave);
  captchaStore.delete(info.chave);
  return false;
}
