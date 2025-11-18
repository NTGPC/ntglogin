// browser-manager.js
// File chuyên dụng để quản lý việc khởi chạy và điều khiển Playwright

const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
const path = require('path');
const fs = require('fs');

chromium.use(stealth);

// HÀM 1: KHỞI CHẠY TRÌNH DUYỆT VÀ FAKE FINGERPRINT (PHIÊN BẢN "BIẾT ĐỢI")
// Hàm này sẽ trả về Promise và chỉ resolve khi trình duyệt bị đóng
// profileId: ID của profile để lưu vào activeBrowsers Map
async function launchAndFingerprint(profileData, profileId = null) {
  // Trả về Promise để buộc tiến trình phải đợi
  return new Promise(async (resolve, reject) => {
    try {
      console.log('[BM] ========================================');
      console.log('[BM] Bắt đầu khởi chạy trình duyệt...');
      console.log(`[BM] Profile: ${profileData.name || 'Unknown'}`);

      const userAgent = profileData.userAgent || profileData.user_agent;

      if (!userAgent) {
        throw new Error('Profile không có userAgent!');
      }

      // Phân tích User-Agent để lấy thông tin
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

      console.log(`[BM] Chrome version: ${chromeVersion}`);
      console.log(`[BM] Platform: ${platform} ${platformVersion}`);

      // Khởi chạy browser
      const browser = await chromium.launch({
        headless: false, // Rất quan trọng: phải là false để thấy trình duyệt
        args: ['--disable-blink-features=AutomationControlled'],
        ignoreDefaultArgs: ["--enable-automation"],
      });

      // Lưu browser vào Map để quản lý (nếu có profileId)
      if (profileId !== null) {
        const activeBrowsers = getActiveBrowsersMap();
        if (activeBrowsers) {
          activeBrowsers.set(profileId, browser);
          console.log(`[BM] Đã lưu browser vào Map cho profile ${profileId}`);
        }
      }

      // Đây là chìa khóa: Lắng nghe sự kiện trình duyệt bị đóng
      browser.on('disconnected', () => {
        console.log('[BM] Trình duyệt đã được đóng. Kịch bản kết thúc.');
        
        // Xóa browser khỏi Map khi đóng
        if (profileId !== null) {
          const activeBrowsers = getActiveBrowsersMap();
          if (activeBrowsers) {
            activeBrowsers.delete(profileId);
            console.log(`[BM] Đã xóa browser khỏi Map cho profile ${profileId}`);
          }
        }
        
        resolve(); // Chỉ khi đó Promise mới hoàn thành
      });

      // Tạo context với viewport
      const screenWidth = profileData.screen?.width || profileData.screenWidth || 1920;
      const screenHeight = profileData.screen?.height || profileData.screenHeight || 1080;
      
      const context = await browser.newContext({
        viewport: { width: screenWidth, height: screenHeight },
      });

      const page = await context.newPage();
      const client = await page.context().newCDPSession(page);

      // Set User-Agent và Client Hints qua CDP
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

      // Inject fingerprint script
      const injectionScriptPath = path.join(__dirname, 'core', 'injection_script.js');
      if (fs.existsSync(injectionScriptPath)) {
        let injectionScript = fs.readFileSync(injectionScriptPath, 'utf-8');
        
        const languages = profileData.navigator?.languages || profileData.language ? [profileData.language] : ['en-US', 'en'];
        const languagesStr = '[' + languages.map(l => `'${l}'`).join(', ') + ']';
        
        const replacements = {
          '%%HARDWARE_CONCURRENCY%%': JSON.stringify(profileData.navigator?.hardwareConcurrency || profileData.hardwareConcurrency || 8),
          '%%DEVICE_MEMORY%%': JSON.stringify(profileData.navigator?.deviceMemory || profileData.deviceMemory || 8),
          '%%LANGUAGES%%': languagesStr,
          '%%LANGUAGE%%': profileData.navigator?.language || profileData.language || 'en-US',
          '%%SCREEN_WIDTH%%': JSON.stringify(screenWidth),
          '%%SCREEN_HEIGHT%%': JSON.stringify(screenHeight),
          '%%SCREEN_AVAIL_WIDTH%%': JSON.stringify(profileData.screen?.availWidth || screenWidth),
          '%%SCREEN_AVAIL_HEIGHT%%': JSON.stringify(profileData.screen?.availHeight || (screenHeight - 40)),
          '%%SCREEN_COLOR_DEPTH%%': JSON.stringify(profileData.screen?.colorDepth || 24),
          '%%SCREEN_PIXEL_DEPTH%%': JSON.stringify(profileData.screen?.pixelDepth || 24),
          '%%DEVICE_PIXEL_RATIO%%': JSON.stringify(profileData.screen?.devicePixelRatio || 1),
          '%%WEBGL_VENDOR%%': profileData.webgl?.vendor || 'Intel Inc.',
          '%%WEBGL_RENDERER%%': profileData.webgl?.renderer || 'Intel Iris OpenGL Engine',
          '%%CANVAS_MODE%%': profileData.canvas?.mode || profileData.canvasMode || 'Noise',
          '%%CANVAS_SEED%%': String(profileData.canvas?.seed || 12345),
          '%%AUDIO_CONTEXT_MODE%%': profileData.audioContext?.mode || profileData.audioCtxMode || 'Off',
          '%%AUDIO_SEED%%': String(profileData.audioContext?.seed || 12345),
          '%%CLIENT_RECTS_MODE%%': profileData.clientRects?.mode || profileData.clientRectsMode || 'Off',
          '%%GEO_ENABLED%%': JSON.stringify(profileData.geo?.enabled || profileData.geoEnabled || false),
          '%%GEO_LAT%%': JSON.stringify(profileData.geo?.lat || profileData.geoLatitude || 10.762622),
          '%%GEO_LON%%': JSON.stringify(profileData.geo?.lon || profileData.geoLongitude || 106.660172),
          '%%WEBRTC_USE_MAIN_IP%%': JSON.stringify(profileData.webrtc?.useMainIP || profileData.webrtcMainIP || false),
          '%%TIMEZONE%%': profileData.timezone || profileData.timezoneId || 'Asia/Ho_Chi_Minh',
          '%%SEED%%': String(profileData.seed || 12345)
        };

        for (const [key, value] of Object.entries(replacements)) {
          injectionScript = injectionScript.replace(new RegExp(key, 'g'), value);
        }

        await context.addInitScript(injectionScript);
        console.log('[BM] Đã inject fingerprint script');
      }

      console.log('[BM] ✅ Trình duyệt đã khởi chạy và fake fingerprint thành công.');
      console.log('[BM] ========================================\n');

      // Bây giờ, chúng ta sẽ gọi hàm thực thi workflow TỪ BÊN TRONG NÀY
      if (profileData.workflow) {
        console.log('[BM] Bắt đầu thực thi workflow...');
        await executeWorkflowOnPage(page, profileData.workflow);
        console.log('[BM] Workflow đã hoàn thành. Trình duyệt sẽ ở lại cho đến khi bạn đóng nó.');
      } else {
        console.log('[BM] Profile không có workflow. Trình duyệt sẽ ở lại cho đến khi bạn đóng nó.');
      }

      // Lưu browser và page vào Map để quản lý (nếu cần)
      const profileId = profileData.id || profileData.profileId;
      if (profileId) {
        // Note: Không thể return browser/page nữa vì Promise chỉ resolve khi browser đóng
        // Nhưng vẫn có thể lưu vào Map nếu cần truy cập từ nơi khác
      }

    } catch (error) {
      console.error('[BM] Lỗi nghiêm trọng khi khởi chạy trình duyệt:', error);
      reject(error); // Báo lỗi nếu có sự cố
    }
  });
}

// HÀM 2: THỰC THI WORKFLOW
// Hàm này chỉ có MỘT nhiệm vụ: nhận page object và điều khiển nó
async function executeWorkflowOnPage(page, workflow) {
  console.log('[BM] ========================================');
  console.log('[BM] Bắt đầu thực thi workflow...');
  console.log(`[BM] Workflow: ${workflow.name || 'Unknown'}`);
  
  // Kiểm tra workflow data
  let workflowData = workflow;
  
  // Nếu workflow có trường 'data' (JSON), lấy từ đó
  if (workflow.data && typeof workflow.data === 'object') {
    workflowData = workflow.data;
    console.log('[BM] Đã lấy workflow data từ trường "data"');
  }

  if (!workflowData) {
    throw new Error('Workflow data không hợp lệ');
  }

  const { nodes, edges } = workflowData;

  // Kiểm tra nodes và edges
  if (!nodes || !Array.isArray(nodes)) {
    console.error('[BM-ERROR] ❌ nodes không phải là array hoặc không tồn tại!');
    console.error('[BM-ERROR] workflowData keys:', Object.keys(workflowData || {}));
    throw new Error('Workflow nodes không hợp lệ');
  }

  if (!edges || !Array.isArray(edges)) {
    console.error('[BM-ERROR] ❌ edges không phải là array hoặc không tồn tại!');
    console.error('[BM-ERROR] workflowData keys:', Object.keys(workflowData || {}));
    throw new Error('Workflow edges không hợp lệ');
  }

  console.log(`[BM] Tổng số nodes: ${nodes.length}`);
  console.log(`[BM] Tổng số edges: ${edges.length}`);
  
  // In ra toàn bộ dữ liệu để kiểm tra
  console.log('[BM] ========================================');
  console.log('[BM] Nodes data:');
  console.log(JSON.stringify(nodes, null, 2));
  console.log('[BM] ========================================');
  console.log('[BM] Edges data:');
  console.log(JSON.stringify(edges, null, 2));
  console.log('[BM] ========================================');

  // 1. TÌM NODE START
  console.log('[BM] Đang tìm node Start...');
  console.log('[BM] Danh sách node types có sẵn:', nodes.map(n => `${n.id}:${n.type}`).join(', '));
  
  let startNode = nodes.find(n => n.type === 'input' || n.type === 'Start' || n.type === 'startNode');
  
  if (!startNode) {
    console.warn('[BM] ⚠️ Không tìm thấy node Start với type "input", "Start", hoặc "startNode"');
    
    // Thử tìm node không có edge nào trỏ đến (in-degree = 0)
    const nodeIds = new Set(nodes.map(n => n.id));
    const targetIds = new Set(edges.map(e => e.target));
    const nodesWithNoIncoming = nodes.filter(n => !targetIds.has(n.id));
    
    console.log('[BM] Nodes không có edge trỏ đến:', nodesWithNoIncoming.map(n => `${n.id}:${n.type}`).join(', '));
    
    if (nodesWithNoIncoming.length > 0) {
      startNode = nodesWithNoIncoming[0];
      console.log(`[BM] ✅ Sử dụng node không có edge trỏ đến làm Start: ${startNode.id} (type: ${startNode.type})`);
    } else {
      console.error("[BM-ERROR] ❌ KHÔNG TÌM THẤY NODE START! Workflow không thể bắt đầu.");
      console.error("[BM-ERROR] Danh sách node types có sẵn:", nodes.map(n => n.type).join(', '));
      throw new Error("Không tìm thấy node Start trong workflow");
    }
  } else {
    console.log(`[BM] ✅ Đã tìm thấy node Start, ID: ${startNode.id}, Type: ${startNode.type}`);
  }
  
  console.log(`[BM] Node Start data:`, JSON.stringify(startNode, null, 2));

  let currentNode = startNode;
  let stepCount = 0;

  // Vòng lặp an toàn để tránh vòng lặp vô hạn
  for (let i = 0; i < 100; i++) {
    stepCount++;
    console.log(`[BM] --- Bước ${stepCount} ---`);

    // 2. TÌM CẠNH (EDGE) TIẾP THEO
    console.log(`[BM] Đang tìm cạnh đi ra từ node ID: ${currentNode.id} (Type: ${currentNode.type})`);
    const nextEdge = edges.find(e => e.source === currentNode.id);
    
    if (!nextEdge) {
      console.log("[BM] ⚠️ Không tìm thấy cạnh nào đi ra từ node này.");
      console.log("[BM] Workflow kết thúc tại đây.");
      break; // Hết đường đi, dừng lại
    }
    
    console.log(`[BM] ✅ Đã tìm thấy cạnh:`);
    console.log(`[BM]   - Source: ${nextEdge.source}`);
    console.log(`[BM]   - Target: ${nextEdge.target}`);
    console.log(`[BM]   - Edge ID: ${nextEdge.id || 'N/A'}`);

    // 3. TÌM NODE TIẾP THEO
    const nextNode = nodes.find(n => n.id === nextEdge.target);
    if (!nextNode) {
      console.error(`[BM-ERROR] ❌ Lỗi logic: Cạnh trỏ đến một target node không tồn tại!`);
      console.error(`[BM-ERROR] Target ID: ${nextEdge.target}`);
      console.error(`[BM-ERROR] Danh sách node IDs có sẵn:`, nodes.map(n => n.id).join(', '));
      throw new Error(`Node target ${nextEdge.target} không tồn tại`);
    }
    
    console.log(`[BM] ✅ Node tiếp theo:`);
    console.log(`[BM]   - ID: ${nextNode.id}`);
    console.log(`[BM]   - Type: ${nextNode.type}`);
    console.log(`[BM]   - Label: ${nextNode.data?.label || 'N/A'}`);
    console.log(`[BM]   - Data:`, JSON.stringify(nextNode.data, null, 2));

    // 4. THỰC THI HÀNH ĐỘNG CỦA NODE TIẾP THEO
    console.log(`[BM] 🚀 Đang thực thi hành động của node: ${nextNode.data?.label || nextNode.type}`);
    
    try {
      // Xử lý nhiều loại node type
      switch (nextNode.type) {
        case 'input':
        case 'Start':
        case 'startNode':
          console.log(`[BM]   -> Start node, bỏ qua`);
          break;

        case 'output':
        case 'End':
        case 'endNode':
          console.log(`[BM]   -> End node, workflow hoàn thành`);
          currentNode = nextNode;
          console.log('[BM] ✅ Thực thi workflow hoàn tất.');
          console.log('[BM] ========================================\n');
          return; // Kết thúc workflow

        case 'Open Page':
        case 'openUrlNode':
        case 'open-url':
        case 'default':
          // In ra dữ liệu của node để xem URL nằm ở đâu
          console.log(`[BM] Dữ liệu node Open Page/default:`, JSON.stringify(nextNode.data, null, 2));
          
          // Kiểm tra nếu là default node với action "open url"
          const action = nextNode.data?.action || nextNode.data?.label?.toLowerCase() || '';
          const isOpenUrl = nextNode.type === 'Open Page' || 
                          nextNode.type === 'openUrlNode' || 
                          nextNode.type === 'open-url' ||
                          (nextNode.type === 'default' && (action.includes('mở url') || action.includes('open url')));
          
          if (isOpenUrl) {
            const url = nextNode.data?.url || nextNode.data?.value || 'https://google.com';
            console.log(`[BM]   -> Đang điều hướng đến URL: ${url}`);
            await page.goto(url, { waitUntil: 'domcontentloaded' });
            console.log(`[BM]   -> ✅ ĐÃ ĐIỀU HƯỚNG ĐẾN: ${url}`);
          } else if (nextNode.type === 'default') {
            // Xử lý các action khác của default node
            if (action.includes('click')) {
              const selector = nextNode.data?.selector || nextNode.data?.value || '';
              if (selector) {
                console.log(`[BM]   -> Đang click vào selector: ${selector}`);
                await page.click(selector, { timeout: 10000 });
                console.log(`[BM]   -> ✅ Đã click vào: ${selector}`);
              } else {
                console.warn(`[BM]   -> ⚠️ CẢNH BÁO: Node "Click" không có selector.`);
              }
            } else if (action.includes('nhập') || action.includes('type') || action.includes('fill')) {
              const selector = nextNode.data?.selector || nextNode.data?.target || '';
              const text = nextNode.data?.text || nextNode.data?.value || '';
              if (selector && text) {
                console.log(`[BM]   -> Đang nhập "${text}" vào selector: ${selector}`);
                await page.fill(selector, text);
                console.log(`[BM]   -> ✅ Đã nhập "${text}" vào: ${selector}`);
              } else {
                console.warn(`[BM]   -> ⚠️ CẢNH BÁO: Node "Type" không đủ thông tin (selector: ${selector}, text: ${text}).`);
              }
            } else {
              console.warn(`[BM]   -> ⚠️ Không biết cách xử lý action: ${action}`);
            }
          }
          break;

        case 'clickNode':
        case 'click':
          const clickSelector = nextNode.data?.selector || nextNode.data?.target || nextNode.data?.value || '';
          if (clickSelector) {
            console.log(`[BM]   -> Đang click vào selector: ${clickSelector}`);
            await page.click(clickSelector, { timeout: 10000 });
            console.log(`[BM]   -> ✅ Đã click vào: ${clickSelector}`);
          } else {
            console.warn(`[BM]   -> ⚠️ CẢNH BÁO: Node "Click" không có selector.`);
          }
          break;

        case 'typeNode':
        case 'type':
        case 'fill':
          const typeSelector = nextNode.data?.selector || nextNode.data?.target || '';
          const typeText = nextNode.data?.text || nextNode.data?.value || '';
          if (typeSelector && typeText) {
            console.log(`[BM]   -> Đang nhập "${typeText}" vào selector: ${typeSelector}`);
            await page.fill(typeSelector, typeText);
            console.log(`[BM]   -> ✅ Đã nhập "${typeText}" vào: ${typeSelector}`);
          } else {
            console.warn(`[BM]   -> ⚠️ CẢNH BÁO: Node "Type" không đủ thông tin (selector: ${typeSelector}, text: ${typeText}).`);
          }
          break;

        case 'waitNode':
        case 'wait':
          const milliseconds = nextNode.data?.milliseconds || nextNode.data?.time || nextNode.data?.value || 1000;
          console.log(`[BM]   -> Đang chờ ${milliseconds}ms`);
          await page.waitForTimeout(Number(milliseconds));
          console.log(`[BM]   -> ✅ Đã chờ xong`);
          break;

        case 'screenshot':
          const screenshotPath = nextNode.data?.path || nextNode.data?.value || `screenshot_${Date.now()}.png`;
          console.log(`[BM]   -> Đang chụp screenshot: ${screenshotPath}`);
          await page.screenshot({ path: screenshotPath });
          console.log(`[BM]   -> ✅ Đã chụp screenshot: ${screenshotPath}`);
          break;

        case 'evaluate':
          const script = nextNode.data?.script || nextNode.data?.value || '';
          if (script) {
            console.log(`[BM]   -> Đang thực thi script`);
            const result = await page.evaluate(script);
            console.log(`[BM]   -> ✅ Đã thực thi script, kết quả:`, result);
          } else {
            console.warn(`[BM]   -> ⚠️ Node "Evaluate" không có script.`);
          }
          break;

        default:
          console.warn(`[BM]   -> ⚠️ Không biết cách xử lý node type: ${nextNode.type}`);
          console.warn(`[BM]   -> Node data:`, JSON.stringify(nextNode, null, 2));
          break;
      }

      // Chờ một chút giữa các node
      await page.waitForTimeout(500);
    } catch (execError) {
      console.error(`[BM-ERROR] ❌ Lỗi khi thực thi node ${nextNode.id}:`, execError);
      console.error(`[BM-ERROR] Error message:`, execError.message);
      console.error(`[BM-ERROR] Error stack:`, execError.stack);
      throw execError; // Ném lỗi để caller xử lý
    }

    currentNode = nextNode;

    // Kiểm tra nếu đã đến node End
    if (currentNode.type === 'output' || currentNode.type === 'End' || currentNode.type === 'endNode') {
      console.log("[BM] ✅ Đã gặp node End. Workflow hoàn thành.");
      break;
    }
  }

  console.log("[BM] ✅ Workflow đã hoàn thành sau", stepCount, "bước");
  console.log('[BM] ✅ Thực thi workflow hoàn tất.');
  console.log('[BM] ========================================\n');
}

// Export hai hàm này ra để main.js có thể sử dụng
module.exports = {
  launchAndFingerprint,
  executeWorkflowOnPage,
};

