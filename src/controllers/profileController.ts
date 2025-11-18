import { Request, Response } from 'express';
import * as profileService from '../services/profileService';
import { AppError, asyncHandler } from '../utils/errorHandler';
import { z } from 'zod'
import { getUniqueUA } from '../services/userAgentProvider'
import { randomUnique as randomMac } from '../services/macService'
import * as fpService from '../services/fingerprintService'
import prisma from '../prismaClient'
import * as path from 'path'

// Helper function để resolve path alias @worker/* ở runtime
function resolveWorkerPath(aliasPath: string): string {
  // Thay thế @worker/ bằng đường dẫn thực tế
  const workerPath = aliasPath.replace('@worker/', '');
  // Resolve từ root project (process.cwd())
  return path.resolve(process.cwd(), 'packages/worker/src', workerPath);
}

export const getAll = asyncHandler(async (_req: Request, res: Response) => {
  const profiles = await profileService.getAllProfiles();
  res.json({
    success: true,
    data: profiles,
  });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const profile = await profileService.getProfileById(id);

  if (!profile) {
    throw new AppError('Profile not found', 404);
  }

  res.json({
    success: true,
    data: profile,
  });
});

const createSchema = z.object({
  name: z.string().min(1),
  user_agent: z.string().optional(),
  fingerprint: z.any().optional(),
  // new fields are optional (backward compatible)
  userAgent: z.string().optional(),
  osName: z.string().optional(),
  osArch: z.enum(['x86','x64','arm']).optional(),
  browserVersion: z.number().int().min(130).max(140).optional(),
  screenWidth: z.number().int().positive().optional(),
  screenHeight: z.number().int().positive().optional(),
  canvasMode: z.enum(['Noise','Off','Block']).optional(),
  clientRectsMode: z.enum(['Off','Noise']).optional(),
  audioCtxMode: z.enum(['Off','Noise']).optional(),
  webglImageMode: z.enum(['Off','Noise']).optional(),
  webglMetaMode: z.enum(['Mask','Real']).optional(),
  geoEnabled: z.boolean().optional(),
  geoLatitude: z.number().min(-90).max(90).optional(),
  geoLongitude: z.number().min(-180).max(180).optional(),
  webrtcMainIP: z.boolean().optional(),
  proxyRefId: z.string().optional(),
  proxyManual: z.any().optional(),
  macAddress: z.string().regex(/^([0-9a-fA-F]{2}:){5}[0-9a-fA-F]{2}$/).optional(),
  fingerprintJson: z.any().optional(),
  timezoneId: z.string().optional(),
  language: z.string().optional(),
  hardwareConcurrency: z.number().int().min(2).max(32).optional(),
  deviceMemory: z.number().int().min(2).max(64).optional(),
  workflowId: z.union([
    z.number().int().positive(),
    z.string().refine((val) => val === 'none' || val === '', { message: 'Must be a number or "none"' }),
    z.null()
  ]).optional(), // ID của workflow được gán, có thể là number, 'none', hoặc null
})

export const create = asyncHandler(async (req: Request, res: Response) => {
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new AppError(parsed.error.message, 400)
  }
  const {
    name,
    user_agent,
    fingerprint,
    userAgent, osName, osArch, browserVersion, screenWidth, screenHeight,
    canvasMode, clientRectsMode, audioCtxMode, webglImageMode, webglMetaMode,
    geoEnabled, geoLatitude, geoLongitude, webrtcMainIP, proxyRefId, proxyManual,
    macAddress, fingerprintJson, timezoneId, language, hardwareConcurrency, deviceMemory
  } = parsed.data

  if (!name) {
    throw new AppError('Name is required', 400);
  }

  // Ensure UA uniqueness
  let finalUA = userAgent || user_agent
  if (finalUA) {
    try {
      const existing = await prisma.$queryRaw`SELECT id FROM profiles WHERE "userAgent" = ${finalUA} LIMIT 1` as any[]
      if (existing && existing.length > 0) {
        finalUA = await getUniqueUA({ browser: 'chrome', versionHint: browserVersion, os: osName || 'Windows 10' })
      }
    } catch {}
  } else {
    finalUA = await getUniqueUA({ browser: 'chrome', versionHint: browserVersion, os: osName || 'Windows 10' })
  }

  // Ensure MAC uniqueness
  let finalMAC = macAddress
  if (finalMAC) {
    try {
      const exists = await prisma.$queryRaw`SELECT id FROM profiles WHERE "macAddress" = ${finalMAC} LIMIT 1` as any[]
      if (exists && exists.length > 0) {
        finalMAC = await randomMac()
      }
    } catch {}
  } else {
    finalMAC = await randomMac()
  }

  // Determine default screen resolution based on OS
  const defaultScreenWidth = screenWidth ?? (osName?.startsWith('macOS') ? 1920 : 1920)
  const defaultScreenHeight = screenHeight ?? (osName?.startsWith('macOS') ? 1200 : 1080)

  // Build fingerprint with temporary seed (will be updated with profileId after creation)
  const tempSeed = Date.now() % 1000000
  const fp = fingerprintJson || fingerprint || fpService.build({
    osName: osName as any,
    osArch: (osArch as any) || 'x64',
    browserVersion: browserVersion || 136,
    screenWidth: defaultScreenWidth,
    screenHeight: defaultScreenHeight,
    canvasMode: canvasMode || 'Noise',
    clientRectsMode: clientRectsMode || 'Off',
    audioCtxMode: audioCtxMode || 'Off',
    webglImageMode: webglImageMode || 'Off',
    webglMetaMode: webglMetaMode || 'Mask',
    geoEnabled: geoEnabled || false,
    geoLatitude: geoLatitude,
    geoLongitude: geoLongitude,
    webrtcMainIP: webrtcMainIP || false,
    proxyRefId: proxyRefId ?? null,
    proxyManual: proxyManual ?? null,
    ua: finalUA,
    mac: finalMAC,
    timezoneId: timezoneId,
    language: language,
    hardwareConcurrency: hardwareConcurrency,
    deviceMemory: deviceMemory,
    seed: tempSeed,
  })

  // Create profile with fingerprint
  const profile = await profileService.createProfile({
    name,
    user_agent: finalUA,
    fingerprint: fp,
    userAgent: finalUA,
    osName, osArch, browserVersion,
    screenWidth: defaultScreenWidth,
    screenHeight: defaultScreenHeight,
    canvasMode, clientRectsMode, audioCtxMode, webglImageMode, webglMetaMode,
    geoEnabled, geoLatitude, geoLongitude, webrtcMainIP,
    proxyRefId, proxyManual, macAddress: finalMAC,
    fingerprintJson: fp,
    timezoneId, language, hardwareConcurrency, deviceMemory,
  } as any)

  // Update fingerprint with actual profileId as seed for deterministic noise
  const finalFp = {
    ...fp,
    profileId: profile.id,
    seed: profile.id,
  }
  
  await profileService.updateProfile(profile.id, {
    fingerprint: finalFp,
    fingerprintJson: finalFp,
  } as any)

  // Reload profile with updated fingerprint
  const updatedProfile = await profileService.getProfileById(profile.id)

  res.status(201).json({
    success: true,
    message: 'Profile created successfully',
    data: updatedProfile || profile,
  });
});

// POST /api/profiles/generate-fingerprint
export const generateFingerprint = asyncHandler(async (req: Request, res: Response) => {
  const body: any = req.body || {}
  const osName = body?.os?.name || req.body?.osName || 'Windows 10'
  const osArch = body?.os?.arch || req.body?.osArch || 'x64'
  const browserVersion = body?.browser?.version || req.body?.browserVersion || 136

  // UA: ensure exists and is unique
  let ua: string | undefined = body.ua || req.body?.user_agent || req.body?.userAgent
  if (ua) {
    try {
      const existing = await prisma.$queryRaw`SELECT id FROM profiles WHERE "userAgent" = ${ua} LIMIT 1` as any[]
      if (existing && existing.length > 0) ua = await getUniqueUA({ browser: 'chrome', versionHint: browserVersion, os: osName })
    } catch {
      // Field might not exist, skip check
    }
  } else {
    ua = await getUniqueUA({ browser: 'chrome', versionHint: browserVersion, os: osName })
  }

  // MAC: ensure exists and unique
  let mac: string | undefined = body.mac || req.body?.macAddress
  if (mac) {
    try {
      const exists = await prisma.$queryRaw`SELECT id FROM profiles WHERE "macAddress" = ${mac} LIMIT 1` as any[]
      if (exists && exists.length > 0) mac = await randomMac()
    } catch {
      // Field might not exist, skip check
    }
  } else {
    mac = await randomMac()
  }

  const fp = {
    ...(body || {}),
    ua,
    mac,
    os: { name: osName, arch: osArch },
    browser: { version: browserVersion },
  }

  res.json({ success: true, data: fp })
})

// POST /api/profiles/user-agent
export const getUserAgent = asyncHandler(async (req: Request, res: Response) => {
  const { browser, versionHint, os } = req.body || {}
  const ua = await getUniqueUA({ browser, versionHint, os })
  res.json({ success: true, userAgent: ua })
})

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const body = req.body; // Lấy toàn bộ body request

  console.log('================================');
  console.log(`[UPDATE] Nhận yêu cầu cập nhật cho Profile ID: ${id}`);
  console.log(`[UPDATE] Dữ liệu nhận được:`, body);
  console.log('================================');

  try {
    // 1. TẠO MỘT OBJECT RỖNG ĐỂ CHỨA DỮ LIỆU CẦN CẬP NHẬT
    const dataToUpdate: any = {};

    // 2. KIỂM TRA TỪNG TRƯỜNG MỘT. TRƯỜNG NÀO CÓ THÌ MỚI THÊM VÀO OBJECT
    // Điều này giúp chúng ta có thể dùng chung endpoint này để cập nhật nhiều thứ
    if (body.name !== undefined) {
      dataToUpdate.name = body.name;
    }
    if (body.userAgent !== undefined) {
      dataToUpdate.userAgent = body.userAgent;
      dataToUpdate.user_agent = body.userAgent; // Đồng bộ cả 2 trường
    }
    if (body.user_agent !== undefined) {
      dataToUpdate.user_agent = body.user_agent;
      dataToUpdate.userAgent = body.user_agent; // Đồng bộ cả 2 trường
    }
    
    // === ĐẢM BẢO DÒNG NÀY TỒN TẠI! ===
    // Cập nhật screenWidth và screenHeight từ body
    if (body.screenWidth !== undefined) {
      dataToUpdate.screenWidth = Number(body.screenWidth);
    }
    if (body.screenHeight !== undefined) {
      dataToUpdate.screenHeight = Number(body.screenHeight);
    }
    // ==================================

    // ĐÂY LÀ PHẦN QUAN TRỌNG NHẤT CHO WORKFLOW
    if (body.workflowId !== undefined) {
      // Xử lý giá trị 'none' thành null
      if (body.workflowId === 'none' || body.workflowId === '' || body.workflowId === null) {
        dataToUpdate.workflowId = null;
        console.log('✅ Xử lý workflowId: chuyển thành null (ngắt kết nối workflow)');
      } else {
        // Chuyển đổi sang number (vì Prisma schema định nghĩa workflowId là Int?)
        const workflowIdNum = typeof body.workflowId === 'string' ? parseInt(body.workflowId, 10) : Number(body.workflowId);
        if (isNaN(workflowIdNum)) {
          console.warn('⚠️ workflowId không hợp lệ:', body.workflowId);
          throw new AppError('Invalid workflowId: must be a number', 400);
        }
        dataToUpdate.workflowId = workflowIdNum;
        console.log('✅ Xử lý workflowId: gán workflow ID =', workflowIdNum);
      }
    }

    // 3. KIỂM TRA XEM CÓ GÌ ĐỂ CẬP NHẬT KHÔNG
    if (Object.keys(dataToUpdate).length === 0) {
      // Nếu không có dữ liệu gì được gửi lên, trả về lỗi
      return res.status(400).json({ message: 'Không có dữ liệu hợp lệ để cập nhật.' });
    }

    // 4. THỰC THI LỆNH UPDATE VỚI DỮ LIỆU ĐÃ ĐƯỢC XÂY DỰNG
    const updatedProfile = await prisma.profile.update({
      where: { id: parseInt(id) }, // Đảm bảo ID là number
      data: dataToUpdate, // Chỉ cập nhật những gì có trong object này
      include: {
        workflow: true, // Lấy kèm thông tin workflow sau khi cập nhật
      },
    });

    console.log('✅ Cập nhật profile thành công:', updatedProfile.id);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedProfile,
    });

  } catch (error: any) {
    console.error('[UPDATE] Lỗi Prisma:', error);
    
    // Cố gắng trả về thông báo lỗi cụ thể hơn từ Prisma
    let errorMessage = 'Lỗi server khi cập nhật profile';
    if (error.code === 'P2025') {
      // Lỗi Prisma: bản ghi không tồn tại
      errorMessage = 'Profile không tồn tại hoặc ID không đúng.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(500).json({ 
      success: false,
      message: errorMessage,
      error: error.message 
    });
  }
});

// =======================================================================
// === PHIÊN BẢN V4 - HÀM CONTROLLER BẤT BẠI ===
// File: profileController.ts
// =======================================================================
export const startProfileWithWorkflow = asyncHandler(async (req: Request, res: Response) => {
  // Parse và validate profileId
  const profileId = parseInt(req.params.id, 10);
  if (isNaN(profileId) || profileId <= 0) {
    throw new AppError(`Invalid profile ID: ${req.params.id}`, 400);
  }

  console.log(`[CONTROLLER] Nhận yêu cầu cho profile ID: ${profileId}`);

  // BƯỚC 1: LẤY DỮ LIỆU PROFILE TỪ DATABASE
  // Chỉ một lần duy nhất, và dùng biến này cho tất cả các bước sau.
  const profileData = await prisma.profile.findUnique({
    where: { id: profileId },
    include: { workflow: true }
  });

  // BƯỚC 2: KIỂM TRA DỮ LIỆU NGAY LẬP TỨC
  if (!profileData) {
    console.error(`[CONTROLLER] LỖI: Không tìm thấy profile với ID ${profileId} trong database.`);
    throw new AppError(`Profile not found: ${profileId}`, 404);
  }

  // Log ra để xác nhận dữ liệu được truyền đi là ĐÚNG
  console.log(`[CONTROLLER] Dữ liệu sẽ được gửi đến browserService:`, {
    id: profileData.id,
    name: profileData.name,
    userAgent: profileData.userAgent || profileData.user_agent,
    user_agent: profileData.user_agent,
    screenWidth: profileData.screenWidth,
    screenHeight: profileData.screenHeight,
    workflowId: profileData.workflowId,
    workflow: profileData.workflow ? { id: profileData.workflow.id, name: profileData.workflow.name } : null,
  });

  // BƯỚC 3: GỌI SERVICE VÀ TRUYỀN ĐÚNG BIẾN ĐÓ ĐI
  // Không tạo thêm biến mới, không merge object, không làm gì phức tạp.
  // Chỉ đơn giản là truyền thẳng 'profileData' đi.
  try {
    const browserService = await import('../services/browserService');
    
    // Tạo session trước
    const session = await prisma.session.create({
      data: {
        profile_id: profileId,
        proxy_id: req.body?.proxyId ? Number(req.body.proxyId) : null,
        status: 'running',
        started_at: new Date(),
      },
      include: {
        profile: true,
        proxy: true,
      },
    });
    console.log(`✅ [CONTROLLER] Session created: ${session.id}`);

    // Get proxy config nếu có
    let proxyConfig: { host: string; port: number; username?: string; password?: string; type: string } | undefined = undefined;
    if (req.body?.proxyId) {
      const proxyRecord = await prisma.proxy.findUnique({
        where: { id: Number(req.body.proxyId) },
      });
      if (proxyRecord && proxyRecord.active) {
        proxyConfig = {
          host: proxyRecord.host,
          port: proxyRecord.port,
          username: proxyRecord.username || undefined,
          password: proxyRecord.password || undefined,
          type: proxyRecord.type,
        };
      }
    }

    // Build fingerprint từ profileData
    let fingerprint: any = profileData.fingerprintJson || profileData.fingerprint;
    if (!fingerprint && (profileData.canvasMode || profileData.osName)) {
      const { build: buildFingerprint } = await import('../services/fingerprintService');
      fingerprint = buildFingerprint({
        osName: profileData.osName as any,
        osArch: (profileData.osArch as any) || 'x64',
        browserVersion: profileData.browserVersion || 136,
        screenWidth: profileData.screenWidth ?? 1920,
        screenHeight: profileData.screenHeight ?? 1080,
        canvasMode: (profileData.canvasMode || 'Noise') as 'Noise' | 'Off' | 'Block',
        clientRectsMode: (profileData.clientRectsMode || 'Off') as 'Off' | 'Noise',
        audioCtxMode: (profileData.audioCtxMode || 'Off') as 'Off' | 'Noise',
        webglImageMode: (profileData.webglImageMode || 'Off') as 'Off' | 'Noise',
        webglMetaMode: (profileData.webglMetaMode || 'Mask') as 'Mask' | 'Real',
        geoEnabled: profileData.geoEnabled ?? false,
        geoLatitude: (profileData as any).geoLatitude,
        geoLongitude: (profileData as any).geoLongitude,
        webrtcMainIP: profileData.webrtcMainIP ?? false,
        proxyRefId: profileData.proxyRefId ?? null,
        proxyManual: (profileData.proxyManual as any) ?? null,
        ua: profileData.user_agent || profileData.userAgent || '',
        mac: profileData.macAddress || '',
        timezoneId: (profileData as any).timezoneId,
        language: (profileData as any).language,
        hardwareConcurrency: (profileData as any).hardwareConcurrency,
        deviceMemory: (profileData as any).deviceMemory,
        profileId: profileData.id,
        seed: profileData.id,
      });
    } else if (fingerprint && !fingerprint.seed) {
      fingerprint = {
        ...fingerprint,
        profileId: profileData.id,
        seed: fingerprint.seed || profileData.id,
      };
    }

    // GỌI runAndManageBrowser VỚI profileData TRỰC TIẾP
    await browserService.runAndManageBrowser(
      profileData, // ← TRUYỀN THẲNG profileData TỪ DB
      profileData.workflow || null,
      {
        profileId: profileData.id,
        sessionId: session.id,
        userAgent: profileData.user_agent || profileData.userAgent || undefined,
        fingerprint: fingerprint,
        proxy: proxyConfig,
      }
    );

    // Update session status to stopped
    await prisma.session.update({
      where: { id: session.id },
      data: { status: 'stopped', stopped_at: new Date() },
    });

    // Trả về thành công
    res.json({
      success: true,
      message: 'Browser launched successfully.',
      data: session,
    });
  } catch (error: any) {
    console.error(`[CONTROLLER] Lỗi từ browserService:`, error.message);
    throw new AppError(error.message || 'Failed to start profile', error.statusCode || 500);
  }
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  await profileService.deleteProfile(id);

  res.json({
    success: true,
    message: 'Profile deleted successfully',
  });
});

export const getFingerprint = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const profile = await profileService.getProfileById(id);

  if (!profile) {
    throw new AppError('Profile not found', 404);
  }

  const fp = profile.fingerprint || {};
  res.json({ success: true, data: fp });
});

export const updateFingerprint = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const fp = req.body;
  const updated = await profileService.updateProfile(id, { fingerprint: fp });
  res.json({ success: true, data: updated.fingerprint });
});

