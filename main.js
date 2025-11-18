const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
const { ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

chromium.use(stealth);

// Import các hàm từ browser-manager.js
const { launchAndFingerprint, executeWorkflowOnPage } = require('./browser-manager');

// Import Prisma Client (dynamic import để tương thích với CommonJS)
let prisma = null;
async function getPrisma() {
  if (!prisma) {
    try {
      // Import Prisma từ generated client
      const { PrismaClient } = require('./generated/prisma');
      prisma = new PrismaClient();
      console.log('[PRISMA] Đã kết nối Prisma Client thành công');
    } catch (error) {
      console.error('[PRISMA] Lỗi khi kết nối Prisma:', error);
      throw error;
    }
  }
  return prisma;
}

// Map để lưu các page object đang chạy theo profileId
const runningPages = new Map();
const runningBrowsers = new Map();

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

  // Lưu page và browser vào Map để sử dụng cho automation
  const profileId = profileData.id || profileData.profileId;
  if (profileId) {
    runningPages.set(profileId, page);
    runningBrowsers.set(profileId, browser);
    console.log(`[+] Đã lưu page và browser cho profile ${profileId}`);
  }

  console.log('[+] Profile đã được khởi chạy. Danh tính đã được LẬP TRÌNH LẠI HOÀN CHỈNH.');
  
  return { page, browser, context };
}

ipcMain.on('launch-profile', (event, profileData) => {
  launchProfileWithFullEmulation(profileData).catch(err => {
    console.error("Lỗi khi khởi chạy profile với Full Emulation:", err);
  });
});

// =======================================================================
// === BẮT ĐẦU ĐOẠN CODE "MỘT PHÁT ĂN NGAY" ===
// =======================================================================

// HÀM "THÔNG DỊCH" WORKFLOW PHIÊN BẢN TỐI THƯỢNG
async function executeWorkflow(page, workflow) {
  // Kiểm tra workflow data - có thể nằm trong workflow.data (JSON) hoặc workflow.nodes/edges trực tiếp
  let nodes, edges;
  
  if (workflow.data && typeof workflow.data === 'object') {
    // Workflow data được lưu trong trường 'data' (JSON)
    nodes = workflow.data.nodes || [];
    edges = workflow.data.edges || [];
    console.log('[WORKFLOW ENGINE] Đã lấy workflow data từ trường "data"');
  } else if (workflow.nodes && workflow.edges) {
    // Workflow có nodes và edges trực tiếp
    nodes = workflow.nodes;
    edges = workflow.edges;
    console.log('[WORKFLOW ENGINE] Đã lấy workflow data từ nodes/edges trực tiếp');
  } else {
    console.error('[WORKFLOW ENGINE] LỖI: Không tìm thấy nodes/edges trong workflow!');
    return;
  }

  console.log('\n--- [WORKFLOW ENGINE V4 - ROBUST] BẮT ĐẦU THỰC THI ---');
  console.log(`--- Tên workflow: "${workflow.name || 'Unknown'}" ---`);
  console.log(`--- Số lượng nodes: ${nodes.length}, edges: ${edges.length} ---`);
  
  // 1. TÌM NODE START MỘT CÁCH AN TOÀN
  let startNode = nodes.find(n => n.type === 'Start' || n.type === 'input' || n.type === 'startNode');
  
  if (!startNode) {
    // Thử tìm node không có edge nào trỏ đến
    const nodeIds = new Set(nodes.map(n => n.id));
    const targetIds = new Set(edges.map(e => e.target));
    const nodesWithNoIncoming = nodes.filter(n => !targetIds.has(n.id));
    
    if (nodesWithNoIncoming.length > 0) {
      startNode = nodesWithNoIncoming[0];
      console.log(`[WORKFLOW ENGINE] Sử dụng node không có edge trỏ đến làm Start: ${startNode.id}`);
    } else {
      console.error("--- LỖI: Không tìm thấy node 'Start'. Dừng thực thi. ---");
      return;
    }
  }
  
  console.log(`[+] Đã tìm thấy node Start (ID: ${startNode.id}).`);

  // 2. XÂY DỰNG "BẢN ĐỒ" KẾT NỐI ĐỂ ĐI CHO ĐÚNG ĐƯỜNG
  const edgeMap = new Map();
  edges.forEach(edge => {
    edgeMap.set(edge.source, edge.target);
  });
  console.log('[+] Đã xây dựng bản đồ kết nối (edge map).');

  let currentNodeId = startNode.id;
  
  // Vòng lặp an toàn, sẽ chạy qua tất cả các node
  for (let i = 0; i < nodes.length + 1; i++) {
    const currentNode = nodes.find(n => n.id === currentNodeId);
    if (!currentNode) {
      console.error(`--- LỖI: Không tìm thấy node với ID: ${currentNodeId}. Dừng lại. ---`);
      break;
    }

    console.log(`\n[>>] Đang ở node: [${currentNode.type}] (ID: ${currentNode.id})`);

    // 3. BỎ QUA HÀNH ĐỘNG CỦA NODE START, CHỈ THỰC THI CÁC NODE SAU
    if (currentNode.type !== 'Start' && currentNode.type !== 'input' && currentNode.type !== 'startNode') {
      // "GIẢI NÉN" DỮ LIỆU CỦA NODE (CỰC KỲ QUAN TRỌNG)
      let nodeData = currentNode.data;
      if (typeof nodeData === 'string') {
        try {
          nodeData = JSON.parse(nodeData);
          console.log('   [i] Dữ liệu node đã được giải nén từ chuỗi JSON.');
        } catch (e) {
          console.error(`   --- LỖI: Dữ liệu của node ${currentNode.id} không phải JSON hợp lệ. Bỏ qua node này. ---`);
          const nextNodeId = edgeMap.get(currentNodeId);
          if (!nextNodeId) { 
            console.log('[+] Hết đường đi sau khi gặp lỗi.'); 
            break; 
          }
          currentNodeId = nextNodeId;
          continue; // Chuyển sang node tiếp theo
        }
      }

      // 4. THỰC THI HÀNH ĐỘNG
      try {
        switch (currentNode.type) {
          case 'Open Page':
          case 'openUrlNode':
          case 'open-url':
            if (nodeData && nodeData.url) {
              console.log(`   [*] Đang điều hướng đến: ${nodeData.url}`);
              await page.goto(nodeData.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
              console.log(`   [✔] ĐÃ ĐẾN TRANG: ${nodeData.url}`);
            } else {
              console.warn(`   [!] CẢNH BÁO: Node "Open Page" không có URL.`);
            }
            break;

          case 'Click':
          case 'clickNode':
          case 'click':
            if (nodeData && nodeData.selector) {
              console.log(`   [*] Đang click vào selector: ${nodeData.selector}`);
              await page.waitForSelector(nodeData.selector, { timeout: 30000 });
              await page.click(nodeData.selector);
              console.log(`   [✔] ĐÃ CLICK vào: ${nodeData.selector}`);
            } else {
              console.warn(`   [!] CẢNH BÁO: Node "Click" không có selector.`);
            }
            break;

          case 'Type':
          case 'typeNode':
          case 'type':
          case 'fill':
            if (nodeData && nodeData.selector && nodeData.text) {
              console.log(`   [*] Đang nhập "${nodeData.text}" vào selector: ${nodeData.selector}`);
              await page.waitForSelector(nodeData.selector, { timeout: 30000 });
              await page.fill(nodeData.selector, nodeData.text);
              console.log(`   [✔] ĐÃ NHẬP vào: ${nodeData.selector}`);
            } else {
              console.warn(`   [!] CẢNH BÁO: Node "Type" không đủ thông tin.`);
            }
            break;

          case 'Wait':
          case 'waitNode':
          case 'wait':
            const milliseconds = nodeData?.milliseconds || nodeData?.time || nodeData?.value || 1000;
            console.log(`   [*] Đang chờ ${milliseconds}ms`);
            await page.waitForTimeout(Number(milliseconds));
            console.log(`   [✔] ĐÃ CHỜ XONG`);
            break;

          case 'screenshot':
            const screenshotPath = nodeData?.path || nodeData?.value || `screenshot_${Date.now()}.png`;
            console.log(`   [*] Đang chụp screenshot: ${screenshotPath}`);
            await page.screenshot({ path: screenshotPath });
            console.log(`   [✔] ĐÃ CHỤP SCREENSHOT: ${screenshotPath}`);
            break;

          case 'evaluate':
            const script = nodeData?.script || nodeData?.value || '';
            if (script) {
              console.log(`   [*] Đang thực thi script`);
              const result = await page.evaluate(script);
              console.log(`   [✔] ĐÃ THỰC THI SCRIPT, kết quả:`, result);
            } else {
              console.warn(`   [!] CẢNH BÁO: Node "Evaluate" không có script.`);
            }
            break;

          default:
            console.warn(`   [!] Không biết cách xử lý node type: ${currentNode.type}`);
            break;
        }
      } catch (execError) {
        console.error(`--- LỖI KHI THỰC THI NODE ${currentNode.id}:`, execError.message);
        break; 
      }
    }
    
    // 5. NẾU LÀ NODE END, KẾT THÚC
    if (currentNode.type === 'End' || currentNode.type === 'output' || currentNode.type === 'endNode') {
      console.log('[+] Gặp node End. Workflow hoàn thành.');
      break;
    }
    
    // 6. TÌM ĐƯỜNG ĐI TIẾP THEO
    const nextNodeId = edgeMap.get(currentNodeId);
    if (!nextNodeId) {
      console.log('[+] Không tìm thấy đường đi tiếp theo. Workflow kết thúc.');
      break;
    }
    
    currentNodeId = nextNodeId; // Cập nhật để vòng lặp tiếp tục
  }
  
  console.log('--- [WORKFLOW ENGINE] KẾT THÚC THỰC THI ---');
}

// =======================================================================
// === KẾT THÚC ĐOẠN CODE THAY THẾ ===
// =======================================================================

// LISTENER CHÍNH, ĐIỀU PHỐI MỌI THỨ
ipcMain.on('start-profile-and-run-workflow', async (event, profileId) => {
  try {
    console.log(`\n\n================================`);
    console.log(`[MAIN] Nhận yêu cầu cho profile ID: ${profileId}`);
    console.log(`================================\n`);

    // BƯỚC 1: LẤY DỮ LIỆU TỪ CSDL
    const prismaClient = await getPrisma();
    
    console.log('[MAIN] Đang truy vấn database...');
    const profile = await prismaClient.profile.findUnique({
      where: { id: Number(profileId) },
      include: {
        workflow: {
          // Workflow data được lưu trong trường 'data' (JSON)
        }
      }
    });

    if (!profile) {
      console.error(`[MAIN-ERROR] Không tìm thấy profile ${profileId}.`);
      if (event && event.sender && !event.sender.isDestroyed()) {
        event.sender.send('execution-error', { 
          profileId, 
          message: `Profile ${profileId} không tồn tại` 
        });
      }
      return;
    }

    // --- ĐÂY LÀ DÒNG QUAN TRỌNG NHẤT ---
    // NÓ SẼ IN RA TOÀN BỘ CẤU TRÚC DỮ LIỆU MÀ CHÚNG TA NHẬN ĐƯỢC
    console.log('[DATA DUMP] ========================================');
    console.log('[DATA DUMP] Dữ liệu Profile và Workflow từ CSDL:');
    console.log(JSON.stringify(profile, null, 2));
    console.log('[DATA DUMP] ========================================\n');

    // Kiểm tra workflow data
    if (profile.workflow && profile.workflow.data) {
      console.log('[DATA DUMP] Workflow data (JSON):');
      console.log(JSON.stringify(profile.workflow.data, null, 2));
      console.log('[DATA DUMP] ========================================\n');
    }

    // 2. KHỞI CHẠY TRÌNH DUYỆT
    console.log('[EXEC] Đang khởi chạy trình duyệt...');
    const { browser, page } = await launchAndFingerprint(profile);
    console.log('[EXEC] ✅ Trình duyệt đã khởi chạy thành công.\n');

    // Lưu page và browser vào Map
    runningPages.set(Number(profileId), page);
    runningBrowsers.set(Number(profileId), browser);
    console.log(`[EXEC] Đã lưu page và browser cho profile ${profileId}\n`);

    // 3. KIỂM TRA VÀ THỰC THI WORKFLOW
    if (profile.workflow && profile.workflow.data) {
      const workflowData = profile.workflow.data;
      
      // Kiểm tra cấu trúc workflow data
      console.log('[EXEC] ========================================');
      console.log(`[EXEC] Tìm thấy workflow "${profile.workflow.name}".`);
      console.log(`[EXEC] Workflow ID: ${profile.workflow.id}`);
      console.log(`[EXEC] Workflow data type:`, typeof workflowData);
      console.log(`[EXEC] Workflow data keys:`, Object.keys(workflowData || {}));
      
      // Kiểm tra nodes và edges
      if (workflowData.nodes) {
        console.log(`[EXEC] Số lượng nodes: ${workflowData.nodes.length}`);
        console.log(`[EXEC] Node types:`, workflowData.nodes.map(n => n.type).join(', '));
      } else {
        console.warn(`[EXEC] ⚠️ Workflow data không có 'nodes'!`);
      }
      
      if (workflowData.edges) {
        console.log(`[EXEC] Số lượng edges: ${workflowData.edges.length}`);
      } else {
        console.warn(`[EXEC] ⚠️ Workflow data không có 'edges'!`);
      }
      
      console.log('[EXEC] ========================================\n');
      console.log('[EXEC] Chuẩn bị thực thi workflow...\n');

      // Gọi hàm executeWorkflow mới
      await executeWorkflow(page, profile.workflow);
      
      console.log(`\n[EXEC] ✅ Đã thực thi xong workflow "${profile.workflow.name}".`);
    } else {
      console.log('[EXEC] ⚠️ Profile không có workflow nào được gán hoặc workflow rỗng.');
      console.log(`[EXEC] Workflow ID: ${profile.workflowId || 'null'}`);
      console.log(`[EXEC] Workflow object:`, profile.workflow ? 'exists' : 'null');
      if (profile.workflow) {
        console.log(`[EXEC] Workflow data:`, profile.workflow.data ? 'exists' : 'null');
      }
    }

    console.log(`\n[EXEC] =================================`);
    console.log(`[EXEC] Hoàn thành tiến trình cho profile ${profileId}`);
    console.log(`[EXEC] =================================\n\n`);

  } catch (error) {
    console.error(`[MAIN] LỖI TOÀN CỤC:`, error);
    console.error(`[MAIN] Error message:`, error.message);
    console.error(`[MAIN] Error stack:`, error.stack);
    
    // Gửi thông báo lỗi về renderer process
    if (event && event.sender && !event.sender.isDestroyed()) {
      event.sender.send('execution-error', { 
        profileId, 
        message: error.message 
      });
    }
  }
});

// =======================================================================
// === KẾT THÚC ĐOẠN CODE THAY THẾ ===
// =======================================================================

// Hàm sắp xếp các node theo thứ tự thực thi (topological sort)
function sortNodes(nodes, edges) {
  // Tạo map để tìm node theo ID
  const nodeMap = new Map();
  nodes.forEach(node => {
    nodeMap.set(node.id, node);
  });

  // Tạo adjacency list (danh sách kề) - node nào phụ thuộc vào node nào
  const inDegree = new Map();
  const graph = new Map();

  // Khởi tạo
  nodes.forEach(node => {
    inDegree.set(node.id, 0);
    graph.set(node.id, []);
  });

  // Xây dựng graph từ edges
  edges.forEach(edge => {
    const sourceId = edge.source;
    const targetId = edge.target;
    
    // Tăng in-degree của target
    inDegree.set(targetId, (inDegree.get(targetId) || 0) + 1);
    
    // Thêm vào graph
    if (!graph.has(sourceId)) {
      graph.set(sourceId, []);
    }
    graph.get(sourceId).push(targetId);
  });

  // Tìm start node (node có type 'input' hoặc không có edge nào trỏ đến)
  const startNodes = nodes.filter(node => {
    return node.type === 'input' || inDegree.get(node.id) === 0;
  });

  if (startNodes.length === 0) {
    console.warn('Không tìm thấy start node, sử dụng node đầu tiên');
    return nodes;
  }

  // Topological sort
  const sortedNodes = [];
  const queue = [...startNodes.map(n => n.id)];
  const visited = new Set();

  while (queue.length > 0) {
    const currentId = queue.shift();
    
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const currentNode = nodeMap.get(currentId);
    if (currentNode) {
      sortedNodes.push(currentNode);
    }

    // Xử lý các node con
    const children = graph.get(currentId) || [];
    children.forEach(childId => {
      const currentInDegree = inDegree.get(childId) - 1;
      inDegree.set(childId, currentInDegree);
      
      if (currentInDegree === 0 && !visited.has(childId)) {
        queue.push(childId);
      }
    });
  }

  // Thêm các node không được kết nối
  nodes.forEach(node => {
    if (!visited.has(node.id)) {
      sortedNodes.push(node);
    }
  });

  return sortedNodes;
}

// HÀM "THÔNG DỊCH" WORKFLOW (PHIÊN BẢN FULL DEBUG)
async function executeWorkflow(page, workflowData) {
  console.log('[WF-DEBUG] ========================================');
  console.log('[WF-DEBUG] Bắt đầu thông dịch workflow...');
  
  // Kiểm tra cấu trúc workflowData
  if (!workflowData) {
    console.error('[WF-ERROR] ❌ workflowData là null hoặc undefined!');
    throw new Error('Workflow data không hợp lệ');
  }

  const { nodes, edges } = workflowData;

  // Kiểm tra nodes và edges
  if (!nodes || !Array.isArray(nodes)) {
    console.error('[WF-ERROR] ❌ nodes không phải là array hoặc không tồn tại!');
    console.error('[WF-ERROR] workflowData keys:', Object.keys(workflowData));
    throw new Error('Workflow nodes không hợp lệ');
  }

  if (!edges || !Array.isArray(edges)) {
    console.error('[WF-ERROR] ❌ edges không phải là array hoặc không tồn tại!');
    console.error('[WF-ERROR] workflowData keys:', Object.keys(workflowData));
    throw new Error('Workflow edges không hợp lệ');
  }

  console.log(`[WF-DEBUG] Tổng số nodes: ${nodes.length}`);
  console.log(`[WF-DEBUG] Tổng số edges: ${edges.length}`);
  
  // In ra toàn bộ dữ liệu để kiểm tra
  console.log('[WF-DEBUG] ========================================');
  console.log('[WF-DEBUG] Nodes data:');
  console.log(JSON.stringify(nodes, null, 2));
  console.log('[WF-DEBUG] ========================================');
  console.log('[WF-DEBUG] Edges data:');
  console.log(JSON.stringify(edges, null, 2));
  console.log('[WF-DEBUG] ========================================');

  // 1. TÌM NODE START
  console.log('[WF-DEBUG] Đang tìm node Start...');
  console.log('[WF-DEBUG] Danh sách node types có sẵn:', nodes.map(n => `${n.id}:${n.type}`).join(', '));
  
  // Kiểm tra nhiều loại type có thể là start node
  let startNode = nodes.find(n => n.type === 'input' || n.type === 'Start' || n.type === 'startNode');
  
  if (!startNode) {
    console.warn('[WF-DEBUG] ⚠️ Không tìm thấy node Start với type "input", "Start", hoặc "startNode"');
    
    // Thử tìm node không có edge nào trỏ đến (in-degree = 0)
    const nodeIds = new Set(nodes.map(n => n.id));
    const targetIds = new Set(edges.map(e => e.target));
    const nodesWithNoIncoming = nodes.filter(n => !targetIds.has(n.id));
    
    console.log('[WF-DEBUG] Nodes không có edge trỏ đến:', nodesWithNoIncoming.map(n => `${n.id}:${n.type}`).join(', '));
    
    if (nodesWithNoIncoming.length > 0) {
      startNode = nodesWithNoIncoming[0];
      console.log(`[WF-DEBUG] ✅ Sử dụng node không có edge trỏ đến làm Start: ${startNode.id} (type: ${startNode.type})`);
    } else {
      console.error("[WF-ERROR] ❌ KHÔNG TÌM THẤY NODE START! Workflow không thể bắt đầu.");
      console.error("[WF-ERROR] Danh sách node types có sẵn:", nodes.map(n => n.type).join(', '));
      throw new Error("Không tìm thấy node Start trong workflow");
    }
  } else {
    console.log(`[WF-DEBUG] ✅ Đã tìm thấy node Start, ID: ${startNode.id}, Type: ${startNode.type}`);
  }
  
  console.log(`[WF-DEBUG] Node Start data:`, JSON.stringify(startNode, null, 2));

  let currentNode = startNode;
  let stepCount = 0;

  // Vòng lặp an toàn để tránh vòng lặp vô hạn
  for (let i = 0; i < 100; i++) {
    stepCount++;
    console.log(`[EXEC-DEBUG] --- Bước ${stepCount} ---`);

    // 2. TÌM CẠNH (EDGE) TIẾP THEO
    console.log(`[EXEC-DEBUG] Đang tìm cạnh đi ra từ node ID: ${currentNode.id} (Type: ${currentNode.type})`);
    const nextEdge = edges.find(e => e.source === currentNode.id);
    
    if (!nextEdge) {
      console.log("[EXEC-DEBUG] ⚠️ Không tìm thấy cạnh nào đi ra từ node này.");
      console.log("[EXEC-DEBUG] Workflow kết thúc tại đây.");
      break; // Hết đường đi, dừng lại
    }
    
    console.log(`[EXEC-DEBUG] ✅ Đã tìm thấy cạnh:`);
    console.log(`[EXEC-DEBUG]   - Source: ${nextEdge.source}`);
    console.log(`[EXEC-DEBUG]   - Target: ${nextEdge.target}`);
    console.log(`[EXEC-DEBUG]   - Edge ID: ${nextEdge.id || 'N/A'}`);

    // 3. TÌM NODE TIẾP THEO
    const nextNode = nodes.find(n => n.id === nextEdge.target);
    if (!nextNode) {
      console.error(`[EXEC-ERROR] ❌ Lỗi logic: Cạnh trỏ đến một target node không tồn tại!`);
      console.error(`[EXEC-ERROR] Target ID: ${nextEdge.target}`);
      console.error(`[EXEC-ERROR] Danh sách node IDs có sẵn:`, nodes.map(n => n.id).join(', '));
      throw new Error(`Node target ${nextEdge.target} không tồn tại`);
    }
    
    console.log(`[EXEC-DEBUG] ✅ Node tiếp theo:`);
    console.log(`[EXEC-DEBUG]   - ID: ${nextNode.id}`);
    console.log(`[EXEC-DEBUG]   - Type: ${nextNode.type}`);
    console.log(`[EXEC-DEBUG]   - Label: ${nextNode.data?.label || 'N/A'}`);
    console.log(`[EXEC-DEBUG]   - Data:`, JSON.stringify(nextNode.data, null, 2));

    // 4. THỰC THI HÀNH ĐỘNG CỦA NODE TIẾP THEO
    console.log(`[EXEC-DEBUG] 🚀 Đang thực thi hành động của node: ${nextNode.data?.label || nextNode.type}`);
    
    try {
      // Xử lý nhiều loại node type
      switch (nextNode.type) {
        case 'input':
        case 'Start':
        case 'startNode':
          console.log(`[EXEC-DEBUG]   -> Start node, bỏ qua`);
          break;

        case 'output':
        case 'End':
        case 'endNode':
          console.log(`[EXEC-DEBUG]   -> End node, workflow hoàn thành`);
          currentNode = nextNode;
          return; // Kết thúc workflow

        case 'Open Page':
        case 'openUrlNode':
        case 'open-url':
        case 'default':
          // In ra dữ liệu của node để xem URL nằm ở đâu
          console.log(`[WF-EXEC] Dữ liệu node Open Page/default:`, JSON.stringify(nextNode.data, null, 2));
          
          // Kiểm tra nếu là default node với action "open url"
          const action = nextNode.data?.action || nextNode.data?.label?.toLowerCase() || '';
          const isOpenUrl = nextNode.type === 'Open Page' || 
                          nextNode.type === 'openUrlNode' || 
                          nextNode.type === 'open-url' ||
                          (nextNode.type === 'default' && (action.includes('mở url') || action.includes('open url')));
          
          if (isOpenUrl) {
            const url = nextNode.data?.url || nextNode.data?.value || 'https://google.com';
            console.log(`[WF-EXEC]   -> Đang điều hướng đến URL: ${url}`);
            await page.goto(url, { waitUntil: 'domcontentloaded' });
            console.log(`[WF-EXEC]   -> ✅ ĐÃ ĐIỀU HƯỚNG ĐẾN: ${url}`);
          } else if (nextNode.type === 'default') {
            // Xử lý các action khác của default node
            if (action.includes('click')) {
              const selector = nextNode.data?.selector || nextNode.data?.value || '';
              if (selector) {
                console.log(`[EXEC-DEBUG]   -> Đang click vào selector: ${selector}`);
                await page.click(selector, { timeout: 10000 });
                console.log(`[EXEC-DEBUG]   -> ✅ Đã click vào: ${selector}`);
              } else {
                console.warn(`[EXEC-DEBUG]   -> ⚠️ CẢNH BÁO: Node "Click" không có selector.`);
              }
            } else if (action.includes('nhập') || action.includes('type') || action.includes('fill')) {
              const selector = nextNode.data?.selector || nextNode.data?.target || '';
              const text = nextNode.data?.text || nextNode.data?.value || '';
              if (selector && text) {
                console.log(`[EXEC-DEBUG]   -> Đang nhập "${text}" vào selector: ${selector}`);
                await page.fill(selector, text);
                console.log(`[EXEC-DEBUG]   -> ✅ Đã nhập "${text}" vào: ${selector}`);
              } else {
                console.warn(`[EXEC-DEBUG]   -> ⚠️ CẢNH BÁO: Node "Type" không đủ thông tin (selector: ${selector}, text: ${text}).`);
              }
            } else {
              console.warn(`[EXEC-DEBUG]   -> ⚠️ Không biết cách xử lý action: ${action}`);
            }
          }
          break;

        case 'clickNode':
        case 'click':
          const clickSelector = nextNode.data?.selector || nextNode.data?.target || nextNode.data?.value || '';
          if (clickSelector) {
            console.log(`[EXEC-DEBUG]   -> Đang click vào selector: ${clickSelector}`);
            await page.click(clickSelector, { timeout: 10000 });
            console.log(`[EXEC-DEBUG]   -> ✅ Đã click vào: ${clickSelector}`);
          } else {
            console.warn(`[EXEC-DEBUG]   -> ⚠️ CẢNH BÁO: Node "Click" không có selector.`);
          }
          break;

        case 'typeNode':
        case 'type':
        case 'fill':
          const typeSelector = nextNode.data?.selector || nextNode.data?.target || '';
          const typeText = nextNode.data?.text || nextNode.data?.value || '';
          if (typeSelector && typeText) {
            console.log(`[EXEC-DEBUG]   -> Đang nhập "${typeText}" vào selector: ${typeSelector}`);
            await page.fill(typeSelector, typeText);
            console.log(`[EXEC-DEBUG]   -> ✅ Đã nhập "${typeText}" vào: ${typeSelector}`);
          } else {
            console.warn(`[EXEC-DEBUG]   -> ⚠️ CẢNH BÁO: Node "Type" không đủ thông tin (selector: ${typeSelector}, text: ${typeText}).`);
          }
          break;

        case 'waitNode':
        case 'wait':
          const milliseconds = nextNode.data?.milliseconds || nextNode.data?.time || nextNode.data?.value || 1000;
          console.log(`[EXEC-DEBUG]   -> Đang chờ ${milliseconds}ms`);
          await page.waitForTimeout(Number(milliseconds));
          console.log(`[EXEC-DEBUG]   -> ✅ Đã chờ xong`);
          break;

        case 'screenshot':
          const screenshotPath = nextNode.data?.path || nextNode.data?.value || `screenshot_${Date.now()}.png`;
          console.log(`[EXEC-DEBUG]   -> Đang chụp screenshot: ${screenshotPath}`);
          await page.screenshot({ path: screenshotPath });
          console.log(`[EXEC-DEBUG]   -> ✅ Đã chụp screenshot: ${screenshotPath}`);
          break;

        case 'evaluate':
          const script = nextNode.data?.script || nextNode.data?.value || '';
          if (script) {
            console.log(`[EXEC-DEBUG]   -> Đang thực thi script`);
            const result = await page.evaluate(script);
            console.log(`[EXEC-DEBUG]   -> ✅ Đã thực thi script, kết quả:`, result);
          } else {
            console.warn(`[EXEC-DEBUG]   -> ⚠️ Node "Evaluate" không có script.`);
          }
          break;

        default:
          console.warn(`[EXEC-DEBUG]   -> ⚠️ Không biết cách xử lý node type: ${nextNode.type}`);
          console.warn(`[EXEC-DEBUG]   -> Node data:`, JSON.stringify(nextNode, null, 2));
          break;
      }

      // Chờ một chút giữa các node
      await page.waitForTimeout(500);
    } catch (execError) {
      console.error(`[EXEC-ERROR] ❌ Lỗi khi thực thi node ${nextNode.id}:`, execError);
      console.error(`[EXEC-ERROR] Error message:`, execError.message);
      console.error(`[EXEC-ERROR] Error stack:`, execError.stack);
      throw execError; // Ném lỗi để caller xử lý
    }

    currentNode = nextNode;

    // Kiểm tra nếu đã đến node End
    if (currentNode.type === 'output' || currentNode.type === 'End' || currentNode.type === 'endNode') {
      console.log("[EXEC-DEBUG] ✅ Đã gặp node End. Workflow hoàn thành.");
      break;
    }
  }

  console.log("[EXEC-DEBUG] ✅ Workflow đã hoàn thành sau", stepCount, "bước");
}

// IPC Handler để thực thi automation
ipcMain.handle('run-automation', async (event, { profileId, workflowData }) => {
  console.log(`[+] Bắt đầu thực thi kịch bản cho profile ${profileId}`);

  // Lấy ra page object của profile đang chạy
  const page = runningPages.get(profileId);
  if (!page) {
    console.error(`[!] Không tìm thấy profile ${profileId} đang chạy!`);
    return { success: false, message: "Profile không hoạt động." };
  }

  try {
    // Gọi hàm executeWorkflow với debug logging
    await executeWorkflow(page, workflowData);
    
    console.log("[+] Thực thi kịch bản thành công!");
    return { success: true, message: "Kịch bản đã hoàn thành." };
  } catch (error) {
    console.error("[!] Lỗi khi thực thi kịch bản:", error);
    return { 
      success: false, 
      message: `Lỗi khi thực thi kịch bản: ${error.message}`,
      error: error.stack
    };
  }
});

module.exports = { launchProfileWithFullEmulation, sortNodes };

