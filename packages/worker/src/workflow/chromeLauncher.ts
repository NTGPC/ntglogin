// packages/worker/src/workflow/chromeLauncher.ts

import { chromium, BrowserContext } from 'playwright';
import * as path from 'path';

// Path to fingerprint patch script (for Playwright)
const fingerprintPatchPath = path.join(__dirname, '../../../src/inject/fingerprintPatch.js');
// Path to audio spoof script (for Playwright)
const audioSpoofPath = path.join(__dirname, '../../../src/inject/audioSpoof.js');

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
      '--use-fake-device-for-media-stream',
      '--use-fake-ui-for-media-stream',
      '--disable-webgpu',
      '--disable-features=WebRtcHideLocalIpsWithMdns',
      '--force-webrtc-ip-handling-policy=disable_non_proxied_udp',
      '--autoplay-policy=no-user-gesture-required',
    ],
    userAgent: ua,                   // nếu bạn muốn set UA từ DB
  });

  // Inject scripts as early as possible for all pages (using path for Playwright)
  for (const p of context.pages()) {
    await p.addInitScript({ path: fingerprintPatchPath });
    await p.addInitScript({ path: audioSpoofPath });
  }
  context.on('page', (newPage) => {
    newPage.addInitScript({ path: fingerprintPatchPath }).catch(() => {});
    newPage.addInitScript({ path: audioSpoofPath }).catch(() => {});
  });

  // có thể mở 1 tab sẵn nếu muốn
  // const page = await context.newPage();

  return { context };
}

