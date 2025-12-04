import prisma from '../prismaClient';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import path from 'path';
import fs from 'fs';

puppeteer.use(StealthPlugin());

// Hàm đổi view: "1.5M" -> 1500000
const parseViewCount = (text: string): number => {
  if (!text) return 0;
  const t = text.toUpperCase().trim();
  let multiplier = 1;
  if (t.includes('K')) multiplier = 1000;
  else if (t.includes('M')) multiplier = 1000000;
  else if (t.includes('B')) multiplier = 1000000000;
  
  const num = parseFloat(t.replace(/[KMB,]/g, ''));
  return Math.floor(num * multiplier);
};

export const scanTikTokChannel = async (channelUrl: string, minView: number) => {
  console.log(`>>> [Scan Unlimited] Channel: ${channelUrl}`);
  
  // 1. TÌM PROFILE MỒI (Giữ nguyên)
  const scannerProfile = await prisma.profile.findFirst({
    where: { name: 'Scanner_TikTok' }
  });
  
  if (!scannerProfile) {
    throw new Error("❌ Không tìm thấy Profile 'Scanner_TikTok'");
  }

  const profileDir = path.join(process.cwd(), 'browser_profiles', `profile_${scannerProfile.id}`);
  
  if (!fs.existsSync(profileDir)) {
      fs.mkdirSync(profileDir, { recursive: true });
  }

  // 3. KHỞI CHẠY PUPPETEER
  let exPath = undefined;
  const DEFAULT_CHROME_PATHS = [
    process.env.CHROME_EXECUTABLE_PATH,
    process.env.NTG_CORE_PATH,
    String.raw`D:\Tool\chrome-win64\chrome.exe`,
    path.join(process.cwd(), 'packages', 'api', 'browser-core', 'ntg-core.exe'),
  ];
  
  for (const p of DEFAULT_CHROME_PATHS) {
    if (p && fs.existsSync(p)) { exPath = p; break; }
  }

  const browser = await puppeteer.launch({
    headless: false, // Để false để bro thấy nó chạy
    executablePath: exPath,
    userDataDir: profileDir,
    ignoreHTTPSErrors: true,
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', // Giảm tải bộ nhớ chia sẻ
        '--disable-accelerated-2d-canvas', // Tắt tăng tốc phần cứng nếu lỗi GPU
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu', // Nếu máy yếu hoặc VPS thì nên bật dòng này
        '--hide-scrollbars',
        '--mute-audio',
        '--disable-notifications',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-breakpad',
        '--disable-component-extensions-with-background-pages',
        '--disable-extensions',
        '--disable-features=TranslateUI,BlinkGenPropertyTrees',
        '--disable-ipc-flooding-protection',
        '--disable-renderer-backgrounding',
        '--enable-features=NetworkService,NetworkServiceInProcess',
        '--force-color-profile=srgb',
        '--metrics-recording-only',
        '--password-store=basic',
        '--use-mock-keychain',
        '--window-size=1280,800',
        '--disable-blink-features=AutomationControlled' // Quan trọng để bypass bot
    ],
    defaultViewport: null
  });

  const page = await browser.newPage();
  const results: any[] = [];

  try {
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    await page.goto(channelUrl, { waitUntil: 'networkidle2', timeout: 60000 });

    // --- LOGIC CUỘN VÔ TẬN (SCROLL UNTIL END) ---
    let previousHeight = 0;
    let noChangeCount = 0; // Đếm số lần cuộn mà không thấy gì mới
    let loopCount = 0;
    
    console.log("--> Bắt đầu cuộn để load toàn bộ video...");

    while (true) {
        loopCount++;
        
        // 1. Scroll xuống cuối trang
        previousHeight = await page.evaluate('document.body.scrollHeight') as number;
        await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
        
        // 2. Chờ load (TikTok load video cũ khá lâu, chờ 3-4s cho chắc)
        await new Promise(r => setTimeout(r, 3000));
        
        // 3. Kiểm tra xem có load thêm được gì không
        const newHeight = await page.evaluate('document.body.scrollHeight') as number;
        
        if (newHeight === previousHeight) {
            noChangeCount++;
            console.log(`... Đang chờ load thêm (${noChangeCount}/3)`);
            
            // Nếu 3 lần liên tiếp (9 giây) mà chiều cao không đổi -> Hết video
            if (noChangeCount >= 3) {
                console.log("--> Đã chạm đáy kênh TikTok! Dừng cuộn.");
                break;
            }
        } else {
            // Vẫn còn load được tiếp -> Reset đếm
            noChangeCount = 0;
            
            // Log nhẹ cái cho đỡ buồn ngủ
            const currentCount = await page.evaluate(() => document.querySelectorAll('a[href*="/video/"]').length);
            console.log(`--> Đã load được khoảng ${currentCount} video...`);
        }
    }

    // --- LẤY DỮ LIỆU SAU KHI ĐÃ LOAD HẾT ---
    console.log("--> Bắt đầu cào dữ liệu...");
    const items = await page.evaluate(() => {
        const data: any[] = [];
        const anchors = Array.from(document.querySelectorAll('a[href*="/video/"]'));
        
        for (const a of anchors) {
            const href = (a as HTMLAnchorElement).href;
            let viewText = "0";
            
            // Tìm text view count
            const parentText = a.parentElement?.innerText || ""; 
            const match = parentText.match(/(\d+(\.\d+)?[KMB])/);
            if (match) viewText = match[0];
            
            data.push({ videoUrl: href, rawView: viewText });
        }
        return data;
    });

    // Lọc trùng (TikTok đôi khi render trùng DOM)
    for (const item of items) {
         if (!results.find(r => r.videoUrl === item.videoUrl)) {
             results.push(item);
         }
    }
    
    console.log(`>>> TỔNG KẾT: Tìm thấy ${results.length} video.`);

    // 5. LƯU DATABASE (Giữ nguyên logic Upsert)
    for (const item of results) {
        const viewCount = parseViewCount(item.rawView);
        
        await prisma.trackedVideo.upsert({
            where: { videoUrl: item.videoUrl },
            update: {
                viewCount: viewCount,
                rawView: item.rawView,
                minViewThreshold: minView,
                lastUpdated: new Date()
            },
            create: {
                platform: 'tiktok',
                videoUrl: item.videoUrl,
                channelUrl: channelUrl,
                viewCount: viewCount,
                rawView: item.rawView,
                minViewThreshold: minView,
                isDownloaded: false
            }
        });
    }

  } catch (e) {
      console.error("Scrape Error:", e);
      throw e;
  } finally {
      await browser.close();
  }
  
  return { success: true, count: results.length };
};

// --- HÀM MỚI: QUÉT FACEBOOK ---
export const scanFacebookPage = async (channelUrl: string, minView: number) => {
  console.log(`>>> [Scan FB Realtime] Page: ${channelUrl}`);

  // 1. Khởi tạo Profile & Browser (Giữ nguyên)
  const scannerProfile = await prisma.profile.findFirst({ 
    where: { name: 'Scanner_Facebook' } 
  });
  if (!scannerProfile) throw new Error("❌ Không tìm thấy Profile 'Scanner_Facebook'");

  const profileDir = path.join(process.cwd(), 'browser_profiles', `profile_${scannerProfile.id}`);

  if (!fs.existsSync(profileDir)) {
      fs.mkdirSync(profileDir, { recursive: true });
  }

  // Tìm Chrome executable path (giống TikTok)
  let exPath = undefined;
  const DEFAULT_CHROME_PATHS = [
    process.env.CHROME_EXECUTABLE_PATH,
    process.env.NTG_CORE_PATH,
    String.raw`D:\Tool\chrome-win64\chrome.exe`,
    path.join(process.cwd(), 'packages', 'api', 'browser-core', 'ntg-core.exe'),
  ];
  
  for (const p of DEFAULT_CHROME_PATHS) {
    if (p && fs.existsSync(p)) { exPath = p; break; }
  }

  const browser = await puppeteer.launch({
    headless: false, // Để false để bro thấy nó chạy
    executablePath: exPath,
    userDataDir: profileDir,
    ignoreHTTPSErrors: true,
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', // Giảm tải bộ nhớ chia sẻ
        '--disable-accelerated-2d-canvas', // Tắt tăng tốc phần cứng nếu lỗi GPU
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu', // Nếu máy yếu hoặc VPS thì nên bật dòng này
        '--hide-scrollbars',
        '--mute-audio',
        '--disable-notifications',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-breakpad',
        '--disable-component-extensions-with-background-pages',
        '--disable-extensions',
        '--disable-features=TranslateUI,BlinkGenPropertyTrees',
        '--disable-ipc-flooding-protection',
        '--disable-renderer-backgrounding',
        '--enable-features=NetworkService,NetworkServiceInProcess',
        '--force-color-profile=srgb',
        '--metrics-recording-only',
        '--password-store=basic',
        '--use-mock-keychain',
        '--window-size=1280,800',
        '--disable-blink-features=AutomationControlled' // Quan trọng để bypass bot
    ],
    defaultViewport: null
  });
  const page = await browser.newPage();

  try {
    let targetUrl = channelUrl;
    if (!channelUrl.includes('/videos') && !channelUrl.includes('/reels')) {
        targetUrl = channelUrl.endsWith('/') ? `${channelUrl}videos` : `${channelUrl}/videos`;
    }
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 60000 });

    // --- LOGIC VỪA CUỘN VỪA LƯU ---
    let previousHeight = 0;
    let noChangeCount = 0;
    
    // Cache danh sách URL đã lưu để đỡ phải gọi DB nhiều lần
    const savedUrls = new Set<string>();
    console.log("--> FB: Bắt đầu chạy Realtime...");
    
    while (true) {
        // 1. SCROLL
        previousHeight = await page.evaluate('document.body.scrollHeight') as number;
        await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
        
        // 2. CHỜ LOAD & CÀO DỮ LIỆU NGAY LẬP TỨC (Không chờ hết)
        await new Promise(r => setTimeout(r, 4000)); // Chờ 4s cho video mới hiện ra
        
        // 3. CÀO DỮ LIỆU TRÊN MÀN HÌNH HIỆN TẠI
        const currentItems = await page.evaluate(() => {
            const data: any[] = [];
            const anchors = Array.from(document.querySelectorAll('a[href*="/videos/"], a[href*="/reel/"]'));
            
            for (const a of anchors) {
                const href = (a as HTMLAnchorElement).href;
                if (href.includes('comment_id')) continue; // Bỏ link rác
                
                // Tìm view
                let viewText = "0";
                let container = a.parentElement;
                
                for (let i = 0; i < 5; i++) {
                    if (!container) break;
                    const text = container.innerText;
                    const match = text.match(/(\d+(\.\d+)?[KMB]?)\s*(views|lượt xem|Views)/);
                    if (match) {
                        viewText = match[1];
                        break;
                    }
                    container = container.parentElement;
                }
                data.push({ videoUrl: href, rawView: viewText });
            }
            return data;
        });
        
        // 4. LƯU NGAY VÀO DATABASE (REALTIME)
        let newCount = 0;
        for (const item of currentItems) {
            // Chỉ lưu nếu chưa có trong cache phiên này (Tối ưu tốc độ)
            if (!savedUrls.has(item.videoUrl)) {
                savedUrls.add(item.videoUrl);
                
                const viewCount = parseViewCount(item.rawView);
                
                // Điều kiện lọc ngay tại nguồn: view >= minView mới lưu
                if (viewCount >= minView) {
                    await prisma.trackedVideo.upsert({
                        where: { videoUrl: item.videoUrl },
                        update: {
                            viewCount: viewCount,
                            rawView: item.rawView,
                            minViewThreshold: minView,
                            lastUpdated: new Date()
                        },
                        create: {
                            platform: 'facebook',
                            videoUrl: item.videoUrl,
                            channelUrl: channelUrl,
                            viewCount: viewCount,
                            rawView: item.rawView,
                            minViewThreshold: minView,
                            isDownloaded: false
                        }
                    });
                    newCount++;
                }
            }
        }
        console.log(`--> Vừa lưu thêm ${newCount} video mới vào DB...`);
        
        // 5. KIỂM TRA ĐIỀU KIỆN DỪNG
        const newHeight = await page.evaluate('document.body.scrollHeight') as number;
        if (newHeight === previousHeight) {
            noChangeCount++;
            console.log(`... Đang tìm thêm (${noChangeCount}/5)`);
            if (noChangeCount >= 5) break; // Hết video
        } else {
            noChangeCount = 0;
        }
    }

  } catch (e) {
      console.error("FB Scrape Error:", e);
      throw e;
  } finally {
      await browser.close();
  }
  
  return { success: true };
};

// Lấy danh sách hiển thị
export const getList = async () => {
    // BigInt không convert sang JSON được trực tiếp, cần ép kiểu
    const data = await prisma.trackedVideo.findMany({
        orderBy: { lastUpdated: 'desc' }
    });
    
    // Convert BigInt -> Number để gửi về Frontend
    return data.map(item => ({
        ...item,
        viewCount: Number(item.viewCount)
    }));
};

// Đổi trạng thái tải
export const toggleStatus = async (id: number, status: boolean) => {
    return await prisma.trackedVideo.update({
        where: { id },
        data: { isDownloaded: status }
    });
};

