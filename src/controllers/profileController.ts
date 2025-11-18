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

export const startProfileWithWorkflow = asyncHandler(async (req: Request, res: Response) => {
  const profileId = parseInt(req.params.id);
  const { proxyId, vars } = req.body || {};

  console.log('================================');
  console.log(`[START] Nhận yêu cầu khởi chạy profile ID: ${profileId}`);
  console.log(`[START] Proxy ID: ${proxyId || 'none'}`);
  console.log('================================');

  try {
    // 1. TÌM PROFILE VÀ WORKFLOW TRONG CSDL
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      include: {
        workflow: true, // Lấy kèm thông tin workflow đã được gán
      },
    });

    if (!profile) {
      throw new AppError(`Profile với ID ${profileId} không tồn tại.`, 404);
    }

    console.log(`[START] Đã tìm thấy profile: ${profile.name}`);
    console.log(`[START] Workflow ID: ${profile.workflowId || 'none'}`);

    // 2. NẾU CÓ WORKFLOW, KHỞI CHẠY PROFILE VÀ THỰC THI WORKFLOW
    if (profile.workflowId && profile.workflow) {
      console.log(`[START] Tìm thấy workflow "${profile.workflow.name}". Sẽ khởi chạy profile và thực thi workflow...`);
      
      // Build userDataDir (persistent profile directory)
      const path = (await import('path')).default;
      const fs = (await import('fs')).default;
      const profilesDir = path.join(process.cwd(), 'browser_profiles');
      if (!fs.existsSync(profilesDir)) {
        fs.mkdirSync(profilesDir, { recursive: true });
      }
      const userDataDir = path.join(profilesDir, `profile_${profileId}`);

      // Get executable path
      let executablePath = process.env.CHROME_EXECUTABLE_PATH || '';
      if (profile.fingerprint && typeof profile.fingerprint === 'object') {
        const fp = profile.fingerprint as any;
        if (fp.executablePath) {
          executablePath = fp.executablePath;
        }
      }

      // Default Chrome paths for Windows
      if (!executablePath) {
        const os = (await import('os')).default;
        const platform = os.platform();
        if (platform === 'win32') {
          executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
          if (!fs.existsSync(executablePath)) {
            executablePath = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
          }
        } else if (platform === 'darwin') {
          executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
        } else {
          executablePath = 'google-chrome';
        }
      }

      // Get proxy config
      let proxy: { host: string; port: number; username?: string; password?: string } | undefined = undefined;
      if (proxyId) {
        const proxyRecord = await prisma.proxy.findUnique({
          where: { id: Number(proxyId) },
        });
        if (proxyRecord && proxyRecord.active) {
          proxy = {
            host: proxyRecord.host,
            port: proxyRecord.port,
            username: proxyRecord.username || undefined,
            password: proxyRecord.password || undefined,
          };
        }
      }

      // Import and run profileStartProcessor (dùng path alias @worker/*)
      const profileStartProcessorPath = resolveWorkerPath('@worker/processors/profileStartProcessor');
      const profileStartProcessor = (await import(profileStartProcessorPath)).default;
      
      console.log(`🔄 [START] Starting profile ${profileId} with workflow ${profile.workflowId}`);
      
      // Process in background (don't await to avoid blocking)
      profileStartProcessor({
        data: {
          profileId: Number(profileId),
          executablePath,
          userDataDir,
          proxy,
          workflowId: Number(profile.workflowId),
          vars: vars || {},
        },
      }).then((_result: any) => {
        console.log(`✅ [START] Profile started successfully`);
      }).catch((err: any) => {
        console.error(`❌ [START] Failed to start profile:`, err?.message || err);
      });

      res.json({
        success: true,
        message: `Profile ${profileId} started with workflow ${profile.workflowId}. Browser should open shortly.`,
      });
    } else {
      // 3. NẾU KHÔNG CÓ WORKFLOW, CHỈ KHỞI CHẠY SESSION BÌNH THƯỜNG
      console.log('[START] Profile không có workflow nào được gán. Chỉ khởi chạy session bình thường.');
      
      const sessionService = await import('../services/sessionService');
      const session = await sessionService.createSession({
        profile_id: profileId,
        proxy_id: proxyId,
      });

      res.json({
        success: true,
        message: 'Session started successfully! Browser should open now.',
        data: session,
      });
    }
  } catch (error: any) {
    console.error(`[START] Lỗi nghiêm trọng khi chạy profile ${profileId}:`, error);
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

