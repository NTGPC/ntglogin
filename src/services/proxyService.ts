import prisma from '../prismaClient';
import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';

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
    status?: string;
    lastChecked?: Date;
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

export const checkProxyLive = async (proxyId: number) => {
  // 1. Lấy thông tin từ DB
  const proxy = await prisma.proxy.findUnique({ where: { id: proxyId } });
  if (!proxy) throw new Error("Proxy không tồn tại");

  // 2. Tạo Agent kết nối (Chuẩn MMO)
  let agent;
  const proxyAuth = proxy.username ? `${proxy.username}:${proxy.password}@` : '';
  const proxyUrl = `${proxy.type}://${proxyAuth}${proxy.host}:${proxy.port}`;
  
  if (proxy.type.startsWith('socks')) {
    agent = new SocksProxyAgent(proxyUrl);
  } else {
    // HTTP/HTTPS
    agent = new HttpsProxyAgent(proxyUrl);
  }

  let newStatus = 'die';
  try {
    // 3. Gửi request check (Check thẳng vào Google hoặc Facebook)
    // Timeout 10s (đủ để check proxy chậm, tránh báo ảo Not Live)
    const response = await axios.get('http://www.google.com', {
      httpAgent: agent,
      httpsAgent: agent,
      timeout: 10000, 
      validateStatus: () => true, // Không throw lỗi nếu status code != 200
    });

    if (response.status >= 200 && response.status < 400) {
      newStatus = 'live';
    }
  } catch (error: any) {
    console.log(`Proxy ${proxy.host} check error:`, error.message);
    newStatus = 'die';
  }

  // 4. QUAN TRỌNG: Update trạng thái vào Database
  const updatedProxy = await prisma.proxy.update({
    where: { id: proxyId },
    data: { 
      status: newStatus,
      lastChecked: new Date()
    }
  });

  return updatedProxy;
};

