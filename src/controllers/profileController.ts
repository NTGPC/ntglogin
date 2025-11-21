import { Request, Response } from 'express';
import * as profileService from '../services/profileService';
import { AppError, asyncHandler } from '../utils/errorHandler';
import { z } from 'zod'
import { getUniqueUA } from '../services/userAgentProvider'
import { randomUnique as randomMac } from '../services/macService'
import * as fpService from '../services/fingerprintService'
import prisma from '../prismaClient'

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
    // NEW V2.0: fingerprintPresetId (ưu tiên)
    fingerprintPresetId: z.union([z.number().int().positive(), z.string()]).transform((val) => {
      if (typeof val === 'string') {
        const num = parseInt(val, 10);
        return isNaN(num) ? undefined : num;
      }
      return val;
    }).optional(),
    webglMetadataMode: z.string().optional(), // NEW: Support webglMetadataMode
  // BACKWARD COMPATIBILITY: Các trường cũ (deprecated)
  user_agent: z.string().optional(),
  fingerprint: z.any().optional(),
  userAgent: z.string().optional(),
  os: z.string().optional(),
  osName: z.string().optional(),
  osArch: z.enum(['x86','x64','arm']).optional(),
  browserVersion: z.number().int().min(130).max(140).optional(),
  // === CLIENT HINTS (NEW) ===
  uaPlatform: z.string().optional(),
  uaPlatformVersion: z.string().optional(),
  uaFullVersion: z.string().optional(),
  uaMobile: z.boolean().optional(),
  // === DISPLAY (NEW) ===
  colorDepth: z.union([z.number().int().positive(), z.string()]).transform((val) => {
    if (typeof val === 'string') {
      const num = parseInt(val, 10);
      return isNaN(num) || num < 1 ? undefined : num;
    }
    return val;
  }).optional(),
  pixelRatio: z.union([z.number().positive(), z.string()]).transform((val) => {
    if (typeof val === 'string') {
      const num = parseFloat(val);
      return isNaN(num) || num < 0.1 ? undefined : num;
    }
    return val;
  }).optional(),
  screenWidth: z.union([z.number().int().positive(), z.string()]).transform((val) => {
    if (typeof val === 'string') {
      const num = parseInt(val, 10);
      return isNaN(num) || num < 1 ? undefined : num;
    }
    return val;
  }).optional(),
  screenHeight: z.union([z.number().int().positive(), z.string()]).transform((val) => {
    if (typeof val === 'string') {
      const num = parseInt(val, 10);
      return isNaN(num) || num < 1 ? undefined : num;
    }
    return val;
  }).optional(),
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
  geolocationLatitude: z.number().min(-90).max(90).optional(), // NEW: Alias for geoLatitude
  geolocationLongitude: z.number().min(-180).max(180).optional(), // NEW: Alias for geoLongitude
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

// ==========================================================
// === HÀM LÀM SẠCH VÀ CHUYỂN ĐỔI DỮ LIỆU ===
// ==========================================================
function sanitizeProfileData(body: any) {
  console.log('[SANITIZE] Dữ liệu gốc nhận từ frontend:', body);

  const sanitized = {
    // --- STRING FIELDS ---
    name: String(body.name || '').trim(),
    userAgent: String(body.userAgent || body.user_agent || '').trim(),
    os: String(body.os || body.osName || '').trim(),
    osName: String(body.osName || body.os || '').trim(),
    osArch: String(body.osArch || 'x64').trim(),
    platform: String(body.platform || 'Win32').trim(),
    webglRenderer: body.webglRenderer ? String(body.webglRenderer).trim() : null,
    webglVendor: body.webglVendor ? String(body.webglVendor).trim() : null,
    macAddress: body.macAddress ? String(body.macAddress).trim() : null,
    notes: body.notes ? String(body.notes).trim() : null,
    timezone: String(body.timezone || body.timezoneId || 'Europe/London').trim(),
    timezoneId: String(body.timezone || body.timezoneId || 'Europe/London').trim(),
    language: String(body.language || 'en-US').trim(),
    
    // === CLIENT HINTS (NEW) ===
    uaPlatform: body.uaPlatform ? String(body.uaPlatform).trim() : null,
    uaPlatformVersion: body.uaPlatformVersion ? String(body.uaPlatformVersion).trim() : null,
    uaFullVersion: body.uaFullVersion ? String(body.uaFullVersion).trim() : null,
    uaMobile: body.uaMobile ?? false,

    // --- INTEGER FIELDS - Chuyển đổi an toàn với giá trị mặc định ---
    hardwareConcurrency: (() => {
      const value = body.hardwareConcurrency;
      if (value === undefined || value === null || value === '') return 8;
      const parsed = parseInt(String(value), 10);
      return isNaN(parsed) || parsed < 1 ? 8 : parsed;
    })(),
    deviceMemory: (() => {
      const value = body.deviceMemory;
      if (value === undefined || value === null || value === '') return 8;
      const parsed = parseInt(String(value), 10);
      return isNaN(parsed) || parsed < 1 ? 8 : parsed;
    })(),
    screenWidth: (() => {
      const value = body.screenWidth;
      if (value === undefined || value === null || value === '') return 1920;
      const parsed = parseInt(String(value), 10);
      return isNaN(parsed) || parsed < 1 ? 1920 : parsed;
    })(),
    screenHeight: (() => {
      const value = body.screenHeight;
      if (value === undefined || value === null || value === '') return 1080;
      const parsed = parseInt(String(value), 10);
      return isNaN(parsed) || parsed < 1 ? 1080 : parsed;
    })(),
    browserVersion: (() => {
      const value = body.browserVersion;
      if (value === undefined || value === null || value === '') return null;
      const parsed = parseInt(String(value), 10);
      return isNaN(parsed) ? null : parsed;
    })(),
    
    // === DISPLAY (NEW) ===
    colorDepth: (() => {
      const value = body.colorDepth;
      if (value === undefined || value === null || value === '') return 24;
      const parsed = parseInt(String(value), 10);
      return isNaN(parsed) || parsed < 1 ? 24 : parsed;
    })(),
    pixelRatio: (() => {
      const value = body.pixelRatio;
      if (value === undefined || value === null || value === '') return 1.0;
      const parsed = parseFloat(String(value));
      return isNaN(parsed) || parsed < 0.1 ? 1.0 : parsed;
    })(),

    // --- ARRAY FIELDS - Chuyển đổi từ string hoặc array ---
    languages: (() => {
      if (Array.isArray(body.languages) && body.languages.length > 0) {
        return body.languages.map((lang: any) => String(lang).trim()).filter((lang: string) => lang.length > 0);
      }
      if (typeof body.languages === 'string' && body.languages.trim()) {
        return body.languages.split(',').map((lang: string) => lang.trim()).filter((lang: string) => lang.length > 0);
      }
      if (body.language) {
        return [String(body.language).trim()];
      }
      return ['en-US', 'en'];
    })(),

    // --- STRING MODE FIELDS ---
    canvasMode: String(body.canvasMode || body.canvas || 'noise').trim(),
    clientRectsMode: body.clientRectsMode || body.clientRects || null,
    audioContextMode: String(body.audioContextMode || body.audioCtxMode || body.audioContext || 'noise').trim(),
    webglImageMode: body.webglImageMode || body.webglImage || null,
    webglMetaMode: body.webglMetaMode || body.webglMetadata || null,
    webrtcMode: String(body.webrtcMode || (body.webrtcMainIP ? 'fake' : 'off')).trim(),
    geolocationMode: String(body.geolocationMode || (body.geoEnabled ? 'fake' : 'off')).trim(),

    // --- BOOLEAN/NUMBER FIELDS ---
    webrtcMainIP: body.webrtcMainIP ?? body.webrtcMainIp ?? false,
    // geoEnabled được map sang geolocationEnabled (schema field)
    geolocationEnabled: body.geoEnabled ?? body.geolocationEnabled ?? (body.geolocationMode === 'fake'),
    geoLatitude: body.geoLatitude || body.geolocationLatitude ? parseFloat(String(body.geoLatitude || body.geolocationLatitude)) : null,
    geoLongitude: body.geoLongitude || body.geolocationLongitude ? parseFloat(String(body.geoLongitude || body.geolocationLongitude)) : null,
    geolocationLatitude: body.geolocationLatitude || body.geoLatitude ? parseFloat(String(body.geolocationLatitude || body.geoLatitude)) : null,
    geolocationLongitude: body.geolocationLongitude || body.geoLongitude ? parseFloat(String(body.geolocationLongitude || body.geoLongitude)) : null,

    // --- RELATION FIELDS - NEW: Library IDs ---
    userAgentId: (() => {
      const value = body.userAgentId;
      if (!value) return null;
      const parsed = parseInt(String(value), 10);
      return isNaN(parsed) ? null : parsed;
    })(),
    webglRendererId: (() => {
      const value = body.webglRendererId;
      if (!value) return null;
      const parsed = parseInt(String(value), 10);
      return isNaN(parsed) ? null : parsed;
    })(),
    proxyId: (() => {
      const value = body.proxyId || body.proxyRefId;
      if (!value) return null;
      const parsed = parseInt(String(value), 10);
      return isNaN(parsed) ? null : parsed;
    })(),
    proxyRefId: body.proxyRefId || null,
    proxyManual: body.proxyManual || null,
    // NEW V2.0: fingerprintPresetId
    fingerprintPresetId: (() => {
      const value = body.fingerprintPresetId;
      if (!value) return undefined;
      if (typeof value === 'number') return value;
      const parsed = parseInt(String(value), 10);
      return isNaN(parsed) ? undefined : parsed;
    })(),
    webglMetadataMode: body.webglMetadataMode || body.webglMetaMode || null,
  };

  console.log('[SANITIZE] Dữ liệu đã được làm sạch:', JSON.stringify(sanitized, null, 2));
  return sanitized;
}

export const create = asyncHandler(async (req: Request, res: Response) => {
  try {
    console.log('================================');
    console.log(`[CREATE] Nhận yêu cầu tạo profile mới`);
    console.log(`[CREATE] Raw body:`, JSON.stringify(req.body, null, 2));
    
    const parsed = createSchema.safeParse(req.body)
    if (!parsed.success) {
      console.error(`[CREATE] ❌ Validation error:`, JSON.stringify(parsed.error.issues, null, 2));
      throw new AppError(`Validation error: ${parsed.error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')}`, 400)
    }
    const body = parsed.data

    console.log(`[CREATE] ✅ Validation passed`);
    console.log(`[CREATE] Dữ liệu sau validation:`, JSON.stringify(body, null, 2));
    console.log('================================');

    // ==========================================================
    // === LÀM SẠCH VÀ CHUYỂN ĐỔI DỮ LIỆU ===
    // ==========================================================
    const cleanData = sanitizeProfileData(body);

    if (!cleanData.name) {
      throw new AppError('Name is required', 400);
    }

    // ==========================================================
    // === NEW V2.0: XỬ LÝ FINGERPRINT PRESET (ƯU TIÊN CAO NHẤT) ===
    // ==========================================================
    let presetData: any = null;
    if (cleanData.fingerprintPresetId) {
      try {
        presetData = await prisma.fingerprintPreset.findUnique({
          where: { id: cleanData.fingerprintPresetId },
        });
        if (presetData) {
          console.log(`[CREATE] ✅ Loaded Fingerprint Preset: ${presetData.name}`);
          // Merge preset data vào cleanData (preset là base, body override)
          Object.assign(cleanData, {
            userAgent: cleanData.userAgent || presetData.userAgent,
            platform: cleanData.platform || presetData.platform,
            uaPlatform: cleanData.uaPlatform || presetData.uaPlatform,
            uaPlatformVersion: cleanData.uaPlatformVersion || presetData.uaPlatformVersion,
            uaFullVersion: cleanData.uaFullVersion || presetData.uaFullVersion,
            uaMobile: cleanData.uaMobile ?? presetData.uaMobile,
            browserVersion: cleanData.browserVersion || presetData.browserVersion,
            hardwareConcurrency: cleanData.hardwareConcurrency || presetData.hardwareConcurrency,
            deviceMemory: cleanData.deviceMemory || presetData.deviceMemory,
            webglVendor: cleanData.webglVendor || presetData.webglVendor,
            webglRenderer: cleanData.webglRenderer || presetData.webglRenderer,
            screenWidth: cleanData.screenWidth || presetData.screenWidth,
            screenHeight: cleanData.screenHeight || presetData.screenHeight,
            colorDepth: cleanData.colorDepth || presetData.colorDepth,
            pixelRatio: cleanData.pixelRatio || presetData.pixelRatio,
            languages: cleanData.languages || presetData.languages,
            timezone: cleanData.timezone || presetData.timezone,
            canvasMode: cleanData.canvasMode || presetData.canvasMode,
            audioContextMode: cleanData.audioContextMode || presetData.audioContextMode,
            webglMetadataMode: cleanData.webglMetadataMode || presetData.webglMetadataMode || presetData.webglMetaMode,
            webrtcMode: cleanData.webrtcMode || presetData.webrtcMode,
            geolocationMode: cleanData.geolocationMode || presetData.geolocationMode,
            geolocationLatitude: cleanData.geolocationLatitude || presetData.geolocationLatitude,
            geolocationLongitude: cleanData.geolocationLongitude || presetData.geolocationLongitude,
            osName: cleanData.osName || presetData.os,
            os: cleanData.os || presetData.os,
          });
        } else {
          console.warn(`[CREATE] ⚠️ Fingerprint Preset ID ${cleanData.fingerprintPresetId} not found`);
        }
      } catch (error) {
        console.warn(`[CREATE] ⚠️ Failed to load Fingerprint Preset:`, error);
      }
    }

    // ==========================================================
    // === GENERATE CÁC GIÁ TRỊ MẶC ĐỊNH NẾU THIẾU ===
    // ==========================================================
    // NEW: Ưu tiên sử dụng userAgentId từ library, fallback về userAgent text (backward compatible)
    let userAgentToUse = cleanData.userAgent;
    let userAgentIdToUse: number | null = cleanData.userAgentId;
    
    if (userAgentIdToUse) {
      // Nếu có userAgentId, lấy value từ database
      try {
        const userAgentRecord = await prisma.userAgent.findUnique({
          where: { id: userAgentIdToUse },
        });
        if (userAgentRecord) {
          userAgentToUse = userAgentRecord.value;
          console.log(`[CREATE] Sử dụng UserAgent từ library (ID: ${userAgentIdToUse}):`, userAgentToUse);
        } else {
          console.warn(`[CREATE] UserAgent ID ${userAgentIdToUse} không tồn tại, sẽ dùng text hoặc generate mới`);
          userAgentIdToUse = null;
        }
      } catch (error) {
        console.warn(`[CREATE] Lỗi khi lấy UserAgent từ library:`, error);
        userAgentIdToUse = null;
      }
    }
    
    if (!userAgentToUse && !userAgentIdToUse) {
      userAgentToUse = await getUniqueUA({ 
        browser: 'chrome', 
        versionHint: cleanData.browserVersion || undefined, 
        os: cleanData.os || 'Windows 10' 
      });
      console.log(`[CREATE] Không có UA trong body, đã generate mới:`, userAgentToUse);
    }
    
    // NEW: Tương tự cho WebGL Renderer
    let webglRendererToUse: string | null = cleanData.webglRenderer;
    let webglVendorToUse: string | null = cleanData.webglVendor;
    let webglRendererIdToUse: number | null = cleanData.webglRendererId;
    
    if (webglRendererIdToUse) {
      // Nếu có webglRendererId, lấy vendor và renderer từ database
      try {
        const webglRecord = await prisma.webglRenderer.findUnique({
          where: { id: webglRendererIdToUse },
        });
        if (webglRecord) {
          webglRendererToUse = webglRecord.renderer;
          webglVendorToUse = webglRecord.vendor;
          console.log(`[CREATE] Sử dụng WebGL Renderer từ library (ID: ${webglRendererIdToUse}):`, webglRendererToUse);
        } else {
          console.warn(`[CREATE] WebGL Renderer ID ${webglRendererIdToUse} không tồn tại, sẽ dùng text`);
          webglRendererIdToUse = null;
        }
      } catch (error) {
        console.warn(`[CREATE] Lỗi khi lấy WebGL Renderer từ library:`, error);
        webglRendererIdToUse = null;
      }
    }

    let macToUse = cleanData.macAddress;
    if (!macToUse) {
      macToUse = await randomMac();
      console.log(`[CREATE] Không có MAC trong body, đã generate mới:`, macToUse);
    }

    // ==========================================================
    // === BUILD FINGERPRINT ===
    // ==========================================================
    const bodyAny = body as any;
    const tempSeed = Date.now() % 1000000;
    const fp = bodyAny.fingerprintJson 
      ? JSON.parse(typeof bodyAny.fingerprintJson === 'string' ? bodyAny.fingerprintJson : JSON.stringify(bodyAny.fingerprintJson))
      : fpService.build({
          osName: cleanData.osName as any,
          osArch: cleanData.osArch as any,
          browserVersion: cleanData.browserVersion || 136,
          screenWidth: cleanData.screenWidth,
          screenHeight: cleanData.screenHeight,
          canvasMode: cleanData.canvasMode === 'noise' ? 'Noise' : cleanData.canvasMode === 'off' ? 'Off' : 'Noise',
          clientRectsMode: cleanData.clientRectsMode === 'noise' ? 'Noise' : 'Off',
          audioCtxMode: cleanData.audioContextMode === 'noise' ? 'Noise' : 'Off',
          webglImageMode: cleanData.webglImageMode === 'noise' ? 'Noise' : 'Off',
          webglMetaMode: cleanData.webglMetaMode === 'mask' ? 'Mask' : 'Real',
          geolocationEnabled: cleanData.geolocationEnabled ?? (cleanData.geolocationMode === 'fake'),
          geoLatitude: cleanData.geoLatitude,
          geoLongitude: cleanData.geoLongitude,
          webrtcMainIP: cleanData.webrtcMainIP ?? false,
          proxyRefId: cleanData.proxyRefId ?? null,
          proxyManual: cleanData.proxyManual ?? null,
          ua: userAgentToUse,
          mac: macToUse,
          timezoneId: cleanData.timezone,
          language: cleanData.language,
          hardwareConcurrency: cleanData.hardwareConcurrency,
          deviceMemory: cleanData.deviceMemory,
          seed: tempSeed,
        } as any);

    // ==========================================================
    // === TẠO PROFILE VỚI DỮ LIỆU ĐÃ LÀM SẠCH ===
    // ==========================================================
    console.log(`[CREATE] Đang tạo profile với dữ liệu đã làm sạch...`);
    console.log(`[CREATE] hardwareConcurrency:`, cleanData.hardwareConcurrency, typeof cleanData.hardwareConcurrency);
    console.log(`[CREATE] deviceMemory:`, cleanData.deviceMemory, typeof cleanData.deviceMemory);
    console.log(`[CREATE] screenWidth:`, cleanData.screenWidth, typeof cleanData.screenWidth);
    console.log(`[CREATE] screenHeight:`, cleanData.screenHeight, typeof cleanData.screenHeight);
    console.log(`[CREATE] languages:`, cleanData.languages, Array.isArray(cleanData.languages));
    
    // Loại bỏ 'id', 'geoEnabled', 'geoLatitude', 'geoLongitude' nếu có trong cleanData (phòng thủ)
    // Chỉ giữ lại geolocationLatitude và geolocationLongitude (tên đúng trong schema)
    const { id: _id, geoEnabled: _geoEnabled, geoLatitude: _geoLatitude, geoLongitude: _geoLongitude, ...dataToCreate } = cleanData as any;
    console.log(`[CREATE] Dữ liệu sạch để TẠO MỚI (đã loại bỏ id và geoEnabled):`, JSON.stringify(dataToCreate, null, 2));
    
    // ==========================================================
    // === ĐẢM BẢO CÁC TRƯỜNG BẮT BUỘC ĐƯỢC CUNG CẤP ===
    // ==========================================================
    // Các trường bắt buộc trong schema (không có default):
    // - name: String (đã validate ở trên)
    // Các trường có default trong schema (Prisma sẽ tự set nếu không có):
    // - platform: String @default("Win32")
    // - hardwareConcurrency: Int @default(8)
    // - deviceMemory: Int @default(8)
    // - languages: String[] @default(["en-US", "en"])
    // - canvasMode: String @default("noise")
    // - audioContextMode: String @default("noise")
    // - webrtcMode: String @default("fake")
    // - geolocationMode: String @default("fake")
    
    const profile = await profileService.createProfile({
      // Trường bắt buộc
      name: cleanData.name, // Đã validate ở trên
      
      // NEW V2.0: Link với Fingerprint Preset nếu có
      ...(cleanData.fingerprintPresetId ? { fingerprintPresetId: cleanData.fingerprintPresetId } : {}),
      
      // Các trường đã được sanitize với default values
      platform: cleanData.platform || 'Win32',
      hardwareConcurrency: cleanData.hardwareConcurrency || 8,
      deviceMemory: cleanData.deviceMemory || 8,
      languages: cleanData.languages || ['en-US', 'en'],
      canvasMode: cleanData.canvasMode || 'noise',
      audioContextMode: cleanData.audioContextMode || 'noise',
      webrtcMode: cleanData.webrtcMode || 'fake',
      geolocationMode: cleanData.geolocationMode || 'fake',
      
      // NEW: Sử dụng ID từ library nếu có, fallback về text (backward compatible)
      ...(userAgentIdToUse ? { userAgentId: userAgentIdToUse } : {}),
      ...(webglRendererIdToUse ? { webglRendererId: webglRendererIdToUse } : {}),
      
      // BACKWARD COMPATIBILITY: Giữ các trường text cũ
      user_agent: userAgentToUse,
      userAgent: userAgentToUse,
      webglRenderer: webglRendererToUse,
      webglVendor: webglVendorToUse,
      
      // Các trường từ dataToCreate (đã được sanitize và loại bỏ geoEnabled)
      ...dataToCreate,
      
      // Override với các giá trị đã generate
      macAddress: macToUse,
      fingerprint: fp,
      fingerprintJson: fp,
      ...(cleanData.proxyId && { proxyId: cleanData.proxyId }),
    } as any)

  // Update fingerprint with actual profileId as seed for deterministic noise
  const finalFp = {
    ...fp,
    profileId: profile.id,
    seed: profile.id,
  }
  
  // Loại bỏ 'id' nếu có trong finalFp (phòng thủ)
  const { id: ___id, ...cleanFp } = finalFp as any;
  await profileService.updateProfile(profile.id, {
    fingerprint: cleanFp,
    fingerprintJson: cleanFp,
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
  
  // ==========================================================
  // === LOẠI BỎ 'id' NGAY TỪ ĐẦU ===
  // ==========================================================
  const { id: _bodyId, ...bodyWithoutId } = req.body; // Loại bỏ 'id' khỏi body ngay lập tức
  const body = bodyWithoutId;

  console.log('================================');
  console.log(`[UPDATE] Nhận yêu cầu cập nhật cho Profile ID: ${id}`);
  console.log(`[UPDATE] Dữ liệu nhận được từ body (đã loại bỏ id):`, JSON.stringify(body, null, 2));
  console.log('================================');

  try {
    // ==========================================================
    // === LÀM SẠCH VÀ CHUYỂN ĐỔI DỮ LIỆU ===
    // ==========================================================
    const cleanData = sanitizeProfileData(body);
    console.log(`[UPDATE] Dữ liệu đã được làm sạch:`, JSON.stringify(cleanData, null, 2));
    
    // ==========================================================
    // === NEW V2.0: XỬ LÝ FINGERPRINT PRESET (ƯU TIÊN CAO NHẤT) ===
    // ==========================================================
    let presetData: any = null;
    if (cleanData.fingerprintPresetId) {
      try {
        presetData = await prisma.fingerprintPreset.findUnique({
          where: { id: cleanData.fingerprintPresetId },
        });
        if (presetData) {
          console.log(`[UPDATE] ✅ Loaded Fingerprint Preset: ${presetData.name}`);
          // Merge preset data vào cleanData (preset là base, body override)
          Object.assign(cleanData, {
            userAgent: cleanData.userAgent || presetData.userAgent,
            platform: cleanData.platform || presetData.platform,
            uaPlatform: cleanData.uaPlatform || presetData.uaPlatform,
            uaPlatformVersion: cleanData.uaPlatformVersion || presetData.uaPlatformVersion,
            uaFullVersion: cleanData.uaFullVersion || presetData.uaFullVersion,
            uaMobile: cleanData.uaMobile ?? presetData.uaMobile,
            browserVersion: cleanData.browserVersion || presetData.browserVersion,
            hardwareConcurrency: cleanData.hardwareConcurrency || presetData.hardwareConcurrency,
            deviceMemory: cleanData.deviceMemory || presetData.deviceMemory,
            webglVendor: cleanData.webglVendor || presetData.webglVendor,
            webglRenderer: cleanData.webglRenderer || presetData.webglRenderer,
            screenWidth: cleanData.screenWidth || presetData.screenWidth,
            screenHeight: cleanData.screenHeight || presetData.screenHeight,
            colorDepth: cleanData.colorDepth || presetData.colorDepth,
            pixelRatio: cleanData.pixelRatio || presetData.pixelRatio,
            languages: cleanData.languages || presetData.languages,
            timezone: cleanData.timezone || presetData.timezone,
            canvasMode: cleanData.canvasMode || presetData.canvasMode,
            audioContextMode: cleanData.audioContextMode || presetData.audioContextMode,
            webglMetadataMode: cleanData.webglMetadataMode || presetData.webglMetadataMode || presetData.webglMetaMode,
            webrtcMode: cleanData.webrtcMode || presetData.webrtcMode,
            geolocationMode: cleanData.geolocationMode || presetData.geolocationMode,
            geolocationLatitude: cleanData.geolocationLatitude || presetData.geolocationLatitude,
            geolocationLongitude: cleanData.geolocationLongitude || presetData.geolocationLongitude,
            osName: cleanData.osName || presetData.os,
            os: cleanData.os || presetData.os,
          });
        } else {
          console.warn(`[UPDATE] ⚠️ Fingerprint Preset ID ${cleanData.fingerprintPresetId} not found`);
        }
      } catch (error) {
        console.warn(`[UPDATE] ⚠️ Failed to load Fingerprint Preset:`, error);
      }
    }

    // ==========================================================
    // === XÂY DỰNG OBJECT CẬP NHẬT ===
    // ==========================================================
    const dataToUpdate: any = {};

    // NEW V2.0: Update fingerprintPresetId if provided
    if (cleanData.fingerprintPresetId !== undefined) {
      dataToUpdate.fingerprintPresetId = cleanData.fingerprintPresetId;
    }

    // Chỉ cập nhật các trường có trong cleanData (không undefined)
    if (cleanData.name !== undefined && cleanData.name !== '') {
      dataToUpdate.name = cleanData.name;
    }
    if (cleanData.userAgent !== undefined && cleanData.userAgent !== '') {
      dataToUpdate.userAgent = cleanData.userAgent;
      dataToUpdate.user_agent = cleanData.userAgent;
    }
    if (cleanData.os !== undefined && cleanData.os !== '') {
      dataToUpdate.os = cleanData.os;
      dataToUpdate.osName = cleanData.osName;
    }
    if (cleanData.osArch !== undefined && cleanData.osArch !== '') {
      dataToUpdate.osArch = cleanData.osArch;
    }
    if (cleanData.screenWidth !== undefined) {
      dataToUpdate.screenWidth = cleanData.screenWidth;
    }
    if (cleanData.screenHeight !== undefined) {
      dataToUpdate.screenHeight = cleanData.screenHeight;
    }
    if (cleanData.browserVersion !== undefined && cleanData.browserVersion !== null) {
      dataToUpdate.browserVersion = cleanData.browserVersion;
    }
    if (cleanData.canvasMode !== undefined && cleanData.canvasMode !== '') {
      dataToUpdate.canvasMode = cleanData.canvasMode;
    }
    if (cleanData.clientRectsMode !== undefined && cleanData.clientRectsMode !== null) {
      dataToUpdate.clientRectsMode = cleanData.clientRectsMode;
    }
    if (cleanData.audioContextMode !== undefined && cleanData.audioContextMode !== '') {
      dataToUpdate.audioCtxMode = cleanData.audioContextMode;
      dataToUpdate.audioContextMode = cleanData.audioContextMode;
    }
    if (cleanData.webglImageMode !== undefined && cleanData.webglImageMode !== null) {
      dataToUpdate.webglImageMode = cleanData.webglImageMode;
    }
    if (cleanData.webglMetaMode !== undefined && cleanData.webglMetaMode !== null) {
      dataToUpdate.webglMetaMode = cleanData.webglMetaMode;
    }
    // NEW: Hỗ trợ cả webglRendererId (library) và webglRenderer (text)
    if (cleanData.webglRendererId !== undefined && cleanData.webglRendererId !== null) {
      dataToUpdate.webglRendererId = cleanData.webglRendererId;
      // Lấy vendor và renderer từ library để đồng bộ
      try {
        const webglRecord = await prisma.webglRenderer.findUnique({
          where: { id: cleanData.webglRendererId },
        });
        if (webglRecord) {
          dataToUpdate.webglRenderer = webglRecord.renderer;
          dataToUpdate.webglVendor = webglRecord.vendor;
        }
      } catch (error) {
        console.warn(`[UPDATE] Lỗi khi lấy WebGL Renderer từ library:`, error);
      }
    } else if (cleanData.webglRenderer !== undefined && cleanData.webglRenderer !== null) {
      // BACKWARD COMPATIBILITY: Giữ logic cũ
      dataToUpdate.webglRenderer = cleanData.webglRenderer;
    }
    if (cleanData.webglVendor !== undefined && cleanData.webglVendor !== null) {
      dataToUpdate.webglVendor = cleanData.webglVendor;
    }
    if (cleanData.geolocationEnabled !== undefined) {
      dataToUpdate.geolocationEnabled = cleanData.geolocationEnabled;
    }
    if (cleanData.geolocationLatitude !== undefined && cleanData.geolocationLatitude !== null) {
      dataToUpdate.geolocationLatitude = cleanData.geolocationLatitude;
    }
    if (cleanData.geolocationLongitude !== undefined && cleanData.geolocationLongitude !== null) {
      dataToUpdate.geolocationLongitude = cleanData.geolocationLongitude;
    }
    if (cleanData.webrtcMainIP !== undefined) {
      dataToUpdate.webrtcMainIP = cleanData.webrtcMainIP;
    }
    if (cleanData.hardwareConcurrency !== undefined) {
      dataToUpdate.hardwareConcurrency = cleanData.hardwareConcurrency;
    }
    if (cleanData.deviceMemory !== undefined) {
      dataToUpdate.deviceMemory = cleanData.deviceMemory;
    }
    if (cleanData.languages !== undefined && Array.isArray(cleanData.languages)) {
      dataToUpdate.languages = cleanData.languages;
    }
    if (cleanData.language !== undefined && cleanData.language !== '') {
      dataToUpdate.language = cleanData.language;
    }
    if (cleanData.timezone !== undefined && cleanData.timezone !== '') {
      dataToUpdate.timezone = cleanData.timezone;
      dataToUpdate.timezoneId = cleanData.timezone;
    }
    if (cleanData.macAddress !== undefined && cleanData.macAddress !== null) {
      dataToUpdate.macAddress = cleanData.macAddress;
    }
    if (cleanData.platform !== undefined && cleanData.platform !== '') {
      dataToUpdate.platform = cleanData.platform;
    }
    if (cleanData.notes !== undefined) {
      dataToUpdate.notes = cleanData.notes;
    }
    if (cleanData.proxyId !== undefined && cleanData.proxyId !== null) {
      dataToUpdate.proxyId = cleanData.proxyId;
    }
    if (cleanData.proxyRefId !== undefined && cleanData.proxyRefId !== null) {
      dataToUpdate.proxyRefId = cleanData.proxyRefId;
    }
    if (cleanData.proxyManual !== undefined && cleanData.proxyManual !== null) {
      dataToUpdate.proxyManual = cleanData.proxyManual;
    }
    
    // === WORKFLOW ID (giữ nguyên logic cũ) ===
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

    // 4. LOẠI BỎ 'id' MỘT LẦN NỮA ĐỂ ĐẢM BẢO AN TOÀN
    const { id: __id, ...finalDataToUpdate } = dataToUpdate as any;
    console.log(`[UPDATE] Dữ liệu sạch để CẬP NHẬT profile ${id} (đã loại bỏ id):`, JSON.stringify(finalDataToUpdate, null, 2));
    
    // 5. THỰC THI LỆNH UPDATE VỚI DỮ LIỆU ĐÃ ĐƯỢC XÂY DỰNG VÀ LÀM SẠCH
    const updatedProfile = await prisma.profile.update({
      where: { id: parseInt(id, 10) }, // Đảm bảo ID là number
      data: finalDataToUpdate, // Chỉ cập nhật những gì có trong object này (đã loại bỏ id)
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
  const { id: _fpId, ...fp } = req.body; // Loại bỏ 'id' nếu có
  const updated = await profileService.updateProfile(id, { fingerprint: fp });
  res.json({ success: true, data: updated.fingerprint });
});

