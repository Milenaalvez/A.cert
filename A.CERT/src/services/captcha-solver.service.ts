import type { CaptchaType } from '../utils/captcha.js';
import type { Page } from 'puppeteer';
import { scrollAteCaptcha } from '../utils/captcha.js';

export async function focusPageForCaptcha(
  page: Page,
  tipo: CaptchaType,
): Promise<void> {
  if (typeof page.bringToFront === 'function') {
    try { await page.bringToFront(); } catch { /* ignore */ }
  }
  if (tipo) {
    await scrollAteCaptcha(page, tipo);
  }
}
