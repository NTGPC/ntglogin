import prisma from '../prismaClient';

export const getAllLogs = async (level?: string) => {
  return prisma.log.findMany({
    where: level ? { level } : undefined,
    orderBy: { created_at: 'desc' },
    take: 100, // Limit to last 100 logs
  });
};

export const getLogById = async (id: number) => {
  return prisma.log.findUnique({
    where: { id },
  });
};

export const createLog = async (data: {
  level: string;
  message: string;
  meta?: any;
}) => {
  return prisma.log.create({
    data,
  });
};

export const deleteLog = async (id: number) => {
  return prisma.log.delete({
    where: { id },
  });
};

// Helper functions for logging
export const logInfo = async (message: string, meta?: any) => {
  return createLog({ level: 'info', message, meta });
};

export const logWarn = async (message: string, meta?: any) => {
  return createLog({ level: 'warn', message, meta });
};

export const logError = async (message: string, meta?: any) => {
  return createLog({ level: 'error', message, meta });
};

