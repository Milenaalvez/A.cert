import puppeteer from 'puppeteer';
import type { Browser, Page } from 'puppeteer';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// Use puppeteer-extra with stealth plugin
const puppeteerExtra = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteerExtra.use(StealthPlugin());

let browser: Browser | null = null;

export async function getBrowser(): Promise<Browser> {
  if (!browser || !browser.connected) {
    browser = await puppeteerExtra.launch({
      headless: process.env.PUPPETEER_HEADLESS === 'true',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--window-size=1366,900',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-web-security',
        '--disable-features=BlockInsecurePrivateNetworkRequests',
      ],
      ignoreDefaultArgs: ['--enable-automation'],
    }) as Browser;
  }
  return browser;
}

export async function createPage(): Promise<Page> {
  const b = await getBrowser();
  const page = await b.newPage();

  page.on('pageerror', (err) => console.log(`[PAGE CRASH] ${String(err)}`));

  // Cookie auto-accept desabilitado — cliques acidentais redirecionam sites
  // Cada conector deve lidar com cookies explicitamente se necessario

  await page.setViewport({ width: 1366, height: 768 });
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36'
  );
  await page.setBypassCSP(true);

  return page;
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}
