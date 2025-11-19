import { Request, Response } from 'express'
import * as presetService from '../services/fingerprintPresetService'
import { AppError, asyncHandler } from '../utils/errorHandler'
import { z } from 'zod'

const createPresetSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  userAgent: z.string().min(1),
  platform: z.string().min(1),
  uaPlatform: z.string().min(1),
  uaPlatformVersion: z.string().optional(),
  uaFullVersion: z.string().optional(),
  uaMobile: z.boolean().optional(),
  browserVersion: z.number().int().min(130).max(140).optional(),
  hardwareConcurrency: z.number().int().min(1).max(64),
  deviceMemory: z.number().int().min(1).max(128),
  webglVendor: z.string().min(1),
  webglRenderer: z.string().min(1),
  screenWidth: z.number().int().positive(),
  screenHeight: z.number().int().positive(),
  colorDepth: z.number().int().positive(),
  pixelRatio: z.number().positive(),
  languages: z.array(z.string()).min(1),
  timezone: z.string().optional(),
  canvasMode: z.enum(['noise', 'mask', 'off']),
  audioContextMode: z.enum(['noise', 'off']),
  webglMetadataMode: z.enum(['mask', 'real']),
  webrtcMode: z.enum(['fake', 'off', 'real']),
  geolocationMode: z.enum(['fake', 'off', 'real']),
  geolocationLatitude: z.number().min(-90).max(90).optional(),
  geolocationLongitude: z.number().min(-180).max(180).optional(),
  os: z.string().min(1),
  osVersion: z.string().optional(),
  isActive: z.boolean().optional(),
})

const updatePresetSchema = createPresetSchema.partial()

export const getAll = asyncHandler(async (_req: Request, res: Response) => {
  const presets = await presetService.getAllPresets()
  res.json({
    success: true,
    data: presets,
  })
})

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10)
  if (isNaN(id)) {
    throw new AppError('Invalid preset ID', 400)
  }

  const preset = await presetService.getPresetById(id)
  if (!preset) {
    throw new AppError('Preset not found', 404)
  }

  res.json({
    success: true,
    data: preset,
  })
})

export const getByOS = asyncHandler(async (req: Request, res: Response) => {
  const os = req.params.os
  if (!os) {
    throw new AppError('OS parameter is required', 400)
  }

  const presets = await presetService.getPresetsByOS(os)
  res.json({
    success: true,
    data: presets,
  })
})

export const create = asyncHandler(async (req: Request, res: Response) => {
  const parsed = createPresetSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new AppError(
      `Validation error: ${parsed.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
      400
    )
  }

  const preset = await presetService.createPreset(parsed.data)
  res.status(201).json({
    success: true,
    message: 'Fingerprint preset created successfully',
    data: preset,
  })
})

export const update = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10)
  if (isNaN(id)) {
    throw new AppError('Invalid preset ID', 400)
  }

  const parsed = updatePresetSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new AppError(
      `Validation error: ${parsed.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
      400
    )
  }

  const preset = await presetService.updatePreset(id, parsed.data)
  res.json({
    success: true,
    message: 'Fingerprint preset updated successfully',
    data: preset,
  })
})

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10)
  if (isNaN(id)) {
    throw new AppError('Invalid preset ID', 400)
  }

  await presetService.deletePreset(id)
  res.json({
    success: true,
    message: 'Fingerprint preset deleted successfully',
  })
})

