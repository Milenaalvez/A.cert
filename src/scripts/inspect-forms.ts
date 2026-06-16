import puppeteer from 'puppeteer';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', '..', 'tmp');
mkdirSync(OUT, { recursive: true });

async function logForm(page: puppeteer.Page, label: string) {
  await new Promise(r => setTimeout(r, 2000));
  const html = await page.content().catch(() => '(error)');
  writeFileSync(join(OUT, `${label}.html`), typeof html === 'string' ? html : '', 'utf-8');
  console.log(`\n--- ${label} ---`);
  console.log(`URL: ${page.url()}`);

  try {
    const els = await page.evaluate(() => {
      const all = document.querySelectorAll('input, select, textarea, button, a, label, h1, h2, h3, h4');
      return Array.from(all).slice(0, 60).map(el => {
        const tag = el.tagName.toLowerCase();
        const attr: Record<string, string> = {};
        for (const a of el.attributes) { attr[a.name] = a.value; }
        const text = (el as HTMLElement).textContent?.trim().slice(0, 120);
        return { tag, attr, text };
      });
    });

    for (const e of els) {
      console.log(`  ${e.tag.padEnd(8)} id=${(e.attr.id || '').slice(0, 30).padEnd(30)} name=${(e.attr.name || '').slice(0, 20).padEnd(20)} placeholder=${(e.attr.placeholder || '').slice(0, 25).padEnd(25)} type=${(e.attr.type || '').slice(0, 10).padEnd(10)} text="${(e.text || '').slice(0, 50)}"`);
    }
  } catch (err) {
    console.log(`  (erro ao avaliar: ${err})`);
  }
}

async function inspect() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    protocolTimeout: 60000,
  });

  // === RECEITA FEDERAL - directly go to CPF form via hash ===
  {
    console.log('\n========== RECEITA FEDERAL ==========');
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto('https://servicos.receitafederal.gov.br/servico/certidoes/#/home/cpf', { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise(r => setTimeout(r, 5000));
    await logForm(page, 'rf-cpf-form');

    // Try to fill CPF
    const cpfInput = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input');
      for (const inp of inputs) {
        const type = inp.type;
        const placeholder = inp.placeholder || '';
        const cls = inp.className || '';
        if (type === 'text' && !placeholder && !cls.includes('searchbox')) return inp;
        if (inp.id?.includes('cpf')) return inp;
      }
      return null;
    });
    if (cpfInput) {
      console.log('CPF input encontrado');
    } else {
      console.log('CPF input NÃO encontrado');
    }

    await page.close();
  }

  // === TRF1 ===
  {
    console.log('\n========== TRF1 UNIFICADA ==========');
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto('https://certidao-unificada.cjf.jus.br/#/solicitacao-certidao', { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise(r => setTimeout(r, 5000));
    await logForm(page, 'trf1-form');

    // Try autocomplete for tipo
    const tipoInput = await page.$('input.ng-tns-c48-3');
    if (tipoInput) {
      console.log('Tipo input: clicando...');
      await tipoInput.click();
      await tipoInput.type('Cível', { delay: 80 });
      await new Promise(r => setTimeout(r, 2000));
      // Look for autocomplete panel
      const panel = await page.evaluate(() => {
        const items = document.querySelectorAll('.p-autocomplete-panel li, .p-autocomplete-item, .ui-autocomplete-list-item');
        return Array.from(items).map(i => i.textContent?.trim());
      });
      console.log(`Autocomplete items: ${JSON.stringify(panel)}`);
    }

    // Try orgaos
    const orgaoInput = await page.$('input[name="orgaos"]');
    if (orgaoInput) {
      console.log('Órgão input: clicando...');
      await orgaoInput.click();
      await orgaoInput.type('SJDF', { delay: 80 });
      await new Promise(r => setTimeout(r, 2000));
      const panel = await page.evaluate(() => {
        const items = document.querySelectorAll('.p-autocomplete-panel li, .p-autocomplete-item, .ui-autocomplete-list-item');
        return Array.from(items).map(i => i.textContent?.trim());
      });
      console.log(`Autocomplete items: ${JSON.stringify(panel)}`);
    }

    await page.close();
  }

  // === TJDFT ===
  {
    console.log('\n========== TJDFT ==========');
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto('https://cnc.tjdft.jus.br/solicitacao-externa', { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise(r => setTimeout(r, 3000));
    await logForm(page, 'tjdft-form');

    // All inputs
    const allInputs = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input');
      return Array.from(inputs).map(i => ({
        id: i.id,
        type: i.type,
        placeholder: i.placeholder,
        className: i.className.slice(0, 40),
      }));
    });
    console.log(`\nAll inputs:`);
    for (const inp of allInputs) {
      console.log(`  id=${inp.id} type=${inp.type} placeholder="${inp.placeholder}" class=${inp.className}`);
    }

    // Fill CPF (first text input)
    const textInputs = allInputs.filter(i => i.type === 'text');
    if (textInputs.length > 0) {
      const cpfHandle = await page.$(`input[id="${textInputs[0].id}"]`);
      if (cpfHandle) {
        await cpfHandle.click();
        await cpfHandle.type('12345678909', { delay: 20 });
        console.log('CPF preenchido');
      }
    }
    if (textInputs.length > 1) {
      const nomeHandle = await page.$(`input[id="${textInputs[1].id}"]`);
      if (nomeHandle) {
        await nomeHandle.click();
        await nomeHandle.type('João', { delay: 20 });
        console.log('Nome preenchido');
      }
    }

    // Click Próximo
    const clicked = await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        const text = b.textContent?.trim().toLowerCase() || '';
        if (text.includes('próximo') || text.includes('proximo')) {
          b.click();
          return text;
        }
      }
      return null;
    });
    console.log(`Botão clicado: "${clicked}"`);
    if (clicked) {
      await new Promise(r => setTimeout(r, 5000));
      await logForm(page, 'tjdft-proximo');
    }

    await page.close();
  }

  await browser.close();
  console.log('\nDiagnóstico concluído.');
}

inspect();
