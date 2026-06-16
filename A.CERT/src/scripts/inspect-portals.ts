import puppeteer from 'puppeteer';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', '..', 'tmp');
mkdirSync(OUT, { recursive: true });

const PORTAS = [
  {
    nome: 'receita-federal',
    url: 'https://servicos.receitafederal.gov.br/servico/certidoes/',
  },
  {
    nome: 'trf1',
    url: 'https://certidao-unificada.cjf.jus.br/#/solicitacao-certidao',
  },
  {
    nome: 'tjdft',
    url: 'https://cnc.tjdft.jus.br/solicitacao-externa',
  },
];

async function inspect() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  for (const portal of PORTAS) {
    console.log(`\n========== ${portal.nome} ==========`);
    const page = await browser.newPage();
    page.setViewport({ width: 1280, height: 900 });

    try {
      const consoleLogs: string[] = [];
      page.on('console', msg => consoleLogs.push(msg.text()));

      await page.goto(portal.url, { waitUntil: 'networkidle2', timeout: 60000 });
      // Extra wait for SPAs
      await new Promise(r => setTimeout(r, 5000));

      // Wait for content to stabilize
      await page.evaluate(() => document.title).catch(() => {});
      console.log(`Title: ${await page.title()}`);
      console.log(`URL final: ${page.url()}`);

      await page.screenshot({ path: join(OUT, `${portal.nome}.png`), fullPage: false });
      console.log(`Screenshot salva: tmp/${portal.nome}.png`);

      const html = await page.content();
      writeFileSync(join(OUT, `${portal.nome}.html`), html, 'utf-8');
      console.log(`HTML salvo: tmp/${portal.nome}.html (${html.length} chars)`);

      // Check for frames/iframes
      const framesInfo = await page.evaluate(() => {
        const frames = document.querySelectorAll('frame, iframe');
        return Array.from(frames).map(f => ({
          tag: f.tagName.toLowerCase(),
          id: f.id,
          name: f.getAttribute('name') || '',
          src: (f as HTMLIFrameElement).src?.slice(0, 120),
        }));
      });
      console.log(`\nFrames/iframes: ${JSON.stringify(framesInfo, null, 2)}`);

      // Inspect inside each iframe
      for (const f of page.mainFrame().childFrames()) {
        try {
          const url = f.url();
          console.log(`  Child frame URL: ${url.slice(0, 120)}`);
          const frameInputs = await f.evaluate(() => {
            const all = document.querySelectorAll('input, select, textarea, button, a, label');
            return Array.from(all).slice(0, 40).map(el => {
              const tag = el.tagName.toLowerCase();
              const attr: Record<string, string> = {};
              for (const a of el.attributes) { attr[a.name] = a.value; }
              const text = (el as HTMLElement).textContent?.trim().slice(0, 80);
              return { tag, attr, text };
            });
          });
          if (frameInputs.length > 0) {
            console.log(`  Frame elements (${frameInputs.length}):`);
            for (const inp of frameInputs) {
              console.log(`    ${inp.tag} | id=${inp.attr.id || '-'} | name=${inp.attr.name || '-'} | placeholder=${inp.attr.placeholder || '-'} | type=${inp.attr.type || '-'} | text="${inp.text || ''}"`);
            }
          }
        } catch { /* cross-origin frame */ }
      }

      // Try to find forms in any frame
      const allInputs = await page.evaluate(() => {
        const all = document.querySelectorAll('input, select, textarea, button, a, label');
        return Array.from(all).slice(0, 80).map(el => {
          const tag = el.tagName.toLowerCase();
          const attr: Record<string, string> = {};
          for (const a of el.attributes) { attr[a.name] = a.value; }
          const text = (el as HTMLElement).textContent?.trim().slice(0, 100);
          return { tag, attr, text };
        });
      });

      console.log(`\nCampos encontrados (${allInputs.length}):`);
      for (const inp of allInputs) {
        const linha = `${inp.tag} | id=${inp.attr.id || '-'} | name=${inp.attr.name || '-'} | placeholder=${inp.attr.placeholder || '-'} | type=${inp.attr.type || '-'} | class=${(inp.attr.class || '').slice(0, 30)} | href=${(inp.attr.href || '').slice(0, 60)} | text="${inp.text || ''}"`;
        console.log(`  ${linha}`);
      }

      // Procura por CAPTCHA
      const captchaEls = await page.evaluate(() => {
        const results: string[] = [];
        document.querySelectorAll('img').forEach(img => {
          const src = img.getAttribute('src') || '';
          const alt = img.getAttribute('alt') || '';
          const id = img.id || '';
          const cls = img.className || '';
          if (/captcha/i.test(src + alt + id + cls)) {
            results.push(`img: src=${src} alt=${alt} id=${id} class=${cls}`);
          }
        });
        document.querySelectorAll('iframe').forEach(ifr => {
          const src = ifr.getAttribute('src') || '';
          if (/recaptcha|captcha/i.test(src)) {
            results.push(`iframe: src=${src.slice(0, 100)}`);
          }
        });
        return results;
      });
      console.log(`\nCAPTCHA elements: ${JSON.stringify(captchaEls)}`);
      if (consoleLogs.length > 0) {
        console.log(`\nConsole logs (${consoleLogs.length}):`);
        consoleLogs.slice(0, 20).forEach(l => console.log(`  ${l.slice(0, 200)}`));
      }

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro';
      console.error(`ERRO em ${portal.nome}: ${msg}`);
    }

    await page.close();
  }

  await browser.close();
  console.log('\nDiagnóstico concluído.');
}

inspect();
