import { chromium, Browser, Page, BrowserContext } from "playwright-core";

export async function attachToChrome(wsEndpoint: string): Promise<{ browser: Browser, context: BrowserContext, page: Page }> {
  const browser = await chromium.connectOverCDP(wsEndpoint);

  // contexts()[0] = default profile context
  const context = browser.contexts()[0] ?? await browser.newContext();

  let page = context.pages()[0] ?? await context.newPage();

  return { browser, context, page };
}

