import type { Page } from 'puppeteer';

/**
 * Injects a global `__fillInput` helper into the page.
 * Can be used inside page.evaluate for setting input values
 * with proper Angular/Vue/React reactivity.
 */
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
