import { chromium, BrowserContext, Page } from 'playwright';
import axios from 'axios';
import * as path from 'path';
import * as fs from 'fs';

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:3000';

// Path to fingerprint patch script (for Playwright)
// Sử dụng process.cwd() để lấy project root, đảm bảo đường dẫn đúng dù code được compile
const fingerprintPatchPath = path.join(process.cwd(), 'src', 'inject', 'fingerprintPatch.js');
// Path to audio spoof script (for Playwright)
const audioSpoofPath = path.join(process.cwd(), 'src', 'inject', 'audioSpoof.js');

export async function openProfileContext(
  userDataDir: string,
  channel: 'chrome' | 'chromium' | 'msedge' = 'chrome'
): Promise<{ ctx: BrowserContext; page: Page }> {
  const ctx: BrowserContext = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    channel, // 'chrome' hoặc 'chromium' tùy bạn cấu hình trong driver
    args: [
      '--restore-last-session=false',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-session-crashed-bubble',
      '--disable-features=TranslateUI,AutofillServerCommunication',
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
      '--no-sandbox',
      '--disable-infobars',
      '--disable-notifications',
      '--disable-popup-blocking',
      '--use-fake-device-for-media-stream',
      '--use-fake-ui-for-media-stream',
      '--disable-webgpu',
      '--disable-features=WebRtcHideLocalIpsWithMdns',
      '--force-webrtc-ip-handling-policy=disable_non_proxied_udp',
      '--autoplay-policy=no-user-gesture-required',
    ],
  });

  // Luôn tạo 1 tab mới để điều khiển
  const page: Page = await ctx.newPage();
  await page.bringToFront();

  // Inject scripts as early as possible for all pages (using path for Playwright)
  for (const p of ctx.pages()) {
    await p.addInitScript({ path: fingerprintPatchPath });
    await p.addInitScript({ path: audioSpoofPath });
  }
  ctx.on('page', (newPage) => {
    newPage.addInitScript({ path: fingerprintPatchPath }).catch(() => {});
    newPage.addInitScript({ path: audioSpoofPath }).catch(() => {});
  });

  return { ctx, page };
}

export class Browser {
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private userDataDir: string | null = null;

  async open(profileId: number): Promise<Page> {
    // Fetch profile data from backend
    const profileResponse = await axios.get(`${BACKEND_URL}/api/profiles/${profileId}`);
    const profile = profileResponse.data.data || profileResponse.data;

    if (!profile) {
      throw new Error(`Profile ${profileId} not found`);
    }

    // Determine userDataDir (persistent profile directory)
    const profilesDir = path.join(process.cwd(), 'browser_profiles');
    if (!fs.existsSync(profilesDir)) {
      fs.mkdirSync(profilesDir, { recursive: true });
    }
    this.userDataDir = path.join(profilesDir, `profile_${profileId}`);

    // Determine channel from fingerprint
    let channel: 'chrome' | 'chromium' | 'msedge' = 'chrome';
    if (profile.fingerprint) {
      const fp = typeof profile.fingerprint === 'string' 
        ? JSON.parse(profile.fingerprint) 
        : profile.fingerprint;
      
      if (fp.driver === 'msedge') {
        channel = 'msedge';
      } else if (fp.driver === 'chromium') {
        channel = 'chromium';
      }
    }

    // Build launchPersistentContext options
    const contextOptions: any = {
      headless: false,
      channel,
      args: [
        '--restore-last-session=false',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-session-crashed-bubble',
        '--disable-features=TranslateUI,AutofillServerCommunication',
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--disable-infobars',
        '--disable-notifications',
        '--disable-popup-blocking',
        '--use-fake-device-for-media-stream',
        '--use-fake-ui-for-media-stream',
        '--disable-webgpu',
        '--disable-features=WebRtcHideLocalIpsWithMdns',
        '--force-webrtc-ip-handling-policy=disable_non_proxied_udp',
        '--autoplay-policy=no-user-gesture-required',
      ],
      viewport: { width: 1280, height: 720 },
      userAgent: profile.user_agent || undefined,
    };

    // Add proxy if available
    if (profile.proxy_id) {
      try {
        const proxyResponse = await axios.get(`${BACKEND_URL}/api/proxies/${profile.proxy_id}`);
        const proxy = proxyResponse.data.data || proxyResponse.data;
        if (proxy && proxy.active) {
          contextOptions.proxy = {
            server: `${proxy.type}://${proxy.host}:${proxy.port}`,
            username: proxy.username || undefined,
            password: proxy.password || undefined,
          };
        }
      } catch (err) {
        console.warn(`Failed to load proxy for profile ${profileId}:`, err);
      }
    }

    // Apply fingerprint if available
    if (profile.fingerprint) {
      const fp = typeof profile.fingerprint === 'string' 
        ? JSON.parse(profile.fingerprint) 
        : profile.fingerprint;

      if (fp.viewport) {
        contextOptions.viewport = {
          width: fp.viewport.width || 1280,
          height: fp.viewport.height || 720,
        };
      }

      if (fp.locale) {
        contextOptions.locale = fp.locale;
      }

      if (fp.timezoneId) {
        contextOptions.timezoneId = fp.timezoneId;
      }

      if (fp.geolocation) {
        contextOptions.geolocation = {
          latitude: fp.geolocation.latitude,
          longitude: fp.geolocation.longitude,
          accuracy: fp.geolocation.accuracy || 100,
        };
      }
    }

    // Launch persistent context
    this.context = await chromium.launchPersistentContext(this.userDataDir, contextOptions);

    // Luôn tạo 1 tab mới để điều khiển
    this.page = await this.context.newPage();
    await this.page.bringToFront();

    // Inject scripts as early as possible for all pages (using path for Playwright)
    for (const p of this.context.pages()) {
      await p.addInitScript({ path: fingerprintPatchPath });
      await p.addInitScript({ path: audioSpoofPath });
    }
    this.context.on('page', (newPage) => {
      newPage.addInitScript({ path: fingerprintPatchPath }).catch(() => {});
      newPage.addInitScript({ path: audioSpoofPath }).catch(() => {});
    });

    // Apply fingerprint injection if needed
    if (profile.fingerprint) {
      const fp = typeof profile.fingerprint === 'string' 
        ? JSON.parse(profile.fingerprint) 
        : profile.fingerprint;

      // Inject fingerprint spoofing
      await this.page.addInitScript(() => {
        // @ts-ignore - Browser context
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined,
        });
      });

      if (fp.languages) {
        await this.page.addInitScript((langs: string[]) => {
          // @ts-ignore - Browser context
          Object.defineProperty(navigator, 'languages', { get: () => langs });
          // @ts-ignore - Browser context
          Object.defineProperty(navigator, 'language', { get: () => langs[0] || 'en-US' });
        }, fp.languages);
      }
    }

    return this.page;
  }

  async close(): Promise<void> {
    try {
      if (this.page) {
        await this.page.close();
        this.page = null;
      }
      if (this.context) {
        // Close persistent context (this also closes the browser)
        await this.context.close();
        this.context = null;
      }
      this.userDataDir = null;
    } catch (error) {
      console.error('Error closing browser:', error);
    }
  }
}

