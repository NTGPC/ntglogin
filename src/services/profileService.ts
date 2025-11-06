import prisma from '../prismaClient';
import fs from 'fs';
import path from 'path';

export const getAllProfiles = async () => {
  return prisma.profile.findMany({
    include: {
      sessions: true,
    },
  });
};

export const getProfileById = async (id: number) => {
  return prisma.profile.findUnique({
    where: { id },
    include: {
      sessions: true,
    },
  });
};

export const createProfile = async (data: any) => {
  // Find the smallest available positive integer for ID (1,2,3,...) filling gaps
  const ids = await prisma.profile.findMany({ select: { id: true }, orderBy: { id: 'asc' } });
  let nextId = 1;
  for (const row of ids) {
    if (row.id === nextId) {
      nextId++;
    } else if (row.id > nextId) {
      break; // found gap at nextId
    }
  }

  // Clean up browser profile directory if it exists (from previously deleted profile)
  // This ensures new profile starts with clean state
  try {
    const profileDir = path.join(process.cwd(), 'browser_profiles', `profile_${nextId}`);
    if (fs.existsSync(profileDir)) {
      fs.rmSync(profileDir, { recursive: true, force: true });
      console.log(`🧹 Cleaned up existing browser profile directory for new profile ${nextId}`);
    }
  } catch (error) {
    console.warn(`⚠️ Failed to clean up browser profile directory for new profile ${nextId}:`, error);
    // Continue with profile creation even if cleanup fails
  }

  return prisma.profile.create({
    data: { id: nextId, ...data },
  });
};

export const updateProfile = async (id: number, data: any) => {
  return prisma.profile.update({
    where: { id },
    data,
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

