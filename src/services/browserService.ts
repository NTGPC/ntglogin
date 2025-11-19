import puppeteer, { Browser } from 'puppeteer';
// BƯỚC 1: THAY ĐỔI CÁCH IMPORT - Dùng playwright-extra thay vì playwright
import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Page } from 'playwright';
import path from 'path';
import fs from 'fs';

// BƯỚC 2: BẢO PLAYWRIGHT-EXTRA SỬ DỤNG PLUGIN STEALTH
// playwright-extra sử dụng StealthPlugin trực tiếp qua chromium.use()
chromium.use(StealthPlugin());
console.log('[BrowserService] ✅ Playwright-Extra với Stealth Plugin đã được kích hoạt!');

// Path to fingerprint patch script (for Playwright)
// Sử dụng process.cwd() để lấy project root, đảm bảo đường dẫn đúng dù code được compile
const fingerprintPatchPath = path.join(process.cwd(), 'src', 'inject', 'fingerprintPatch.js');
// Path to audio spoof script (for Playwright)
const audioSpoofPath = path.join(process.cwd(), 'src', 'inject', 'audioSpoof.js');
// Path to deep injection script template (for Playwright)
const injectionScriptTemplatePath = path.join(process.cwd(), 'core', 'injection_script.js');

// Load script contents (for Puppeteer)
const fingerprintPatchScript = fs.readFileSync(fingerprintPatchPath, 'utf-8');
const audioSpoofScript = fs.readFileSync(audioSpoofPath, 'utf-8');

// ==========================================================
// === HÀM MỚI: launchProfileWithFingerprint ===
// === TRÁI TIM MỚI CỦA HỆ THỐNG ===
// ==========================================================
/**
 * Khởi chạy trình duyệt với fingerprint từ schema mới
 * Đọc cấu trúc fingerprint mới và tiêm "bộ não" vào trình duyệt
 * 
 * @param profile - Profile object từ database với cấu trúc mới
 * @returns BrowserContext từ Playwright
 */
export async function launchProfileWithFingerprint(profile: any) {
  console.log(`[LIFECYCLE] Nhận yêu cầu khởi chạy cho profile: ${profile.name} (ID: ${profile.id})`);

  // ==========================================================
  // === BƯỚC 1: TẠO MÔI TRƯỜNG LƯU TRỮ RIÊNG BIỆT ===
  // ==========================================================
  // Định dạng tên thư mục mới: {profile.id}-PROFILE{profile.id}
  const profileIdStr = String(profile.id).padStart(6, '0');
  const profileDirName = `${profile.id}-PROFILE${profileIdStr}`;
  const profilePath = path.join(process.cwd(), 'browser_profiles', profileDirName);
  
  if (!fs.existsSync(profilePath)) {
    fs.mkdirSync(profilePath, { recursive: true });
    console.log(`[LIFECYCLE] ✅ Đã tạo thư mục profile: ${profilePath}`);
  } else {
    console.log(`[LIFECYCLE] ✅ Sử dụng thư mục profile hiện có: ${profilePath}`);
  }

  // ==========================================================
  // === BƯỚC 2: ĐỌC VÀ CHUẨN BỊ SCRIPT TIÊM ===
  // ==========================================================
  // Ưu tiên sử dụng file mới, fallback về file cũ
  const injectionScriptPathNew = path.join(process.cwd(), 'src', 'scripts', 'injection_script.js');
  const injectionScriptPathOld = path.join(process.cwd(), 'core', 'injection_script.js');
  
  let injectionScriptPath = injectionScriptPathNew;
  if (!fs.existsSync(injectionScriptPath)) {
    injectionScriptPath = injectionScriptPathOld;
    if (!fs.existsSync(injectionScriptPath)) {
      throw new Error(`[LIFECYCLE] ❌ Không tìm thấy injection script tại: ${injectionScriptPathNew} hoặc ${injectionScriptPathOld}`);
    }
  }

  let injectionScript = fs.readFileSync(injectionScriptPath, 'utf-8');
  const useNewFormat = injectionScriptPath === injectionScriptPathNew;
  console.log(`[LIFECYCLE] ✅ Đã đọc injection script từ: ${injectionScriptPath} (Format: ${useNewFormat ? 'MỚI' : 'CŨ'})`);

  // ==========================================================
  // === BƯỚC 3: THAY THẾ CÁC PLACEHOLDER BẰNG GIÁ TRỊ TỪ DB ===
  // ==========================================================
  // Lấy giá trị từ profile (theo schema mới)
  const userAgent = profile.userAgent || profile.user_agent || '';
  const platform = profile.platform || 'Win32';
  const hardwareConcurrency = profile.hardwareConcurrency || 8;
  const deviceMemory = profile.deviceMemory || 8;
  const languages = profile.languages || ['en-US', 'en'];
  const language = profile.language || languages[0] || 'en-US';
  
  // Screen resolution
  const screenWidth = profile.screenWidth || 1920;
  const screenHeight = profile.screenHeight || 1080;
  const screenAvailWidth = screenWidth;
  const screenAvailHeight = screenHeight - 40; // Trừ đi thanh taskbar
  
  // WebGL
  const webglVendor = profile.webglVendor || 'Intel Inc.';
  const webglRenderer = profile.webglRenderer || 'Intel Iris OpenGL Engine';
  
  // Canvas, Audio, ClientRects
  const canvasMode = profile.canvasMode || profile.canvas || 'noise';
  const audioContextMode = profile.audioContextMode || profile.audioCtxMode || profile.audioContext || 'noise';
  const clientRectsMode = profile.clientRectsMode || profile.clientRects || 'off';
  
  // Geolocation
  const geoEnabled = profile.geolocationMode === 'fake' || profile.geoEnabled || false;
  const geoLat = profile.geolocationLat || 10.762622; // Default: Ho Chi Minh City
  const geoLon = profile.geolocationLon || 106.660172;
  
  // WebRTC
  const webrtcUseMainIP = profile.webrtcMode === 'fake' || profile.webrtcMainIP || false;
  
  // Timezone
  const timezone = profile.timezone || profile.timezoneId || 'Asia/Bangkok';
  
  // Seed (sử dụng profile ID để đảm bảo tính nhất quán)
  const seed = profile.id || 12345;

  // Chuẩn bị languages array string
  const languagesStr = '[' + languages.map((l: string) => `'${l}'`).join(', ') + ']';

  // Thay thế các placeholder (hỗ trợ cả format mới __PLACEHOLDER__ và format cũ %%PLACEHOLDER%%)
  const replacements: Record<string, string> = {
    // Format mới (__PLACEHOLDER__)
    '__USER_AGENT__': userAgent,
    '__PLATFORM__': platform,
    '__HARDWARE_CONCURRENCY__': String(hardwareConcurrency),
    '__DEVICE_MEMORY__': String(deviceMemory),
    '__LANGUAGES__': languagesStr,
    '__LANGUAGE__': language,
    '__SCREEN_WIDTH__': String(screenWidth),
    '__SCREEN_HEIGHT__': String(screenHeight),
    '__SCREEN_AVAIL_WIDTH__': String(screenAvailWidth),
    '__SCREEN_AVAIL_HEIGHT__': String(screenAvailHeight),
    '__SCREEN_COLOR_DEPTH__': String(24),
    '__SCREEN_PIXEL_DEPTH__': String(24),
    '__DEVICE_PIXEL_RATIO__': String(1),
    '__WEBGL_VENDOR__': webglVendor,
    '__WEBGL_RENDERER__': webglRenderer,
    '__CANVAS_MODE__': canvasMode,
    '__CANVAS_SEED__': String(seed),
    '__AUDIO_CONTEXT_MODE__': audioContextMode,
    '__AUDIO_SEED__': String(seed),
    '__CLIENT_RECTS_MODE__': clientRectsMode,
    '__GEO_ENABLED__': String(geoEnabled),
    '__GEO_LAT__': String(geoLat),
    '__GEO_LON__': String(geoLon),
    '__WEBRTC_USE_MAIN_IP__': String(webrtcUseMainIP),
    '__TIMEZONE__': timezone,
    '__SEED__': String(seed),
    
    // Format cũ (%%PLACEHOLDER%%) - để tương thích ngược
    '%%HARDWARE_CONCURRENCY%%': JSON.stringify(hardwareConcurrency),
    '%%DEVICE_MEMORY%%': JSON.stringify(deviceMemory),
    '%%LANGUAGES%%': languagesStr,
    '%%LANGUAGE%%': language,
    '%%SCREEN_WIDTH%%': JSON.stringify(screenWidth),
    '%%SCREEN_HEIGHT%%': JSON.stringify(screenHeight),
    '%%SCREEN_AVAIL_WIDTH%%': JSON.stringify(screenAvailWidth),
    '%%SCREEN_AVAIL_HEIGHT%%': JSON.stringify(screenAvailHeight),
    '%%SCREEN_COLOR_DEPTH%%': JSON.stringify(24),
    '%%SCREEN_PIXEL_DEPTH%%': JSON.stringify(24),
    '%%DEVICE_PIXEL_RATIO%%': JSON.stringify(1),
    '%%WEBGL_VENDOR%%': webglVendor,
    '%%WEBGL_RENDERER%%': webglRenderer,
    '%%CANVAS_MODE%%': canvasMode,
    '%%CANVAS_SEED%%': String(seed),
    '%%AUDIO_CONTEXT_MODE%%': audioContextMode,
    '%%AUDIO_SEED%%': String(seed),
    '%%CLIENT_RECTS_MODE%%': clientRectsMode,
    '%%GEO_ENABLED%%': JSON.stringify(geoEnabled),
    '%%GEO_LAT%%': JSON.stringify(geoLat),
    '%%GEO_LON%%': JSON.stringify(geoLon),
    '%%WEBRTC_USE_MAIN_IP%%': JSON.stringify(webrtcUseMainIP),
    '%%TIMEZONE%%': timezone,
    '%%SEED%%': String(seed),
  };

  // Thực hiện thay thế
  for (const [placeholder, value] of Object.entries(replacements)) {
    injectionScript = injectionScript.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
  }

  console.log(`[LIFECYCLE] ✅ Đã thay thế tất cả placeholders trong injection script`);
  console.log(`[LIFECYCLE] 📊 Thông tin fingerprint:`);
  console.log(`  - User Agent: ${userAgent.substring(0, 60)}...`);
  console.log(`  - Platform: ${platform}`);
  console.log(`  - Screen: ${screenWidth}x${screenHeight}`);
  console.log(`  - WebGL: ${webglVendor} / ${webglRenderer.substring(0, 40)}...`);
  console.log(`  - Canvas: ${canvasMode}, Audio: ${audioContextMode}`);

  // ==========================================================
  // === BƯỚC 4: KHỞI CHẠY LÕI CHROMIUM VỚI CẤU HÌNH ĐẦY ĐỦ ===
  // ==========================================================
  const contextOptions: any = {
    headless: false,
    args: [
      '--disable-infobars',
      '--no-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
      '--disable-setuid-sandbox',
      '--disable-notifications',
      '--disable-popup-blocking',
      '--restore-last-session',
      '--use-fake-device-for-media-stream',
      '--use-fake-ui-for-media-stream',
      '--disable-webgpu',
      '--disable-features=WebRtcHideLocalIpsWithMdns',
      '--force-webrtc-ip-handling-policy=disable_non_proxied_udp',
      '--no-first-run',
      '--no-default-browser-check',
      '--autoplay-policy=no-user-gesture-required',
    ],
    ignoreDefaultArgs: ['--enable-automation'],
    viewport: {
      width: screenWidth,
      height: screenHeight,
    },
  };

  // Thêm proxy nếu có
  if (profile.proxy) {
    const proxy = profile.proxy;
    const server = `${proxy.type || 'http'}://${proxy.host}:${proxy.port}`;
    contextOptions.proxy = {
      server,
      username: proxy.username || undefined,
      password: proxy.password || undefined,
    };
    console.log(`[LIFECYCLE] ✅ Đã cấu hình proxy: ${server}`);
  }

  try {
    console.log(`[LIFECYCLE] 🚀 Đang khởi chạy browser với persistent context...`);
    const browserContext = await chromium.launchPersistentContext(profilePath, contextOptions);
    console.log(`[LIFECYCLE] ✅ Browser đã được khởi chạy thành công`);

    // ==========================================================
    // === BƯỚC 5: TIÊM SCRIPT KHỞI TẠO ("PHÉP THUẬT") ===
    // ==========================================================
    await browserContext.addInitScript(injectionScript);
    console.log(`[LIFECYCLE] ✅ Đã tiêm injection script vào browser`);

    // Đảm bảo có ít nhất một page
    const pages = browserContext.pages();
    let page = pages[0];
    if (!page) {
      page = await browserContext.newPage();
    }
    try {
      await page.bringToFront();
    } catch (e) {
      // Ignore
    }

    // Áp dụng User Agent qua CDP (nếu có)
    if (userAgent) {
      try {
        const client = await browserContext.newCDPSession(page);
        
        // Extract Chrome version từ userAgent
        const chromeVersionMatch = userAgent.match(/Chrome\/(\d+)/);
        const chromeMajorVersion = chromeVersionMatch ? chromeVersionMatch[1] : '120';
        const chromeFullVersion = chromeVersionMatch ? `${chromeMajorVersion}.0.6099.71` : '120.0.6099.71';
        
        // Determine OS name for userAgentMetadata
        const osName = platform === 'Win32' ? 'Windows' : 
                      platform === 'MacIntel' ? 'macOS' : 
                      'Linux';
        
        await client.send('Emulation.setUserAgentOverride', {
          userAgent: userAgent,
          platform: platform,
          userAgentMetadata: {
            brands: [
              { brand: 'Chromium', version: chromeMajorVersion },
              { brand: 'Google Chrome', version: chromeMajorVersion },
              { brand: 'Not=A?Brand', version: '8' },
            ],
            fullVersion: chromeFullVersion,
            platform: platform,
            platformVersion: osName === 'Windows' ? '10.0.0' : osName === 'macOS' ? '10.15.7' : '5.0.0',
            architecture: 'x86',
            model: '',
            mobile: false,
          },
        });
        console.log(`[LIFECYCLE] ✅ Đã áp dụng User Agent qua CDP: ${userAgent.substring(0, 60)}...`);
      } catch (cdpError) {
        console.warn(`[LIFECYCLE] ⚠️ Không thể áp dụng User Agent qua CDP:`, cdpError);
      }
    }

    console.log(`[LIFECYCLE] ✅ Profile "${profile.name}" đã khởi chạy thành công.`);
    return browserContext;
  } catch (error) {
    console.error(`[LIFECYCLE] ❌ Lỗi khi khởi chạy browser:`, error);
    throw error;
  }
}

function processInjectionTemplate(profileData: any): string {
  try {
    let template = fs.readFileSync(injectionScriptTemplatePath, 'utf-8');
    
    // LƯU Ý: userAgent không còn được fake trong injection script nữa vì đã được CDP Emulation xử lý
    const navigator = profileData?.navigator || {};
    const screen = profileData?.screen || {};
    const webgl = profileData?.webgl || {};
    const canvas = profileData?.canvas || { mode: 'Noise' };
    const audioContext = profileData?.audioContext || { mode: 'Off' };
    const clientRects = profileData?.clientRects || { mode: 'Off' };
    const geo = profileData?.geo || { enabled: false, lat: null, lon: null };
    const webrtc = profileData?.webrtc || { useMainIP: false };
    const timezone = profileData?.timezone || profileData?.timezoneId || 'America/New_York';
    const seed = profileData?.seed || profileData?.profileId || 12345;
    
    // --- FIX OS PLATFORM DETECTION ---
    let platform = navigator.platform || profileData?.platform || null;
    if (!platform) {
      const osName = profileData?.os || profileData?.osName || '';
      const osLower = osName.toLowerCase();
      const arch = profileData?.arch || profileData?.architecture || 'x64';
      
      if (osLower.includes('macos') || osLower.includes('mac')) {
        platform = 'MacIntel';
      } else if (osLower.includes('linux')) {
        platform = arch === 'x64' || arch === 'x86_64' ? 'Linux x86_64' : 'Linux i686';
      } else {
        platform = 'Win32';
      }
    }
    
    console.log(`[Injection Template] OS: ${profileData?.os || profileData?.osName || 'Unknown'}, Platform: ${platform}`);
    
    // --- FIX WEBGL VENDOR/RENDERER ---
    let webglVendor = webgl.vendor || 'Google Inc. (NVIDIA)';
    let webglRenderer = webgl.renderer || 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3080 Direct3D11 vs_5_0 ps_5_0, D3D11)';
    
    if (webgl.renderer && webgl.renderer.includes('ANGLE')) {
      webglVendor = 'Google Inc. (NVIDIA)';
    } else if (!webgl.vendor) {
      const osLower = (profileData?.os || profileData?.osName || '').toLowerCase();
      if (osLower.includes('macos') || osLower.includes('mac')) {
        webglVendor = 'Apple Inc.';
        if (!webglRenderer || webglRenderer.includes('ANGLE')) {
          webglRenderer = 'Apple M1';
        }
      } else if (osLower.includes('linux')) {
        webglVendor = 'Google Inc. (NVIDIA)';
        if (!webglRenderer || !webglRenderer.includes('ANGLE')) {
          webglRenderer = 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1060 3GB (0x00001C02) Direct3D11 vs_5_0 ps_5_0, D3D11)';
        }
      } else {
        webglVendor = 'Intel Inc.';
        if (!webglRenderer || webglRenderer.includes('ANGLE')) {
          webglRenderer = 'Intel Iris OpenGL Engine';
        }
      }
    }
    
    console.log(`[Injection Template] WebGL Vendor: ${webglVendor}`);
    console.log(`[Injection Template] WebGL Renderer: ${webglRenderer.substring(0, 80)}...`);
    
    // LƯU Ý: User-Agent và Platform KHÔNG CÒN được fake trong injection script nữa
    // CDP Emulation.setUserAgentOverride đã xử lý ở cấp engine, nên không cần replacements cho chúng
    const replacements: Record<string, string> = {
      '%%HARDWARE_CONCURRENCY%%': String(navigator.hardwareConcurrency || profileData?.hwc || profileData?.hardware?.cores || 8),
      '%%DEVICE_MEMORY%%': String(navigator.deviceMemory || profileData?.dmem || profileData?.hardware?.memoryGb || 8),
      '%%LANGUAGES%%': JSON.stringify(navigator.languages || profileData?.languages || ['en-US', 'en']),
      '%%LANGUAGE%%': JSON.stringify(navigator.language || profileData?.language || 'en-US'),
      '%%SCREEN_WIDTH%%': String(screen.width || 1920),
      '%%SCREEN_HEIGHT%%': String(screen.height || 1080),
      '%%SCREEN_AVAIL_WIDTH%%': String(screen.availWidth || screen.width || 1920),
      '%%SCREEN_AVAIL_HEIGHT%%': String(screen.availHeight || (screen.height ? screen.height - 40 : 1040)),
      '%%SCREEN_COLOR_DEPTH%%': String(screen.colorDepth || 24),
      '%%SCREEN_PIXEL_DEPTH%%': String(screen.pixelDepth || 24),
      '%%DEVICE_PIXEL_RATIO%%': String(screen.devicePixelRatio || screen.dpr || 1),
      '%%WEBGL_VENDOR%%': JSON.stringify(webglVendor),
      '%%WEBGL_RENDERER%%': JSON.stringify(webglRenderer),
      '%%CANVAS_MODE%%': JSON.stringify(canvas.mode || 'Noise'),
      '%%CANVAS_SEED%%': String(canvas.seed || seed),
      '%%AUDIO_CONTEXT_MODE%%': JSON.stringify(audioContext.mode || 'Off'),
      '%%AUDIO_SEED%%': String(audioContext.seed || seed),
      '%%CLIENT_RECTS_MODE%%': JSON.stringify(clientRects.mode || 'Off'),
      '%%GEO_ENABLED%%': String(geo.enabled || false),
      '%%GEO_LAT%%': String(geo.lat || geo.latitude || 10.762622),
      '%%GEO_LON%%': String(geo.lon || geo.longitude || 106.660172),
      '%%WEBRTC_USE_MAIN_IP%%': String(webrtc.useMainIP || false),
      '%%TIMEZONE%%': JSON.stringify(timezone),
      '%%SEED%%': String(seed)
    };
    
    Object.entries(replacements).forEach(([placeholder, value]) => {
      template = template.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
    });
    
    return template;
  } catch (error) {
    console.error('[Injection Template] Error processing template:', error);
    return buildStealthScript(profileData);
  }
}

// Store browser instances per session (Puppeteer Browser or Playwright Context)
const browserInstances = new Map<number, any>();

/**
 * Build comprehensive stealth fingerprint injection script
 * Based on Python Selenium implementation for maximum compatibility
 */
function buildStealthScript(fp: any): string {
  const fpJson = JSON.stringify(fp);
  
  return `
(() => {
  // Get fingerprint from injected or fallback to defaults
  const FP = window.__INJECTED_FINGERPRINT__ || (typeof window.__PROFILE__ !== 'undefined' ? window.__PROFILE__ : ${fpJson}) || {
    seed: 12345,
    ua: null,
    screen: { width: 1920, height: 1080, dpr: 1 },
    canvas: { mode: 'Noise' },
    webgl: { metaMode: 'Mask', imageMode: 'Off' },
    audioContext: { mode: 'Noise' },
    clientRects: { mode: 'Noise' },
    geo: { enabled: false, lat: null, lon: null },
    webrtc: { useMainIP: false },
    seedFallback: 1234567
  };
  
  // ---------- seeded PRNG (xorshift32) ----------
  function xorshift32(seed) {
    let x = seed >>> 0;
    return function() {
      x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
      return (x >>> 0) / 4294967295;
    };
  }
  
  const seed = (FP && (FP.seed || FP.seedFallback || FP.profileId || 12345)) >>> 0;
  const rand = xorshift32(seed);
  
  // ---------- helpers ----------
  function randInt(min, max) { return Math.floor(rand() * (max - min + 1)) + min; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  
  // ---------- navigator properties ----------
  try {
    if (typeof navigator !== 'undefined') {
      try { Object.defineProperty(navigator, 'webdriver', { get: () => false, configurable: true }); } catch(e){/*ignore*/}
      
      const fakeUA = FP.ua || FP.userAgent || FP.user_agent || null;
      const fakeHC = FP.hwc || FP.hardware?.cores || (4 + (seed % 4)); // 4..7
      const fakeDM = FP.dmem || FP.hardware?.memoryGb || 4; // GB
      
      let fakePlatform = FP.platform;
      if (!fakePlatform) {
        const osName = FP.os || FP.osName || '';
        const osLower = osName.toLowerCase();
        const arch = FP.arch || FP.architecture || 'x64';
        
        if (osLower.includes('macos') || osLower.includes('mac')) {
          fakePlatform = 'MacIntel';
        } else if (osLower.includes('linux')) {
          fakePlatform = arch === 'x64' || arch === 'x86_64' ? 'Linux x86_64' : 'Linux i686';
        } else {
          fakePlatform = 'Win32';
        }
      }
      
      const fakeLangs = FP.languages || ['en-US', 'en'];
      
      if (fakeUA) {
        try { Object.defineProperty(navigator, 'userAgent', { get: () => fakeUA, configurable: true }); } catch(e){}
      }
      try { Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => fakeHC, configurable: true }); } catch(e){}
      try { Object.defineProperty(navigator, 'deviceMemory', { get: () => fakeDM, configurable: true }); } catch(e){}
      try { Object.defineProperty(navigator, 'platform', { get: () => fakePlatform, configurable: true }); } catch(e){}
      try { Object.defineProperty(navigator, 'languages', { get: () => fakeLangs, configurable: true }); } catch(e){}
      try { Object.defineProperty(navigator, 'language', { get: () => fakeLangs[0] || 'en-US', configurable: true }); } catch(e){}
    }
  } catch(e){/*ignore*/}
  
  // ---------- Canvas: deterministic noise or block ----------
  (function canvasPatch(){
    const mode = (FP.canvas && FP.canvas.mode) || (FP.canvasMode) || 'Noise';
    if (mode === 'Block') {
      try {
        HTMLCanvasElement.prototype.toDataURL = function() { throw new Error('Canvas blocked'); };
        HTMLCanvasElement.prototype.toBlob = function() { throw new Error('Canvas blocked'); };
      } catch(e){}
      return;
    }
    // deterministic noise: mutate getImageData and toDataURL via context
    const origGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, attrs) {
      const ctx = origGetContext.call(this, type, attrs);
      if (!ctx) return ctx;
      if (type === '2d') {
        try {
          const orig_getImageData = ctx.getImageData;
          ctx.getImageData = function(x, y, w, h) {
            const data = orig_getImageData.call(this, x, y, w, h);
            // apply low-magnitude deterministic noise
            const len = data.data.length;
            for (let i = 0; i < len; i += 4) {
              // small jitter - deterministic
              const j = Math.floor((rand() - 0.5) * 6); // -3..+2
              data.data[i] = (data.data[i] + j) & 255;
              data.data[i+1] = (data.data[i+1] + j) & 255;
              data.data[i+2] = (data.data[i+2] + j) & 255;
            }
            return data;
          };
        } catch(e){}
      }
      return ctx;
    };
  })();
  
  // ---------- WebGL/WebGL2 + OffscreenCanvas: mask vendor/renderer & mute debug ----------
  (function webglPatch(){
    const VENDOR = (FP.webgl && FP.webgl.vendor) || 'PolyVendor Labs';
    const RENDER = (FP.webgl && FP.webgl.renderer) || 'PolyRenderer 1.0';
    const REAL = FP.webgl && FP.webgl.metaMode === 'Real';
    
    function hardDefine(obj, name, fn) {
      try {
        Object.defineProperty(obj, name, { value: fn, configurable: true });
      } catch(e) {
        try { obj[name] = fn; } catch(_){/* ignore */}
      }
    }
    
    function patchProto(proto) {
      if (!proto) return;
      
      const orig_getParameter = proto.getParameter;
      const orig_getExtension = proto.getExtension;
      const orig_getSupported = proto.getSupportedExtensions;
      const orig_readPixels = proto.readPixels;
      const orig_prec = proto.getShaderPrecisionFormat;
      
      hardDefine(proto, 'getParameter', function(param) {
        try {
          if (!REAL) {
            if (param === 37445) return VENDOR;   // UNMASKED_VENDOR_WEBGL
            if (param === 37446) return RENDER;   // UNMASKED_RENDERER_WEBGL
          }
          return orig_getParameter.call(this, param);
        } catch(e) { return null; }
      });
      
      hardDefine(proto, 'getExtension', function(name) {
        if (name && /WEBGL_debug/.test(name)) return null;
        return orig_getExtension.call(this, name);
      });
      
      hardDefine(proto, 'getSupportedExtensions', function() {
        const list = (orig_getSupported && orig_getSupported.call(this)) || [];
        return list.filter(e => !/debug|unmasked/i.test(e));
      });
      
      // make pixel hash deterministic-but-different
      hardDefine(proto, 'readPixels', function(x, y, w, h, fmt, typ, pix) {
        try {
          orig_readPixels.call(this, x, y, w, h, fmt, typ, pix);
          if (!pix || !pix.length) return;
          for (let i = 0; i < Math.min(256, pix.length); i += 4) {
            pix[i] = (pix[i] + ((FP.seed || seed || 12345) % 7)) & 255;
          }
        } catch(e) {}
      });
      
      hardDefine(proto, 'getShaderPrecisionFormat', function(t, p) {
        try {
          const v = orig_prec.call(this, t, p);
          if (!v) return v;
          return { rangeMin: v.rangeMin, rangeMax: v.rangeMax, precision: Math.max(8, v.precision) };
        } catch(e) { return { rangeMin: 0, rangeMax: 0, precision: 8 }; }
      });
    }
    
    // WebGL1 + WebGL2
    if (window.WebGLRenderingContext) patchProto(WebGLRenderingContext.prototype);
    if (window.WebGL2RenderingContext) patchProto(WebGL2RenderingContext.prototype);
    
    // OffscreenCanvas contexts
    if (window.OffscreenCanvas) {
      const orig = OffscreenCanvas.prototype.getContext;
      hardDefine(OffscreenCanvas.prototype, 'getContext', function(type, opts) {
        const ctx = orig.call(this, type, opts);
        try {
          const p = Object.getPrototypeOf(ctx);
          patchProto(p); // patch instance proto too
        } catch(e) {}
        return ctx;
      });
    }
  })();

  // ---------- Audio fingerprint: patch OfflineAudioContext & Analyser deterministic ----------
  (function audioPatch(){
    const audioSeed = (FP.seed || seed || 12345) >>> 0;
    const mode = (FP.audioContext && FP.audioContext.mode) || (FP.audioCtxMode) || 'Off';
    
    if (mode === 'Noise') {
      // OfflineAudioContext (được dùng để render buffer rồi hash)
      try {
        const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
        if (OAC && OAC.prototype && OAC.prototype.startRendering) {
          const origStart = OAC.prototype.startRendering;
          Object.defineProperty(OAC.prototype, 'startRendering', {
            value: function() {
              const ret = origStart.apply(this, arguments);
              return Promise.resolve(ret).then(buf => {
                try {
                  const ch = buf.numberOfChannels;
                  for (let c = 0; c < ch; c++) {
                    const data = buf.getChannelData(c);
                    for (let i = 0; i < data.length; i += 128) {
                      // nhiễu rất nhỏ nhưng ổn định theo seed
                      data[i] = data[i] + ((audioSeed % 9) - 4) * 1e-7;
                    }
                  }
                } catch(e) {}
                return buf;
              });
            },
            configurable: true
          });
        }
      } catch(e) {}
      
      // Realtime Analyser (ít site dùng, nhưng patch cho chắc)
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC && AC.prototype && AC.prototype.createAnalyser) {
          const origCreate = AC.prototype.createAnalyser;
          Object.defineProperty(AC.prototype, 'createAnalyser', {
            value: function() {
              const an = origCreate.call(this);
              if (an && an.getFloatTimeDomainData) {
                const orig = an.getFloatTimeDomainData.bind(an);
                an.getFloatTimeDomainData = function(arr) {
                  orig(arr);
                  for (let i = 0; i < arr.length; i += 128) {
                    arr[i] = arr[i] + ((audioSeed % 7) * 1e-7);
                  }
                };
              }
              return an;
            },
            configurable: true
          });
        }
      } catch(e) {}
    }
  })();
  
  // ---------- clientRects: getBoundingClientRect + getClientRects ----------
  (function rectsPatch(){
    const elProto = Element.prototype;
    const mode = (FP.clientRects && FP.clientRects.mode) || (FP.clientRectsMode) || 'Off';
    if (mode === 'Noise') {
      const orig_getBoundingClientRect = elProto.getBoundingClientRect;
      elProto.getBoundingClientRect = function() {
        const r = orig_getBoundingClientRect.call(this);
        const jitter = ((seed % 5) - 2) / 100; // small deterministic jitter
        return {
          x: r.x + jitter, y: r.y + jitter, width: r.width + jitter, height: r.height + jitter,
          top: r.top + jitter, left: r.left + jitter, right: r.right + jitter, bottom: r.bottom + jitter
        };
      };
      const orig_getClientRects = elProto.getClientRects;
      elProto.getClientRects = function() {
        const col = orig_getClientRects.call(this);
        // could adjust rects values similarly if needed
        return col;
      };
    }
  })();
  
  // ---------- WebRTC: intercept ICE candidates (drop local private) ----------
  (function webrtcPatch(){
    try {
      const OrigPeer = window.RTCPeerConnection;
      if (!OrigPeer) return;
      function FakePC(...args) {
        const pc = new OrigPeer(...args);
        // intercept onicecandidate addEventListener
        const origAddEvent = pc.addEventListener.bind(pc);
        pc.addEventListener = function(type, listener, ...rest) {
          if (type === 'icecandidate') {
            const wrapped = function(e) {
              if (!e || !e.candidate) return;
              const cand = e.candidate.candidate || '';
              // if useMainIP false -> drop private addresses
              if (!FP.webrtc || !FP.webrtc.useMainIP) {
                // drop local/private IP candidates
                if (/(10\\.|192\\.168\\.|172\\.(1[6-9]|2[0-9]|3[0-1])|169\\.254\\.)/.test(cand)) return;
              }
              try { listener.call(this, e); } catch(err){}
            };
            return origAddEvent(type, wrapped, ...rest);
          }
          return origAddEvent(type, listener, ...rest);
        };
        return pc;
      }
      FakePC.prototype = OrigPeer.prototype;
      window.RTCPeerConnection = FakePC;
    } catch(e){}
  })();
  
  // ---------- Geolocation override ----------
  (function geoPatch(){
    if (FP.geo && FP.geo.enabled) {
      try {
        const fakePos = {
          coords: {
            latitude: FP.geo.lat || 10.762622,
            longitude: FP.geo.lon || 106.660172,
            accuracy: 50
          }
        };
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition = function(success, error, opts) {
            setTimeout(()=> success(fakePos), 10);
          };
          navigator.geolocation.watchPosition = function(success, error, opts) {
            const id = Math.floor(rand()*100000);
            setTimeout(()=> success(fakePos), 10);
            return id;
          };
        }
      } catch(e){}
    }
  })();
  
  // ---------- Fonts fingerprinting protection ----------
  (function fontsPatch(){
    try {
      const origOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth') || 
        Object.getOwnPropertyDescriptor(Element.prototype, 'offsetWidth');
      const origOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight') || 
        Object.getOwnPropertyDescriptor(Element.prototype, 'offsetHeight');
      
      if (origOffsetWidth && origOffsetWidth.get) {
        Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
          get: function() {
            const val = origOffsetWidth.get.call(this);
            const jitter = ((seed % 3) - 1);
            return Math.max(0, val + jitter);
          },
          configurable: true
        });
      }
      
      if (origOffsetHeight && origOffsetHeight.get) {
        Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
          get: function() {
            const val = origOffsetHeight.get.call(this);
            const jitter = ((seed % 3) - 1);
            return Math.max(0, val + jitter);
          },
          configurable: true
        });
      }
    } catch(e){}
    
    try {
      const origGetComputedStyle = window.getComputedStyle;
      window.getComputedStyle = function(el, pseudo) {
        const style = origGetComputedStyle.call(this, el, pseudo);
        if (el && el.tagName) {
          try {
            const proxy = new Proxy(style, {
              get: function(target, prop) {
                if (prop === 'fontFamily' || prop === 'fontSize') {
                  const val = target[prop];
                  return val;
                }
                return target[prop];
              }
            });
            return proxy;
          } catch(e){}
        }
        return style;
      };
    } catch(e){}
  })();

  // ---------- Plugins spoofing ----------
  (function pluginsPatch(){
    try {
      const fakePlugins = [
        {
          name: 'Chrome PDF Plugin',
          description: 'Portable Document Format',
          filename: 'internal-pdf-viewer',
          length: 1,
          item: function(index) {
            return index === 0 ? {
              type: 'application/pdf',
              suffixes: 'pdf',
              description: 'Portable Document Format',
              enabledPlugin: fakePlugins[0]
            } : null;
          },
          namedItem: function(type) { return null; }
        },
        {
          name: 'Chrome PDF Viewer',
          description: '',
          filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai',
          length: 1,
          item: function(index) { return null; },
          namedItem: function(type) { return null; }
        },
        {
          name: 'Native Client',
          description: '',
          filename: 'internal-nacl-plugin',
          length: 2,
          item: function(index) { return null; },
          namedItem: function(type) { return null; }
        }
      ];
      
      Object.defineProperty(navigator, 'plugins', {
        get: () => {
          const pluginArray = {
            length: fakePlugins.length,
            item: function(index) { return fakePlugins[index] || null; },
            namedItem: function(name) {
              for (const p of fakePlugins) {
                if (p.name === name) return p;
              }
              return null;
            },
            refresh: function() {},
            [Symbol.iterator]: function* () {
              for (const p of fakePlugins) yield p;
            }
          };
          for (let i = 0; i < fakePlugins.length; i++) {
            Object.defineProperty(pluginArray, i, {
              get: () => fakePlugins[i],
              configurable: true
            });
          }
          return pluginArray;
        },
        configurable: true
      });
      
      Object.defineProperty(navigator, 'mimeTypes', {
        get: () => {
          const mimeArray = {
            length: 1,
            item: function(index) {
              return index === 0 ? {
                type: 'application/pdf',
                suffixes: 'pdf',
                description: 'Portable Document Format',
                enabledPlugin: fakePlugins[0]
              } : null;
            },
            namedItem: function(type) {
              return type === 'application/pdf' ? {
                type: 'application/pdf',
                suffixes: 'pdf',
                description: 'Portable Document Format',
                enabledPlugin: fakePlugins[0]
              } : null;
            },
            [Symbol.iterator]: function* () {
              if (mimeArray.item(0)) yield mimeArray.item(0);
            }
          };
          Object.defineProperty(mimeArray, 0, {
            get: () => mimeArray.item(0),
            configurable: true
          });
          return mimeArray;
        },
        configurable: true
      });
    } catch(e){}
  })();

  // ---------- Screen properties ----------
  (function screenPatch(){
    if (FP.screen) {
      try {
        Object.defineProperty(screen, 'width', { get: () => FP.screen.width || 1920, configurable: true });
        Object.defineProperty(screen, 'height', { get: () => FP.screen.height || 1080, configurable: true });
        Object.defineProperty(screen, 'availWidth', { get: () => (FP.screen.width || 1920), configurable: true });
        Object.defineProperty(screen, 'availHeight', { get: () => (FP.screen.height || 1080) - 40, configurable: true });
        Object.defineProperty(screen, 'colorDepth', { get: () => 24, configurable: true });
        Object.defineProperty(screen, 'pixelDepth', { get: () => 24, configurable: true });
        if (FP.screen.dpr) {
          Object.defineProperty(window, 'devicePixelRatio', { get: () => FP.screen.dpr || 1, configurable: true });
        }
      } catch(e){}
    }
  })();

  // ---------- Timezone ----------
  (function timezonePatch(){
    if (FP.timezone || FP.timezoneId) {
      try {
        const tz = FP.timezone || FP.timezoneId || 'America/New_York';
        const origToLocaleString = Date.prototype.toLocaleString;
        Date.prototype.toLocaleString = function(locales, options) {
          if (options && options.timeZone) {
            options.timeZone = tz;
          }
          return origToLocaleString.call(this, locales, options);
        };
        
        const origToLocaleDateString = Date.prototype.toLocaleDateString;
        Date.prototype.toLocaleDateString = function(locales, options) {
          if (options && options.timeZone) {
            options.timeZone = tz;
          }
          return origToLocaleDateString.call(this, locales, options);
        };
        
        const origToLocaleTimeString = Date.prototype.toLocaleTimeString;
        Date.prototype.toLocaleTimeString = function(locales, options) {
          if (options && options.timeZone) {
            options.timeZone = tz;
          }
          return origToLocaleTimeString.call(this, locales, options);
        };
      } catch(e){}
    }
  })();

  // ---------- mark injected for debug ----------
  try { Object.defineProperty(window, '__INJECTED_FINGERPRINT__', { value: FP, configurable:false }); } catch(e){}

  // Remove Chrome automation indicators
  try { 
    delete window.chrome; 
    window.chrome = { 
      runtime: {},
      loadTimes: function() {},
      csi: function() {},
      app: {}
    };
  } catch(e){}
  
  try {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined, configurable: true });
  } catch(e){}

  // Override permissions query
  try {
    if (navigator.permissions && navigator.permissions.query) {
      const originalQuery = navigator.permissions.query;
      navigator.permissions.query = function(parameters) {
        if (parameters.name === 'notifications') {
          return Promise.resolve({ state: Notification.permission || 'default' });
        }
        if (parameters.name === 'geolocation') {
          return Promise.resolve({ state: 'prompt' });
        }
        try {
          return originalQuery.call(this, parameters);
        } catch(e) {
          return Promise.resolve({ state: 'prompt' });
        }
      };
    }
  } catch(e){}
  
  // Hide automation indicators
  try {
    delete window.__playwright;
    delete window.__pw_manual;
    delete window.__pw_original;
    delete window.__PUPPETEER_WORLD__;
    delete window.__pw;
  } catch(e){}
})();
`;
}

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

export async function launchBrowser(options: BrowserLaunchOptions & { profile?: any }): Promise<any> {
  const { profileId, sessionId, userAgent: userAgentFromOptions, fingerprint, proxy, profile } = options;
  
  // === VŨ KHÍ #1: USER AGENT HIỆN ĐẠI - LẤY TỪ PROFILE TRONG DB ===
  // User agent cũ (Chrome 17) là một lá cờ đỏ khổng lồ.
  // Hãy dùng một user agent của năm 2023-2024 (Chrome 118+).
  const defaultModernUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36';
  
  // === LOGIC ĐÚNG: ƯU TIÊN LẤY TỪ PROFILE TRONG DB ===
  // Ưu tiên: profile.userAgent/user_agent (từ DB) > userAgent từ options > fingerprint > mặc định hiện đại
  const userAgent = profile?.userAgent || 
                    profile?.user_agent || 
                    userAgentFromOptions || 
                    fingerprint?.userAgent || 
                    fingerprint?.user_agent || 
                    fingerprint?.ua || 
                    defaultModernUserAgent;

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

  // === NÂNG CẤP VŨ KHÍ: LUÔN DÙNG launchPersistentContext ĐỂ TRÁNH BỊ PHÁT HIỆN ===
  // Đảm bảo thư mục profile tồn tại
  if (!fs.existsSync(profileDir)) {
    fs.mkdirSync(profileDir, { recursive: true });
  }

  // Close any existing instance for this session
  try {
    const existing = browserInstances.get(sessionId);
    if (existing) {
      await existing.close().catch(() => {});
      browserInstances.delete(sessionId);
    }
  } catch {}

  // Build context options cho launchPersistentContext
  const contextOptions: any = {
    headless: false,
    args: [
      // Các tham số để ẩn dấu hiệu tự động hóa và chống phát hiện bot
      '--disable-blink-features=AutomationControlled',
      '--disable-infobars', // Tắt thanh thông báo "Chrome is being controlled..."
      '--disable-dev-shm-usage',
      '--no-sandbox', // Thường cần thiết trong một số môi trường
      '--disable-setuid-sandbox',
      '--disable-notifications',
      '--disable-popup-blocking',
      '--restore-last-session', // Khôi phục session trước đó để trông tự nhiên hơn
      '--use-fake-device-for-media-stream',
      '--use-fake-ui-for-media-stream',
      '--disable-webgpu',
      '--disable-features=WebRtcHideLocalIpsWithMdns',
      '--force-webrtc-ip-handling-policy=disable_non_proxied_udp',
      '--no-first-run',
      '--no-default-browser-check',
      '--autoplay-policy=no-user-gesture-required',
    ],
    // Bỏ qua các default args tự động hóa
    ignoreDefaultArgs: ['--enable-automation'],
  };

  // Thêm proxy nếu có
  if (proxy) {
    const server = `${proxy.type}://${proxy.host}:${proxy.port}`;
    contextOptions.proxy = {
      server,
      username: proxy.username || undefined,
      password: proxy.password || undefined,
    };
  }
  
  // === VŨ KHÍ #2: VIEWPORT TIÊU CHUẨN - LẤY TỪ PROFILE TRONG DB ===
  // Giả lập một màn hình desktop Full HD thông thường (1920x1080) thay vì 1280x720 cũ
  // === LOGIC ĐÚNG: ƯU TIÊN LẤY TỪ PROFILE TRONG DB ===
  const screenWidth = profile?.screenWidth || fingerprint?.viewport?.width || fingerprint?.screenWidth || 1920;
  const screenHeight = profile?.screenHeight || fingerprint?.viewport?.height || fingerprint?.screenHeight || 1080;
  
  contextOptions.viewport = {
    width: screenWidth,
    height: screenHeight,
  };
  
  // WebGL/GPU renderer masking at system level (ép WebGL dùng SwiftShader)
  const useSwiftShader = fingerprint?.webgl?.useSwiftShader || fingerprint?.webglImageMode === 'swiftshader';
  if (useSwiftShader) {
    contextOptions.args.push('--use-gl=swiftshader');          // ép WebGL dùng SwiftShader
    contextOptions.args.push('--use-angle=swiftshader');       // ANGLE -> swiftshader
    contextOptions.args.push('--disable-software-rasterizer=false');
  }

  // === NÂNG CẤP VŨ KHÍ: LUÔN DÙNG launchPersistentContext ĐỂ TRÁNH BỊ PHÁT HIỆN ===
  try {
    console.log(`[Browser ${sessionId}] ✅ Khởi chạy với STEALTH MODE - Playwright-Extra + Stealth Plugin + Persistent Context`);
    console.log(`[Browser ${sessionId}] ✅ Sử dụng profile thật: ${profileDir}`);
    const context = await chromium.launchPersistentContext(profileDir, contextOptions);
    browserInstances.set(sessionId, context);

    // Ensure at least one page exists and is frontmost
    const pages = context.pages();
    let page: Page | undefined = pages[0];
    if (!page) page = await context.newPage();
    try { await page.bringToFront(); } catch {}

    // --- BƯỚC 2: ĐÂY LÀ PHẦN "MA THUẬT" CDP EMULATION ---
    // Tạo một phiên kết nối trực tiếp đến Chrome DevTools Protocol
    // Ra lệnh cho trình duyệt ghi đè User-Agent ở cấp độ nhân (engine-level)
    // BƯỚC QUAN TRỌNG NHẤT: DÙNG LỆNH GIẢ LẬP
    // Lệnh này sẽ ghi đè User-Agent (HTTP), User-Agent (JS), Platform (JS)
    // và các Client Hint (Sec-CH-UA) liên quan một cách nhất quán.
    // === VŨ KHÍ #1: USER AGENT HIỆN ĐẠI - ÁP DỤNG QUA CDP ===
    // Luôn áp dụng user-agent (có thể là mặc định hiện đại hoặc từ profile)
    if (userAgent) {
      try {
        const client = await context.newCDPSession(page);
        
        // Extract Chrome version từ userAgent string (ví dụ: "Chrome/120.0.0.0" -> "120")
        const chromeVersionMatch = userAgent.match(/Chrome\/(\d+)/);
        const chromeMajorVersion = chromeVersionMatch ? chromeVersionMatch[1] : '120';
        const chromeFullVersion = chromeVersionMatch ? `${chromeMajorVersion}.0.6099.71` : '120.0.6099.71';
        
        // Determine platform string
        const platform = fingerprint?.platform || 
          (fingerprint?.os === 'Windows' ? 'Win32' : 
           fingerprint?.os === 'Mac OS' ? 'MacIntel' : 
           'Linux x86_64');
        
        // Determine OS name for userAgentMetadata
        const osName = platform === 'Win32' ? 'Windows' : 
                      platform === 'MacIntel' ? 'macOS' : 
                      'Linux';
        
        await client.send('Emulation.setUserAgentOverride', {
          userAgent: userAgent,
          platform: platform, // <-- Ghi đè platform ở đây luôn
          
          // Các User-Agent Client Hint để trông giống thật hơn
          userAgentMetadata: {
            brands: [
              { brand: 'Not_A Brand', version: '8' },
              { brand: 'Chromium', version: chromeMajorVersion },
              { brand: 'Google Chrome', version: chromeMajorVersion }
            ],
            fullVersion: chromeFullVersion,
            platform: osName,
            platformVersion: osName === 'Windows' ? '10.0.0' : osName === 'macOS' ? '13.0.0' : '5.15.0',
            architecture: 'x86',
            model: '',
            mobile: false
          }
        });
        
        console.log(`[Browser ${sessionId}] ✅ CDP Emulation.setUserAgentOverride applied: ${userAgent.substring(0, 80)}...`);
        console.log(`[Browser ${sessionId}] ✅ Platform: ${platform}, Chrome Version: ${chromeMajorVersion}`);
        if (userAgent === defaultModernUserAgent) {
          console.log(`[Browser ${sessionId}] ℹ️ Đang sử dụng User-Agent mặc định hiện đại (Chrome 118)`);
        }
      } catch (cdpError) {
        console.warn(`[Browser ${sessionId}] ⚠️ Failed to apply CDP Emulation.setUserAgentOverride:`, cdpError);
      }
    } else {
      // Fallback: Nếu vẫn không có userAgent, dùng mặc định hiện đại
      console.warn(`[Browser ${sessionId}] ⚠️ Không có User-Agent được cung cấp, sử dụng mặc định hiện đại...`);
      try {
        const client = await context.newCDPSession(page);
        await client.send('Emulation.setUserAgentOverride', {
          userAgent: defaultModernUserAgent,
          platform: 'Win32',
          userAgentMetadata: {
            brands: [
              { brand: 'Not_A Brand', version: '8' },
              { brand: 'Chromium', version: '118' },
              { brand: 'Google Chrome', version: '118' }
            ],
            fullVersion: '118.0.0.0',
            platform: 'Windows',
            platformVersion: '10.0.0',
            architecture: 'x86',
            model: '',
            mobile: false
          }
        });
        console.log(`[Browser ${sessionId}] ✅ Đã áp dụng User-Agent mặc định hiện đại (Chrome 118)`);
      } catch (fallbackError) {
        console.error(`[Browser ${sessionId}] ❌ Không thể áp dụng User-Agent mặc định:`, fallbackError);
      }
    }
    // --- KẾT THÚC PHẦN "MA THUẬT" CDP EMULATION ---

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

    // Inject fingerprint for Playwright context
    if (fingerprint) {
      try {
        const normalizedFp: any = {
          ...fingerprint,
          profileId: profileId,
          userAgent: fingerprint.userAgent || fingerprint.user_agent || fingerprint.ua || userAgent || null,
          ua: fingerprint.ua || fingerprint.userAgent || fingerprint.user_agent || userAgent || null,
          os: fingerprint.os || fingerprint.osName || null,
          osName: fingerprint.osName || fingerprint.os || null,
          platform: fingerprint.platform || null,
          navigator: {
            platform: fingerprint.platform || null,
            hardwareConcurrency: fingerprint.hwc || fingerprint.hardware?.cores || null,
            deviceMemory: fingerprint.dmem || fingerprint.hardware?.memoryGb || null,
            languages: fingerprint.languages || null,
            language: fingerprint.language || null
          },
          screen: fingerprint.screen || {
            width: fingerprint.viewport?.width || 1920,
            height: fingerprint.viewport?.height || 1080,
            availWidth: fingerprint.viewport?.width || 1920,
            availHeight: (fingerprint.viewport?.height || 1080) - 40,
            colorDepth: 24,
            pixelDepth: 24,
            devicePixelRatio: fingerprint.viewport?.deviceScaleFactor || 1
          },
          webgl: fingerprint.webgl || {
            vendor: null,
            renderer: null,
            imageMode: fingerprint.webglImageMode,
            metaMode: fingerprint.webglMetaMode,
          },
          canvas: fingerprint.canvas || (fingerprint.canvasMode ? { mode: fingerprint.canvasMode } : { mode: 'Noise' }),
          clientRects: fingerprint.clientRects || (fingerprint.clientRectsMode ? { mode: fingerprint.clientRectsMode } : { mode: 'Off' }),
          audioContext: fingerprint.audioContext || (fingerprint.audioCtxMode ? { mode: fingerprint.audioCtxMode } : { mode: 'Off' }),
          geo: fingerprint.geo || (fingerprint.geoEnabled !== undefined ? { enabled: fingerprint.geoEnabled, lat: fingerprint.geoLat, lon: fingerprint.geoLon } : { enabled: false }),
          webrtc: fingerprint.webrtc || (fingerprint.webrtcMainIP !== undefined ? { useMainIP: fingerprint.webrtcMainIP } : { useMainIP: false }),
          timezone: fingerprint.timezone || fingerprint.timezoneId || null,
          seed: fingerprint.seed || profileId || 12345
        };
        
        const deepInjectionScript = processInjectionTemplate(normalizedFp);
        const stealthScript = buildStealthScript(normalizedFp);
        
        for (const p of context.pages()) {
          await p.addInitScript({ path: fingerprintPatchPath });
          await p.addInitScript({ path: audioSpoofPath });
          await p.addInitScript(deepInjectionScript);
          await p.addInitScript(stealthScript);
        }
        context.on('page', (newPage) => {
          newPage.addInitScript({ path: fingerprintPatchPath }).catch(() => {});
          newPage.addInitScript({ path: audioSpoofPath }).catch(() => {});
          newPage.addInitScript(deepInjectionScript).catch(() => {});
          newPage.addInitScript(stealthScript).catch(() => {});
        });
        console.log(`[Browser ${sessionId}] ✅ Stealth fingerprint injected for Playwright context với Stealth Plugin`);
      } catch (fpError) {
        console.warn(`[Browser ${sessionId}] Failed to inject fingerprint for Playwright:`, fpError);
      }
    }

    return context;
  } catch (playwrightError: any) {
    console.error(`[Browser ${sessionId}] Playwright launchPersistentContext failed:`, playwrightError);
    // If Playwright fails (e.g., browser not installed), fallback to Puppeteer
    console.log(`[Browser ${sessionId}] ⚠️ Falling back to Puppeteer (không khuyến khích - dễ bị phát hiện)...`);
    // Continue to Puppeteer path below
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
    '--use-fake-device-for-media-stream',
    '--use-fake-ui-for-media-stream',
    '--disable-webgpu',
    '--disable-features=WebRtcHideLocalIpsWithMdns',
    '--force-webrtc-ip-handling-policy=disable_non_proxied_udp',
    '--no-first-run',
    '--no-default-browser-check',
    '--autoplay-policy=no-user-gesture-required',
  ];
  // Only allow restoring last session when no proxy auth is required, otherwise
  // Chrome will attempt to load tabs before we can authenticate and show a dialog.
  const needsProxyAuth = !!(proxy && proxy.username);
  if (!needsProxyAuth) {
    launchArgs.push('--restore-last-session');
  }
  
  // WebGL/GPU renderer masking at system level (ép WebGL dùng SwiftShader) - chỉ dùng trong Puppeteer fallback
  const useSwiftShaderPuppeteer = fingerprint?.webgl?.useSwiftShader || fingerprint?.webglImageMode === 'swiftshader';
  if (useSwiftShaderPuppeteer) {
    launchArgs.push('--use-gl=swiftshader');          // ép WebGL dùng SwiftShader
    launchArgs.push('--use-angle=swiftshader');       // ANGLE -> swiftshader
    launchArgs.push('--disable-software-rasterizer=false');
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

  // Inject comprehensive stealth fingerprint script (only if page is still valid)
  if (fingerprint && !page.isClosed()) {
    try {
      // Normalize fingerprint format: support both old format (nested) and new format (flat)
      const normalizedFp: any = {
        ...fingerprint,
        // Add profileId for deterministic seeded noise (canvas, etc.)
        profileId: profileId,
        // Ensure userAgent is included in fingerprint for JavaScript override
        ua: fingerprint.ua || fingerprint.userAgent || fingerprint.user_agent || userAgent || null,
        userAgent: fingerprint.userAgent || fingerprint.user_agent || fingerprint.ua || userAgent || null,
        // Map flat DB fields to nested format for script compatibility
        canvas: fingerprint.canvas || (fingerprint.canvasMode ? { mode: fingerprint.canvasMode } : undefined),
        clientRects: fingerprint.clientRects || (fingerprint.clientRectsMode ? { mode: fingerprint.clientRectsMode } : undefined),
        audioContext: fingerprint.audioContext || (fingerprint.audioCtxMode ? { mode: fingerprint.audioCtxMode } : undefined),
        webgl: fingerprint.webgl || {
          imageMode: fingerprint.webglImageMode,
          metaMode: fingerprint.webglMetaMode,
        },
        geo: fingerprint.geo || (fingerprint.geoEnabled !== undefined ? { enabled: fingerprint.geoEnabled } : undefined),
        webrtc: fingerprint.webrtc || (fingerprint.webrtcMainIP !== undefined ? { useMainIP: fingerprint.webrtcMainIP } : undefined),
      };
      
      // Languages
      if (Array.isArray(fingerprint.languages) && fingerprint.languages.length) {
        await page.evaluateOnNewDocument((ls: string[]) => {
          // @ts-ignore - This code runs in browser context, navigator exists
          Object.defineProperty(navigator, 'languages', { get: () => ls });
          // @ts-ignore - This code runs in browser context, navigator exists
          Object.defineProperty(navigator, 'language', { get: () => ls[0] || 'en-US' });
        }, fingerprint.languages);
      }
      
      // Geolocation permissions (if enabled)
      if (normalizedFp.geo && normalizedFp.geo.enabled) {
        try {
          await page.browserContext().overridePermissions('https://www.google.com', ['geolocation']);
        } catch {}
        if (fingerprint.geolocation) {
          try {
            const { latitude, longitude, accuracy } = fingerprint.geolocation;
            await page.setGeolocation({ latitude, longitude, accuracy: accuracy ?? 100 });
          } catch {}
        }
      }
      
      // Inject scripts as early as possible: fingerprint patch, audio spoof, then stealth script using CDP (like Python Selenium)
      const stealthScript = buildStealthScript(normalizedFp);
      try {
        const client = await page.target().createCDPSession();
        // Inject scripts in order: fingerprint patch, audio spoof, then stealth script
        await client.send('Page.addScriptToEvaluateOnNewDocument', { source: fingerprintPatchScript });
        await client.send('Page.addScriptToEvaluateOnNewDocument', { source: audioSpoofScript });
        await client.send('Page.addScriptToEvaluateOnNewDocument', { source: stealthScript });
        console.log(`[Browser ${sessionId}] Fingerprint patch, audio spoof, and stealth script injected via CDP`);
      } catch (cdpError) {
        // Fallback to evaluateOnNewDocument if CDP fails
        await page.evaluateOnNewDocument(new Function(fingerprintPatchScript) as any);
        await page.evaluateOnNewDocument(new Function(audioSpoofScript) as any);
        await page.evaluateOnNewDocument(new Function(stealthScript) as any);
        console.log(`[Browser ${sessionId}] Fingerprint patch, audio spoof, and stealth script injected via evaluateOnNewDocument`);
      }
    } catch (fpError) {
      console.warn(`[Browser ${sessionId}] Failed to inject fingerprint:`, fpError);
    }
  } else if (!page.isClosed()) {
    // Even without fingerprint, inject fingerprint patch, audio spoof, and basic stealth (webdriver hiding)
    try {
      // Inject fingerprint patch and audio spoof
      try {
        const client = await page.target().createCDPSession();
        await client.send('Page.addScriptToEvaluateOnNewDocument', { source: fingerprintPatchScript });
        await client.send('Page.addScriptToEvaluateOnNewDocument', { source: audioSpoofScript });
      } catch (cdpError) {
        await page.evaluateOnNewDocument(new Function(fingerprintPatchScript) as any);
        await page.evaluateOnNewDocument(new Function(audioSpoofScript) as any);
      }
      // Inject basic stealth
      await page.evaluateOnNewDocument(() => {
        // @ts-ignore - This code runs in browser context, navigator exists
        Object.defineProperty(navigator, 'webdriver', { get: () => false, configurable: true });
        delete (window as any).chrome;
        (window as any).chrome = { runtime: {} };
      });
    } catch (initError) {
      console.warn(`[Browser ${sessionId}] Failed to inject fingerprint patch, audio spoof, or basic stealth:`, initError);
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

// =======================================================================
// === PHIÊN BẢN HOÀN CHỈNH - HÀM executeWorkflow VỚI KHẢ NĂNG TỰ CHẨN ĐOÁN ===
// =======================================================================
async function executeWorkflowOnPuppeteerPage(page: any, workflow: any): Promise<void> {
  console.log('[🧠 WORKFLOW ENGINE] BỘ NÃO ĐÃ ĐƯỢC KÍCH HOẠT.');

  // --- BƯỚC 1: KIỂM TRA ĐẦU VÀO ---
  if (!workflow) {
    console.error('[❌ ENGINE FAULT] Dữ liệu workflow không hợp lệ hoặc không tồn tại.');
    return;
  }

  // Kiểm tra workflow.data nếu có
  let workflowData = workflow;
  if (workflow.data && typeof workflow.data === 'object') {
    workflowData = workflow.data;
    console.log('[🔧] Đã lấy workflow data từ trường "data"');
  }

  if (!workflowData || !workflowData.nodes || !workflowData.edges) {
    console.error('[❌ ENGINE FAULT] Dữ liệu workflow không hợp lệ hoặc không có nodes/edges.');
    console.error('[❌ ENGINE FAULT] Workflow keys:', Object.keys(workflowData || {}));
    return;
  }

  console.log('[✔] Dữ liệu đầu vào hợp lệ.');

  // --- BƯỚC 2: MỞ NIÊM PHONG (JSON.parse) ---
  let nodes: any[];
  let edges: any[];
  try {
    console.log('[🔧] Đang kiểm tra định dạng dữ liệu...');
    nodes = (typeof workflowData.nodes === 'string') ? JSON.parse(workflowData.nodes) : workflowData.nodes;
    edges = (typeof workflowData.edges === 'string') ? JSON.parse(workflowData.edges) : workflowData.edges;
    console.log(`[✔] Dữ liệu đã được phân tích thành công. Tìm thấy ${nodes.length} nodes và ${edges.length} edges.`);
  } catch (error: any) {
    console.error('[❌ ENGINE FAULT] Không thể phân tích chuỗi JSON của nodes/edges.', error);
    return;
  }

  // --- BƯỚC 3: XÂY DỰNG BẢN ĐỒ VÀ TÌM ĐIỂM XUẤT PHÁT ---
  const nodeMap = new Map(nodes.map((node: any) => [node.id, node]));
  const edgeMap = new Map(edges.map((edge: any) => [edge.source, edge.target]));

  let startNode = nodes.find((node: any) => 
    node.type?.toLowerCase() === 'start' || 
    node.type?.toLowerCase() === 'input' ||
    node.type === 'startNode'
  );

  if (!startNode) {
    console.error('[❌ ENGINE FAULT] Không tìm thấy Start Node trong kịch bản.');
    console.error('[❌ ENGINE FAULT] Danh sách node types:', nodes.map((n: any) => n.type).join(', '));
    return;
  }

  console.log(`[✔] Điểm xuất phát đã được xác định: Node ID ${startNode.id}.`);

  // --- BƯỚC 4: VÒNG LẶP THỰC THI TỪNG BƯỚC ---
  let currentNodeId = startNode.id;
  let stepCount = 0;

  while (currentNodeId) {
    stepCount++;
    const currentNode = nodeMap.get(currentNodeId);
    
    if (!currentNode) {
      console.error(`[❌ ENGINE FAULT] Mất dấu! Không tìm thấy node với ID: ${currentNodeId}`);
      break;
    }

    console.log(`[▶️] ĐANG THỰC THI NODE: ${currentNode.id} | LOẠI: ${currentNode.type}`);
    console.log(`[▶️] Node data:`, JSON.stringify(currentNode.data, null, 2));

    try {
      const nodeType = currentNode.type?.toLowerCase() || '';
      
      switch (nodeType) {
        case 'start':
        case 'input':
        case 'startnode':
          // Không làm gì cả, chỉ là điểm bắt đầu
          console.log(`[✅] HÀNH ĐỘNG THÀNH CÔNG: Start node, bỏ qua`);
          break;

        case 'end':
        case 'output':
        case 'endnode':
          console.log(`[✅] HÀNH ĐỘNG THÀNH CÔNG: End node, workflow hoàn thành`);
          console.log('[🧠 WORKFLOW ENGINE] ĐÃ HOÀN TẤT NHIỆM VỤ.');
          return;

        case 'open page':
        case 'openpage':
        case 'openurlnode':
        case 'open-url':
          // Sửa lại đường dẫn để đọc trong 'config'
          const url = currentNode.data?.config?.url || currentNode.data?.url || currentNode.data?.value;
          if (url) {
            console.log(`[🔧] Đang điều hướng đến URL: ${url}`);
            await page.goto(url, { waitUntil: 'domcontentloaded' });
            console.log(`[✅] HÀNH ĐỘNG THÀNH CÔNG: Đã mở trang: ${url}`);
          } else {
            console.warn(`[⚠️] CẢNH BÁO: Node "Open Page" không có thuộc tính 'url' trong config. Bỏ qua.`);
          }
          break;

        case 'click':
        case 'clicknode':
          // Sửa lại đường dẫn để đọc trong 'config'
          const clickSelector = currentNode.data?.config?.selector || currentNode.data?.selector || currentNode.data?.target || currentNode.data?.value;
          if (clickSelector) {
            console.log(`[🔧] Đang click vào selector: ${clickSelector}`);
            await page.click(clickSelector, { timeout: 10000 });
            console.log(`[✅] HÀNH ĐỘNG THÀNH CÔNG: Đã click vào: ${clickSelector}`);
          } else {
            console.warn(`[⚠️] CẢNH BÁO: Node "Click" không có selector trong config. Bỏ qua.`);
          }
          break;

        case 'type':
        case 'typenode':
        case 'fill':
          // Sửa lại đường dẫn để đọc trong 'config'
          const typeSelector = currentNode.data?.config?.selector || currentNode.data?.selector || currentNode.data?.target || '';
          const typeText = currentNode.data?.config?.text || currentNode.data?.text || currentNode.data?.value || '';
          if (typeSelector && typeText) {
            console.log(`[🔧] Đang nhập "${typeText}" vào selector: ${typeSelector}`);
            await page.type(typeSelector, typeText);
            console.log(`[✅] HÀNH ĐỘNG THÀNH CÔNG: Đã nhập "${typeText}" vào: ${typeSelector}`);
          } else {
            console.warn(`[⚠️] CẢNH BÁO: Node "Type" không đủ thông tin (selector: ${typeSelector}, text: ${typeText}). Bỏ qua.`);
          }
          break;

        case 'wait':
        case 'waitnode':
          const milliseconds = currentNode.data?.milliseconds || currentNode.data?.time || currentNode.data?.value || 1000;
          console.log(`[🔧] Đang chờ ${milliseconds}ms`);
          await page.waitForTimeout(Number(milliseconds));
          console.log(`[✅] HÀNH ĐỘNG THÀNH CÔNG: Đã chờ ${milliseconds}ms`);
          break;

        default:
          console.warn(`[⚠️] CẢNH BÁO: Chưa định nghĩa hành động cho loại node: "${currentNode.type}". Bỏ qua.`);
          break;
      }
    } catch (execError: any) {
      console.error(`[❌ ENGINE FAULT] Lỗi khi thực thi hành động của node ${currentNode.id}:`, execError.message);
      console.error(`[❌ ENGINE FAULT] Error stack:`, execError.stack);
      break; // Dừng vòng lặp nếu có lỗi
    }

    // Tìm node tiếp theo
    const nextNodeId = edgeMap.get(currentNodeId);
    if (!nextNodeId) {
      console.log('[🏁] KẾT THÚC KỊCH BẢN: Đã đi đến node cuối cùng.');
      break;
    }

    currentNodeId = nextNodeId;

    // Bảo vệ khỏi vòng lặp vô hạn
    if (stepCount > 100) {
      console.error('[❌ ENGINE FAULT] Vòng lặp quá dài (>100 bước). Dừng lại để tránh vòng lặp vô hạn.');
      break;
    }
  }

  console.log(`[🧠 WORKFLOW ENGINE] ĐÃ HOÀN TẤT NHIỆM VỤ sau ${stepCount} bước.`);
}

// Hàm "Fire and Wait" - quản lý browser lifecycle và workflow execution
export async function runAndManageBrowser(
  profile: any,
  workflow: any,
  options: {
    profileId: number;
    sessionId: number;
    userAgent?: string;
    fingerprint?: any;
    proxy?: { host: string; port: number; username?: string; password?: string; type: string };
  }
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('[LIFECYCLE] ========================================');
      console.log(`[LIFECYCLE] Nhận yêu cầu quản lý browser cho profile ${profile.id}`);
      console.log(`[LIFECYCLE] Workflow: ${workflow?.name || 'none'}`);
      console.log('[LIFECYCLE] ========================================');

      // Khởi chạy browser - TRUYỀN PROFILE OBJECT ĐỂ LẤY DỮ LIỆU TỪ DB
      const browser = await launchBrowser({
        profileId: options.profileId,
        sessionId: options.sessionId,
        userAgent: options.userAgent,
        fingerprint: options.fingerprint,
        proxy: options.proxy,
        profile: profile, // === TRUYỀN PROFILE OBJECT ĐỂ LẤY userAgent, screenWidth, screenHeight TỪ DB ===
      });

      if (!browser) {
        return reject(new Error("Không thể khởi tạo browser."));
      }

      console.log(`[LIFECYCLE] ✅ Browser đã được khởi chạy cho profile ${profile.id}`);

      // CHÌA KHÓA: Lắng nghe sự kiện trình duyệt bị đóng
      browser.on('disconnected', () => {
        console.log(`[LIFECYCLE] Trình duyệt cho profile ${profile.id} đã được đóng. Hoàn tất.`);
        resolve(); // Chỉ khi đó Promise mới kết thúc
      });

      try {
        // Lấy page từ browser
        const pages = await browser.pages();
        let page = pages[0];
        
        if (!page || page.isClosed()) {
          page = await browser.newPage();
        }

        // Chỉ thực thi workflow NẾU nó tồn tại
        if (workflow && workflow.data) {
          console.log(`[WORKFLOW] Bắt đầu thực thi workflow "${workflow.name}"...`);
          // =======================================================================
          // === SỬA LẠI DUY NHẤT DÒNG NÀY - BỎ `await` ĐỂ WORKFLOW CHẠY NON-BLOCKING ===
          // =======================================================================
          executeWorkflowOnPuppeteerPage(page, workflow).catch((error: any) => {
            console.error('[WORKFLOW] Lỗi khi thực thi workflow (non-blocking):', error);
            // Không reject Promise chính, chỉ log lỗi để browser vẫn tiếp tục chạy
          });
          console.log(`[WORKFLOW] Workflow đã được khởi chạy (non-blocking). Trình duyệt sẽ tiếp tục chạy.`);
        } else {
          console.log('[WORKFLOW] Không có workflow nào được gán. Trình duyệt sẽ ở chế độ chờ.');
        }

        // Script sẽ bị treo ở đây, đợi sự kiện 'disconnected' ở trên
      } catch (error: any) {
        console.error('[LIFECYCLE] Lỗi trong quá trình thực thi:', error);
        try {
          await browser.close();
        } catch (closeError) {
          console.error('[LIFECYCLE] Lỗi khi đóng browser:', closeError);
        }
        reject(error);
      }
    } catch (error: any) {
      console.error('[LIFECYCLE] Lỗi nghiêm trọng khi khởi chạy browser:', error);
      reject(error);
    }
  });
}

