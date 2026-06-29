import type { Page } from 'puppeteer';

export async function injectFillHelper(page: Page): Promise<void> {
  await page.evaluate(() => {
    (window as any).__fillInput = function (el: HTMLInputElement, value: string) {
      const proto = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
      const setter = proto?.set;
      if (setter) {
        setter.call(el, value);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    };
  });
}

export async function preencherInputRapido(page: Page, selector: string, valor: string): Promise<boolean> {
  const el = await page.$(selector);
  if (!el) return false;
  await page.evaluate((s: string) => {
    const e = document.querySelector<HTMLInputElement>(s);
    if (e) { (e as HTMLInputElement).value = ''; e.focus(); }
  }, selector);
  await new Promise(r => setTimeout(r, 100));
  await page.keyboard.type(valor, { delay: 6 });
  return true;
}

const DOWNLOAD_BUTTON_TEXTS = [
  'imprimir', 'baixar', 'download', 'gerar pdf', 'exportar',
  'emitir', 'obter certidão', 'visualizar', 'abrir pdf',
];

export async function tentarBaixarPDF(page: Page): Promise<Uint8Array | null> {
  // Nível 1: clicar em botão de download e capturar nova aba/página
  try {
    const newTargetPromise = new Promise<import('puppeteer').Target | null>((resolve) => {
      const handler = (target: import('puppeteer').Target) => {
        if (target.type() === 'page') resolve(target);
      };
      page.browser().on('targetcreated', handler);
      setTimeout(() => {
        page.browser().off('targetcreated', handler);
        resolve(null);
      }, 10000);
    });

    for (const txt of DOWNLOAD_BUTTON_TEXTS) {
      const clicked = await page.evaluate((t: string) => {
        const norm = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        const botoes = document.querySelectorAll<HTMLElement>(
          'button, a.btn, a[class*="button"], input[type="submit"], input[type="button"], a[download]'
        );
        for (const b of botoes) {
          const content = (b.textContent?.trim() || (b as HTMLInputElement).value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
          if (content.includes(norm)) { b.click(); return true; }
        }
        return false;
      }, txt);
      if (clicked) {
        const target = await newTargetPromise;
        if (target) {
          const newPage = await target.page();
          if (newPage) {
            await newPage.waitForNetworkIdle({ timeout: 15000 }).catch(() => {});
            const pdfBuf = await newPage.pdf({ format: 'A4', printBackground: true });
            await newPage.close().catch(() => {});
            if (pdfBuf.length > 1000) return pdfBuf;
          }
        }
        await page.waitForNetworkIdle({ timeout: 8000 }).catch(() => {});
      }
    }
  } catch {}

  // Nível 2: buscar embed/object/iframe/link com PDF e fazer fetch
  try {
    const pdfData = await page.evaluate(async () => {
      const candidates: string[] = [];
      for (const el of document.querySelectorAll<HTMLElement>('embed[src*=".pdf"], object[data*=".pdf"], iframe[src*=".pdf"], a[href*=".pdf"]')) {
        const src = (el as any).src || (el as any).data || (el as any).href;
        if (src) candidates.push(src);
      }
      for (const url of candidates) {
        try {
          const r = await fetch(url);
          const buf = await r.arrayBuffer();
          if (buf.byteLength > 1000) return Array.from(new Uint8Array(buf));
        } catch {}
      }
      return null;
    });
    if (pdfData) return new Uint8Array(pdfData);
  } catch {}

  // Nível 3: fallback — capturar tela como PDF
  try {
    const buf = await page.pdf({ format: 'A4', printBackground: true });
    if (buf.length > 1000) return buf;
  } catch {}
  return null;
}

export async function aceitarCookies(page: Page): Promise<boolean> {
  const clicked = await page.evaluate(() => {
    const textos = [
      'aceitar', 'aceitar cookies', 'aceitar todos', 'ok', 'continuar',
      'accept', 'accept all', 'concordo', 'entendi', 'fechar', 'x',
    ];
    const botoes = document.querySelectorAll<HTMLElement>(
      'button, a, div[role="button"], span[role="button"]'
    );
    for (const b of botoes) {
      const txt = (b.textContent?.trim() || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      if (textos.some(t => txt.includes(t))) {
        b.click();
        return true;
      }
    }
    return false;
  });
  if (clicked) await new Promise(r => setTimeout(r, 600));
  return clicked;
}

export async function clicarBotaoPorTexto(page: Page, texto: string): Promise<boolean> {
  return page.evaluate((txt) => {
    const txtNorm = txt.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const botoes = document.querySelectorAll<HTMLElement>('button, a.btn, a[class*="button"], input[type="submit"], input[type="button"]');
    for (const b of botoes) {
      const content = (b.textContent?.trim() || (b as HTMLInputElement).value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      if (content.includes(txtNorm)) { b.click(); return true; }
    }
    return false;
  }, texto);
}
