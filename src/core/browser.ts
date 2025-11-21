import puppeteer from 'puppeteer-core';
import { Browser } from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

interface BrowserLaunchOptions {
  executablePath?: string;
  headless?: boolean;
  profileId?: number;
  userAgent?: string;
  proxy?: {
    server: string;
    username?: string;
    password?: string;
  };
  args?: string[];
}

export async function startBrowser(options: BrowserLaunchOptions = {}): Promise<Browser | null> {
  const {
    executablePath,
    headless = false,
    profileId,
    userAgent,
    proxy,
    args = []
  } = options;

  let chromePath = executablePath;

  if (!chromePath) {
    const possiblePaths = [
      'D:\\Tool\\chrome-win64\\chrome.exe',
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      path.join(process.cwd(), 'packages', 'api', 'browser-core', 'ntg-core.exe'),
      path.join(process.cwd(), 'ntg-core', 'build', 'src', 'out', 'Release', 'electron.exe'),
    ];

    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        chromePath = possiblePath;
        console.log(`✅ Tìm thấy Chrome tại: ${chromePath}`);
        break;
      }
    }
  }

  if (!chromePath || !fs.existsSync(chromePath)) {
    console.error('❌ Không tìm thấy Chrome executable. Vui lòng chỉ định executablePath hoặc cài đặt Chrome.');
    return null;
  }

  const launchArgs = [
    '--start-maximized',
    '--no-sandbox',
    '--disable-setuid-sandbox',
    // Fake User-Agent (Ví dụ giả làm iPhone 14 Pro - có thể override bằng userAgent option)
    userAgent ? `--user-agent=${userAgent}` : '--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
    // Fake ngôn ngữ sang Tiếng Anh (Mỹ)
    '--lang=en-US',
    // Tắt tính năng phát hiện Automation
    '--disable-blink-features=AutomationControlled',
    '--disable-infobars',
    '--disable-dev-shm-usage',
    '--no-first-run',
    '--no-default-browser-check',
    ...args
  ];

  if (proxy) {
    launchArgs.push(`--proxy-server=${proxy.server}`);
  }

  if (profileId) {
    const profileDir = path.join(process.cwd(), 'browser_profiles', `profile_${profileId}`);
    if (!fs.existsSync(profileDir)) {
      fs.mkdirSync(profileDir, { recursive: true });
    }
    launchArgs.push(`--user-data-dir=${profileDir}`);
  }

  try {
    console.log(`🚀 Đang khởi động browser với executable: ${chromePath}`);

    const browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: headless,
      defaultViewport: null,
      args: launchArgs,
    });

    const page = await browser.newPage();

    if (userAgent) {
      await page.setUserAgent(userAgent);
    }

    if (proxy && proxy.username && proxy.password) {
      await page.authenticate({
        username: proxy.username,
        password: proxy.password,
      });
    }

    await page.goto('https://browserleaks.com/ip');

    console.log('✅ Browser đã khởi động thành công với Core Node.js!');
    console.log(`📊 Đang kiểm tra fingerprint tại: ${page.url()}`);

    return browser; 
  } catch (error) {
    console.error('❌ Lỗi khởi động browser:', error);
    return null;
  }
}

export async function startBrowserWithProfile(profile: any): Promise<Browser | null> {
  const executablePath = process.env.CHROME_EXECUTABLE_PATH || 
                         process.env.NTG_CORE_PATH ||
                         undefined;

  return startBrowser({
    executablePath,
    headless: false,
    profileId: profile.id,
    userAgent: profile.userAgent || profile.user_agent,
    proxy: profile.proxy ? {
      server: `${profile.proxy.type || 'http'}://${profile.proxy.host}:${profile.proxy.port}`,
      username: profile.proxy.username,
      password: profile.proxy.password,
    } : undefined,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-infobars',
    ],
  });
}

