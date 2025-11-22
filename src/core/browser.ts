import puppeteer from 'puppeteer-core';
import { Browser } from 'puppeteer-core';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load biến môi trường
dotenv.config();

export async function startBrowser(profile: any) {
    console.log(`🚀 Đang khởi động profile: ${profile.name}`);

    // 1. Xử lý Fingerprint (Vì trong DB nó có thể là String hoặc Object)
    let fingerprintData: any = {};
    try {
        if (typeof profile.fingerprint === 'string') {
            fingerprintData = JSON.parse(profile.fingerprint);
        } else {
            fingerprintData = profile.fingerprint || {};
        }
    } catch (e) {
        console.error("Lỗi parse fingerprint", e);
    }

    // 2. Lấy UserAgent: Ưu tiên lấy trong JSON fingerprint, nếu không có thì lấy ở ngoài
    const userAgent = fingerprintData.ua || fingerprintData.userAgent || profile.userAgent || 'Mozilla/5.0...';

    // 3. Cấu hình đường dẫn Chrome (Ổ D)
    const executablePath = process.env.CHROME_EXECUTABLE_PATH || 'D:\\Tool\\chrome-win64\\chrome.exe';

    // 4. CHUẨN BỊ DỮ LIỆU ĐỂ FAKE (Map từ Database sang Script)
    const injectionConfig = {
        // Fake CPU (Lấy từ cột hardwareConcurrency trong DB)
        hardwareConcurrency: profile.hardwareConcurrency || profile.cpu || 4,
        
        // Fake RAM (Lấy từ cột deviceMemory)
        deviceMemory: profile.deviceMemory || profile.memory || 8,
        
        // Fake Canvas (Lấy từ cột canvasMode)
        canvasMode: profile.canvasMode || 'off',
        
        // Fake WebGL (Card màn hình)
        webglVendor: profile.webglVendor,
        webglRenderer: profile.webglRenderer,

        // Fake Múi giờ (Quan trọng để giấu vị trí)
        timezone: profile.timezone || 'Europe/London', // Mặc định London nếu thiếu
    };

    // 5. Tạo script cấu hình
    const configScript = `window.__NTG_PROFILE__ = ${JSON.stringify(injectionConfig)};`;

    try {
        const browser = await puppeteer.launch({
            executablePath: executablePath,
            headless: false,
            defaultViewport: null,
            args: [
                '--no-sandbox',
                `--user-agent=${userAgent}`, // Fake UA ngay từ vỏ
                '--disable-blink-features=AutomationControlled',
                '--lang=en-US',
            ]
        });

        const page = (await browser.pages())[0];

        // 6. TIÊM SCRIPT FAKE
        const injectionPath = path.join(__dirname, 'injection_script.js'); // Kiểm tra lại đường dẫn file này
        
        if (fs.existsSync(injectionPath)) {
            const mainScript = fs.readFileSync(injectionPath, 'utf8');
            
            // Fake Timezone bằng thư viện có sẵn của Puppeteer (Cực mạnh)
            if (injectionConfig.timezone) {
                await page.emulateTimezone(injectionConfig.timezone);
            }

            // Tiêm code fake canvas/cpu/ram
            await page.evaluateOnNewDocument(configScript + '\n' + mainScript);
            console.log("💉 Đã tiêm code fake thành công!");
        }

        return browser;

    } catch (error) {
        console.error("Lỗi mở browser:", error);
        return null;
    }
}

export async function startBrowserWithProfile(profile: any): Promise<Browser | null> {
  let executablePath = '';

  // 1. Xử lý lựa chọn từ Dropdown (Change Driver)
  if (profile.driverType === 'chrome' || profile.driverType === 'Chrome') {
    // Nếu chọn Chrome -> Lấy đường dẫn ổ D từ file .env
    executablePath = process.env.CHROME_EXECUTABLE_PATH || '';
  } else {
    // Mặc định dùng Chromium có sẵn hoặc logic cũ
    executablePath = process.env.NTG_CORE_PATH || process.env.CHROME_EXECUTABLE_PATH || '';
  }

  // Nếu vẫn chưa có, thử tìm trong các đường dẫn mặc định
  if (!executablePath || !fs.existsSync(executablePath)) {
    const possiblePaths = [
      'D:\\Tool\\chrome-win64\\chrome.exe',
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    ];

    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        executablePath = possiblePath;
        console.log(`✅ Tìm thấy Chrome tại: ${executablePath}`);
        break;
      }
    }
  }

  // Validate đường dẫn
  if (!executablePath || !fs.existsSync(executablePath)) {
    console.error("❌ Không tìm thấy file Chrome tại: " + executablePath);
    console.error("   Vui lòng cấu hình CHROME_EXECUTABLE_PATH trong file .env");
    return null;
  }

  // 2. Cấu hình Launch (Kèm các cờ Fake cơ bản)
  const userAgent = profile.userAgent || profile.user_agent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36';

  const args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-infobars',
    '--window-position=0,0',
    '--ignore-certifcate-errors',
    '--ignore-certifcate-errors-spki-list',
    '--disable-blink-features=AutomationControlled', // QUAN TRỌNG: Chống phát hiện bot
    `--user-agent=${userAgent}`, // Lấy UserAgent từ cột User Agent trong hình 1
    '--lang=en-US',
    '--start-maximized',
    '--disable-dev-shm-usage',
    '--no-first-run',
    '--no-default-browser-check',
  ];

  // Nếu có Proxy thì thêm vào
  if (profile.proxy) {
    const proxyString = typeof profile.proxy === 'string' 
      ? profile.proxy 
      : `${profile.proxy.type || 'http'}://${profile.proxy.host}:${profile.proxy.port}`;
    args.push(`--proxy-server=${proxyString}`);
  }

  const browser = await puppeteer.launch({
    executablePath: executablePath,
    headless: false,
    defaultViewport: null,
    args: args,
    ignoreDefaultArgs: ['--enable-automation'] // Tắt dòng "Chrome is being controlled..."
  });

  const page = (await browser.pages())[0] || await browser.newPage();

  // Set UserAgent trên page level
  await page.setUserAgent(userAgent);

  // Xác thực Proxy nếu cần
  if (profile.proxyUsername && profile.proxyPassword) {
    await page.authenticate({
      username: profile.proxyUsername,
      password: profile.proxyPassword
    });
  } else if (profile.proxy && typeof profile.proxy === 'object' && profile.proxy.username && profile.proxy.password) {
    await page.authenticate({
      username: profile.proxy.username,
      password: profile.proxy.password
    });
  }

  // ============================================================
  // 3. BƯỚC QUAN TRỌNG NHẤT: TIÊM SCRIPT FAKE (HÌNH 2)
  // ============================================================
  
  // 1. CHUẨN BỊ DỮ LIỆU CẤU HÌNH TỪ PROFILE (Lấy từ giao diện)
  const fingerprintConfig = {
    canvasMode: profile.canvasMode || 'off', // noise, off, block (Lấy từ cái nút xanh trong ảnh)
    hardwareConcurrency: profile.concurrency || profile.hardwareConcurrency || 8, // Số nhân CPU
    deviceMemory: profile.deviceMemory || 8,       // RAM
    webglVendor: profile.webglVendor || profile.webglVendorRef?.vendor,              // Card màn hình
    webglRenderer: profile.webglRenderer || profile.webglRendererRef?.renderer,
    // ... các thông số khác
  };

  // 2. TẠO CODE CẤU HÌNH ĐỂ TIÊM TRƯỚC
  const configScript = `
    window.__NTG_PROFILE__ = ${JSON.stringify(fingerprintConfig)};
  `;

  // 3. ĐỌC FILE SCRIPT FAKE CHÍNH
  const injectionPath = path.join(process.cwd(), 'src', 'core', 'injection_script.js');
  
  // Fallback: thử tìm ở core/injection_script.js nếu không có ở src/core
  const injectionPathFallback = path.join(process.cwd(), 'core', 'injection_script.js');
  
  const finalInjectionPath = fs.existsSync(injectionPath) ? injectionPath : 
                              (fs.existsSync(injectionPathFallback) ? injectionPathFallback : null);
  
  if (finalInjectionPath) {
    try {
      const mainInjectionCode = fs.readFileSync(finalInjectionPath, 'utf8');
      
      // GỘP 2 CÁI LẠI: Cấu hình chạy trước -> Script Fake chạy sau
      await page.evaluateOnNewDocument(configScript + '\n' + mainInjectionCode);
      
      console.log(`💉 Đã tiêm cấu hình: Canvas=${fingerprintConfig.canvasMode}, RAM=${fingerprintConfig.deviceMemory}GB, CPU=${fingerprintConfig.hardwareConcurrency} cores`);
    } catch (error) {
      console.warn("⚠️ Lỗi khi đọc/tiêm injection script:", error);
    }
  } else {
    console.warn("⚠️ Không tìm thấy file injection_script.js tại:");
    console.warn(`   - ${injectionPath}`);
    console.warn(`   - ${injectionPathFallback}`);
  }

  // ============================================================
  // Mở trang kiểm tra để bạn test
  // ============================================================
  await page.goto('https://browserleaks.com/canvas');

  console.log('✅ Browser đã khởi động thành công với Chrome custom build!');
  console.log(`📊 Đang kiểm tra fingerprint tại: ${page.url()}`);

  return browser;
}

