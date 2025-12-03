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



async function clickMagicAvatar(page: Page, pid: any) {
    console.log(`[${pid}] 🧙‍♂️ Magic Avatar: Đang tìm...`);
    
    try {
        await page.waitForSelector('image[preserveAspectRatio^="xMidYMid"]', { timeout: 10000 });
        const clicked = await page.evaluate(() => {
            const images = document.querySelectorAll('image[preserveAspectRatio^="xMidYMid"]');
            for (const img of images) {
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



async function handleSmart2FA(page: Page, code2FA: string) {
    console.log(`>>> [SMART 2FA] Bắt đầu chiến 2FA. Mã: ${code2FA}`);
    
    if (!code2FA) {
        console.error(">>> [LỖI] Không có mã 2FA.");
        return;
    }

    try {
        const tryBtn = await (page as any).$x("//div[contains(text(), 'Try another way')] | //span[contains(text(), 'Try another way')]");
        if (tryBtn.length > 0) {
            console.log("   -> Đã bấm 'Try another way'.");
            
            await Promise.all([
                tryBtn[0].click(),
                page.waitForNavigation({ timeout: 3000, waitUntil: 'networkidle2' }).catch(() => {})
            ]);
            
            await randomDelay(2000, 3000);
        }
    } catch (e) {
        console.log("   -> [INFO] Không bấm được 'Try another way' (Có thể đã qua bước này).");
    }

    try {
        const authOption = await page.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('span, div, label'));
            for (const el of elements) {
                if (el.textContent && (el.textContent.includes('Authentication app') || el.textContent.includes('Ứng dụng xác thực'))) {
                    (el as HTMLElement).click();
                    return true;
                }
            }
            return false;
        });

        if (authOption) {
            console.log("   -> Đã chọn 'Authentication app'.");
            await randomDelay(1000, 2000);

            await page.evaluate(() => {
                const btns = Array.from(document.querySelectorAll('span, button, div[role="button"]'));
                for (const b of btns) {
                    if (b.textContent === 'Continue' || b.textContent === 'Tiếp tục') {
                        (b as HTMLElement).click();
                        return true;
                    }
                }
            });
            
            await new Promise(r => setTimeout(r, 3000));
        }
    } catch (e) {
        console.log("   -> [INFO] Lỗi chọn Auth App (Có thể đã hiện ô nhập luôn).");
    }

    const selectors = [
        'input[name="approvals_code"]',
        'input[type="text"][autocomplete="one-time-code"]',
        'input[aria-label="Code"]',
        'input[placeholder="Code"]',
        'input[type="text"]'
    ];

    let typed = false;
    for (let i = 0; i < 10; i++) {
        if (page.isClosed()) break;

        for (const sel of selectors) {
            try {
                const el = await page.$(sel);
                if (el) {
                    console.log(`   -> Tìm thấy ô nhập: ${sel}`);
                    await el.click();
                    await page.type(sel, code2FA, { delay: 100 });
                    typed = true;
                    break;
                }
            } catch(e) {}
        }
        if (typed) break;
        await new Promise(r => setTimeout(r, 1000));
    }

    if (!typed) {
        console.log("   -> Gõ mù (Blind Type)...");
        try {
            await page.keyboard.press('Tab');
            await page.keyboard.type(code2FA, { delay: 100 });
        } catch(e) {}
    }

    try {
        await page.keyboard.press('Enter');
        await randomDelay(1000, 2000);
        
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button, span'));
            for (const b of btns) {
                if (['Continue', 'Tiếp tục', 'Submit', 'Gửi mã'].includes(b.textContent?.trim() || '')) {
                    (b as HTMLElement).click();
                    return true;
                }
            }
        });
    } catch(e) {}
}



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



    console.log(`>>> [STEP ${step}] Node: ${node.type}`);



    try {

      if (type === 'openpage' || type === 'openurl') {

         const url = config.url || config.value;

         if (url) {

             await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

             

             await randomDelay(2000, 4000);

         }

      } 

      else if (type === 'click' || type === 'clicknode') {

         let sel = config.selector || config.target;

         if (sel) {

             try {

                await page.waitForSelector(sel, { timeout: 5000 });

                await page.click(sel);

             } catch(e) {

                 if (!sel.includes('submit')) console.warn("Click miss:", e);

             }

         }

      } 

      else if (type === 'type' || type === 'typetext' || type === 'input') {

         const sel = config.selector || config.target;

         const txt = config.text || config.value;

         

         if (sel && txt) {

           if (txt.includes('{{2fa}}')) {

               console.log("      -> Phát hiện bước 2FA. Gọi hàm xử lý...");

               await handleSmart2FA(page, code2FA);

           } 

           else {

               const finalTxt = replaceVariables(txt, profile);

               await page.waitForSelector(sel, { timeout: 10000 });

               await page.type(sel, finalTxt, { delay: 100 });

           }

         }

      } 

      else if (type === 'wait') {

         const ms = Number(config.milliseconds || 1000);

         await new Promise(r => setTimeout(r, ms));

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



      const browser = await puppeteer.launch({

        headless: false,

        executablePath: exPath,

        userDataDir: profileDir,

        args,

        defaultViewport: null,

        ignoreDefaultArgs: ['--enable-automation']

      });



      browserInstances.set(options.sessionId, browser);

      const page = (await browser.pages())[0] || await browser.newPage();



      if (options.proxy?.username) await page.authenticate({ username: options.proxy.username, password: options.proxy.password });

      if (options.userAgent) await page.setUserAgent(options.userAgent);

      if (profile.screenWidth) await page.setViewport({ width: profile.screenWidth, height: profile.screenHeight });

      await page.evaluateOnNewDocument(() => {
        const newProto = navigator.__proto__;
        delete newProto.webdriver;
        // @ts-ignore
        navigator.__proto__ = newProto;
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
