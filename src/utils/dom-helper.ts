import type { Page } from 'puppeteer';
import fs from 'fs';
import path from 'path';

function isPdfValido(buf: Uint8Array): boolean {
  if (buf.length < 500) return false;
  // Header PDF: %PDF- seguido de versao (ex: %PDF-1.4)
  const header = String.fromCharCode(...buf.slice(0, 8));
  return header.startsWith('%PDF-');
}

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

export async function tentarBaixarPDF(page: Page, downloadDir?: string): Promise<Uint8Array | null> {
  const TIMEOUT = 28000;
  const start = Date.now();

  // ── 0. Prepara diretorio de download ──
  if (downloadDir && !fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true });
  }

  // ── 1. Intercepta window.print (abre dialogo "Salvar como PDF") ──
  await page.evaluate(() => {
    (window as any).__origPrint = window.print;
    window.print = () => {};
  }).catch(() => {});

  // ── 2. Configura CDP download behavior + listeners ──
  let cdpClient: import('puppeteer').CDPSession | null = null;
  if (downloadDir) {
    try {
      cdpClient = await page.target().createCDPSession();
      await cdpClient.send('Browser.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: downloadDir,
        eventsEnabled: true,
      });
    } catch { cdpClient = null; }
  }

  const timeoutRace = <T>(p: Promise<T>, ms: number): Promise<T | null> =>
    Promise.race([p, new Promise<T | null>(r => setTimeout(() => r(null), ms))]);

  let cdpGuid = '';
  const cdpPromise = new Promise<Uint8Array | null>((resolve) => {
    if (!cdpClient) { resolve(null); return; }
    const handler = (p: any) => {
      if (p.state === 'inProgress') cdpGuid = p.guid;
      if (p.state === 'completed' && p.guid === cdpGuid) {
        setTimeout(() => {
          try {
            const arquivos = fs.readdirSync(downloadDir!);
            let nome = '', mt = 0;
            for (const f of arquivos) {
              if (f.endsWith('.crdownload')) continue;
              const st = fs.statSync(path.join(downloadDir!, f));
              if (st.mtimeMs > mt) { mt = st.mtimeMs; nome = f; }
            }
            if (nome) {
              const buf = fs.readFileSync(path.join(downloadDir!, nome));
              if (buf.length > 500 && buf.slice(0, 5).toString() === '%PDF-') {
                resolve(new Uint8Array(buf)); return;
              }
            }
          } catch {}
          resolve(null);
        }, 1000);
      }
    };
    cdpClient.on('Browser.downloadProgress', handler);
  });

  // ── 3. Intercepta respostas HTTP application/pdf ──
  const httpPromise = new Promise<Uint8Array | null>((resolve) => {
    const handler = async (resp: import('puppeteer').HTTPResponse) => {
      const ct = resp.headers()['content-type'] || '';
      if (ct.includes('application/pdf') || ct.includes('application/octet-stream')) {
        try {
          const buf = await resp.buffer();
          if (buf.length > 500 && buf.slice(0, 5).toString() === '%PDF-') {
            resolve(new Uint8Array(buf));
          }
        } catch {}
      }
    };
    page.on('response', handler);
  });

  // ── 4. Detecta nova aba ──
  const tabPromise = new Promise<import('puppeteer').Page | null>((resolve) => {
    const handler = (target: import('puppeteer').Target) => {
      if (target.type() === 'page') {
        target.page().then(p => resolve(p)).catch(() => {});
      }
    };
    page.browser().on('targetcreated', handler);
  });

  // ── 5. Clica botoes de download ──
  for (const txt of DOWNLOAD_BUTTON_TEXTS) {
    const clicou = await page.evaluate((normTxt) => {
      const norm = normTxt.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      const botoes = document.querySelectorAll<HTMLElement>(
        'button, a.btn, a[class*="button"], input[type="submit"], input[type="button"], a[download]'
      );
      for (const b of botoes) {
        const content = (b.textContent?.trim() || (b as HTMLInputElement).value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        if (content.includes(norm)) {
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
    }, txt);
    if (clicou) break;
  }

  const tempoRestante = () => Math.max(1000, TIMEOUT - (Date.now() - start));

  // ── 6. Race: CDP event || HTTP response || nova aba (com timeout) ──
  const qualquer = await timeoutRace(
    Promise.race([
      cdpPromise,
      httpPromise,
      tabPromise.then(async (newPage) => {
        if (!newPage) return null;
        try {
          await newPage.waitForNetworkIdle({ timeout: 10000 }).catch(() => {});
          await new Promise(r => setTimeout(r, 1500));

          const pdf = await newPage.pdf({ format: 'A4', printBackground: true }).catch(() => null);
          if (pdf && pdf.length > 500 && pdf.slice(0, 5).toString() === '%PDF-') {
            return new Uint8Array(pdf);
          }

          const data = await newPage.evaluate(async () => {
            const links = [...document.querySelectorAll<HTMLElement>('embed[src], object[data], iframe[src], a[href]')]
              .map(e => (e as any).src || (e as any).data || (e as any).href || '')
              .filter(u => u.includes('.pdf'));
            if (links.length === 0 && (document.contentType?.includes('pdf') || window.location.href.endsWith('.pdf'))) {
              links.push(window.location.href);
            }
            for (const url of links) {
              try {
                const r = await fetch(url);
                const buf = await r.arrayBuffer();
                if (buf.byteLength > 500) return Array.from(new Uint8Array(buf));
              } catch {}
            }
            return null;
          }).catch(() => null);
          if (data && data.length > 0) return new Uint8Array(data);
        } finally {
          newPage.close().catch(() => {});
        }
        return null;
      }),
    ]),
    tempoRestante()
  );

  if (qualquer && qualquer.length > 500) {
    const header = String.fromCharCode(...qualquer.slice(0, 5));
    if (header === '%PDF-') return qualquer;
  }

  // ── 7. Aguarda render e tenta embed/iframe na pagina atual ──
  await new Promise(r => setTimeout(r, 2000));
  try {
    const data = await page.evaluate(async () => {
      const urls = [...document.querySelectorAll<HTMLElement>('embed[src], object[data], iframe[src], a[href]')]
        .map(e => (e as any).src || (e as any).data || (e as any).href || '')
        .filter(u => u.includes('.pdf'));
      for (const url of urls) {
        try {
          const r = await fetch(url);
          const buf = await r.arrayBuffer();
          if (buf.byteLength > 500) return Array.from(new Uint8Array(buf));
        } catch {}
      }
      return null;
    });
    if (data && data.length > 0) {
      const buf = new Uint8Array(data);
      if (buf.length > 500 && String.fromCharCode(...buf.slice(0, 5)) === '%PDF-') return buf;
    }
  } catch {}

  // ── 8. FALLBACK UNIVERSAL: page.pdf() ──
  try {
    const pdf = await page.pdf({ format: 'A4', printBackground: true });
    if (pdf.length > 500 && pdf.slice(0, 5).toString() === '%PDF-') {
      console.log(`[PDF] Capturado via page.pdf(): ${pdf.length} bytes`);
      return new Uint8Array(pdf);
    }
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
      if (content.includes(txtNorm)) {
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
  }, texto);
}

export async function preencherInputPorLabelTexto(
  page: Page,
  labelTexto: string,
  valor: string,
): Promise<boolean> {
  return page.evaluate((lbl, val) => {
    const textoBusca = lbl.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    const todos = document.querySelectorAll('label, span, td, div, p, strong, b, th');
    for (const el of todos) {
      const txt = (el.textContent?.trim() || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      if (!txt.includes(textoBusca)) continue;

      // Sobe no DOM ate achar container com input
      let container: HTMLElement | null = el as HTMLElement;
      while (container && container !== document.body) {
        const inp = container.querySelector<HTMLInputElement>(
          'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"])'
        );
        if (inp) {
          const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
          if (setter) setter.call(inp, val);
          inp.dispatchEvent(new Event('input', { bubbles: true }));
          inp.dispatchEvent(new Event('change', { bubbles: true }));
          inp.dispatchEvent(new Event('blur', { bubbles: true }));
          return true;
        }
        container = container.parentElement;
      }
    }
    return false;
  }, labelTexto, valor);
}

export async function prepararCapturaPDFViaCDP(
  page: Page,
  downloadDir: string
): Promise<void> {
  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true });
  }
  const client = await page.target().createCDPSession();
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: downloadDir,
  });
}

export async function aguardarDownloadCDP(
  downloadDir: string,
  opts: { timeoutMs?: number; pollMs?: number } = {}
): Promise<string | null> {
  const timeoutMs = opts.timeoutMs ?? 20000;
  const pollMs = opts.pollMs ?? 300;
  const start = Date.now();
  const arquivosAntes = new Set(
    fs.existsSync(downloadDir) ? fs.readdirSync(downloadDir) : []
  );

  while (Date.now() - start < timeoutMs) {
    if (fs.existsSync(downloadDir)) {
      const arquivosAgora = fs.readdirSync(downloadDir);
      const novo = arquivosAgora.find(
        (f) => !arquivosAntes.has(f) && !f.endsWith('.crdownload')
      );
      if (novo) {
        const caminhoCompleto = path.join(downloadDir, novo);
        await new Promise((r) => setTimeout(r, 500));
        return caminhoCompleto;
      }
    }
    await new Promise((r) => setTimeout(r, pollMs));
  }
  return null;
}

// ============================================================
// NOVA captura via CDP Browser.downloadProgress (eventos reais)
// Muito mais confiavel que polling de arquivos
// ============================================================
export async function configurarCapturaDownloadViaCDP(
  page: Page,
  downloadDir: string,
  timeoutMs: number = 30000
): Promise<{ promise: Promise<Uint8Array | null>; cleanup: () => void }> {
  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true });
  }

  const client = await page.target().createCDPSession();

  await client.send('Browser.setDownloadBehavior', {
    behavior: 'allowAndName',
    downloadPath: downloadDir,
    eventsEnabled: true,
  });

  let resolvePromise: (val: Uint8Array | null) => void;
  const downloadPromise = new Promise<Uint8Array | null>((resolve) => {
    resolvePromise = resolve;
  });

  let downloadGuid = '';
  let resolved = false;

  // Timeout: se nenhum download completar, resolve null
  const timeout = setTimeout(() => {
    if (!resolved) { resolved = true; resolvePromise(null); }
  }, timeoutMs);

  const onProgress = (params: any) => {
    const { guid, state, receivedBytes: rb, totalBytes } = params;

    if (state === 'inProgress') {
      downloadGuid = guid;
    }

    if (state === 'completed' && guid === downloadGuid && !resolved) {
      resolved = true;
      clearTimeout(timeout);
      // Aguarda um pouco para o Chrome finalizar a escrita
      setTimeout(() => {
        try {
          const arquivos = fs.readdirSync(downloadDir);
          let maisRecente: string | null = null;
          let maiorTimestamp = 0;
          for (const f of arquivos) {
            if (f.endsWith('.crdownload')) continue;
            const stat = fs.statSync(path.join(downloadDir, f));
            if (stat.mtimeMs > maiorTimestamp) {
              maiorTimestamp = stat.mtimeMs;
              maisRecente = f;
            }
          }
          if (maisRecente) {
            const filePath = path.join(downloadDir, maisRecente);
            const buf = fs.readFileSync(filePath);
            // Valida header PDF
            if (buf.length > 500 && buf.slice(0, 5).toString() === '%PDF-') {
              resolvePromise(new Uint8Array(buf));
              return;
            }
          }
        } catch {}
        resolvePromise(null);
      }, 1000);
    }

    if (state === 'canceled' && !resolved) {
      resolved = true;
      clearTimeout(timeout);
      resolvePromise(null);
    }
  };

  client.on('Browser.downloadProgress', onProgress);

  const cleanup = () => {
    client.off('Browser.downloadProgress', onProgress);
    client.detach().catch(() => {});
  };

  return { promise: downloadPromise, cleanup };
}

// ============================================================
// Intercepta respostas HTTP com Content-Type: application/pdf
// Captura o PDF real servido pelo site, independente de ser
// download, nova aba, iframe ou blob
// ============================================================
export function interceptarRespostaPDF(
  page: Page,
  timeoutMs: number = 30000
): Promise<Uint8Array | null> {
  return new Promise((resolve) => {
    const respostas: Array<Uint8Array> = [];

    const timeout = setTimeout(() => {
      page.off('response', handler);
      // Retorna o primeiro PDF capturado
      resolve(respostas.length > 0 ? respostas[0] : null);
    }, timeoutMs);

    const handler = async (response: import('puppeteer').HTTPResponse) => {
      const ct = response.headers()['content-type'] || '';
      const cd = response.headers()['content-disposition'] || '';
      const isPdf = ct.includes('application/pdf') || ct.includes('application/octet-stream');
      const isAttachment = cd.includes('attachment');

      if (isPdf || (isAttachment && (ct.includes('pdf') || response.url().includes('.pdf')))) {
        try {
          const buf = await response.buffer();
          const arr = new Uint8Array(buf);
          if (isPdfValido(arr)) {
            respostas.push(arr);
            clearTimeout(timeout);
            page.off('response', handler);
            resolve(arr);
          }
        } catch {}
      }
    };

    page.on('response', handler);
  });
}

export async function preencherCampoRobusto(
  page: Page,
  selector: string,
  valor: string,
  maskFnName?: string
): Promise<boolean> {
  const el = await page.$(selector);
  if (!el) return false;

  await el.click({ clickCount: 3 });
  await page.keyboard.press('Backspace').catch(() => {});
  await page.keyboard.type(valor, { delay: 60 });

  let valorAtual = await page.evaluate(
    (e) => (e as HTMLInputElement).value,
    el
  );
  const digitosEsperados = valor.replace(/\D/g, '');
  if (
    valorAtual &&
    digitosEsperados &&
    valorAtual.replace(/\D/g, '').length >= Math.min(3, digitosEsperados.length)
  ) {
    return true;
  }

  await page.evaluate(
    (e, val, maskFn) => {
      const input = e as HTMLInputElement;
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )!.set!;
      setter.call(input, val);
      ['keydown', 'input', 'keyup', 'change', 'blur'].forEach((evt) =>
        input.dispatchEvent(new Event(evt, { bubbles: true }))
      );
      if (maskFn && typeof (window as any)[maskFn] === 'function') {
        (window as any)[maskFn](input);
      }
    },
    el,
    valor,
    maskFnName
  );

  valorAtual = await page.evaluate((e) => (e as HTMLInputElement).value, el);
  return !!valorAtual && valorAtual.trim() !== '';
}

export async function encontrarPorSufixoId(
  page: Page,
  sufixo: string,
  tag = '*'
): Promise<string | null> {
  return page.evaluate(
    (suf: string, t: string) => {
      const els = Array.from(document.querySelectorAll(t));
      const found = els.find((el) => el.id && el.id.endsWith(suf));
      return found ? `#${CSS.escape(found.id)}` : null;
    },
    sufixo,
    tag
  );
}
