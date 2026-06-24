// A.CERT Puppeteer — Automação de Certidões no Electron
import { app } from 'electron';
import puppeteer from 'puppeteer';

const CERT_SITES = {
  TRF1: {
    url: 'https://sistemas.trf1.jus.br/certidao/#/solicitacao',
    fill: async (page, person) => {
      await page.waitForSelector('input', { timeout: 10000 });
      const inputs = await page.$$('input');
      for (const inp of inputs) {
        const name = await inp.evaluate(el => el.name || '');
        if (name.toLowerCase().includes('cpf')) {
          await inp.type(person.cpf || '');
        }
      }
      const selects = await page.$$('select');
      for (const sel of selects) {
        const options = await sel.$$('option');
        for (const opt of options) {
          const text = await opt.evaluate(el => el.textContent || '');
          if (text.includes('SEÇÃO JUDICIÁRIA DO DF')) {
            const value = await opt.evaluate(el => el.value);
            await sel.select(value);
          }
        }
      }
    },
  },
  TJDFT: {
    url: 'https://cnc.tjdft.jus.br/solicitacao-externa',
    fill: async (page, person) => {
      await page.waitForSelector('input', { timeout: 10000 });
      const inputs = await page.$$('input');
      for (const inp of inputs) {
        const label = await inp.evaluate(el => {
          const lbl = el.closest('label')?.textContent || el.previousElementSibling?.textContent || '';
          return lbl.toLowerCase();
        });
        if (label.includes('cpf')) await inp.type(person.cpf || '');
        else if (label.includes('nome') && !label.includes('mãe') && !label.includes('pai')) await inp.type(person.name || '');
        else if (label.includes('mãe')) await inp.type(person.mother_name || '');
        else if (label.includes('pai')) await inp.type(person.father_name || '');
      }
    },
  },
};

// Start cert emission flow
export async function emitCertificate(certKey, certLabel, personData) {
  const site = Object.values(CERT_SITES).find(s => certKey.includes(Object.keys(CERT_SITES).find(k => certKey.startsWith(k)) || ''));
  
  if (!site) return null;

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.goto(site.url, { waitUntil: 'networkidle2' });

    await site.fill(page, personData);

    // Set download path
    const client = await page.createCDPSession();
    await client.send('Page.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: app.getPath('downloads'),
    });

    return site.url;
  } catch (err) {
    console.error(`A.CERT: Puppeteer error for ${certLabel}`, err);
    return null;
  }
}

