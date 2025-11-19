import prisma from '../prismaClient';

export const getAllUserAgents = async () => {
  return prisma.userAgent.findMany({
    orderBy: [
      { os: 'asc' },
      { browserVersion: 'desc' },
      { name: 'asc' },
    ],
  });
};

export const getUserAgentById = async (id: number) => {
  return prisma.userAgent.findUnique({
    where: { id },
  });
};

export const createUserAgent = async (data: {
  name: string;
  value: string;
  os: string;
  platform: string;
  uaPlatform?: string;
  uaPlatformVersion?: string;
  uaFullVersion?: string;
  browserVersion?: number;
}) => {
  // Loại bỏ 'id' nếu có
  const { id: _id, ...cleanData } = data as any;
  
  return prisma.userAgent.create({
    data: cleanData,
  });
};

export const updateUserAgent = async (id: number, data: {
  name?: string;
  value?: string;
  os?: string;
  platform?: string;
  uaPlatform?: string;
  uaPlatformVersion?: string;
  uaFullVersion?: string;
  browserVersion?: number;
}) => {
  // Loại bỏ 'id' nếu có
  const { id: _id, ...cleanData } = data as any;
  
  return prisma.userAgent.update({
    where: { id },
    data: cleanData,
  });
};

export const deleteUserAgent = async (id: number) => {
  // Kiểm tra xem có profile nào đang sử dụng UserAgent này không
  const profilesUsing = await prisma.profile.count({
    where: { userAgentId: id },
  });
  
  if (profilesUsing > 0) {
    throw new Error(`Cannot delete UserAgent: ${profilesUsing} profile(s) are using it`);
  }
  
  return prisma.userAgent.delete({
    where: { id },
  });
};

export const getUserAgentsByOS = async (os: string) => {
  return prisma.userAgent.findMany({
    where: { os },
    orderBy: [
      { browserVersion: 'desc' },
      { name: 'asc' },
    ],
  });
};

export const getUserAgentsByBrowserVersion = async (minVersion: number, maxVersion: number) => {
  return prisma.userAgent.findMany({
    where: {
      browserVersion: {
        gte: minVersion,
        lte: maxVersion,
      },
    },
    orderBy: [
      { os: 'asc' },
      { browserVersion: 'desc' },
    ],
  });
};
