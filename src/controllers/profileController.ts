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
  os: z.string().optional(), // Thêm trường os
  osName: z.string().optional(),
  osArch: z.enum(['x86','x64','arm']).optional(),
  browserVersion: z.number().int().min(130).max(140).optional(),
  screenWidth: z.number().int().positive().optional(),
  screenHeight: z.number().int().positive().optional(),
  canvas: z.enum(['Noise','Off','Block']).optional(), // Thêm trường canvas
  canvasMode: z.enum(['Noise','Off','Block']).optional(),
  clientRects: z.enum(['Off','Noise']).optional(), // Thêm trường clientRects
  clientRectsMode: z.enum(['Off','Noise']).optional(),
  audioContext: z.enum(['Off','Noise']).optional(), // Thêm trường audioContext
  audioCtxMode: z.enum(['Off','Noise']).optional(),
  webglImage: z.enum(['Off','Noise']).optional(), // Thêm trường webglImage
  webglImageMode: z.enum(['Off','Noise']).optional(),
  webglMetadata: z.enum(['Mask','Real']).optional(), // Thêm trường webglMetadata
  webglMetaMode: z.enum(['Mask','Real']).optional(),
  geoEnabled: z.boolean().optional(),
  geoLatitude: z.number().min(-90).max(90).optional(),
  geoLongitude: z.number().min(-180).max(180).optional(),
  webrtcMainIp: z.boolean().optional(), // Thêm trường webrtcMainIp
  webrtcMainIP: z.boolean().optional(),
  proxyRefId: z.string().optional(),
  proxyManual: z.any().optional(),
  macAddress: z.string().regex(/^([0-9a-fA-F]{2}:){5}[0-9a-fA-F]{2}$/).optional(),
  fingerprintJson: z.any().optional(),
  timezoneId: z.string().optional(),
  language: z.string().optional(),
  hardwareConcurrency: z.union([z.number().int().min(2).max(32), z.string()]).transform((val) => {
    if (typeof val === 'string') {
      const num = parseInt(val, 10);
      return isNaN(num) ? undefined : num;
    }
    return val;
  }).optional(),
  deviceMemory: z.union([z.number().int().min(2).max(64), z.string()]).transform((val) => {
    if (typeof val === 'string') {
      const num = parseInt(val, 10);
      return isNaN(num) ? undefined : num;
    }
    return val;
  }).optional(),
  workflowId: z.union([
    z.number().int().positive(),
    z.string().refine((val) => val === 'none' || val === '', { message: 'Must be a number or "none"' }),
    z.null()
  ]).optional(), // ID của workflow được gán, có thể là number, 'none', hoặc null
})

export const create = asyncHandler(async (req: Request, res: Response) => {
  try {
    console.log('================================');
    console.log(`[CREATE] Nhận yêu cầu tạo profile mới`);
    console.log(`[CREATE] Raw body:`, JSON.stringify(req.body, null, 2));
    
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) {
      console.error(`[CREATE] ❌ Validation error:`, parsed.error.issues);
      throw new AppError(`Validation error: ${parsed.error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')}`, 400)
    }
    const body = parsed.data

    console.log(`[CREATE] ✅ Validation passed`);
    console.log(`[CREATE] Dữ liệu sau validation:`, JSON.stringify(body, null, 2));
    console.log(`[CREATE] hardwareConcurrency:`, body.hardwareConcurrency, typeof body.hardwareConcurrency);
    console.log(`[CREATE] deviceMemory:`, body.deviceMemory, typeof body.deviceMemory);
    console.log('================================');

  if (!body.name) {
    throw new AppError('Name is required', 400);
  }

  // ==========================================================
  // === LẤY DỮ LIỆU TỪ BODY - NGUỒN CHÂN LÝ DUY NHẤT ===
  // ==========================================================
  // KHÔNG override, KHÔNG generate mới nếu đã có trong body
  const finalUA = body.userAgent || body.user_agent
  const finalOS = body.os || body.osName
  const finalScreenWidth = body.screenWidth
  const finalScreenHeight = body.screenHeight

  console.log(`[CREATE] User Agent từ body:`, finalUA);
  console.log(`[CREATE] OS từ body:`, finalOS);
  console.log(`[CREATE] Screen Width từ body:`, finalScreenWidth);
  console.log(`[CREATE] Screen Height từ body:`, finalScreenHeight);

  // Chỉ generate UA mới nếu KHÔNG có trong body
  let userAgentToUse = finalUA
  if (!userAgentToUse) {
    userAgentToUse = await getUniqueUA({ 
      browser: 'chrome', 
      versionHint: body.browserVersion, 
      os: finalOS || 'Windows 10' 
    })
    console.log(`[CREATE] Không có UA trong body, đã generate mới:`, userAgentToUse);
  }

  // Chỉ generate MAC mới nếu KHÔNG có trong body
  let macToUse = body.macAddress
  if (!macToUse) {
    macToUse = await randomMac()
    console.log(`[CREATE] Không có MAC trong body, đã generate mới:`, macToUse);
  }

  // Sử dụng screenWidth/screenHeight từ body, hoặc default nếu không có
  const screenWidthToUse = finalScreenWidth ?? 1920
  const screenHeightToUse = finalScreenHeight ?? 1080

  // Build fingerprint từ dữ liệu body (KHÔNG dùng fingerprintJson cũ)
  const tempSeed = Date.now() % 1000000
  const bodyAny = body as any // Type assertion để truy cập các trường không có trong schema
  const fp = bodyAny.fingerprintJson ? JSON.parse(typeof bodyAny.fingerprintJson === 'string' ? bodyAny.fingerprintJson : JSON.stringify(bodyAny.fingerprintJson)) : fpService.build({
    osName: (finalOS || bodyAny.osName) as any,
    osArch: (bodyAny.osArch as any) || 'x64',
    browserVersion: bodyAny.browserVersion || 136,
    screenWidth: screenWidthToUse,
    screenHeight: screenHeightToUse,
    canvasMode: bodyAny.canvasMode || bodyAny.canvas || 'Noise',
    clientRectsMode: bodyAny.clientRectsMode || bodyAny.clientRects || 'Off',
    audioCtxMode: bodyAny.audioCtxMode || bodyAny.audioContext || 'Off',
    webglImageMode: bodyAny.webglImageMode || bodyAny.webglImage || 'Off',
    webglMetaMode: bodyAny.webglMetaMode || bodyAny.webglMetadata || 'Mask',
    geoEnabled: bodyAny.geoEnabled ?? false,
    geoLatitude: bodyAny.geoLatitude,
    geoLongitude: bodyAny.geoLongitude,
    webrtcMainIP: bodyAny.webrtcMainIP ?? bodyAny.webrtcMainIp ?? false,
    proxyRefId: bodyAny.proxyRefId ?? null,
    proxyManual: bodyAny.proxyManual ?? null,
    ua: userAgentToUse,
    mac: macToUse,
    timezoneId: bodyAny.timezone || bodyAny.timezoneId,
    language: bodyAny.language,
    hardwareConcurrency: bodyAny.hardwareConcurrency,
    deviceMemory: bodyAny.deviceMemory,
    seed: tempSeed,
  } as any)

  // Create profile với dữ liệu từ body
  console.log(`[CREATE] Đang tạo profile với dữ liệu...`);
  
  // Đảm bảo các giá trị required luôn có giá trị (không undefined)
  const finalHardwareConcurrency = bodyAny.hardwareConcurrency !== undefined && bodyAny.hardwareConcurrency !== null 
    ? Number(bodyAny.hardwareConcurrency) 
    : 8;
  const finalDeviceMemory = bodyAny.deviceMemory !== undefined && bodyAny.deviceMemory !== null 
    ? Number(bodyAny.deviceMemory) 
    : 8;
  const finalLanguages = Array.isArray(bodyAny.languages) && bodyAny.languages.length > 0 
    ? bodyAny.languages 
    : (bodyAny.language ? [bodyAny.language] : ['en-US', 'en']);
  const finalLanguage = bodyAny.language || 'en-US';
  const finalTimezone = bodyAny.timezone || bodyAny.timezoneId || 'Europe/London';
  
  console.log(`[CREATE] hardwareConcurrency sẽ lưu:`, finalHardwareConcurrency);
  console.log(`[CREATE] deviceMemory sẽ lưu:`, finalDeviceMemory);
  console.log(`[CREATE] languages sẽ lưu:`, finalLanguages);
  console.log(`[CREATE] language sẽ lưu:`, finalLanguage);
  console.log(`[CREATE] timezone sẽ lưu:`, finalTimezone);
  
  const profile = await profileService.createProfile({
    name: body.name,
    user_agent: userAgentToUse,
    userAgent: userAgentToUse,
    os: finalOS,
    osName: finalOS || bodyAny.osName,
    osArch: bodyAny.osArch,
    browserVersion: bodyAny.browserVersion,
    screenWidth: screenWidthToUse,
    screenHeight: screenHeightToUse,
    canvasMode: bodyAny.canvasMode || bodyAny.canvas,
    clientRectsMode: bodyAny.clientRectsMode || bodyAny.clientRects,
    audioCtxMode: bodyAny.audioCtxMode || bodyAny.audioContext,
    webglImageMode: bodyAny.webglImageMode || bodyAny.webglImage,
    webglMetaMode: bodyAny.webglMetaMode || bodyAny.webglMetadata,
    geoEnabled: bodyAny.geoEnabled,
    geoLatitude: bodyAny.geoLatitude,
    geoLongitude: bodyAny.geoLongitude,
    webrtcMainIP: bodyAny.webrtcMainIP ?? bodyAny.webrtcMainIp,
    proxyRefId: bodyAny.proxyRefId,
    proxyManual: bodyAny.proxyManual,
    macAddress: macToUse,
    fingerprint: fp,
    fingerprintJson: fp,
    timezoneId: finalTimezone,
    timezone: finalTimezone,
    language: finalLanguage,
    languages: finalLanguages,
    hardwareConcurrency: finalHardwareConcurrency,
    deviceMemory: finalDeviceMemory,
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

  console.log(`[CREATE] ✅ Profile đã được tạo thành công với ID:`, updatedProfile?.id);
  console.log(`[CREATE] User Agent cuối cùng:`, (updatedProfile as any)?.userAgent || (updatedProfile as any)?.user_agent);
  console.log(`[CREATE] OS cuối cùng:`, (updatedProfile as any)?.os || (updatedProfile as any)?.osName);

  res.status(201).json({
    success: true,
    message: 'Profile created successfully',
    data: updatedProfile || profile,
  });
  } catch (error: any) {
    console.error(`[CREATE] ❌ Lỗi khi tạo profile:`, error);
    console.error(`[CREATE] ❌ Stack trace:`, error.stack);
    throw error; // Re-throw để asyncHandler xử lý
  }
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
  console.log(`[UPDATE] Dữ liệu nhận được từ body:`, JSON.stringify(body, null, 2));
  console.log('================================');

  try {
    // ==========================================================
    // === LẤY DỮ LIỆU TỪ BODY - NGUỒN CHÂN LÝ DUY NHẤT ===
    // ==========================================================
    // 1. TẠO MỘT OBJECT RỖNG ĐỂ CHỨA DỮ LIỆU CẦN CẬP NHẬT
    const dataToUpdate: any = {};

    // 2. KIỂM TRA TỪNG TRƯỜNG MỘT. TRƯỜNG NÀO CÓ THÌ MỚI THÊM VÀO OBJECT
    // Điều này giúp chúng ta có thể dùng chung endpoint này để cập nhật nhiều thứ
    if (body.name !== undefined) {
      dataToUpdate.name = body.name;
    }

    // === USER AGENT - LẤY TỪ BODY ===
    if (body.userAgent !== undefined) {
      dataToUpdate.userAgent = body.userAgent;
      dataToUpdate.user_agent = body.userAgent; // Đồng bộ cả 2 trường
      console.log(`[UPDATE] ✅ Cập nhật userAgent từ body:`, body.userAgent);
    } else if (body.user_agent !== undefined) {
      dataToUpdate.user_agent = body.user_agent;
      dataToUpdate.userAgent = body.user_agent; // Đồng bộ cả 2 trường
      console.log(`[UPDATE] ✅ Cập nhật user_agent từ body:`, body.user_agent);
    }

    // === OS - LẤY TỪ BODY ===
    if (body.os !== undefined) {
      dataToUpdate.os = body.os;
      dataToUpdate.osName = body.os; // Đồng bộ cả 2 trường
      console.log(`[UPDATE] ✅ Cập nhật os từ body:`, body.os);
    } else if (body.osName !== undefined) {
      dataToUpdate.osName = body.osName;
      dataToUpdate.os = body.osName; // Đồng bộ cả 2 trường
      console.log(`[UPDATE] ✅ Cập nhật osName từ body:`, body.osName);
    }
    
    // === SCREEN WIDTH/HEIGHT - LẤY TỪ BODY ===
    if (body.screenWidth !== undefined) {
      dataToUpdate.screenWidth = Number(body.screenWidth);
      console.log(`[UPDATE] ✅ Cập nhật screenWidth từ body:`, body.screenWidth);
    }
    if (body.screenHeight !== undefined) {
      dataToUpdate.screenHeight = Number(body.screenHeight);
      console.log(`[UPDATE] ✅ Cập nhật screenHeight từ body:`, body.screenHeight);
    }

    // === CÁC TRƯỜNG FINGERPRINT KHÁC - LẤY TỪ BODY ===
    if (body.canvas !== undefined || body.canvasMode !== undefined) {
      const canvasValue = body.canvasMode || body.canvas;
      dataToUpdate.canvas = canvasValue;
      dataToUpdate.canvasMode = canvasValue;
    }
    if (body.clientRects !== undefined || body.clientRectsMode !== undefined) {
      const clientRectsValue = body.clientRectsMode || body.clientRects;
      dataToUpdate.clientRects = clientRectsValue;
      dataToUpdate.clientRectsMode = clientRectsValue;
    }
    if (body.audioContext !== undefined || body.audioCtxMode !== undefined) {
      const audioValue = body.audioCtxMode || body.audioContext;
      dataToUpdate.audioContext = audioValue;
      dataToUpdate.audioCtxMode = audioValue;
    }
    if (body.webglImage !== undefined || body.webglImageMode !== undefined) {
      const webglImageValue = body.webglImageMode || body.webglImage;
      dataToUpdate.webglImage = webglImageValue;
      dataToUpdate.webglImageMode = webglImageValue;
    }
    if (body.webglMetadata !== undefined || body.webglMetaMode !== undefined) {
      const webglMetaValue = body.webglMetaMode || body.webglMetadata;
      dataToUpdate.webglMetadata = webglMetaValue;
      dataToUpdate.webglMetaMode = webglMetaValue;
    }
    if (body.geoEnabled !== undefined) {
      dataToUpdate.geoEnabled = Boolean(body.geoEnabled);
    }
    if (body.webrtcMainIp !== undefined || body.webrtcMainIP !== undefined) {
      const webrtcValue = body.webrtcMainIP ?? body.webrtcMainIp;
      dataToUpdate.webrtcMainIp = Boolean(webrtcValue);
      dataToUpdate.webrtcMainIP = Boolean(webrtcValue);
    }

    // === NAVIGATOR OBJECT - Thông số fingerprint đầy đủ ===
    if (body.hardwareConcurrency !== undefined) {
      dataToUpdate.hardwareConcurrency = Number(body.hardwareConcurrency);
      console.log(`[UPDATE] ✅ Cập nhật hardwareConcurrency từ body:`, body.hardwareConcurrency);
    }
    if (body.deviceMemory !== undefined) {
      dataToUpdate.deviceMemory = Number(body.deviceMemory);
      console.log(`[UPDATE] ✅ Cập nhật deviceMemory từ body:`, body.deviceMemory);
    }
    if (body.languages !== undefined) {
      dataToUpdate.languages = Array.isArray(body.languages) ? body.languages : [body.languages];
      console.log(`[UPDATE] ✅ Cập nhật languages từ body:`, body.languages);
    }
    if (body.timezone !== undefined) {
      dataToUpdate.timezone = body.timezone;
      dataToUpdate.timezoneId = body.timezone; // Đồng bộ cả 2 trường
      console.log(`[UPDATE] ✅ Cập nhật timezone từ body:`, body.timezone);
    } else if (body.timezoneId !== undefined) {
      dataToUpdate.timezoneId = body.timezoneId;
      dataToUpdate.timezone = body.timezoneId; // Đồng bộ cả 2 trường
      console.log(`[UPDATE] ✅ Cập nhật timezoneId từ body:`, body.timezoneId);
    }
    if (body.language !== undefined) {
      dataToUpdate.language = body.language;
      console.log(`[UPDATE] ✅ Cập nhật language từ body:`, body.language);
    }

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
        audioCtxMode: ((profileData.audioContextMode || (profileData as any).audioCtxMode) || 'Off') as 'Off' | 'Noise',
        webglImageMode: (profileData.webglImageMode || 'Off') as 'Off' | 'Noise',
        webglMetaMode: (profileData.webglMetaMode || 'Mask') as 'Mask' | 'Real',
        geoEnabled: (profileData.geolocationMode === 'fake' || (profileData as any).geolocationEnabled || (profileData as any).geoEnabled) ?? false,
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

