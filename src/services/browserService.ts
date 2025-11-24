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



// --- HÀM XỬ LÝ BIẾN (In log nếu thiếu dữ liệu) ---

function replaceVariables(text: string, profile: any): string {

  if (!text) return "";

  

  let account: any = {};

  try {

    if (profile.accountInfo) {

      account = typeof profile.accountInfo === 'string' ? JSON.parse(profile.accountInfo) : profile.accountInfo;

    }

  } catch (e) { console.error("!!! Lỗi parse Account Info:", e); }



  // DEBUG: Kiểm tra xem có UID không

  if (!account.uid && !account.username && !profile.name) {

      console.warn("!!! CẢNH BÁO: Không tìm thấy UID/Username trong Profile. Biến {{uid}} sẽ rỗng!");

  }



  let result = text;

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



async function executeWorkflowOnPage(page: Page, workflow: any, profile: any) {

  console.log(`>>> [WORKFLOW] Bắt đầu chạy kịch bản cho: ${profile.name}`);

  

  if (!workflow || !workflow.data) {

      console.error("!!! [LỖI] Workflow rỗng.");

      return;

  }



  let nodes: any[] = [];

  let edges: any[] = [];

  try {

    const wd = workflow.data;

    nodes = typeof wd.nodes === 'string' ? JSON.parse(wd.nodes) : wd.nodes;

    edges = typeof wd.edges === 'string' ? JSON.parse(wd.edges) : wd.edges;

  } catch (e) { return; }



  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  const edgeMap = new Map(edges.map(e => [e.source, e.target]));

  

  // Tìm nút Start (Mở rộng phạm vi tìm kiếm)

  let currentId = nodes.find(n => {

      const t = n.type?.toLowerCase();

      return t === 'start' || t === 'startnode' || t === 'begin';

  })?.id;



  // Fallback: Nếu không có nút Start, lấy nút đầu tiên

  if (!currentId && nodes.length > 0) currentId = nodes[0].id;



  let step = 0;

  while (currentId && step < 100) {

    step++;

    const node = nodeMap.get(currentId);

    if (!node) break;



    // CHUẨN HÓA TÊN NODE ĐỂ TRÁNH LỖI TYPE/TYPETEXT

    let type = node.type?.toLowerCase().replace(/\s/g, ''); // Xóa hết dấu cách: "Type Text" -> "typetext"

    const config = node.data?.config || node.data || {};



    console.log(`>>> [BƯỚC ${step}] Node: ${node.type} (Hiểu là: ${type})`);



    try {

      // 1. OPEN PAGE

      if (type === 'openpage' || type === 'openurl' || type === 'open-url') {

         const url = config.url || config.value;

         if (url) await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

      } 

      // 2. CLICK

      else if (type === 'click' || type === 'clicknode') {

         const sel = config.selector || config.target;

         if (sel) {

           console.log(`      -> Đang Click: ${sel}`);

           try {

               await page.waitForSelector(sel, { timeout: 5000 });

               await Promise.all([

                   new Promise(r => setTimeout(r, 1000)),

                   page.click(sel),

                   // Không chờ nav nữa để tránh treo

               ]);

           } catch (e) { console.warn(`      [!] Không click được (bỏ qua): ${sel}`); }

         }

      } 

      // 3. TYPE TEXT (QUAN TRỌNG: CHẤP NHẬN NHIỀU TÊN)

      else if (type === 'type' || type === 'typetext' || type === 'fill' || type === 'input') {

         const sel = config.selector || config.target;

         const txt = config.text || config.value;

         

         console.log(`      -> Kiểm tra nhập liệu: Selector=${sel} | Text=${txt}`);



         if (sel && txt) {

           const finalTxt = replaceVariables(txt, profile);

           console.log(`      -> Nội dung sẽ nhập: "${finalTxt}"`);



           try {

               // Chờ Selector xuất hiện (quan trọng)

               await page.waitForSelector(sel, { timeout: 5000 });

               

               // Clear nội dung cũ

               await page.evaluate(s => { const el = document.querySelector(s); if(el) (el as any).value = ''; }, sel);

               

               // Nhập nội dung mới

               await page.type(sel, finalTxt, { delay: 50 });

               console.log(`      -> Đã nhập xong!`);

           } catch (e) {

               console.error(`      !!! [LỖI] Không tìm thấy ô nhập liệu: ${sel}. Kiểm tra lại Selector!`);

           }

         } else {

             console.warn("      !!! [LỖI] Thiếu Selector hoặc Text trong Workflow");

         }

      } 

      // 4. WAIT

      else if (type === 'wait') {

         await new Promise(r => setTimeout(r, Number(config.milliseconds || 1000)));

      }

    } catch (e) { console.warn(`Lỗi Node:`, e); }

    

    currentId = edgeMap.get(currentId);

  }

  console.log(">>> [WORKFLOW] Kết thúc.");

}



// --- MAIN ---

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

        `--user-data-dir=${profileDir}`,

        '--no-first-run', '--disable-notifications'

      ];

      

      if (options.proxy) args.push(`--proxy-server=${options.proxy.type}://${options.proxy.host}:${options.proxy.port}`);



      const browser = await puppeteer.launch({

        headless: false,

        executablePath: exPath,

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

        const newProto = (navigator as any).__proto__;

        delete newProto.webdriver;

        (navigator as any).__proto__ = newProto;

      });



      // 1. Mở Facebook trước (Failsafe)

      try {

          await page.goto('https://www.facebook.com', { waitUntil: 'domcontentloaded', timeout: 30000 });

      } catch(e) {}



      // 2. Chạy Workflow

      if (workflow) await executeWorkflowOnPage(page, workflow, profile);

      else console.log(">>> Không có workflow.");



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
