import prisma from '../prismaClient';

export const getAllJobs = async () => {
  return prisma.job.findMany({
    orderBy: { created_at: 'desc' },
  });
};

export const getJobById = async (id: number) => {
  return prisma.job.findUnique({
    where: { id },
  });
};

export const createJob = async (data: {
  type: string;
  payload: any;
  status?: string;
  scheduled_at?: Date;
}) => {
  return prisma.job.create({
    data,
  });
};

export const updateJob = async (
  id: number,
  data: {
    status?: string;
    attempts?: number;
    scheduled_at?: Date;
  }
) => {
  return prisma.job.update({
    where: { id },
    data,
  });
};

export const deleteJob = async (id: number) => {
  return prisma.job.delete({
    where: { id },
  });
};

export const getJobsByStatus = async (status: string) => {
  return prisma.job.findMany({
    where: { status },
    orderBy: { created_at: 'desc' },
  });
};

export const incrementJobAttempts = async (id: number) => {
  return prisma.job.update({
    where: { id },
    data: {
      attempts: { increment: 1 },
    },
  });
};

