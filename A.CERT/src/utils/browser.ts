import puppeteer from 'puppeteer';
import type { Browser, Page } from 'puppeteer';
import { createRequire } from 'node:module';
import { displayPool } from './display-pool-manager.js';

const require = createRequire(import.meta.url);

// Use puppeteer-extra with stealth plugin
const puppeteerExtra = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteerExtra.use(StealthPlugin());

let browser: Browser | null = null;

let currentJobId: string | null = null;
let currentDisplayId: string | null = null;

export function setJobContext(jobId: string | null): void {
  currentJobId = jobId;
}

export async function acquireDisplayForJob(jobId: string, orgao?: string): Promise<string | null> {
  const info = await displayPool.acquire(jobId, orgao);
  if (info) {
    currentJobId = jobId;
    currentDisplayId = info.id;
    return info.id;
  }
  console.log(`[Browser] No pool display available for job ${jobId}, using singleton`);
  return null;
}

export async function releaseDisplayForJob(jobId: string): Promise<void> {
  const info = displayPool.getDisplayByJob(jobId);
  if (info) {
    await displayPool.release(info.id);
  }
  currentJobId = null;
  currentDisplayId = null;
}

export function getCurrentDisplayId(): string | null {
  return currentDisplayId;
}

export async function getBrowser(): Promise<Browser> {
  if (!browser || !browser.connected) {
    const headless = process.env.PUPPETEER_HEADLESS === 'true';
    const isLinux = process.platform === 'linux';
    const hasDisplay = !!process.env.DISPLAY;

    browser = await puppeteerExtra.launch({
      headless,
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
        ...(isLinux ? ['--disable-software-rasterizer', '--disable-features=VizDisplayCompositor'] : []),
      ],
      ignoreDefaultArgs: ['--enable-automation'],
    }) as Browser;
  }
  return browser;
}

async function configurePage(page: Page): Promise<void> {
  page.on('pageerror', (err) => console.log(`[PAGE CRASH] ${String(err)}`));

  await page.setViewport({ width: 1366, height: 768 });
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36'
  );
  await page.setBypassCSP(true);
}

export async function createPage(): Promise<Page> {
  if (currentDisplayId) {
    const page = await displayPool.createPage(currentDisplayId);
    if (page) {
      await configurePage(page);
      return page;
    }
    console.log(`[Browser] Pool page creation failed for display ${currentDisplayId}, falling back to singleton`);
  }

  const b = await getBrowser();
  const page = await b.newPage();
  await configurePage(page);
  return page;
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}
