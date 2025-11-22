import { Request, Response } from 'express';
import * as profileService from '../services/profileService';
import { AppError, asyncHandler } from '../utils/errorHandler';
import prisma from '../prismaClient';
import { randomUnique as randomMac } from '../services/macService';
import { getUniqueUA } from '../services/userAgentProvider';

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
  const id = parseNumber(req.params.id);
  if (!id) throw new AppError('Invalid ID', 400);

  const body = req.body;
  console.log(`[UPDATE] Profile ID: ${id}. Body keys:`, Object.keys(body));

  // 1. Xử lý Proxy ID (nếu có gửi lên)
  let proxyIdToUpdate: number | null | undefined = undefined;
  if (body.proxyId !== undefined) {
    proxyIdToUpdate = parseNumber(body.proxyId); // Có thể là null (nếu muốn gỡ proxy)
  }

  // 2. Xây dựng object update
  const updateData: any = {
    ...body,
  };

  // Chỉ set proxyId nếu nó được gửi lên
  if (proxyIdToUpdate !== undefined) {
    updateData.proxyId = proxyIdToUpdate;
  }

  // Xóa các trường không có trong DB để tránh lỗi
  delete updateData.id;
  delete updateData.status; // Xóa status nếu frontend lỡ gửi lên
  delete updateData.folderId;
  delete updateData.driverType;
  delete updateData.browserType;
  delete updateData.transferStatus;

  // Cập nhật fingerprint JSON nếu có thay đổi
  if (body.fingerprintJson || body.fingerprint) {
    const fp = body.fingerprintJson || body.fingerprint;
    updateData.fingerprint = typeof fp === 'string' ? JSON.parse(fp) : fp;
    updateData.fingerprintJson = updateData.fingerprint;
  }

  const updatedProfile = await profileService.updateProfile(id, updateData);

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: updatedProfile,
  });
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