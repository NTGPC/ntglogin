import prisma from '../prismaClient';
import fs from 'fs';
import path from 'path';

// Cấu hình Include mặc định để dùng chung
const defaultInclude = {
  proxy: true,
  workflow: true,
  sessions: true,
  userAgentRef: true,
  webglRendererRef: true,
};

export const getAllProfiles = async () => {
  return prisma.profile.findMany({
    orderBy: { createdAt: 'desc' },
    include: defaultInclude,
  });
};

export const getProfileById = async (id: number) => {
  return prisma.profile.findUnique({
    where: { id },
    include: defaultInclude,
  });
};

export const createProfile = async (data: any) => {
  // Data đã được sanitize ở Controller, chỉ việc lưu
  // Lưu ý: data.proxyId phải là Int hoặc null
  
  console.log(`[SERVICE] Saving profile to DB... ProxyID: ${data.proxyId}`);

  const newProfile = await prisma.profile.create({
    data: data,
    include: defaultInclude, // Trả về full relation để frontend hiển thị ngay
  });

  // Tạo thư mục profile (Optional)
  try {
    const profileDir = path.join(process.cwd(), 'browser_profiles', `profile_${newProfile.id}`);
    if (fs.existsSync(profileDir)) {
        // Cleanup old dir if exists logic
    }
  } catch (e) { console.warn("Dir cleanup warning", e); }

  return newProfile;
};

export const updateProfile = async (id: number, data: any) => {
  // Prisma không cho phép update 'id', loại bỏ nó
  const { id: _id, ...cleanData } = data;

  return prisma.profile.update({
    where: { id },
    data: cleanData,
    include: defaultInclude,
  });
};

export const deleteProfile = async (id: number) => {
  // Cleanup logic (giữ nguyên logic xóa file của bạn)
  try {
    const profileDir = path.join(process.cwd(), 'browser_profiles', `profile_${id}`);
    if (fs.existsSync(profileDir)) fs.rmSync(profileDir, { recursive: true, force: true });
  } catch (e) {}

  return prisma.profile.delete({ where: { id } });
};