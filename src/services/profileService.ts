import prisma from '../prismaClient';
import fs from 'fs';
import path from 'path';

export const getAllProfiles = async () => {
  // Để Prisma trả về toàn bộ object, không dùng select để tránh lỗi khi schema thay đổi
  return prisma.profile.findMany({
    include: {
      proxy: true, // Lấy kèm thông tin proxy nếu có
      workflow: true, // Lấy kèm thông tin workflow đã được gán
      sessions: true, // Lấy kèm thông tin sessions
    },
  });
};

export const getProfileById = async (id: number) => {
  // Để Prisma trả về toàn bộ object, không dùng select để tránh lỗi khi schema thay đổi
  return prisma.profile.findUnique({
    where: { id },
    include: {
      proxy: true, // Lấy kèm thông tin proxy nếu có
      workflow: true, // Lấy kèm thông tin workflow đã được gán
      sessions: true, // Lấy kèm thông tin sessions
    },
  });
};

// ==========================================================
// === PHIÊN BẢN SẠCH SẼ VÀ AN TOÀN CỦA createProfile ===
// ==========================================================
export const createProfile = async (data: any) => {
  // Bước 1: Loại bỏ 'id' phòng thủ (dù controller đã làm)
  const { id: _dataId, ...cleanData } = data;

  // Bước 2: Tạo profile và để cho DATABASE tự quyết định ID
  const newProfile = await prisma.profile.create({
    data: cleanData,
  });

  // Sau khi đã có profile với ID thật, chúng ta mới thực hiện các hành động phụ
  const newProfileId = newProfile.id;

  // Bước 3: Dọn dẹp thư mục profile cũ (nếu có)
  try {
    const profileDir = path.join(process.cwd(), 'browser_profiles', `profile_${newProfileId}`);
    if (fs.existsSync(profileDir)) {
      fs.rmSync(profileDir, { recursive: true, force: true });
      console.log(`🧹 Cleaned up existing browser profile directory for new profile #${newProfileId}`);
    }
  } catch (error) {
    console.warn(`⚠️ Failed to clean up browser profile directory for new profile #${newProfileId}:`, error);
    // Không dừng lại nếu dọn dẹp thất bại, chỉ cảnh báo
  }

  // Bước 4: Trả về profile đã được tạo thành công
  return newProfile;
};

export const updateProfile = async (id: number, data: any) => {
  // Loại bỏ 'id' nếu có trong data (phòng thủ)
  const { id: _dataId, ...cleanData } = data;
  return prisma.profile.update({
    where: { id },
    data: cleanData,
  });
};

export const deleteProfile = async (id: number) => {
  // Clean up dependent records that are not cascading by schema (e.g., workflow assignments)
  await prisma.workflowAssignment.deleteMany({ where: { profileId: id } }).catch(() => {})
  // Sessions and JobExecutions are set to Cascade on profile in schema, but do an extra safety cleanup
  await prisma.session.deleteMany({ where: { profile_id: id } }).catch(() => {})
  await prisma.jobExecution.deleteMany({ where: { profile_id: id } }).catch(() => {})

  // Delete browser profile directory (user-data-dir) and all session directories
  try {
    const browserProfilesDir = path.join(process.cwd(), 'browser_profiles');
    
    // Delete main profile directory
    const profileDir = path.join(browserProfilesDir, `profile_${id}`);
    if (fs.existsSync(profileDir)) {
      fs.rmSync(profileDir, { recursive: true, force: true });
      console.log(`✅ Deleted browser profile directory: ${profileDir}`);
    }
    
    // Delete all session directories for this profile (profile_{id}_session_{sessionId})
    if (fs.existsSync(browserProfilesDir)) {
      const entries = fs.readdirSync(browserProfilesDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && entry.name.startsWith(`profile_${id}_session_`)) {
          const sessionDir = path.join(browserProfilesDir, entry.name);
          try {
            fs.rmSync(sessionDir, { recursive: true, force: true });
            console.log(`✅ Deleted session directory: ${entry.name}`);
          } catch (err) {
            console.warn(`⚠️ Failed to delete session directory ${entry.name}:`, err);
          }
        }
      }
    }
  } catch (error) {
    console.warn(`⚠️ Failed to delete browser profile directories for profile ${id}:`, error);
    // Continue with profile deletion even if directory cleanup fails
  }

  // Finally delete the profile
  return prisma.profile.delete({ where: { id } });
};

