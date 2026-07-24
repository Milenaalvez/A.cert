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
  const start = Date.now();

  // ── 0. Prepara diretorio de download ──
  if (downloadDir && !fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true });
  }

  // ── 1. Intercepta window.print ──
  await page.evaluate(() => {
    (window as any).__origPrint = window.print;
    window.print = () => {};
  }).catch(() => {});

  // ── 2. page.pdf() como PRIMEIRA tentativa (captura o que esta na tela) ──
  await new Promise(r => setTimeout(r, 1500));
  try {
    const pdf = await page.pdf({ format: 'A4', printBackground: true });
    if (pdf.length > 500 && pdf.slice(0, 5).toString() === '%PDF-') {
      console.log(`[PDF] Capturado via page.pdf() direto: ${pdf.length} bytes`);
      return new Uint8Array(pdf);
    }
  } catch (e: any) {
    console.log(`[PDF] page.pdf() direto falhou: ${e.message}`);
  }

  // ── 3. Se page.pdf() deu pouco conteudo, tenta recarregar embed/iframe ──
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
      if (buf.length > 500 && String.fromCharCode(...buf.slice(0, 5)) === '%PDF-') {
        console.log(`[PDF] Capturado via embed fetch: ${buf.length} bytes`);
        return buf;
      }
    }
  } catch {}

  // ── 4. Prepara CDP download behavior ──
  let cdpClient: import('puppeteer').CDPSession | null = null;
  if (downloadDir) {
    try {
      cdpClient = await page.target().createCDPSession();
      await cdpClient.send('Browser.setDownloadBehavior', {
        behavior: 'allow', downloadPath: downloadDir, eventsEnabled: true,
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

  const httpPromise = new Promise<Uint8Array | null>((resolve) => {
    const handler = async (resp: import('puppeteer').HTTPResponse) => {
      const ct = resp.headers()['content-type'] || '';
      if (ct.includes('application/pdf') || ct.includes('application/octet-stream')) {
        try {
          const buf = await resp.buffer();
          if (buf.length > 500 && buf.slice(0, 5).toString() === '%PDF-') resolve(new Uint8Array(buf));
        } catch {}
      }
    };
    page.on('response', handler);
  });

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

  // ── 6. Race: CDP || HTTP || nova aba (timeout 15s) ──
  const qualquer = await timeoutRace(
    Promise.race([
      cdpPromise,
      httpPromise,
      tabPromise.then(async (newPage) => {
        if (!newPage) return null;
        try {
          await newPage.waitForNetworkIdle({ timeout: 8000 }).catch(() => {});
          await new Promise(r => setTimeout(r, 1000));
          const pdf = await newPage.pdf({ format: 'A4', printBackground: true }).catch(() => null);
          if (pdf && pdf.length > 500 && pdf.slice(0, 5).toString() === '%PDF-') return new Uint8Array(pdf);
        } finally { newPage.close().catch(() => {}); }
        return null;
      }),
    ]),
    15000
  );

  if (qualquer && qualquer.length > 500) {
    const header = String.fromCharCode(...qualquer.slice(0, 5));
    if (header === '%PDF-') return qualquer;
  }

  // ── 7. page.pdf() tentativa final apos clique ──
  await new Promise(r => setTimeout(r, 2000));
  try {
    const pdf = await page.pdf({ format: 'A4', printBackground: true });
    if (pdf.length > 500 && pdf.slice(0, 5).toString() === '%PDF-') {
      console.log(`[PDF] Capturado via page.pdf() final: ${pdf.length} bytes`);
      return new Uint8Array(pdf);
    }
  } catch (e: any) {
    console.log(`[PDF] page.pdf() final falhou: ${e.message}`);
  }

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
// Setup de captura de download ANTES do clique disparador
// Deve ser chamado antes de qualquer acao que dispare download
// Retorna promise + cleanup - a promise resolve com o primeiro
// PDF capturado via CDP, HTTP intercept ou nova aba
// ============================================================
export function setupDownloadCapture(
  page: Page,
  downloadDir: string,
  timeoutMs: number = 45000
): { promise: Promise<Uint8Array | null>; cleanup: () => void } {
  if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true });

  let resolvePromise: (val: Uint8Array | null) => void;
  let resolved = false;
  const promise = new Promise<Uint8Array | null>((resolve) => { resolvePromise = resolve; });

  const cleanups: Array<() => void> = [];

  const resolveOnce = (val: Uint8Array | null) => {
    if (!resolved) { resolved = true; resolvePromise(val); }
  };

  const timeout = setTimeout(() => resolveOnce(null), timeoutMs);
  cleanups.push(() => clearTimeout(timeout));

  // ── 1. CDP: set download behavior + progress events ──
  page.target().createCDPSession().then(async client => {
    try {
      await client.send('Browser.setDownloadBehavior', {
        behavior: 'allowAndName',
        downloadPath: downloadDir,
        eventsEnabled: true,
      });
    } catch {}

    let cdpGuid = '';
    const onProgress = (params: any) => {
      const { guid, state } = params;
      if (state === 'inProgress') cdpGuid = guid;
      if (state === 'completed' && guid === cdpGuid && !resolved) {
        setTimeout(() => {
          try {
            const arquivos = fs.readdirSync(downloadDir);
            let nome = '', mt = 0;
            for (const f of arquivos) {
              if (f.endsWith('.crdownload')) continue;
              const st = fs.statSync(path.join(downloadDir, f));
              if (st.mtimeMs > mt) { mt = st.mtimeMs; nome = f; }
            }
            if (nome) {
              const buf = fs.readFileSync(path.join(downloadDir, nome));
              if (buf.length > 500 && buf.slice(0, 5).toString() === '%PDF-') {
                resolveOnce(new Uint8Array(buf)); return;
              }
            }
          } catch {}
          resolveOnce(null);
        }, 1000);
      }
      if (state === 'canceled' && !resolved) resolveOnce(null);
    };
    client.on('Browser.downloadProgress', onProgress);
    cleanups.push(() => {
      client.off('Browser.downloadProgress', onProgress);
      client.detach().catch(() => {});
    });
  }).catch(() => {});

  // ── 2. HTTP response intercept ──
  const httpHandler = async (resp: import('puppeteer').HTTPResponse) => {
    if (resolved) return;
    const ct = resp.headers()['content-type'] || '';
    const cd = resp.headers()['content-disposition'] || '';
    const isPdf = ct.includes('application/pdf') || ct.includes('application/octet-stream');
    if (isPdf || (cd.includes('attachment') && (ct.includes('pdf') || resp.url().includes('.pdf')))) {
      try {
        const buf = await resp.buffer();
        if (buf.length > 500 && buf.slice(0, 5).toString() === '%PDF-') {
          resolveOnce(new Uint8Array(buf));
        }
      } catch {}
    }
  };
  page.on('response', httpHandler);
  cleanups.push(() => page.off('response', httpHandler));

  // ── 3. New tab listener ──
  const browser = page.browser();
  const tabHandler = (target: import('puppeteer').Target) => {
    if (resolved) return;
    if (target.type() === 'page') {
      target.page().then(async p => {
        if (!p) return;
        try {
          await p.waitForNetworkIdle({ timeout: 8000 }).catch(() => {});
          await new Promise(r => setTimeout(r, 1000));
          const pdf = await p.pdf({ format: 'A4', printBackground: true }).catch(() => null);
          if (pdf && pdf.length > 500 && pdf.slice(0, 5).toString() === '%PDF-') {
            resolveOnce(new Uint8Array(pdf));
          }
        } finally { p.close().catch(() => {}); }
      }).catch(() => {});
    }
  };
  browser.on('targetcreated', tabHandler);
  cleanups.push(() => browser.off('targetcreated', tabHandler));

  const cleanup = () => { cleanups.forEach(fn => { try { fn(); } catch {} }); };

  return { promise, cleanup };
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
