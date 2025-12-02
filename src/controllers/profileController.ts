import { Request, Response } from 'express';
import * as profileService from '../services/profileService';
import { AppError, asyncHandler } from '../utils/errorHandler';
import prisma from '../prismaClient';
import { randomUnique as randomMac } from '../services/macService';
import { getUniqueUA } from '../services/userAgentProvider';
import pLimit from 'p-limit';

// ============================================================================
// === HELPER FUNCTIONS ===
// ============================================================================

/**
 * Hàm ép kiểu số an toàn. Trả về số nguyên hoặc null/fallback nếu không hợp lệ.
 */
const parseNumber = (val: any, fallback: number | null = null): number | null => {
  if (val === undefined || val === null || val === '') return fallback;
  const n = parseInt(String(val), 10);
  return isNaN(n) ? fallback : n;
};

/**
 * Hàm ép kiểu boolean an toàn.
 */
const parseBoolean = (val: any, fallback: boolean = false): boolean => {
  if (val === undefined || val === null) return fallback;
  return String(val) === 'true' || val === true;
};

/**
 * Hàm tạo vân tay ngẫu nhiên (Random Fingerprint)
 */
const generateRandomFingerprint = () => {
  const osList = ['windows', 'mac', 'linux'];
  const screens = [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 1440, height: 900 },
    { width: 1536, height: 864 },
    { width: 2560, height: 1440 }
  ];
  const cpus = [4, 6, 8, 12, 16];
  const rams = [4, 8, 16, 32];
  
  // List UserAgent mới nhất (Chrome 120+)
  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  ];
  
  const selectedOS = osList[Math.floor(Math.random() * osList.length)];
  const selectedScreen = screens[Math.floor(Math.random() * screens.length)];
  const selectedCPU = cpus[Math.floor(Math.random() * cpus.length)];
  const selectedRAM = rams[Math.floor(Math.random() * rams.length)];
  const selectedUA = userAgents[Math.floor(Math.random() * userAgents.length)];
  
  return {
    browser: 'chrome',
    os: selectedOS,
    screen: selectedScreen,
    cores: selectedCPU,
    memory: selectedRAM,
    userAgent: selectedUA,
    hardwareConcurrency: selectedCPU,
    deviceMemory: selectedRAM,
    screenWidth: selectedScreen.width,
    screenHeight: selectedScreen.height,
    webglVendor: "Google Inc. (NVIDIA)",
    webglRenderer: "ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11, vs_5_0, ps_5_0)"
  };
};

// ============================================================================
// === CONTROLLER HANDLERS ===
// ============================================================================

export const getAll = asyncHandler(async (_req: Request, res: Response) => {
  const profiles = await profileService.getAllProfiles();
  res.json({
    success: true,
    data: profiles,
  });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseNumber(req.params.id);
  if (!id) throw new AppError('Invalid ID', 400);

  const profile = await profileService.getProfileById(id);
  if (!profile) {
    throw new AppError('Profile not found', 404);
  }

  res.json({
    success: true,
    data: profile,
  });
});

/**
 * CREATE PROFILE - ĐÃ FIX LỖI UNKNOWN ARGUMENT 'STATUS'
 */
export const create = asyncHandler(async (req: Request, res: Response) => {
  try {
    const body = req.body;
    console.log('================================');
    console.log(`[CREATE] Nhận request tạo profile. Raw body:`, JSON.stringify(body, null, 2));

    // 1. Xử lý Proxy ID (QUAN TRỌNG NHẤT)
    let finalProxyId: number | null = null;
    if (body.proxyId) finalProxyId = parseNumber(body.proxyId);
    else if (body.proxyRefId) finalProxyId = parseNumber(body.proxyRefId);

    console.log(`[CREATE] Đã tách Proxy ID: ${finalProxyId}`);

    // 2. Chuẩn bị dữ liệu cho bảng Profile (CHỈ LẤY CÁC TRƯỜNG CÓ TRONG SCHEMA)
    // Đã xóa 'status' vì schema không có
    const profileData: any = {
      // Basic Info
      name: body.name || `Profile ${new Date().toISOString()}`,
      notes: body.notes || "",
      
      // Relation IDs
      proxyId: finalProxyId, 
      workflowId: parseNumber(body.workflowId),
      fingerprintPresetId: parseNumber(body.fingerprintPresetId),
      userAgentId: parseNumber(body.userAgentId),
      webglRendererId: parseNumber(body.webglRendererId),

      // Navigator & System
      userAgent: body.userAgent || body.user_agent,
      os: body.os || body.osName || "Windows",
      osName: body.osName || body.os || "Windows",
      platform: body.platform || "Win32",
      browserVersion: parseNumber(body.browserVersion, 120),
      
      // Hardware
      hardwareConcurrency: parseNumber(body.hardwareConcurrency, 8),
      deviceMemory: parseNumber(body.deviceMemory, 8),
      screenWidth: parseNumber(body.screenWidth, 1920),
      screenHeight: parseNumber(body.screenHeight, 1080),

      // Fingerprint Modes
      canvasMode: body.canvasMode || body.canvas || "noise",
      clientRectsMode: body.clientRectsMode || body.clientRects || "off",
      audioContextMode: body.audioContextMode || body.audioCtxMode || "noise",
      webglImageMode: body.webglImageMode || body.webglImage || "off",
      webglMetadataMode: body.webglMetadataMode || body.webglMetaMode || "mask",
      
      // Network / Geo
      geolocationMode: body.geolocationMode || (body.geoEnabled ? 'fake' : 'off'),
      geolocationEnabled: parseBoolean(body.geoEnabled) || parseBoolean(body.geolocationEnabled),
      geolocationLatitude: parseFloat(body.geoLatitude || body.geolocationLatitude || '0'),
      geolocationLongitude: parseFloat(body.geoLongitude || body.geolocationLongitude || '0'),
      
      webrtcMode: body.webrtcMode || (body.webrtcMainIP ? 'fake' : 'real'),
      webrtcMainIP: parseBoolean(body.webrtcMainIP) || parseBoolean(body.webrtcMainIp),
      
      // Mac Address (Tạo mới nếu không có)
      macAddress: body.macAddress || await randomMac(),
    };

    // 3. Gom toàn bộ dữ liệu thô vào Fingerprint JSON để bảo toàn thông tin
    // Logic: Lấy tất cả body, loại bỏ các trường ID quan hệ để tránh rác
    const { id: _tempId, proxyId: _tempProxyId, ...rawFingerprint } = body;
    
    // Nếu chưa có userAgent trong fingerprint, nhét vào
    if (!rawFingerprint.userAgent) rawFingerprint.userAgent = profileData.userAgent;
    
    profileData.fingerprint = rawFingerprint;
    profileData.fingerprintJson = rawFingerprint; // Lưu cả 2 trường legacy/new

    // 4. Gọi Service tạo Profile
    console.log(`[CREATE] Đang gọi Service tạo Profile...`);
    const newProfile = await profileService.createProfile(profileData);

    console.log(`[CREATE] ✅ Thành công! Profile ID: ${newProfile.id}`);

    res.status(201).json({
      success: true,
      message: 'Profile created successfully',
      data: newProfile,
    });
  } catch (error: any) {
    console.error(`[CREATE] ❌ Lỗi:`, error);
    res.status(400).json({ 
      success: false, 
      message: error.message || 'Failed to create profile',
      error: error 
    });
  }
});

/**
 * UPDATE PROFILE
 */
export const update = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body;
  
  try {
    // 1. Tách các trường đặc biệt cần xử lý thủ công
    const { fingerprintPresetId, proxyId, workflowId, ...updateData } = data;

    // 2. Chuẩn bị object dữ liệu để update
    const finalData: any = { ...updateData };

    // 3. Xử lý Proxy ID (Ép kiểu sang Int hoặc null)
    if (proxyId !== undefined) {
      // Nếu gửi lên là "None" hoặc chuỗi rỗng hoặc null thì set null
      if (proxyId === "None" || proxyId === "" || proxyId === null) {
        finalData.proxyId = null;
      } else {
        finalData.proxyId = parseInt(String(proxyId));
      }
    }

    // 4. Xử lý Workflow ID (FIX LỖI TRONG ẢNH)
    if (workflowId !== undefined) {
      if (workflowId === "None" || workflowId === "" || workflowId === null) {
        finalData.workflowId = null; // Hủy chọn workflow
      } else {
        finalData.workflowId = parseInt(String(workflowId)); // Ép kiểu sang Int
      }
    }

    // 5. Xử lý Browser Type (đảm bảo lưu đúng loại Chrome/Chromium)
    if (updateData.fingerprint && typeof updateData.fingerprint === 'object') {
       if (updateData.fingerprint.browser) {
           finalData.browserType = updateData.fingerprint.browser;
       }
    }

    // FIX LỖI 500: Xử lý Fingerprint
    // Frontend gửi lên là Object -> Phải giữ nguyên dạng Json (không cần stringify vì Prisma tự xử lý)
    if (data.fingerprint && typeof data.fingerprint === 'object') {
        finalData.fingerprint = data.fingerprint;
        finalData.fingerprintJson = data.fingerprint; // Đồng bộ cả 2 trường
        
        // Nếu trong fingerprint có userAgent, cập nhật luôn cột userAgent ở ngoài
        if (data.fingerprint.userAgent) {
            finalData.userAgent = data.fingerprint.userAgent;
        }
    } else if (data.fingerprint && typeof data.fingerprint === 'string') {
        // Nếu là string thì parse về object
        try {
            const parsed = JSON.parse(data.fingerprint);
            finalData.fingerprint = parsed;
            finalData.fingerprintJson = parsed;
        } catch (e) {
            console.warn("Invalid fingerprint JSON string, skipping...");
        }
    }

    // Xóa các trường không có trong DB để tránh lỗi
    delete finalData.id;
    delete finalData.status;
    delete finalData.folderId;
    delete finalData.driverType;
    delete finalData.transferStatus;

    // 6. Thực hiện Update
    const profile = await prisma.profile.update({
      where: { id: parseInt(String(id)) },
      data: finalData,
      // Include cả proxy và workflow để frontend hiển thị lại ngay lập tức
      include: { 
        proxy: true,
        // Nếu bạn có relationship workflow, hãy uncomment dòng dưới:
        // workflow: true 
      } 
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: profile,
    });
  } catch (error) {
    console.error("Update error:", error);
    // Trả về lỗi chi tiết để dễ debug hơn
    res.status(500).json({ 
      success: false,
      error: 'Failed to update profile', 
      details: (error as any).message 
    });
  }
});

/**
 * DELETE PROFILE
 */
export const remove = asyncHandler(async (req: Request, res: Response) => {
  const id = parseNumber(req.params.id);
  if (!id) throw new AppError('Invalid ID', 400);

  await profileService.deleteProfile(id);

  res.json({
    success: true,
    message: 'Profile deleted successfully',
  });
});

/**
 * START PROFILE WITH WORKFLOW (V4 BẤT BẠI)
 */
export const startProfileWithWorkflow = asyncHandler(async (req: Request, res: Response) => {
  const profileId = parseNumber(req.params.id);
  if (!profileId) throw new AppError('Invalid Profile ID', 400);

  console.log(`[START] Đang khởi động Profile ID: ${profileId}`);

  // BƯỚC 1: Lấy dữ liệu Profile từ DB
  const profileData = await prisma.profile.findUnique({
    where: { id: profileId },
    include: { workflow: true }
  });

  if (!profileData) {
    throw new AppError(`Profile ID ${profileId} not found`, 404);
  }

  // BƯỚC 2: Gọi Browser Service
  try {
    const browserService = await import('../services/browserService');

    // Tạo Session tracking
    const session = await prisma.session.create({
      data: {
        profile_id: profileId,
        proxy_id: req.body?.proxyId ? parseNumber(req.body.proxyId) : profileData.proxyId,
        status: 'running',
        started_at: new Date(),
      },
      include: { profile: true, proxy: true },
    });

    // Lấy cấu hình Proxy (ưu tiên từ body request, fallback về profile config)
    let proxyConfig: any = undefined;
    const activeProxyId = req.body?.proxyId ? parseNumber(req.body.proxyId) : profileData.proxyId;

    if (activeProxyId) {
      const proxyRecord = await prisma.proxy.findUnique({ where: { id: activeProxyId } });
      if (proxyRecord && proxyRecord.active) {
        proxyConfig = {
          host: proxyRecord.host,
          port: proxyRecord.port,
          username: proxyRecord.username,
          password: proxyRecord.password,
          type: proxyRecord.type,
        };
      }
    }

    // Chuẩn bị Fingerprint
    let fingerprint: any = profileData.fingerprintJson || profileData.fingerprint;
    if (!fingerprint || Object.keys(fingerprint).length === 0) {
       fingerprint = {
         userAgent: profileData.userAgent,
         screenWidth: profileData.screenWidth,
         screenHeight: profileData.screenHeight,
         canvasMode: profileData.canvasMode,
         os: profileData.osName,
       };
    }
    
    fingerprint.seed = profileId; 
    fingerprint.profileId = profileId;

    // GỌI HÀM CHẠY BROWSER
    await browserService.runAndManageBrowser(
      profileData,
      profileData.workflow || null,
      {
        profileId: profileData.id,
        sessionId: session.id,
        userAgent: profileData.userAgent || undefined,
        fingerprint: fingerprint,
        proxy: proxyConfig,
      }
    );

    await prisma.session.update({
      where: { id: session.id },
      data: { status: 'stopped', stopped_at: new Date() },
    });

    res.json({
      success: true,
      message: 'Browser launched successfully.',
      data: session,
    });

  } catch (error: any) {
    console.error(`[START] Lỗi khi khởi chạy browser:`, error);
    throw new AppError(error.message || 'Failed to launch browser', 500);
  }
});

export const generateFingerprint = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body || {};
  const osName = body.osName || 'Windows 10';
  const browserVersion = body.browserVersion || 120;
  
  const ua = await getUniqueUA({ browser: 'chrome', versionHint: browserVersion, os: osName });
  const mac = await randomMac();

  const fp = {
    ...body,
    userAgent: ua,
    macAddress: mac,
    randomSeed: Math.floor(Math.random() * 1000000),
  };

  res.json({ success: true, data: fp });
});

export const getUserAgent = asyncHandler(async (req: Request, res: Response) => {
  const { browser, versionHint, os } = req.body || {};
  const ua = await getUniqueUA({ browser, versionHint, os });
  res.json({ success: true, userAgent: ua });
});

export const getFingerprint = asyncHandler(async (req: Request, res: Response) => {
  const id = parseNumber(req.params.id);
  if (!id) throw new AppError('Invalid ID', 400);
  
  const profile = await profileService.getProfileById(id);
  if (!profile) throw new AppError('Profile not found', 404);

  res.json({ success: true, data: profile.fingerprint || {} });
});

export const updateFingerprint = asyncHandler(async (req: Request, res: Response) => {
  const id = parseNumber(req.params.id);
  if (!id) throw new AppError('Invalid ID', 400);
  
  const { id: _fpId, ...fp } = req.body;
  const updated = await profileService.updateProfile(id, { fingerprint: fp, fingerprintJson: fp });
  
  res.json({ success: true, data: updated.fingerprint });
});

/**
 * IMPORT PROFILES - Import hàng loạt accounts từ text với Random Fingerprint
 * Format: uid|password|twoFactor|email|emailPassword|recoveryEmail
 */
export const importProfiles = asyncHandler(async (req: Request, res: Response) => {
  const { rawData } = req.body; 

  if (!rawData) {
    return res.status(400).json({ success: false, error: "No data provided" });
  }

  // SỬA: Dùng Regex này để tách dòng chuẩn xác cho cả Windows (\r\n) và Linux (\n)
  const lines = rawData.split(/\r?\n/);
  
  const createdProfiles: any[] = [];
  const errors: string[] = [];

  try {
    for (const line of lines) {
      // 1. Dọn dẹp dòng (xóa khoảng trắng thừa đầu đuôi)
      const trimmedLine = line.trim();
      
      // 2. Nếu dòng trống thì bỏ qua ngay -> Giúp xử lý việc paste dính chùm hay cách dòng đều được
      if (!trimmedLine) continue; 

      // 3. Cắt chuỗi
      const parts = trimmedLine.split('|');
      
      // Validate cơ bản
      if (parts.length < 2) {
        // Log nhẹ để biết dòng nào lỗi, nhưng không dừng chương trình
        console.log(`Skipping invalid line: ${trimmedLine}`);
        continue; 
      }

      const uid = parts[0]?.trim();
      const password = parts[1]?.trim();
      
      // Nếu thiếu UID hoặc Pass thì bỏ qua
      if (!uid || !password) continue;

      // Các trường phụ (nếu không có thì để rỗng)
      const twoFactor = parts[2]?.trim() || "";
      const email = parts[3]?.trim() || "";
      const emailPassword = parts[4]?.trim() || "";
      const recoveryEmail = parts[5]?.trim() || "";

      // TẠO FINGERPRINT NGẪU NHIÊN NGAY TẠI ĐÂY
      const randomFP = generateRandomFingerprint();

      // 4. Tạo Profile
      // Dùng await để đảm bảo tạo xong cái này mới tới cái kia (tránh overload DB)
      try {
        const profile = await prisma.profile.create({
          data: {
            name: uid, 
            
            // Lưu JSON Account
            accountInfo: JSON.stringify({
              uid,
              password,
              twoFactor,
              email,
              emailPassword,
              recoveryEmail
            }),
            
            // Lưu full bộ thông số giả lập vào cột fingerprint (dạng Json)
            fingerprint: randomFP,
            fingerprintJson: randomFP,
            
            // Lưu UserAgent ra cột ngoài để dễ nhìn
            userAgent: randomFP.userAgent,
            
            // Các giá trị mặc định cần thiết
            os: randomFP.os === 'windows' ? 'Windows 10' : randomFP.os === 'mac' ? 'macOS' : 'Linux',
            osName: randomFP.os === 'windows' ? 'Windows 10' : randomFP.os === 'mac' ? 'macOS' : 'Linux',
            platform: randomFP.os === 'windows' ? 'Win32' : randomFP.os === 'mac' ? 'MacIntel' : 'Linux x86_64',
            screenWidth: randomFP.screenWidth,
            screenHeight: randomFP.screenHeight,
            hardwareConcurrency: randomFP.hardwareConcurrency,
            deviceMemory: randomFP.deviceMemory,
            webglVendor: randomFP.webglVendor,
            webglRenderer: randomFP.webglRenderer,
            canvasMode: "noise",
            audioContextMode: "noise",
            webglMetadataMode: "mask",
            macAddress: await randomMac(),
          }
        });

        createdProfiles.push(profile);
      } catch (err: any) {
        console.error("Error creating profile for line:", trimmedLine, err);
        errors.push(`Failed to create profile for ${uid}: ${err.message}`);
      }
    }

    res.json({ 
      success: true, 
      message: `Successfully imported ${createdProfiles.length} accounts with RANDOM Fingerprints.`, 
      data: createdProfiles,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error: any) {
    console.error("Bulk import error:", error);
    // Trả về lỗi chi tiết để debug
    res.status(500).json({ 
      success: false,
      error: 'Import failed', 
      details: error.message 
    });
  }
});

export const runBulkProfiles = asyncHandler(async (req: Request, res: Response) => {
  const { profileIds, concurrency, screenWidth, screenHeight } = req.body;

  if (!profileIds || !Array.isArray(profileIds)) {
      return res.status(400).json({ error: "Cần danh sách profileIds" });
  }

  const count = profileIds.length;

  // Tự động tính số cột và dòng dựa trên số lượng profile (cố gắng chia thành hình vuông hoặc chữ nhật)
  const cols = Math.ceil(Math.sqrt(count)); 
  const rows = Math.ceil(count / cols);

  // Kích thước màn hình (Mặc định Full HD nếu không gửi lên)
  const sWidth = screenWidth || 1920;
  const sHeight = screenHeight || 1040; // Trừ thanh Taskbar

  // Tính kích thước mỗi cửa sổ
  const winWidth = Math.floor(sWidth / cols);
  const winHeight = Math.floor(sHeight / rows);

  console.log(`[LAYOUT] Sắp xếp ${count} profiles -> Lưới ${cols}x${rows} -> Size: ${winWidth}x${winHeight}`);

  const limit = pLimit(concurrency || count); 
  const browserService = await import('../services/browserService');

  void profileIds.map((id, index) => {
      return limit(async () => {
          // === THÊM DÒNG NÀY: CHỜ RẢI RÁC ===
          // Profile thứ 1 chạy ngay. Profile thứ 2 chờ 2s. Profile thứ 3 chờ 4s...
          // Giúp CPU không bị shock và mạng không bị nghẽn
          await new Promise(resolve => setTimeout(resolve, index * 2000));

          try {
              // Tính tọa độ X, Y
              const colIndex = index % cols;
              const rowIndex = Math.floor(index / cols);
              const positionX = colIndex * winWidth;
              const positionY = rowIndex * winHeight;

              const profile = await prisma.profile.findUnique({
                  where: { id: parseInt(String(id)) },
                  include: { workflow: true, proxy: true }
              });

              if (!profile) return;

              let proxyConfig = undefined;
              if (profile.proxy) {
                  proxyConfig = {
                      host: profile.proxy.host,
                      port: profile.proxy.port,
                      username: profile.proxy.username,
                      password: profile.proxy.password,
                      type: profile.proxy.type
                  };
              }

              const session = await prisma.session.create({
                  data: { profile_id: profile.id, status: 'running', started_at: new Date() }
              });

              browserService.runAndManageBrowser(
                  profile,
                  profile.workflow,
                  {
                      profileId: profile.id,
                      sessionId: session.id,
                      userAgent: profile.userAgent,
                      proxy: proxyConfig,
                      // Truyền tọa độ chuẩn
                      windowPosition: { x: positionX, y: positionY },
                      windowSize: { width: winWidth, height: winHeight }
                  }
              ).then(() => {
                  prisma.session.update({
                      where: { id: session.id },
                      data: { status: 'stopped', stopped_at: new Date() }
                  });
              });

          } catch (e) {
              console.error(`[ERROR] Profile ${id} fail:`, e);
          }
      });
  });

  res.json({ success: true, message: `Đang khởi động ${count} profiles (Layout ${cols}x${rows})...` });
});