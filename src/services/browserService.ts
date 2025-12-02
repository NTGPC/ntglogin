import puppeteer from 'puppeteer-extra';

import StealthPlugin from 'puppeteer-extra-plugin-stealth';

import { Browser, Page } from 'puppeteer';

import path from 'path';

import fs from 'fs';

import { authenticator } from 'otplib';



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

    const secret = account.twoFactor || account.secretKey;

    if (secret) {

      try {

        const token = authenticator.generate(secret.replace(/\s/g, ''));

        result = result.replace(/\{\{2fa\}\}/g, token);

      } catch (err) {}

    }

  }

  return result;

}



// === MAGIC CLICK: TÌM BẰNG MỌI GIÁ (Hỗ trợ cửa sổ nhỏ) ===

async function clickMagicAvatar(page: Page, pid: any) {

    console.log(`[${pid}] 🧙‍♂️ Magic Avatar: Quét tìm ảnh...`);

    

    try {

        // Tìm cái thẻ ảnh (image) có thuộc tính đặc biệt

        await page.waitForSelector('image[preserveAspectRatio^="xMidYMid"]', { timeout: 5000 });

        const clicked = await page.evaluate(() => {

            // Lấy tất cả ảnh Avatar trên màn hình

            const images = document.querySelectorAll('image[preserveAspectRatio^="xMidYMid"]');

            

            for (const img of images) {

                // Kiểm tra kích thước (Lọc bỏ icon nhỏ)

                const rect = img.getBoundingClientRect();

                if (rect.width > 80) { // Avatar profile luôn > 80px

                    // Tìm cái nút cha của nó để click

                    const btn = img.closest('div[role="button"]') || img.parentElement;

                    if (btn) {

                        (btn as HTMLElement).click(); // JS CLICK

                        return true;

                    }

                }

            }

            return false;

        });

        if (clicked) {

            console.log(`[${pid}] ✅ Đã JS Click vào Avatar!`);

            return;

        }

    } catch (e) {}

    console.warn(`[${pid}] [!] Không tìm thấy. Thử Click tọa độ ảo...`);

    // Nếu JS fail, click vào giữa màn hình (nơi thường là cover photo/avatar)

    await page.mouse.click(640, 300); 

}



async function handleSmart2FA(page: Page, code2FA: string) {

    try {

        const tryAnotherWayBtn = await (page as any).$x("//div[contains(text(), 'Try another way')]");

        if (tryAnotherWayBtn.length > 0) {

            await tryAnotherWayBtn[0].click();

            await randomDelay(2000, 3000);

            const authAppOption = await (page as any).$x("//div[contains(text(), 'Authentication app')]");

            if (authAppOption.length > 0) {

                await authAppOption[0].click();

                await randomDelay(1000, 2000);

                const continueBtn = await (page as any).$x("//span[contains(text(), 'Continue')]");

                if (continueBtn.length > 0) await continueBtn[0].click();

            }

        }

        const inputSelector = 'input[type="text"], input[name="approvals_code"]';

        try {

            await page.waitForSelector(inputSelector, { timeout: 5000 });

            await page.type(inputSelector, code2FA, { delay: 100 });

            await page.keyboard.press('Enter');

            const submitBtn = await page.$('button[type="submit"], button[value="Continue"]');

            if (submitBtn) await submitBtn.click();

        } catch (e) {}

    } catch (error) {}

}



async function executeWorkflowOnPage(page: Page, workflow: any, profile: any) {

  const pid = profile.id;

  console.log(`[${pid}] WORKFLOW START`);

  

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

  

  let code2FA = "";

  try {

      let acc: any = {};

      if (profile.accountInfo) acc = JSON.parse(profile.accountInfo);

      if (acc.twoFactor) code2FA = authenticator.generate(acc.twoFactor.replace(/\s/g, ''));

  } catch(e){}



  let currentId = nodes.find(n => ['start', 'startnode'].includes(n.type?.toLowerCase()))?.id;

  if (!currentId && nodes.length > 0) currentId = nodes[0].id;



  let step = 0;

  while (currentId && step < 100) {

    step++;

    const node = nodeMap.get(currentId);

    if (!node) break;



    let type = node.type?.toLowerCase().replace(/\s/g, '');

    const config = node.data?.config || node.data || {};



    console.log(`[${pid}] STEP ${step}: ${node.type}`);



    try {

      if (type === 'openpage' || type === 'openurl') {

         const url = config.url || config.value;

         if (url) {

             await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

             

             // === LOGIC ZOOM THÔNG MINH ===

             // Lấy chiều rộng cửa sổ hiện tại

             const view = page.viewport();

             

             if (view && view.width < 400) {

                 // Nếu cửa sổ bé như lỗ mũi (chạy 20-30 luồng)

                 // Zoom xuống 25% để Facebook tưởng màn hình vẫn to

                 console.log(`[${pid}] 🔍 Window cực nhỏ. Zoom 25%`);

                 await page.evaluate(() => { document.body.style.zoom = '0.25'; });

             } 

             else if (view && view.width < 800) {

                 // Nếu cửa sổ vừa vừa

                 console.log(`[${pid}] 🔍 Window vừa. Zoom 60%`);

                 await page.evaluate(() => { document.body.style.zoom = '0.6'; });

             }

             

             await randomDelay(2000, 4000);

         }

      } 

      else if (type === 'click' || type === 'clicknode') {

         let sel = config.selector || config.target;

         if (sel) {

           if (sel === 'MAGIC_AVATAR') {

               await clickMagicAvatar(page, pid);

           }

           else if (sel.startsWith('force:')) {

               sel = sel.replace('force:', '').trim();

               

               // Fix XPath JS Click

               try { await page.waitForSelector(sel, { timeout: 5000 }); } catch(e) {}

               const clicked = await page.evaluate((s) => {

                   let el: any;

                   if (s.startsWith('/') || s.startsWith('(')) {

                       const result = document.evaluate(s, document, null, 9, null);

                       el = result.singleNodeValue;

                   } else {

                       el = document.querySelector(s);

                   }

                   if (el) { el.click(); return true; }

                   return false;

               }, sel);

               

               if(!clicked) console.warn(`[${pid}] JS Click missed.`);

               await randomDelay(2000, 3000);

           } 

           else {

               await page.waitForSelector(sel, { timeout: 10000 });

               await randomDelay(1000, 2000);

               await Promise.all([

                   page.click(sel),

                   page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }).catch(() => {})

               ]);

           }

         }

      } 

      else if (type === 'type' || type === 'typetext') {

         const sel = config.selector || config.target;

         const txt = config.text || config.value;

         if (sel && txt) {

           if (txt.includes('{{2fa}}')) await handleSmart2FA(page, code2FA);

           else {

               const finalTxt = replaceVariables(txt, profile);

               await page.waitForSelector(sel, { timeout: 10000 });

               await randomDelay(1000, 2000);

               await page.type(sel, finalTxt, { delay: 100 });

           }

         }

      } 

      else if (type === 'wait') {

         const ms = Number(config.milliseconds || 1000);

         await new Promise(r => setTimeout(r, ms));

      }

    } catch (e) { console.warn(`[${pid}] Node Error (Ignored):`, e); }

    

    currentId = edgeMap.get(currentId);

  }

  console.log(`[${pid}] DONE.`);

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

      // LẤY KÍCH THƯỚC CỬA SỔ BÉ TÍ TỪ CONTROLLER (ĐỂ XẾP GRID)
      const winX = options.windowPosition?.x || 0;
      const winY = options.windowPosition?.y || 0;
      const winW = options.windowSize?.width || 1000;
      const winH = options.windowSize?.height || 700;

      const args = [

        '--no-sandbox', '--disable-setuid-sandbox', '--disable-infobars',

        

        // Cửa sổ bên ngoài thì bé (để xếp gạch)

        `--window-position=${winX},${winY}`,

        `--window-size=${winW},${winH}`,

        

        '--force-device-scale-factor=0.7', // Thu nhỏ tỉ lệ UI lại chút cho dễ nhìn

        '--ignore-certificate-errors',

        '--disable-blink-features=AutomationControlled',

        '--no-first-run', '--disable-notifications', '--no-default-browser-check',

        '--password-store=basic',

        '--disable-background-timer-throttling',

        '--disable-backgrounding-occluded-windows',

        '--disable-renderer-backgrounding',

        '--autoplay-policy=no-user-gesture-required',

        '--disable-features=CalculateNativeWinOcclusion'

      ];

      

      if (options.proxy) args.push(`--proxy-server=${options.proxy.type}://${options.proxy.host}:${options.proxy.port}`);



      const browser = await puppeteer.launch({

        headless: false,

        executablePath: exPath,

        userDataDir: profileDir,

        args,

        defaultViewport: null,

        ignoreDefaultArgs: ['--enable-automation']

      });



      browserInstances.set(options.sessionId, browser);

      const pages = await browser.pages();

      const page = pages.length > 0 ? pages[0] : await browser.newPage();

      await page.bringToFront();

      // === QUAN TRỌNG NHẤT: ÉP MÀN HÌNH BÊN TRONG PHẢI TO ===
      // Dù cửa sổ bé, nhưng "mắt" của Bot vẫn nhìn thấy giao diện rộng 1280px
      // Điều này giúp Avatar luôn nằm đúng vị trí chuẩn
      await page.setViewport({ width: 1280, height: 800 });



      if (options.proxy?.username) await page.authenticate({ username: options.proxy.username, password: options.proxy.password });

      if (options.userAgent) await page.setUserAgent(options.userAgent);



      // === HACK: LUÔN BÁO LÀ ĐANG NHÌN MÀN HÌNH (BYPASS AUTO-PAUSE) ===

      await page.evaluateOnNewDocument(() => {

        // Xóa dấu vết Bot

        const newProto = (navigator as any).__proto__;

        delete newProto.webdriver;

        // @ts-ignore

        (navigator as any).__proto__ = newProto;



        // Fake Visibility (Quan trọng nhất để chạy nền)

        Object.defineProperty(document, 'hidden', { get: () => false, configurable: true });

        Object.defineProperty(document, 'visibilityState', { get: () => 'visible', configurable: true });

        

        // Chặn sự kiện làm mờ (Blur)

        window.addEventListener('blur', (e) => e.stopImmediatePropagation(), true);

        window.addEventListener('visibilitychange', (e) => e.stopImmediatePropagation(), true);

      });



      try { await page.goto('https://www.facebook.com', { waitUntil: 'domcontentloaded', timeout: 30000 }); } catch(e) {}



      // Chạy không cần await để nó chạy song song

      if (workflow) {

          executeWorkflowOnPage(page, workflow, profile).then(() => {

              // Xong thì kệ nó

          });

      } else console.log(">>> No workflow.");



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
