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



async function handleSmart2FA(page: Page, code2FA: string) {

    console.log(">>> [SMART 2FA] Checking...");

    try {

        const tryAnotherWayBtn = await (page as any).$x("//div[contains(text(), 'Try another way')] | //span[contains(text(), 'Try another way')]");

        if (tryAnotherWayBtn.length > 0) {

            await tryAnotherWayBtn[0].click();

            await randomDelay(2000, 3000);

            const authAppOption = await (page as any).$x("//div[contains(text(), 'Authentication app')] | //span[contains(text(), 'Authentication app')]");

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

  console.log(`>>> [WORKFLOW] Start: ${profile.name}`);

  

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



    const captcha = await page.$('iframe[title*="reCAPTCHA"]');

    if (captcha) await new Promise(r => setTimeout(r, 30000));



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

           const isForce = sel.startsWith('force:');

           if (isForce) sel = sel.replace('force:', '').trim();



           try {

               await page.waitForSelector(sel, { timeout: 10000 });

               if (isForce) {

                   await page.evaluate((selector) => {

                       let el: any = document.querySelector(selector);

                       if (!el && selector.startsWith('//')) {

                           el = document.evaluate(selector, document, null, 9, null).singleNodeValue;

                       }

                       if (el) el.click();

                   }, sel);

               } else {

                   await randomDelay(1000, 2000);

                   await Promise.all([

                       page.click(sel),

                       page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }).catch(() => {})

                   ]);

               }

           } catch (e) { console.warn(`[!] Click Failed:`, e); }

         }

      } 

      else if (type === 'type' || type === 'typetext' || type === 'input') {

         const sel = config.selector || config.target;

         const txt = config.text || config.value;

         if (sel && txt) {

           if (txt.includes('{{2fa}}')) await handleSmart2FA(page, code2FA);

           else {

               const finalTxt = replaceVariables(txt, profile);

               await page.waitForSelector(sel, { timeout: 10000 });

               await randomDelay(1000, 2000);

               await page.evaluate(s => { const el = document.querySelector(s); if(el) (el as any).value = ''; }, sel);

               await page.type(sel, finalTxt, { delay: 100 });

           }

         }

      } 

      else if (type === 'wait') {

         const ms = Number(config.milliseconds || 1000);

         console.log(`      -> Waiting: ${ms}ms`);

         await new Promise(r => setTimeout(r, ms));

      }

    } catch (e) { 

        console.warn(`[!] Node Error (Ignored):`, e);

        if (String(e).includes('detached Frame')) {

            console.log(">>> [INFO] Phát hiện chuyển trang (Detached Frame), tiếp tục node sau...");

        }

    }

    

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

        '--no-first-run', '--disable-notifications', '--no-default-browser-check',

        '--password-store=basic'

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



      if (options.proxy?.username) await page.authenticate({ username: options.proxy.username, password: options.proxy.password });

      if (options.userAgent) await page.setUserAgent(options.userAgent);

      if (profile.screenWidth) await page.setViewport({ width: profile.screenWidth, height: profile.screenHeight });



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
