import prisma from '../prismaClient';
import axios from 'axios';

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

export const checkProxyLive = async (id: number) => {
  const proxy = await prisma.proxy.findUnique({ where: { id } });
  if (!proxy) {
    throw new Error('Proxy not found');
  }

  // Only HTTP proxy check is supported in this quick checker
  if (proxy.type && proxy.type.toLowerCase() !== 'http') {
    return { live: false, latencyMs: null, error: 'Only HTTP proxy check supported' };
  }

  const start = Date.now();
  try {
    await axios.get('http://example.com', {
      timeout: 7000,
      // Axios proxy option supports HTTP proxies
      proxy: {
        host: proxy.host,
        port: proxy.port,
        auth: proxy.username && proxy.password ? { username: proxy.username, password: proxy.password } : undefined,
        protocol: 'http',
      } as any,
      // don't follow many redirects to keep latency predictable
      maxRedirects: 2,
      validateStatus: () => true,
    });
    return { live: true, latencyMs: Date.now() - start };
  } catch (err: any) {
    return { live: false, latencyMs: null, error: err?.message || String(err) };
  }
};

