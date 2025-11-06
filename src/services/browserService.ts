import puppeteer, { Browser } from 'puppeteer';
import { chromium, BrowserContext, Page } from 'playwright';
import path from 'path';
import fs from 'fs';

// Store browser instances per session (Puppeteer Browser or Playwright Context)
const browserInstances = new Map<number, any>();

interface BrowserLaunchOptions {
  profileId: number;
  sessionId: number;
  userAgent?: string;
  fingerprint?: any;
  proxy?: {
    host: string;
    port: number;
    username?: string;
    password?: string;
    type: string;
  };
}

export async function launchBrowser(options: BrowserLaunchOptions): Promise<any> {
  const { profileId, sessionId, userAgent, fingerprint, proxy } = options;

  // Use persistent user-data-dir per profile so cookies/history/logins are preserved across sessions
  // Note: launching multiple sessions for the same profile concurrently can corrupt data; avoid parallel runs
  const profileDir = path.join(process.cwd(), 'browser_profiles', `profile_${profileId}`);
  if (!fs.existsSync(profileDir)) {
    fs.mkdirSync(profileDir, { recursive: true });
  }

  // Make Chrome think previous shutdown was clean, and enable auto-restore without prompts
  const ensureCleanExitFlags = () => {
    try {
      const prefsPath = path.join(profileDir, 'Default', 'Preferences');
      if (fs.existsSync(prefsPath)) {
        try {
          const raw = fs.readFileSync(prefsPath, 'utf-8');
          const json = JSON.parse(raw);
          json.profile = json.profile || {};
          json.profile.exit_type = 'Normal';
          json.profile.exited_cleanly = true;
          json.session = json.session || {};
          json.session.restore_on_startup = 1; // 1 = restore last session
          fs.mkdirSync(path.dirname(prefsPath), { recursive: true });
          fs.writeFileSync(prefsPath, JSON.stringify(json));
        } catch {}
      } else {
        // Seed minimal Preferences
        const base = {
          profile: { exit_type: 'Normal', exited_cleanly: true },
          session: { restore_on_startup: 1 },
        } as any;
        fs.mkdirSync(path.dirname(prefsPath), { recursive: true });
        try { fs.writeFileSync(prefsPath, JSON.stringify(base)); } catch {}
      }

      const localStatePath = path.join(profileDir, 'Local State');
      try {
        const raw2 = fs.existsSync(localStatePath) ? fs.readFileSync(localStatePath, 'utf-8') : '{}';
        const json2 = JSON.parse(raw2);
        json2.profile = json2.profile || {};
        json2.profile.exit_type = 'Normal';
        json2.profile.exited_cleanly = true;
        fs.writeFileSync(localStatePath, JSON.stringify(json2));
      } catch {}
    } catch {}
  };
  ensureCleanExitFlags();

  // Try to close any browser instance that might be using the same directory
  // This handles cases where browser wasn't properly closed
  try {
    const existingBrowser = browserInstances.get(sessionId);
    if (existingBrowser) {
      console.log(`⚠️ [Browser ${sessionId}] Closing existing browser instance...`);
      try {
        await existingBrowser.close();
      } catch (e) {
        // Ignore errors
      }
      browserInstances.delete(sessionId);
    }
  } catch (err) {
    // Ignore
  }

  // If proxy is provided, use Playwright persistent context (native proxy support/auth)
  if (proxy) {
    // Close any existing instance for this session
    try {
      const existing = browserInstances.get(sessionId);
      if (existing) {
        await existing.close().catch(() => {});
        browserInstances.delete(sessionId);
      }
    } catch {}

    const server = `${proxy.type}://${proxy.host}:${proxy.port}`;
    const contextOptions: any = {
      headless: false,
      proxy: {
        server,
        username: proxy.username || undefined,
        password: proxy.password || undefined,
      },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--disable-infobars',
        '--disable-notifications',
        '--disable-popup-blocking',
        '--restore-last-session',
      ],
    };
    if (userAgent) contextOptions.userAgent = userAgent;
    if (fingerprint && fingerprint.viewport) {
      contextOptions.viewport = {
        width: fingerprint.viewport.width || 1280,
        height: fingerprint.viewport.height || 720,
      };
    } else {
      contextOptions.viewport = { width: 1280, height: 720 };
    }

    const context = await chromium.launchPersistentContext(profileDir, contextOptions);
    browserInstances.set(sessionId, context);

    // Ensure at least one page exists and is frontmost
    const pages = context.pages();
    let page: Page | undefined = pages[0];
    if (!page) page = await context.newPage();
    try { await page.bringToFront(); } catch {}

    // Remove about:blank if session tabs are restored
    setTimeout(async () => {
      try {
        const all = context.pages();
        if (all.length > 1) {
          for (const p of all) {
            const url = p.url();
            if (url === 'about:blank') {
              try { await p.close(); } catch {}
            }
          }
        }
      } catch {}
    }, 1200);

    return context;
  }

  // Build launch args for Puppeteer path (no proxy auth required)
  const launchArgs = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-blink-features=AutomationControlled',
    '--disable-dev-shm-usage',
    '--disable-infobars', // Hide "Chrome is being controlled" message
    '--disable-notifications',
    '--disable-popup-blocking',
    `--user-data-dir=${profileDir}`,
  ];
  // Only allow restoring last session when no proxy auth is required, otherwise
  // Chrome will attempt to load tabs before we can authenticate and show a dialog.
  const needsProxyAuth = !!(proxy && proxy.username);
  if (!needsProxyAuth) {
    launchArgs.push('--restore-last-session');
  }

  // Add proxy if provided (Puppeteer doesn't support auth in URL, use authenticate() instead)
  const proxyAuth = proxy?.username ? { username: proxy.username, password: proxy.password || '' } : null;
  
  if (proxy) {
    // Puppeteer requires proxy URL without auth - format: type://host:port
    // Note: SOCKS5 proxies may need special handling
    let proxyString = '';
    if (proxy.type === 'socks5' || proxy.type === 'socks') {
      // SOCKS5 format
      proxyString = `socks5://${proxy.host}:${proxy.port}`;
    } else {
      // HTTP/HTTPS proxy
      proxyString = `${proxy.type}://${proxy.host}:${proxy.port}`;
    }
    
    launchArgs.push(`--proxy-server=${proxyString}`);
    console.log(`[Browser ${sessionId}] Using proxy: ${proxyString}`);
    if (proxyAuth) {
      console.log(`[Browser ${sessionId}] Proxy auth: ${proxyAuth.username}${proxyAuth.password ? ':***' : ''}`);
    } else {
      console.log(`[Browser ${sessionId}] No proxy authentication required`);
    }
  }

  // Launch browser
  // Choose browser channel based on fingerprint.driver
  let channel: 'chrome' | 'msedge' | undefined = undefined;
  if (fingerprint && typeof fingerprint.driver === 'string') {
    if (fingerprint.driver === 'chrome') channel = 'chrome';
    if (fingerprint.driver === 'msedge') channel = 'msedge';
  }

  const browser = await puppeteer.launch({
    headless: false, // Show browser window
    args: launchArgs,
    defaultViewport: { width: 1280, height: 720 },
    channel: channel as any, // Puppeteer types may not include msedge, but it works
  });

  // Store browser instance
  browserInstances.set(sessionId, browser);

  // Get pages and configure
  // Wait a bit for browser to fully initialize
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const pages = await browser.pages();
  let page = pages[0];
  
  // If no page exists or page is closed, create a new one
  if (!page || page.isClosed()) {
    page = await browser.newPage();
  }

  // Set proxy authentication if needed (must be done after page creation)
  // Note: page.authenticate() works for HTTP proxies, but SOCKS5 auth needs different handling
  const applyProxyAuthToPage = async (p: any) => {
    if (!p || p.isClosed()) return;
    try {
      if (proxy && proxyAuth && proxyAuth.username) {
        if (proxy.type !== 'socks5' && proxy.type !== 'socks') {
          await p.authenticate({ username: proxyAuth.username, password: proxyAuth.password || '' });
          console.log(`[Browser ${sessionId}] Proxy authentication applied to page`);
        } else {
          console.log(`[Browser ${sessionId}] SOCKS proxy in use - page.authenticate may not be supported`);
        }
      }
    } catch (error) {
      console.error(`[Browser ${sessionId}] Failed to set proxy auth:`, error);
      // Continue anyway - some proxies work without auth or user can enter manually
    }
  };

  if (proxy && proxyAuth && proxyAuth.username) {
    // Apply to existing pages
    for (const p of await browser.pages()) {
      await applyProxyAuthToPage(p);
    }
    // Apply to any new pages opened later
    browser.on('targetcreated', async (target) => {
      try {
        const newPage = await target.page();
        if (newPage) await applyProxyAuthToPage(newPage);
      } catch {}
    });
  }

  // Set user agent (only if page is still valid)
  if (userAgent && !page.isClosed()) {
    try {
      await page.setUserAgent(userAgent);
    } catch (error) {
      console.warn(`[Browser ${sessionId}] Failed to set user agent:`, error);
    }
  }

  // Apply fingerprint fields (only if page is still valid)
  if (fingerprint && !page.isClosed()) {
    try {
      if (fingerprint.viewport) {
        const { width, height, deviceScaleFactor } = fingerprint.viewport;
        await page.setViewport({ width: width ?? 1366, height: height ?? 768, deviceScaleFactor: deviceScaleFactor ?? 1 });
      }

      // Emulate media features
      const mediaFeatures: { name: string; value: string }[] = [];
      if (fingerprint.colorScheme) mediaFeatures.push({ name: 'prefers-color-scheme', value: fingerprint.colorScheme });
      if (fingerprint.reducedMotion) mediaFeatures.push({ name: 'prefers-reduced-motion', value: fingerprint.reducedMotion });
      if (mediaFeatures.length) await page.emulateMediaFeatures(mediaFeatures);
    } catch (fpError) {
      console.warn(`[Browser ${sessionId}] Failed to apply fingerprint:`, fpError);
    }
  }

  // Apply fingerprint languages and canvas if available (only if page is still valid)
  if (fingerprint && !page.isClosed()) {
    try {
      // Languages via init script
      if (Array.isArray(fingerprint.languages) && fingerprint.languages.length) {
        const langs = fingerprint.languages;
        await page.evaluateOnNewDocument((ls: string[]) => {
          // @ts-ignore - This code runs in browser context, navigator exists
          Object.defineProperty(navigator, 'languages', { get: () => ls });
          // @ts-ignore - This code runs in browser context, navigator exists
          Object.defineProperty(navigator, 'language', { get: () => ls[0] || 'en-US' });
        }, langs);
      }

      // Canvas (noise/off/block)
      if (fingerprint.canvas && fingerprint.canvas.mode && fingerprint.canvas.mode !== 'real') {
        const seed = fingerprint.canvas.seed || 's1';
        await page.evaluateOnNewDocument((cfg: { mode: string; seed: string }) => {
          const rand = (x: number) => {
            let h = 0;
            for (let i = 0; i < cfg.seed.length; i++) h = (h << 5) - h + cfg.seed.charCodeAt(i);
            const n = Math.sin(h + x) * 10000;
            return n - Math.floor(n);
          };
          if (cfg.mode === 'block' || cfg.mode === 'off') {
            // @ts-ignore - This code runs in browser context, HTMLCanvasElement exists
            const toDataURL = HTMLCanvasElement.prototype.toDataURL;
            // @ts-ignore - This code runs in browser context, HTMLCanvasElement exists
            HTMLCanvasElement.prototype.toDataURL = function (this: any) {
              try {
                // @ts-ignore - Browser context
                const ctx = this.getContext('2d');
                if (ctx) {
                  // @ts-ignore - Browser context
                  ctx.clearRect(0, 0, this.width, this.height);
                }
              } catch {}
              return toDataURL.apply(this as any, arguments as any);
            } as any;
          } else if (cfg.mode === 'noise') {
            // @ts-ignore - This code runs in browser context, CanvasRenderingContext2D exists
            const getImageData = CanvasRenderingContext2D.prototype.getImageData;
            // @ts-ignore - This code runs in browser context, CanvasRenderingContext2D exists
            CanvasRenderingContext2D.prototype.getImageData = function (this: any, sx: number, sy: number, sw: number, sh: number) {
              const imgData = getImageData.call(this as any, sx, sy, sw, sh);
              for (let i = 0; i < imgData.data.length; i += 4) {
                imgData.data[i] = imgData.data[i] + (rand(i) * 2 - 1);
              }
              return imgData;
            } as any;
          }
        }, { mode: fingerprint.canvas.mode, seed });
      }

      // Permissions and geolocation (best effort)
      if (Array.isArray(fingerprint.permissions) && fingerprint.permissions.includes('geolocation')) {
        try {
          await page.browserContext().overridePermissions('https://www.google.com', ['geolocation']);
        } catch {}
      }
      if (fingerprint.geolocation) {
        try {
          const { latitude, longitude, accuracy } = fingerprint.geolocation;
          await page.setGeolocation({ latitude, longitude, accuracy: accuracy ?? 100 });
        } catch {}
      }
    } catch (fpError) {
      console.warn(`[Browser ${sessionId}] Failed to apply fingerprint scripts:`, fpError);
    }
  }

  // Hide automation indicators and inject fingerprint (only if page is still valid)
  if (!page.isClosed()) {
    try {
      await page.evaluateOnNewDocument(() => {
        // Remove webdriver property to hide automation
        // @ts-ignore - This code runs in browser context, navigator exists
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined,
        });
        
        // Remove Chrome automation warning
        delete (window as any).chrome;
        (window as any).chrome = {
          runtime: {},
        };
        
        // Override permissions to avoid automation detection
        // @ts-ignore - This code runs in browser context
        const originalQuery = window.navigator.permissions.query;
        // @ts-ignore - This code runs in browser context
        window.navigator.permissions.query = (parameters: any) => 
          parameters.name === 'notifications'
            // @ts-ignore - Browser context
            ? Promise.resolve({ state: Notification.permission } as PermissionStatus)
            : originalQuery(parameters);
      });
    } catch (initError) {
      // If init script fails, continue anyway - might work on next navigation
      console.warn(`[Browser ${sessionId}] Failed to inject init script:`, initError);
    }
  }

  // Inject fingerprint if provided (only if page is still valid)
  if (fingerprint && !page.isClosed()) {
    try {
      await page.evaluateOnNewDocument((fp: any) => {
        // Canvas fingerprint spoofing
        if (fp.canvas) {
          // @ts-ignore - This code runs in browser context, HTMLCanvasElement exists
          const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
          // @ts-ignore - This code runs in browser context, HTMLCanvasElement exists
          HTMLCanvasElement.prototype.toDataURL = function () {
            return fp.canvas || originalToDataURL.apply(this as any, arguments as any);
          };
        }

        if (fp.webgl) {
          // WebGL fingerprint spoofing would go here
        }
      }, fingerprint);
    } catch (fpError) {
      console.warn(`[Browser ${sessionId}] Failed to inject fingerprint:`, fpError);
    }
  }

  // Do not auto-navigate; allow Chrome to restore previous session tabs

  // Handle browser close
  browser.on('disconnected', () => {
    browserInstances.delete(sessionId);
  });

  return browser;
}

export async function closeBrowser(sessionId: number): Promise<void> {
  const instance = browserInstances.get(sessionId);
  if (!instance) {
    console.warn(`[Browser ${sessionId}] Browser instance not found`);
    return;
  }
  
  try {
    // Handle both Puppeteer Browser and Playwright Context
    const pages = await instance.pages();
    for (const p of pages) {
      try { await p.close(); } catch {}
    }
    await instance.close();
    browserInstances.delete(sessionId);
    console.log(`✅ [Browser ${sessionId}] Browser closed gracefully`);
  } catch (error) {
    console.error(`❌ [Browser ${sessionId}] Error closing browser:`, error);
    // Force disconnect if close fails
    try {
      if (typeof instance.disconnect === 'function') {
        await instance.disconnect();
      }
      browserInstances.delete(sessionId);
    } catch (e) {
      // Ignore disconnect errors
    }
  }
}

export function getBrowser(sessionId: number): Browser | undefined {
  return browserInstances.get(sessionId);
}

export async function getOpenPageUrls(sessionId: number): Promise<string[]> {
  const browser = browserInstances.get(sessionId)
  if (!browser) return []
  const pages = await browser.pages()
  const urls: string[] = []
  for (const p of pages) {
    const u = p.url()
    if (u && u !== 'about:blank') urls.push(u)
  }
  return urls
}

