import puppeteer from 'puppeteer-extra';

import StealthPlugin from 'puppeteer-extra-plugin-stealth';

import { Browser, Page } from 'puppeteer';

import path from 'path';

import fs from 'fs';

import * as OTPAuth from 'otpauth';



puppeteer.use(StealthPlugin());



const browserInstances = new Map<number, Browser>();



const DEFAULT_CHROME_PATHS = [

  process.env.CHROME_EXECUTABLE_PATH,

  process.env.NTG_CORE_PATH,

  String.raw`D:\Tool\chrome-win64\chrome.exe`,

  path.join(process.cwd(), 'packages', 'api', 'browser-core', 'ntg-core.exe'),

];



const randomDelay = (min: number = 2000, max: number = 5000) => {

  const ms = Math.floor(Math.random() * (max - min + 1)) + min;

  return new Promise(resolve => setTimeout(resolve, ms));

};



function replaceVariables(text: string, profile: any): string {

  if (!text) return "";

  let result = text;

  let account: any = {};

  try {

    if (profile.accountInfo) {

      account = typeof profile.accountInfo === 'string' ? JSON.parse(profile.accountInfo) : profile.accountInfo;

    }

  } catch (e) {}



  const uid = account.uid || account.username || profile.name || "";

  result = result.replace(/\{\{uid\}\}/g, uid);

  result = result.replace(/\{\{username\}\}/g, uid);

  result = result.replace(/\{\{password\}\}/g, account.password || "");

  

  if (result.includes('{{2fa}}')) {

    const secret = account.twoFactor || account.secretKey || account.twoFactorCode;

    if (secret) {

      try {

        const cleanSecret = secret.replace(/\s+/g, '');

        const totp = new OTPAuth.TOTP({

          secret: OTPAuth.Secret.fromBase32(cleanSecret),

          algorithm: 'SHA1',

          digits: 6,

          period: 30

        });

        const token = totp.generate();

        result = result.replace(/\{\{2fa\}\}/g, token);

      } catch (err) {

        console.error("Lỗi khi generate 2FA token:", err);

      }

    }

  }

  return result;

}



async function clickMagicAvatar(page: Page, pid: any) {
    console.log(`[${pid}] 🧙‍♂️ Magic Avatar: Đang tìm...`);
    
    try {
        await page.waitForSelector('image[preserveAspectRatio^="xMidYMid"]', { timeout: 10000 });
        const clicked = await page.evaluate(() => {
            const images = document.querySelectorAll('image[preserveAspectRatio^="xMidYMid"]');
            for (let i = 0; i < images.length; i++) {
                const img = images[i];
                const rect = img.getBoundingClientRect();
                if (rect.width > 80) { 
                    const btn = img.closest('div[role="button"]') || img.parentElement;
                    if (btn) {
                        (btn as HTMLElement).click();
                        return true;
                    }
                }
            }
            return false;
        });
        if (clicked) {
            console.log(`[${pid}] ✅ Đã Click Avatar!`);
            return;
        }
    } catch (e) {}
    console.warn(`[${pid}] [!] Không tìm thấy. Thử Click tọa độ...`);
    await page.mouse.click(170, 370);
}



// Hàm helper để chờ và click an toàn với delay
async function safeClick(page: Page, selector: string, timeout: number = 5000): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { visible: true, timeout });
    await page.click(selector);
    // QUAN TRỌNG: Chờ 1 chút sau khi click để UI kịp phản hồi
    await new Promise(r => setTimeout(r, 1000));
    return true;
  } catch (e) {
    return false;
  }
}

// Export để có thể dùng ở nơi khác nếu cần
export { safeClick };

// --- HÀM CLICK BẤT TỬ (CẤP ĐỘ CAO NHẤT) ---
// Hàm này chấp nhận lỗi sập context, sập protocol, sập mạng -> Vẫn thử lại đến khi click được
async function godModeClick(page: Page, ariaName: string, timeout: number = 5000): Promise<boolean> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        try {
            // 1. Dùng ARIA Selector (Chuẩn nhất của Chrome)
            // Nó tìm theo cái tên mà người mù nghe được (VD: "Try another way")
            const selector = `aria/${ariaName}`;
            
            // 2. Chờ nút hiện ra
            const el = await page.waitForSelector(selector, { timeout: 1000 });
            if (el) {
                // 3. Click
                await el.click();
                console.log(`[GOD MODE] ✅ Đã click trúng: "${ariaName}"`);
                return true;
            }
        } catch (error: any) {
            // BỎ QUA MỌI LỖI - KHÔNG ĐƯỢC DỪNG
            // Lỗi refresh trang, lỗi chưa load xong... kệ nó, lặp lại ngay
        }
        // Nghỉ 500ms trước khi thử lại
        await new Promise(r => setTimeout(r, 500));
    }
    console.log(`[GOD MODE] ❌ Hết giờ tìm: "${ariaName}"`);
    return false;
}

// --- LOGIC 2FA CHÍNH ---
async function handleSmart2FA(page: Page, profile: any) {
    console.log("🔥 KÍCH HOẠT CHẾ ĐỘ 2FA GOD MODE 🔥");
    if (page.isClosed()) return;
    
    // Lấy Secret Key
    let secretKey = '';
    try {
        let account: any = {};
        if (profile.accountInfo) {
            account = typeof profile.accountInfo === 'string' ? JSON.parse(profile.accountInfo) : profile.accountInfo;
        }
        secretKey = account.twoFactor || account.secretKey || account.twoFactorCode || profile.twoFactorCode || '';
    } catch (e) {}
    
    if (!secretKey) {
        console.error("LỖI: Không có Secret Key!");
        return;
    }

    // --- GIAI ĐOẠN 1: TÌM NÚT "Try another way" ---
    // Vì trang refresh liên tục, ta lặp vô tận cho đến khi qua được bước này
    let passedStep1 = false;
    for (let i = 0; i < 20; i++) { // Thử tối đa 20 lần (khoảng 20 giây)
        // Thử tìm nút Try another way
        if (await godModeClick(page, "Try another way", 2000)) {
            passedStep1 = true;
            break;
        }
        
        // Nếu không thấy, có thể nó tên là "Thử cách khác"
        if (await godModeClick(page, "Thử cách khác", 1000)) {
            passedStep1 = true;
            break;
        }
        
        // Nếu vẫn không thấy, kiểm tra xem có phải đã ở màn hình chọn App chưa?
        // Check thử nút "Authentication app"
        try {
            const isAtStep2 = await page.$(`aria/Authentication app`) || await page.$(`aria/Ứng dụng xác thực`);
            if (isAtStep2) {
                console.log("--> Đang ở bước 2 luôn rồi, bỏ qua bước 1.");
                passedStep1 = true;
                break;
            }
        } catch(e) {}
    }
    
    // Chờ popup bung ra (quan trọng)
    await new Promise(r => setTimeout(r, 2000));
    
    // --- GIAI ĐOẠN 2: CHỌN "Authentication app" ---
    console.log("--> Đang chọn App...");
    let passedStep2 = false;
    
    // Thử click vào App
    if (await godModeClick(page, "Authentication app", 5000)) passedStep2 = true;
    else if (await godModeClick(page, "Ứng dụng xác thực", 5000)) passedStep2 = true;
    
    // Mẹo: Đôi khi click vào chữ không ăn, phải click vào cái radio button
    if (!passedStep2) {
         try {
             // Tìm tất cả radio button và click cái thứ 2 (thường là App)
             const radios = await page.$$('input[type="radio"]');
             if (radios.length > 1) {
                 await radios[1].click();
                 console.log("--> Đã click Radio Button thứ 2");
                 passedStep2 = true;
             }
         } catch(e) {}
    }
    
    await new Promise(r => setTimeout(r, 1000));
    
    // --- GIAI ĐOẠN 3: BẤM "Continue" ---
    console.log("--> Bấm Continue...");
    await godModeClick(page, "Continue", 5000);
    await godModeClick(page, "Tiếp tục", 2000);
    
    // --- GIAI ĐOẠN 4: NHẬP MÃ ---
    console.log("--> Tìm ô nhập mã...");
    const inputSelector = 'input[type="text"], input[type="number"], input[aria-label="Code"], input[data-wrapper-for="code_input"]';
    
    try {
        // Chờ ô input xuất hiện (Lâu hơn chút vì mạng lag)
        await page.waitForSelector(inputSelector, { visible: true, timeout: 15000 });
        
        // Tính mã
        const secret = secretKey.replace(/\s+/g, '');
        const totp = new OTPAuth.TOTP({
            secret: OTPAuth.Secret.fromBase32(secret),
            algorithm: 'SHA1',
            digits: 6,
            period: 30
        });
        const token = totp.generate();
        console.log(`--> Mã 2FA: ${token}`);
        
        // Nhập mã
        await page.click(inputSelector);
        await new Promise(r => setTimeout(r, 500));
        await page.type(inputSelector, token, { delay: 100 });
        await new Promise(r => setTimeout(r, 500));
        await page.keyboard.press('Enter');
        
        console.log("--> ĐÃ NHẬP XONG. ĐANG LOGIN...");
        
        // Chờ điều hướng
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
    } catch (e) {
        console.log("Lỗi nhập mã (Có thể đã login thành công):", e);
    }
}



// --- HÀM CLICK THÔNG MINH CHO WORKFLOW (Kết hợp Drill + GodMode) ---
async function workflowSmartClick(page: Page, selectorOrText: string): Promise<boolean> {
    console.log(`[WORKFLOW CLICK] Đang xử lý: ${selectorOrText}`);
    
    // TRƯỜNG HỢP 1: Nếu là lệnh tìm theo Text (Cú pháp mới: "TEXT:::View story")
    if (selectorOrText.startsWith('TEXT:::') || selectorOrText.includes('View story') || selectorOrText.includes('Xem tin')) {
        const textToFind = selectorOrText.replace('TEXT:::', '').replace('force://', ''); // Làm sạch
        
        // Tách các từ khóa nếu có dấu | (Ví dụ: "View story|Xem tin")
        const keywords = textToFind.split('|').map(k => k.trim());
        
        for (const kw of keywords) {
            // Dùng lại hàm godModeClick thần thánh ở trên
            if (await godModeClick(page, kw, 3000)) return true; 
        }
        return false;
    }
    
    // TRƯỜNG HỢP 2: Selector thông thường (XPath hoặc CSS)
    try {
        let cleanSelector = selectorOrText.replace('force://', '');
        
        // Nếu là XPath
        if (cleanSelector.startsWith('//') || cleanSelector.startsWith('xpath/')) {
            const el = await (page as any).waitForXPath(cleanSelector, { visible: true, timeout: 5000 });
            if (el) { await el.click(); return true; }
        } 
        // Nếu là CSS
        else {
            const el = await page.waitForSelector(cleanSelector, { visible: true, timeout: 5000 });
            if (el) { await el.click(); return true; }
        }
    } catch (e) {
        console.warn(`[CLICK FAIL] Không bấm được theo selector: ${selectorOrText}`);
    }
    return false;
}

// --- HÀM THỰC THI WORKFLOW CHÍNH ---
async function executeWorkflowOnPage(page: Page, workflow: any, profile: any) {
  console.log(`>>> [WORKFLOW] Start: ${profile.name || profile.id}`);
  
  if (!workflow || !workflow.data) return;
  
  let nodes: any[] = [];
  let edges: any[] = [];
  try {
    const wd = workflow.data;
    nodes = typeof wd.nodes === 'string' ? JSON.parse(wd.nodes) : wd.nodes;
    edges = typeof wd.edges === 'string' ? JSON.parse(wd.edges) : wd.edges;
  } catch (e) { return; }
  
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const edgeMap = new Map(edges.map(e => [e.source, e.target]));
  
  let currentId = nodes.find(n => ['start', 'startnode'].includes(n.type?.toLowerCase()))?.id;
  if (!currentId && nodes.length > 0) currentId = nodes[0].id;
  
  let step = 0;
  while (currentId && step < 100) {
    step++;
    const node = nodeMap.get(currentId);
    if (!node) break;
    
    const type = node.type?.toLowerCase().replace(/\s/g, '');
    const config = node.data?.config || node.data || {};
    
    console.log(`>>> [STEP ${step}] Node: ${node.type} (${node.id})`);
    
    try {
      // --- XỬ LÝ LOẠI CLICK ---
      if (type === 'click' || type === 'clicknode') {
         let sel = config.selector || config.target;
         if (sel) {
             // 1. Xử lý Magic Avatar (Giữ nguyên)
             if (sel === 'MAGIC_AVATAR') {
                await clickMagicAvatar(page, profile.id);
             } 
             // 2. Xử lý Click thông thường & Text
             else {
                // Thay thế biến {{username}} nếu có
                sel = replaceVariables(sel, profile);
                await workflowSmartClick(page, sel);
             }
         }
      } 
      // --- XỬ LÝ WAIT ---
      else if (type === 'wait') {
         const ms = Number(config.milliseconds || 2000);
         console.log(`   -> Waiting ${ms}ms...`);
         await new Promise(r => setTimeout(r, ms));
      }
      // --- CÁC LOẠI KHÁC (Type, OpenPage...) giữ nguyên ---
      else if (type === 'openpage' || type === 'openurl') {
         const url = config.url || config.value;
         if (url) {
             await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
             await randomDelay(2000, 4000);
         }
      }
      else if (type === 'type' || type === 'typetext' || type === 'input') {
         const sel = config.selector || config.target;
         const txt = config.text || config.value;
         
         if (sel && txt) {
           if (txt.includes('{{2fa}}')) {
               console.log("      -> Phát hiện bước 2FA. Gọi hàm xử lý...");
               await handleSmart2FA(page, profile);
           } 
           else {
               const finalTxt = replaceVariables(txt, profile);
               await page.waitForSelector(sel, { timeout: 10000 });
               await page.type(sel, finalTxt, { delay: 100 });
           }
         }
      }
    } catch (e) { console.warn(`[!] Node Error:`, e); }
    
    currentId = edgeMap.get(currentId);
  }
  
  console.log(">>> [WORKFLOW] Done.");
}



export async function runAndManageBrowser(profile: any, workflow: any, options: any): Promise<void> {

  return new Promise(async (resolve, reject) => {

    try {

      const profileDir = path.join(process.cwd(), 'browser_profiles', `profile_${profile.id}`);

      if (!fs.existsSync(profileDir)) fs.mkdirSync(profileDir, { recursive: true });



      let exPath = undefined;

      for (const p of DEFAULT_CHROME_PATHS) {

        if (p && fs.existsSync(p)) { exPath = p; break; }

      }

      const args = [
        '--no-sandbox', '--disable-setuid-sandbox', '--disable-infobars',
        '--window-position=0,0', '--ignore-certificate-errors',
        '--disable-blink-features=AutomationControlled',
        '--no-first-run', '--disable-notifications', '--no-default-browser-check'
      ];

      

      if (options.proxy) args.push(`--proxy-server=${options.proxy.type}://${options.proxy.host}:${options.proxy.port}`);



      // SlowMo mode để debug (bật bằng env variable DEBUG_SLOWMO=50)
      const slowMo = process.env.DEBUG_SLOWMO ? parseInt(process.env.DEBUG_SLOWMO) : undefined;

      const browser = await puppeteer.launch({

        headless: false,

        executablePath: exPath,

        userDataDir: profileDir,

        args,

        defaultViewport: null,

        ignoreDefaultArgs: ['--enable-automation'],

        ...(slowMo ? { slowMo } : {}) // Chỉ thêm slowMo nếu được bật

      });



      browserInstances.set(options.sessionId, browser);

      const page = (await browser.pages())[0] || await browser.newPage();



      if (options.proxy?.username) await page.authenticate({ username: options.proxy.username, password: options.proxy.password });

      if (options.userAgent) await page.setUserAgent(options.userAgent);

      if (profile.screenWidth) await page.setViewport({ width: profile.screenWidth, height: profile.screenHeight });

      await page.evaluateOnNewDocument(() => {
        const newProto = (navigator as any).__proto__;
        delete newProto.webdriver;
        // @ts-ignore
        (navigator as any).__proto__ = newProto;
      });



      try { await page.goto('https://www.facebook.com', { waitUntil: 'domcontentloaded', timeout: 30000 }); } catch(e) {}

      if (workflow) await executeWorkflowOnPage(page, workflow, profile);
      else console.log(">>> No workflow.");



      browser.on('disconnected', () => {

        browserInstances.delete(options.sessionId);

        resolve();

      });



    } catch (error) {

      console.error(error);

      reject(error);

    }

  });

}



export async function closeBrowser(sessionId: number) {

  const b = browserInstances.get(sessionId);

  if (b) { await b.close(); browserInstances.delete(sessionId); }

}



export async function getOpenPageUrls(sessionId: number): Promise<string[]> {

    const b = browserInstances.get(sessionId);

    if (!b) return [];

    try { return (await b.pages()).map(p => p.url()); } catch { return []; }

}



export const launchBrowser = runAndManageBrowser;
