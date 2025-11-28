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



// === MAGIC AVATAR ===

async function clickMagicAvatar(page: Page) {

    console.log("      -> 🧙‍♂️ Magic Avatar...");

    try {

        const avatarSelector = 'div[role="main"] image[preserveAspectRatio^="xMidYMid"]';

        try { await page.waitForSelector(avatarSelector, { timeout: 3000 }); } catch(e){}



        const element = await page.$(avatarSelector);

        if (element) {

            const box = await element.boundingBox();

            if (box) {

                const x = box.x + box.width / 2;

                const y = box.y + box.height / 2;

                console.log(`      -> 🎯 Click tọa độ ảnh: X=${x}, Y=${y}`);

                await page.mouse.move(x, y, { steps: 5 });

                await page.mouse.down();

                await new Promise(r => setTimeout(r, 100));

                await page.mouse.up();

                return;

            }

        }

    } catch (e) {}

    

    // Fallback

    const hardX = 170;

    const hardY = 370; 

    console.log(`      -> 🔨 Búa tạ: Click X=${hardX}, Y=${hardY}`);

    await page.mouse.click(hardX, hardY);

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

             await randomDelay(2000, 4000);

         }

      } 

      else if (type === 'click' || type === 'clicknode') {

         let sel = config.selector || config.target;

         if (sel) {

           if (sel === 'MAGIC_AVATAR') {

               await clickMagicAvatar(page);

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



      const args = [

        '--no-sandbox', '--disable-setuid-sandbox', '--disable-infobars',

        '--window-position=0,0', '--ignore-certificate-errors',

        '--disable-blink-features=AutomationControlled',

        '--no-first-run', '--disable-notifications', '--no-default-browser-check',

        '--password-store=basic',

        // === CỜ CHỐNG NGỦ ĐÔNG & AUTO PLAY ===

        '--disable-background-timer-throttling',

        '--disable-backgrounding-occluded-windows',

        '--disable-renderer-backgrounding',

        '--autoplay-policy=no-user-gesture-required', // Ép video tự chạy

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



      // Ép Viewport

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
