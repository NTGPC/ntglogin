// packages/worker/src/workflow/chromeLauncher.ts

import { chromium, BrowserContext } from 'playwright';

export type ProxyConfig = {
  host: string;
  port: number;
  username?: string;
  password?: string;
};

export type LaunchResult = {
  context: BrowserContext;
  wsEndpoint?: string;
  port?: number;
};

export async function launchBrowserWithProfile(
  userDataDir: string,
  proxy?: ProxyConfig,
  ua?: string,
): Promise<LaunchResult> {

  const proxyOpt = proxy
    ? {
        server: `http://${proxy.host}:${proxy.port}`,
        username: proxy.username,
        password: proxy.password,
      }
    : undefined;

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,                 // để bạn thấy chạy
    proxy: proxyOpt,                 // <--- QUAN TRỌNG: nhét proxy ở đây
    viewport: null,
    ignoreHTTPSErrors: true,
    args: [
      '--disable-features=AutomationControlled',
      '--disable-blink-features=AutomationControlled',
      '--no-default-browser-check',
      '--no-first-run',
    ],
    userAgent: ua,                   // nếu bạn muốn set UA từ DB
  });

  // có thể mở 1 tab sẵn nếu muốn
  // const page = await context.newPage();

  return { context };
}

