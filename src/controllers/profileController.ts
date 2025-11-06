import { Request, Response, NextFunction } from 'express';
import * as profileService from '../services/profileService';
import { AppError, asyncHandler } from '../utils/errorHandler';
import { z } from 'zod'
import { randomUnique as randomUA } from '../services/userAgentService'
import { getUniqueUA } from '../services/userAgentProvider'
import { randomUnique as randomMac } from '../services/macService'
import * as fpService from '../services/fingerprintService'

export const getAll = asyncHandler(async (req: Request, res: Response) => {
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
  osArch: z.enum(['x86','x64']).optional(),
  browserVersion: z.number().int().min(130).max(140).optional(),
  screenWidth: z.number().int().optional(),
  screenHeight: z.number().int().optional(),
  canvasMode: z.enum(['Noise','Off','Block']).optional(),
  clientRectsMode: z.enum(['Off','Noise']).optional(),
  audioCtxMode: z.enum(['Off','Noise']).optional(),
  webglImageMode: z.enum(['Off','Noise']).optional(),
  webglMetaMode: z.enum(['Mask','Real']).optional(),
  geoEnabled: z.boolean().optional(),
  webrtcMainIP: z.boolean().optional(),
  proxyRefId: z.string().optional(),
  proxyManual: z.any().optional(),
  macAddress: z.string().regex(/^([0-9a-fA-F]{2}:){5}[0-9a-fA-F]{2}$/).optional(),
  fingerprintJson: z.any().optional(),
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
    geoEnabled, webrtcMainIP, proxyRefId, proxyManual, macAddress, fingerprintJson
  } = parsed.data

  if (!name) {
    throw new AppError('Name is required', 400);
  }

  // Decide UA & MAC
  const finalUA = userAgent || user_agent || await getUniqueUA({ browser: 'chrome', versionHint: browserVersion, os: osName || 'Windows 10' })
  const finalMAC = macAddress || await randomMac()

  // Build fingerprint if client didn't provide override
  const fp = fingerprintJson || fingerprint || fpService.build({
    osName: osName as any,
    osArch: (osArch as any) || 'x64',
    browserVersion: browserVersion || 136,
    screenWidth: screenWidth ?? (osName?.startsWith('macOS') ? 1920 : 1920),
    screenHeight: screenHeight ?? (osName?.startsWith('macOS') ? 1200 : 1080),
    canvasMode: canvasMode || 'Noise',
    clientRectsMode: clientRectsMode || 'Off',
    audioCtxMode: audioCtxMode || 'Off',
    webglImageMode: webglImageMode || 'Off',
    webglMetaMode: webglMetaMode || 'Mask',
    geoEnabled: geoEnabled || false,
    webrtcMainIP: webrtcMainIP || false,
    proxyRefId: proxyRefId ?? null,
    proxyManual: proxyManual ?? null,
    ua: finalUA,
    mac: finalMAC,
  })

  const profile = await profileService.createProfile({
    name,
    user_agent: finalUA,
    fingerprint: fp,
    userAgent: finalUA,
    osName, osArch, browserVersion, screenWidth, screenHeight,
    canvasMode, clientRectsMode, audioCtxMode, webglImageMode, webglMetaMode,
    geoEnabled, webrtcMainIP, proxyRefId, proxyManual, macAddress: finalMAC,
    fingerprintJson: fp,
  } as any);

  res.status(201).json({
    success: true,
    message: 'Profile created successfully',
    data: profile,
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
  const { name, user_agent, fingerprint } = req.body;

  const profile = await profileService.updateProfile(id, {
    name,
    user_agent,
    fingerprint,
  });

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

