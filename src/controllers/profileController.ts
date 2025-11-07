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
  const id = parseInt(req.params.id);
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

  const currentProfile = await profileService.getProfileById(id)
  if (!currentProfile) {
    throw new AppError('Profile not found', 404)
  }

  let finalUA = userAgent || user_agent || currentProfile.user_agent
  if (finalUA && finalUA !== currentProfile.user_agent) {
    try {
      const existing = await prisma.$queryRaw`SELECT id FROM profiles WHERE "userAgent" = ${finalUA} AND id != ${id} LIMIT 1` as any[]
      if (existing && existing.length > 0) {
        finalUA = await getUniqueUA({ browser: 'chrome', versionHint: browserVersion, os: osName || 'Windows 10' })
      }
    } catch {}
  }

  let finalMAC = macAddress || currentProfile.macAddress
  if (finalMAC && finalMAC !== currentProfile.macAddress) {
    try {
      const exists = await prisma.$queryRaw`SELECT id FROM profiles WHERE "macAddress" = ${finalMAC} AND id != ${id} LIMIT 1` as any[]
      if (exists && exists.length > 0) {
        finalMAC = await randomMac()
      }
    } catch {}
  }

  const fp = fingerprintJson || fingerprint || (osName || canvasMode || clientRectsMode ? fpService.build({
    osName: osName as any || currentProfile.osName,
    osArch: (osArch as any) || currentProfile.osArch || 'x64',
    browserVersion: browserVersion || currentProfile.browserVersion || 136,
    screenWidth: screenWidth ?? currentProfile.screenWidth ?? 1920,
    screenHeight: screenHeight ?? currentProfile.screenHeight ?? 1080,
    canvasMode: (canvasMode || currentProfile.canvasMode || 'Noise') as 'Noise' | 'Off' | 'Block',
    clientRectsMode: (clientRectsMode || currentProfile.clientRectsMode || 'Off') as 'Off' | 'Noise',
    audioCtxMode: (audioCtxMode || currentProfile.audioCtxMode || 'Off') as 'Off' | 'Noise',
    webglImageMode: (webglImageMode || currentProfile.webglImageMode || 'Off') as 'Off' | 'Noise',
    webglMetaMode: (webglMetaMode || currentProfile.webglMetaMode || 'Mask') as 'Mask' | 'Real',
    geoEnabled: geoEnabled ?? currentProfile.geoEnabled ?? false,
    geoLatitude: geoLatitude ?? (currentProfile as any).geoLatitude,
    geoLongitude: geoLongitude ?? (currentProfile as any).geoLongitude,
    webrtcMainIP: webrtcMainIP ?? currentProfile.webrtcMainIP ?? false,
    proxyRefId: proxyRefId ?? currentProfile.proxyRefId ?? null,
    proxyManual: proxyManual ?? (currentProfile.proxyManual as any) ?? null,
    ua: finalUA || currentProfile.user_agent || '',
    mac: finalMAC || currentProfile.macAddress || '',
    timezoneId: timezoneId ?? (currentProfile as any).timezoneId,
    language: language ?? (currentProfile as any).language,
    hardwareConcurrency: hardwareConcurrency ?? (currentProfile as any).hardwareConcurrency,
    deviceMemory: deviceMemory ?? (currentProfile as any).deviceMemory,
    profileId: id,
    seed: id,
  }) : undefined)

  const updateData: any = {}
  if (name) updateData.name = name
  if (finalUA) {
    updateData.user_agent = finalUA
    updateData.userAgent = finalUA
  }
  if (fp) {
    updateData.fingerprint = fp
    updateData.fingerprintJson = fp
  }
  if (osName !== undefined) updateData.osName = osName
  if (osArch !== undefined) updateData.osArch = osArch
  if (browserVersion !== undefined) updateData.browserVersion = browserVersion
  if (screenWidth !== undefined) updateData.screenWidth = screenWidth
  if (screenHeight !== undefined) updateData.screenHeight = screenHeight
  if (canvasMode !== undefined) updateData.canvasMode = canvasMode
  if (clientRectsMode !== undefined) updateData.clientRectsMode = clientRectsMode
  if (audioCtxMode !== undefined) updateData.audioCtxMode = audioCtxMode
  if (webglImageMode !== undefined) updateData.webglImageMode = webglImageMode
  if (webglMetaMode !== undefined) updateData.webglMetaMode = webglMetaMode
  if (geoEnabled !== undefined) updateData.geoEnabled = geoEnabled
  if (geoLatitude !== undefined) updateData.geoLatitude = geoLatitude
  if (geoLongitude !== undefined) updateData.geoLongitude = geoLongitude
  if (webrtcMainIP !== undefined) updateData.webrtcMainIP = webrtcMainIP
  if (proxyRefId !== undefined) updateData.proxyRefId = proxyRefId
  if (proxyManual !== undefined) updateData.proxyManual = proxyManual
  if (finalMAC) updateData.macAddress = finalMAC
  if (timezoneId !== undefined) updateData.timezoneId = timezoneId
  if (language !== undefined) updateData.language = language
  if (hardwareConcurrency !== undefined) updateData.hardwareConcurrency = hardwareConcurrency
  if (deviceMemory !== undefined) updateData.deviceMemory = deviceMemory

  const profile = await profileService.updateProfile(id, updateData)

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: profile,
  });
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

