import type { Page } from 'puppeteer';

export type CaptchaType = 'hcaptcha' | 'recaptcha' | 'texto' | null;

export async function detectarCaptcha(page: Page): Promise<CaptchaType> {
  await new Promise(r => setTimeout(r, 100));

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
      if (name.includes('captcha') || id.includes('captcha') || placeholder.includes('captcha')
          || name.includes('resposta') || id.includes('resposta') || placeholder.includes('resposta'))
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
  let urlInicial = '';
  try { urlInicial = page.url(); } catch {}
  let ultimoValor = '';
  let contagemEstavel = 0;

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
          const inputs = Array.from(document.querySelectorAll<HTMLInputElement>(
            'input[type="text"]:not([disabled]), input:not([type]):not([disabled])'
          ));

          // 1) Campo nomeado "captcha" ou "resposta" preenchido com 4+ caracteres
          for (const inp of inputs) {
            const name = (inp.getAttribute('name') || '').toLowerCase();
            const id = (inp.id || '').toLowerCase();
            const ph = (inp.getAttribute('placeholder') || '').toLowerCase();
            if ((name.includes('captcha') || id.includes('captcha') || ph.includes('captcha')
                || name.includes('resposta') || id.includes('resposta') || ph.includes('resposta'))
              && inp.value.length >= 4) return 'filled';
          }

          // 2) Campo visivel proximo a imagem de captcha: valor com 4+ caracteres
          //    (exclui campos de CPF/CNPJ/nome que podem estar no mesmo form)
          const img = document.querySelector<HTMLElement>(
            'img[src*="captcha"], img[alt*="captcha"], img[alt*="seguran"], img[alt*="codigo"], img[src*="securimage"], img[src*="kcaptcha"]'
          );
          if (img && img.offsetParent !== null) {
            const ir = img.getBoundingClientRect();
            for (const inp of inputs) {
              const name = (inp.getAttribute('name') || '').toLowerCase();
              const id = (inp.id || '').toLowerCase();
              const ph = (inp.getAttribute('placeholder') || '').toLowerCase();
              const isNonCaptcha = id.includes('cpf') || id.includes('cnpj') || name.includes('cpf')
                || name.includes('cnpj') || id.includes('nome') || name.includes('nome')
                || id.includes('email') || name.includes('email');
              if (!isNonCaptcha && inp.value.length >= 4 && inp.offsetParent !== null) {
                const pr = inp.getBoundingClientRect();
                if (Math.abs(pr.top - ir.top) < 600 && Math.abs(pr.left - ir.left) < 900) {
                  return 'filled';
                }
              }
            }
          }

          // 3) Imagem captcha desapareceu → pagina avancou
          //    Só dispara se existe input de captcha visivel (form ainda ativo)
          const imgSumiu = !document.querySelector(
            'img[src*="captcha"], img[alt*="captcha"], img[alt*="seguran"], img[alt*="codigo"], img[src*="securimage"], img[src*="kcaptcha"]'
          );
          const temInputCaptchaAtivo = inputs.some(inp => {
            const name = (inp.getAttribute('name') || '').toLowerCase();
            const id = (inp.id || '').toLowerCase();
            const ph = (inp.getAttribute('placeholder') || '').toLowerCase();
            return (name.includes('captcha') || id.includes('captcha') || ph.includes('captcha')
                || name.includes('resposta') || id.includes('resposta') || ph.includes('resposta'))
              && inp.offsetParent !== null;
          });
          if (imgSumiu && !temInputCaptchaAtivo) {
            const body = (document.body?.textContent || '').toLowerCase();
            if (body.includes('certidão') || body.includes('certidao')
              || body.includes('protocolo') || body.includes('nada consta')
              || body.includes('download') || body.includes('pdf')) {
              return 'done';
            }
          }

          // 4) Qualquer input visivel alem do CPF foi preenchido com 4+ caracteres apos submit
          const temInputCaptcha = inputs.some(inp => {
            const id = (inp.id || '').toLowerCase();
            if (id.includes('cpf') || id.includes('cnpj')) return false;
            return inp.value.length >= 4 && inp.offsetParent !== null;
          });

          if (temInputCaptcha) {
            const textos = (document.body?.textContent || '').toLowerCase();
            if (textos.includes('certidão') || textos.includes('protocolo') || textos.includes('emitida')) {
              return 'done';
            }
          }

          // 5) Captcha com menos de 4 chars? Retorna valor atual para tracking de estabilidade
          for (const inp of inputs) {
            const name = (inp.getAttribute('name') || '').toLowerCase();
            const id = (inp.id || '').toLowerCase();
            const ph = (inp.getAttribute('placeholder') || '').toLowerCase();
            if (name.includes('captcha') || id.includes('captcha') || ph.includes('captcha')
                || name.includes('resposta') || id.includes('resposta') || ph.includes('resposta')) {
              return inp.value;
            }
          }

          return false;
        }
        return false;
      }, tipo);

      if (resolvido === 'filled' || resolvido === 'done') {
        return true;
      }

      // Estabilidade: se o valor do captcha parou de mudar por 3 segundos e tem 3+ chars, resolve
      if (typeof resolvido === 'string' && resolvido.length >= 3) {
        if (resolvido === ultimoValor) {
          contagemEstavel++;
          if (contagemEstavel >= 3) {
            console.log(`[CAPTCHA] Valor estavel: "${resolvido}" — resolvido`);
            return true;
          }
        } else {
          ultimoValor = resolvido;
          contagemEstavel = 0;
        }
      }

      // Fallback 6: URL mudou
      try {
        const atual = page.url();
        if (urlInicial && atual !== urlInicial && !atual.includes('error') && !atual.includes('block')) {
          return true;
        }
      } catch {}
    } catch {
      // Page may have navigated or frame detached; continue polling
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  console.log(`[CAPTCHA] Timeout apos ${timeoutMs}ms — nao resolvido`);
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
    await new Promise(r => setTimeout(r, 200));
  }

  return null;
}
