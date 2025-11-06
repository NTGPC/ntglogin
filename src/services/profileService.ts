import prisma from '../prismaClient';

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

export const createProfile = async (data: {
  name: string;
  user_agent?: string;
  fingerprint?: any;
}) => {
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

  return prisma.profile.create({
    data: { id: nextId, ...data },
  });
};

export const updateProfile = async (
  id: number,
  data: {
    name?: string;
    user_agent?: string;
    fingerprint?: any;
  }
) => {
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

  // Finally delete the profile
  return prisma.profile.delete({ where: { id } });
};

