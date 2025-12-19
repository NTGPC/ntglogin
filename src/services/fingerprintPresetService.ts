import prisma from '../prismaClient'

export interface CreateFingerprintPresetDto {
  name: string
  description?: string
  userAgent: string
  platform: string
  uaPlatform: string
  uaPlatformVersion?: string
  uaFullVersion?: string
  uaMobile?: boolean
  browserVersion?: number
  hardwareConcurrency: number
  deviceMemory: number
  webglVendor: string
  webglRenderer: string
  screenWidth: number
  screenHeight: number
  colorDepth: number
  pixelRatio: number
  languages: string[] | string
  timezone?: string
  canvasMode: string
  audioContextMode: string
  webglMetadataMode: string
  webrtcMode: string
  geolocationMode: string
  geolocationLatitude?: number
  geolocationLongitude?: number
  os: string
  osVersion?: string
  isActive?: boolean
}

export interface UpdateFingerprintPresetDto extends Partial<CreateFingerprintPresetDto> { }

export const getAllPresets = async () => {
  return prisma.fingerprintPreset.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  })
}

export const getPresetById = async (id: number) => {
  return prisma.fingerprintPreset.findUnique({
    where: { id },
    include: {
      profiles: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })
}

export const getPresetsByOS = async (os: string) => {
  return prisma.fingerprintPreset.findMany({
    where: {
      os,
      isActive: true,
    },
    orderBy: { name: 'asc' },
  })
}

export const createPreset = async (data: CreateFingerprintPresetDto) => {
  return prisma.fingerprintPreset.create({
    data: {
      ...data,
      languages: Array.isArray(data.languages) ? data.languages.join(',') : data.languages,
    },
  })
}

export const updatePreset = async (id: number, data: UpdateFingerprintPresetDto) => {
  const { languages, ...rest } = data;
  const updateData = {
    ...rest,
    ...(languages && Array.isArray(languages) ? { languages: languages.join(',') } : {}),
  };

  // Ép kiểu 'as any' để TypeScript không báo lỗi dòng này nữa
  if (updateData.languages && Array.isArray(updateData.languages)) {
    (updateData as any).languages = updateData.languages.join(',');
  }

  return prisma.fingerprintPreset.update({
    where: { id },
    // Ép kiểu 'as any' cho toàn bộ cục updateData luôn cho nhanh
    data: updateData as any,
  })
}

export const deletePreset = async (id: number) => {
  // Check if preset is used by any profile
  const profiles = await prisma.profile.findMany({
    where: { fingerprintPresetId: id },
    select: { id: true },
  })

  if (profiles.length > 0) {
    throw new Error(`Cannot delete preset: ${profiles.length} profile(s) are using it`)
  }

  // Soft delete: set isActive to false
  return prisma.fingerprintPreset.update({
    where: { id },
    data: { isActive: false },
  })
}

