import type { Browser, Page } from 'puppeteer';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const puppeteerExtra = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteerExtra.use(StealthPlugin());

export interface DisplayInfo {
  id: string;
  displayNum: number;
  port: number;
  status: 'available' | 'busy' | 'error';
  jobId: string | null;
  orgao: string | null;
  acquiredAt: number | null;
}

interface DisplayEntry {
  id: string;
  displayNum: number;
  port: number;
  status: 'available' | 'busy' | 'error';
  browser: Browser | null;
  jobId: string | null;
  orgao: string | null;
  acquiredAt: number | null;
  pages: Set<Page>;
}

const LOG = (msg: string) => console.log(`[DisplayPool] ${msg}`);

function getBrowserArgs(displayNum?: number): string[] {
  const isLinux = process.platform === 'linux';
  const args: string[] = [
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
    '--disable-infobars',
    ...(isLinux ? ['--disable-software-rasterizer', '--disable-features=VizDisplayCompositor'] : []),
  ];

  if (displayNum != null && isLinux) {
    args.push(`--display=:${displayNum}`);
  }

  return args;
}

export class DisplayPoolManager {
  private displays: Map<string, DisplayEntry> = new Map();
  private maxDisplays: number;
  private startPort: number;
  private startDisplay: number;

  constructor(maxDisplays?: number, startPort?: number, startDisplay?: number) {
    this.maxDisplays = maxDisplays ?? (Number(process.env.DISPLAY_POOL_SIZE) || 3);
    this.startPort = startPort ?? (Number(process.env.VNC_START_PORT) || 5901);
    this.startDisplay = startDisplay ?? (Number(process.env.VNC_START_DISPLAY) || 99);
  }

  async initialize(): Promise<void> {
    for (let i = 0; i < this.maxDisplays; i++) {
      const displayNum = this.startDisplay + i;
      const port = this.startPort + i;
      const id = `display-${displayNum}`;

      const entry: DisplayEntry = {
        id,
        displayNum,
        port,
        status: 'available',
        browser: null,
        jobId: null,
        orgao: null,
        acquiredAt: null,
        pages: new Set(),
      };

      this.displays.set(id, entry);
    }

    LOG(`Pool initialized with ${this.maxDisplays} displays (ports ${this.startPort}-${this.startPort + this.maxDisplays - 1})`);
  }

  async acquire(jobId: string, orgao?: string): Promise<DisplayInfo | null> {
    for (const [, entry] of this.displays) {
      if (entry.status === 'available') {
        try {
          const headless = false;

          const browser = await puppeteerExtra.launch({
            headless,
            args: getBrowserArgs(entry.displayNum),
            ignoreDefaultArgs: ['--enable-automation'],
          }) as Browser;

          entry.browser = browser;
          entry.status = 'busy';
          entry.jobId = jobId;
          entry.orgao = orgao ?? null;
          entry.acquiredAt = Date.now();

          browser.on('disconnected', () => {
            LOG(`Browser disconnected for display ${entry.id}`);
            this._cleanupEntry(entry);
          });

          LOG(`Display ${entry.id} acquired for job ${jobId} (${orgao ?? 'N/A'})`);
          return this._toInfo(entry);
        } catch (err: any) {
          entry.status = 'error';
          LOG(`Failed to launch browser for display ${entry.id}: ${err.message}`);
          return null;
        }
      }
    }

    LOG(`No available displays (all ${this.maxDisplays} busy)`);
    return null;
  }

  async createPage(displayId: string): Promise<Page | null> {
    const entry = this.displays.get(displayId);
    if (!entry || !entry.browser || entry.status !== 'busy') {
      LOG(`Display ${displayId} is not available for page creation`);
      return null;
    }

    try {
      const page = await entry.browser.newPage();

      page.on('pageerror', (err) => LOG(`[Page Crash] display=${displayId}: ${String(err)}`));

      await page.setViewport({ width: 1366, height: 768 });
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36'
      );
      await page.setBypassCSP(true);

      page.on('close', () => {
        entry.pages.delete(page);
      });

      entry.pages.add(page);
      return page;
    } catch (err: any) {
      LOG(`Failed to create page on display ${displayId}: ${err.message}`);
      return null;
    }
  }

  async release(displayId: string): Promise<void> {
    const entry = this.displays.get(displayId);
    if (!entry) {
      LOG(`Display ${displayId} not found in pool`);
      return;
    }

    LOG(`Releasing display ${entry.id} (job ${entry.jobId})`);

    for (const page of entry.pages) {
      try { await page.close(); } catch { /* ignore */ }
    }
    entry.pages.clear();

    if (entry.browser) {
      try { await entry.browser.close(); } catch { /* ignore */ }
    }

    entry.status = 'available';
    entry.browser = null;
    entry.jobId = null;
    entry.orgao = null;
    entry.acquiredAt = null;
  }

  getDisplayInfo(displayId: string): DisplayInfo | null {
    const entry = this.displays.get(displayId);
    if (!entry) return null;
    return this._toInfo(entry);
  }

  getAllDisplays(): DisplayInfo[] {
    return Array.from(this.displays.values()).map(this._toInfo);
  }

  getAvailableDisplays(): DisplayInfo[] {
    return this.getAllDisplays().filter((d) => d.status === 'available');
  }

  getBusyDisplays(): DisplayInfo[] {
    return this.getAllDisplays().filter((d) => d.status === 'busy');
  }

  getDisplayByJob(jobId: string): DisplayInfo | null {
    for (const [, entry] of this.displays) {
      if (entry.jobId === jobId) return this._toInfo(entry);
    }
    return null;
  }

  async shutdown(): Promise<void> {
    LOG('Shutting down display pool...');
    const releases = Array.from(this.displays.keys()).map((id) => this.release(id));
    await Promise.allSettled(releases);
    LOG('All displays released');
  }

  get poolSize(): number { return this.maxDisplays; }
  get availableCount(): number { return this.getAvailableDisplays().length; }
  get busyCount(): number { return this.getBusyDisplays().length; }

  private _toInfo(entry: DisplayEntry): DisplayInfo {
    return {
      id: entry.id,
      displayNum: entry.displayNum,
      port: entry.port,
      status: entry.status,
      jobId: entry.jobId,
      orgao: entry.orgao,
      acquiredAt: entry.acquiredAt,
    };
  }

  private _cleanupEntry(entry: DisplayEntry): void {
    entry.status = 'error';
    entry.browser = null;
    for (const page of entry.pages) {
      try { page.close(); } catch { /* ignore */ }
    }
    entry.pages.clear();
  }
}

export const displayPool = new DisplayPoolManager();
