import type { Page } from 'puppeteer';

export type CaptchaType = 'hcaptcha' | 'recaptcha' | 'texto' | null;

export async function detectarCaptcha(page: Page): Promise<CaptchaType> {
  await new Promise(r => setTimeout(r, 500));

  const tipo = await page.evaluate(() => {
    if (document.querySelector('iframe[src*="hcaptcha"], div[class*="h-captcha"], textarea[id*="h-captcha-response"]'))
      return 'hcaptcha';
    if (document.querySelector('.g-recaptcha, iframe[src*="recaptcha"], div[class*="recaptcha"], textarea[id*="g-recaptcha-response"]'))
      return 'recaptcha';
    const imgs = document.querySelectorAll('img');
    for (const img of imgs) {
      const src = (img.getAttribute('src') || '').toLowerCase();
      const alt = (img.getAttribute('alt') || '').toLowerCase();
      if (src.includes('captcha') || alt.includes('captcha') || alt.includes('seguran') || alt.includes('codigo'))
        return 'texto';
      if (src.includes('/captcha/') || src.includes('securimage') || src.includes('kcaptcha') || src.includes('simple-php-captcha'))
        return 'texto';
    }
    // Frases comuns de CAPTCHA texto
    const textos = document.querySelectorAll('span, p, label, div, td, strong, b');
    for (const el of textos) {
      const t = (el.textContent?.trim() || '').toLowerCase();
      if (t.includes('digite os caracteres') || t.includes('caracteres exibidos') || t.includes('ouça as palavras') || t.includes('digite o codigo') || t.includes('digite as letras')) {
        return 'texto';
      }
    }
    const inputs = document.querySelectorAll('input[type="text"], input:not([type])');
    for (const input of inputs) {
      const name = (input.getAttribute('name') || '').toLowerCase();
      const id = (input.id || '').toLowerCase();
      const placeholder = (input.getAttribute('placeholder') || '').toLowerCase();
      if (name.includes('captcha') || id.includes('captcha') || placeholder.includes('captcha'))
        return 'texto';
    }
    return null;
  });

  return tipo;
}

export async function scrollAteCaptcha(page: Page, tipo: CaptchaType): Promise<void> {
  await page.evaluate((t) => {
    if (t === 'hcaptcha') {
      const el = document.querySelector('iframe[src*="hcaptcha"], div[class*="h-captcha"]');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (t === 'recaptcha') {
      const el = document.querySelector('iframe[src*="recaptcha"], div[class*="g-recaptcha"], iframe[title*="recaptcha"]');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (t === 'texto') {
      // Rola ate a imagem do captcha ou input de texto
      const img = document.querySelector<HTMLElement>('img[src*="captcha"], img[alt*="captcha"], img[alt*="seguran"], img[alt*="codigo"]');
      if (img) img.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const inp = document.querySelector<HTMLInputElement>('input[name*="captcha"], input[id*="captcha"], input[placeholder*="captcha"], input[name*="Captcha"], input[id*="Captcha"]');
      if (inp) inp.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, tipo);
}

export async function clicarCaptchaCheckbox(page: Page, tipo: Exclude<CaptchaType, null>): Promise<void> {
  await page.evaluate((t) => {
    if (t === 'hcaptcha') {
      const div = document.querySelector<HTMLElement>('div[class*="h-captcha"]');
      if (div) { div.click(); return; }
      const iframe = document.querySelector<HTMLIFrameElement>('iframe[src*="hcaptcha"]');
      if (iframe) {
        const rect = iframe.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const evt = new MouseEvent('click', { bubbles: true, clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 });
          iframe.dispatchEvent(evt);
        }
      }
    }
    if (t === 'recaptcha') {
      const div = document.querySelector<HTMLElement>('div[class*="g-recaptcha"]');
      if (div) { div.click(); return; }
      const iframe = document.querySelector<HTMLIFrameElement>('iframe[title*="recaptcha"], iframe[src*="recaptcha"]');
      if (iframe) {
        const rect = iframe.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const evt = new MouseEvent('click', { bubbles: true, clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 });
          iframe.dispatchEvent(evt);
        }
      }
    }
  }, tipo);
}

export async function esperarCaptchaInterativo(
  page: Page,
  tipo: Exclude<CaptchaType, null>,
  timeoutMs = 180000,
): Promise<boolean> {
  const inicio = Date.now();
  while (Date.now() - inicio < timeoutMs) {
    try {
      if (page.isClosed()) return false;
      const resolvido = await page.evaluate((t: string) => {
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
      }, tipo);
      if (resolvido) return true;
    } catch {
      // Page may have navigated or frame detached; continue polling
    }
    await new Promise(r => setTimeout(r, 500));
  }
  return false;
}

export async function aguardarCaptchaAposSubmit(
  page: Page,
  timeoutMs = 15000,
): Promise<CaptchaType> {
  const inicio = Date.now();
  let ultimaUrl = page.url();

  while (Date.now() - inicio < timeoutMs) {
    const urlAtual = page.url();
    if (urlAtual !== ultimaUrl) {
      console.log(`[CAPTCHA] URL: ${urlAtual.slice(0, 100)}`);
      ultimaUrl = urlAtual;
      await new Promise(r => setTimeout(r, 1000));
    }

    const tipo = await page.evaluate(() => {
      if (document.querySelector('iframe[src*="hcaptcha"], textarea[id*="h-captcha-response"]')) return 'hcaptcha';
      if (document.querySelector('iframe[title*="recaptcha"], iframe[src*="recaptcha"], textarea[id*="g-recaptcha-response"]')) return 'recaptcha';
      const imgs = document.querySelectorAll('img');
      for (const img of imgs) {
        const s = (img.getAttribute('src') || '').toLowerCase();
        const a = (img.getAttribute('alt') || '').toLowerCase();
        if (s.includes('captcha') || a.includes('captcha') || a.includes('segurança')) return 'texto';
      }
      return null;
    });

    if (tipo) {
      console.log(`[CAPTCHA] Detectado: ${tipo}`);
      return tipo;
    }
    await new Promise(r => setTimeout(r, 500));
  }

  return null;
}
