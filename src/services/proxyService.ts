import prisma from '../prismaClient';

export const getAllProxies = async () => {
  return prisma.proxy.findMany();
};

export const getProxyById = async (id: number) => {
  return prisma.proxy.findUnique({
    where: { id },
  });
};

export const createProxy = async (data: {
  host: string;
  port: number;
  username?: string;
  password?: string;
  type: string;
  active?: boolean;
}) => {
  return prisma.proxy.create({
    data,
  });
};

export const updateProxy = async (
  id: number,
  data: {
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    type?: string;
    active?: boolean;
  }
) => {
  return prisma.proxy.update({
    where: { id },
    data,
  });
};

export const deleteProxy = async (id: number) => {
  return prisma.proxy.delete({
    where: { id },
  });
};

export const getActiveProxies = async () => {
  return prisma.proxy.findMany({
    where: { active: true },
  });
};

