const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
const { ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

chromium.use(stealth);

async function loadProfileData(profileId) {
  const profilePath = path.join(__dirname, 'profiles', `profile${profileId}.json`);
  if (fs.existsSync(profilePath)) {
    const data = fs.readFileSync(profilePath, 'utf-8');
    return JSON.parse(data);
  }
  return null;
}

async function loadUserAgents() {
  const uaPath = path.join(__dirname, 'data', 'user_agents.json');
  if (fs.existsSync(uaPath)) {
    const data = fs.readFileSync(uaPath, 'utf-8');
    return JSON.parse(data);
  }
  return [];
}

async function launchProfileWithFullEmulation(profileData) {
  console.log('[+] Khởi chạy profile với FULL EMULATION:', profileData.name);

  const userAgent = profileData.userAgent;

  let chromeVersion = '120';
  const chromeMatch = userAgent.match(/Chrome\/(\d+)/);
  if (chromeMatch) {
    chromeVersion = chromeMatch[1];
  }

  let platform = "Windows";
  let platformVersion = "10.0";
  if (userAgent.includes("Windows NT 10.0")) {
    platform = "Windows";
    platformVersion = "10.0";
  } else if (userAgent.includes("Mac OS X")) {
    platform = "macOS";
    const macVersionMatch = userAgent.match(/Mac OS X (\d+_\d+_\d+)/);
    if (macVersionMatch) {
      platformVersion = macVersionMatch[1].replace(/_/g, '.');
    } else {
      platformVersion = "10.15.7";
    }
  } else if (userAgent.includes("Linux")) {
    platform = "Linux";
    platformVersion = "";
  }

  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-blink-features=AutomationControlled'],
    ignoreDefaultArgs: ["--enable-automation"],
  });

  const context = await browser.newContext({
    viewport: { width: profileData.screen.width, height: profileData.screen.height },
  });

  const page = await context.newPage();
  const client = await page.context().newCDPSession(page);

  await client.send('Emulation.setUserAgentOverride', {
    userAgent: userAgent,
    platform: (platform === 'Windows') ? 'Win32' : (platform === 'macOS' ? 'MacIntel' : 'Linux x86_64'),
    userAgentMetadata: {
      brands: [
        { brand: 'Not_A Brand', version: '8' },
        { brand: 'Chromium', version: chromeVersion },
        { brand: 'Google Chrome', version: chromeVersion }
      ],
      fullVersion: `${chromeVersion}.0.0.0`,
      platform: platform,
      platformVersion: platformVersion,
      architecture: 'x86',
      model: '',
      mobile: false
    }
  });

  const injectionScriptPath = path.join(__dirname, 'core', 'injection_script.js');
  if (fs.existsSync(injectionScriptPath)) {
    let injectionScript = fs.readFileSync(injectionScriptPath, 'utf-8');
    
    const languages = profileData.navigator?.languages || ['en-US', 'en'];
    const languagesStr = '[' + languages.map(l => `'${l}'`).join(', ') + ']';
    
    const replacements = {
      '%%HARDWARE_CONCURRENCY%%': JSON.stringify(profileData.navigator?.hardwareConcurrency || 8),
      '%%DEVICE_MEMORY%%': JSON.stringify(profileData.navigator?.deviceMemory || 8),
      '%%LANGUAGES%%': languagesStr,
      '%%LANGUAGE%%': profileData.navigator?.language || 'en-US',
      '%%SCREEN_WIDTH%%': JSON.stringify(profileData.screen?.width || 1920),
      '%%SCREEN_HEIGHT%%': JSON.stringify(profileData.screen?.height || 1080),
      '%%SCREEN_AVAIL_WIDTH%%': JSON.stringify(profileData.screen?.availWidth || 1920),
      '%%SCREEN_AVAIL_HEIGHT%%': JSON.stringify(profileData.screen?.availHeight || 1040),
      '%%SCREEN_COLOR_DEPTH%%': JSON.stringify(profileData.screen?.colorDepth || 24),
      '%%SCREEN_PIXEL_DEPTH%%': JSON.stringify(profileData.screen?.pixelDepth || 24),
      '%%DEVICE_PIXEL_RATIO%%': JSON.stringify(profileData.screen?.devicePixelRatio || 1),
      '%%WEBGL_VENDOR%%': profileData.webgl?.vendor || 'Intel Inc.',
      '%%WEBGL_RENDERER%%': profileData.webgl?.renderer || 'Intel Iris OpenGL Engine',
      '%%CANVAS_MODE%%': profileData.canvas?.mode || 'Noise',
      '%%CANVAS_SEED%%': String(profileData.canvas?.seed || 12345),
      '%%AUDIO_CONTEXT_MODE%%': profileData.audioContext?.mode || 'Off',
      '%%AUDIO_SEED%%': String(profileData.audioContext?.seed || 12345),
      '%%CLIENT_RECTS_MODE%%': profileData.clientRects?.mode || 'Off',
      '%%GEO_ENABLED%%': JSON.stringify(profileData.geo?.enabled || false),
      '%%GEO_LAT%%': JSON.stringify(profileData.geo?.lat || 10.762622),
      '%%GEO_LON%%': JSON.stringify(profileData.geo?.lon || 106.660172),
      '%%WEBRTC_USE_MAIN_IP%%': JSON.stringify(profileData.webrtc?.useMainIP || false),
      '%%TIMEZONE%%': profileData.timezone || 'Asia/Ho_Chi_Minh',
      '%%SEED%%': String(profileData.seed || 12345)
    };

    for (const [key, value] of Object.entries(replacements)) {
      injectionScript = injectionScript.replace(new RegExp(key, 'g'), value);
    }

    await context.addInitScript(injectionScript);
  }

  await page.goto('https://pixelscan.net/fingerprint-check/');

  console.log('[+] Profile đã được khởi chạy. Danh tính đã được LẬP TRÌNH LẠI HOÀN CHỈNH.');
}

ipcMain.on('launch-profile', (event, profileData) => {
  launchProfileWithFullEmulation(profileData).catch(err => {
    console.error("Lỗi khi khởi chạy profile với Full Emulation:", err);
  });
});

module.exports = { launchProfileWithFullEmulation };

