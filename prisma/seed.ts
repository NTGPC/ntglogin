import { PrismaClient } from '../generated/prisma';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Helper function để extract browser version từ User Agent string
function extractBrowserVersion(uaString: string): number | null {
  const chromeMatch = uaString.match(/Chrome\/(\d+)/);
  if (chromeMatch) {
    return parseInt(chromeMatch[1], 10);
  }
  return null;
}

// Helper function để extract platform từ User Agent string
function extractPlatform(uaString: string): string {
  if (uaString.includes('Windows NT 10.0')) {
    return 'Win32';
  } else if (uaString.includes('Macintosh')) {
    return 'MacIntel';
  } else if (uaString.includes('Linux')) {
    return 'Linux x86_64';
  }
  return 'Win32'; // Default
}

// Helper function để extract platform version từ User Agent string
function extractPlatformVersion(uaString: string): string | null {
  if (uaString.includes('Windows NT 10.0')) {
    return '10.0.0';
  } else if (uaString.includes('Mac OS X')) {
    const macVersionMatch = uaString.match(/Mac OS X (\d+_\d+_\d+)/);
    if (macVersionMatch) {
      return macVersionMatch[1].replace(/_/g, '.');
    }
    return '10.15.7';
  }
  return null;
}

// Import User Agent Library từ constants
const USER_AGENT_LIBRARY = [
  // --- Windows - Chrome 130-140 ---
  { 
    name: "Windows 11 - Chrome 140", 
    value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
    os: "Windows"
  },
  { 
    name: "Windows 11 - Chrome 139", 
    value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
    os: "Windows"
  },
  { 
    name: "Windows 11 - Chrome 138", 
    value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
    os: "Windows"
  },
  { 
    name: "Windows 11 - Chrome 137", 
    value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
    os: "Windows"
  },
  { 
    name: "Windows 11 - Chrome 136", 
    value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
    os: "Windows"
  },
  { 
    name: "Windows 11 - Chrome 135", 
    value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
    os: "Windows"
  },
  { 
    name: "Windows 11 - Chrome 134", 
    value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
    os: "Windows"
  },
  { 
    name: "Windows 11 - Chrome 133", 
    value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
    os: "Windows"
  },
  { 
    name: "Windows 11 - Chrome 132", 
    value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
    os: "Windows"
  },
  { 
    name: "Windows 11 - Chrome 131", 
    value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    os: "Windows"
  },
  { 
    name: "Windows 11 - Chrome 130", 
    value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    os: "Windows"
  },
  { 
    name: "Windows 10 - Chrome 140", 
    value: "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
    os: "Windows 10"
  },
  { 
    name: "Windows 10 - Chrome 139", 
    value: "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
    os: "Windows 10"
  },
  { 
    name: "Windows 10 - Chrome 138", 
    value: "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
    os: "Windows 10"
  },
  { 
    name: "Windows 10 - Chrome 137", 
    value: "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
    os: "Windows 10"
  },
  { 
    name: "Windows 10 - Chrome 136", 
    value: "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
    os: "Windows 10"
  },
  { 
    name: "Windows 10 - Chrome 135", 
    value: "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
    os: "Windows 10"
  },
  { 
    name: "Windows 10 - Chrome 134", 
    value: "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
    os: "Windows 10"
  },
  { 
    name: "Windows 10 - Chrome 133", 
    value: "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
    os: "Windows 10"
  },
  { 
    name: "Windows 10 - Chrome 132", 
    value: "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
    os: "Windows 10"
  },
  { 
    name: "Windows 10 - Chrome 131", 
    value: "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    os: "Windows 10"
  },
  { 
    name: "Windows 10 - Chrome 130", 
    value: "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    os: "Windows 10"
  },
  
  // --- macOS - Chrome 130-140 ---
  { 
    name: "macOS - Chrome 140", 
    value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
    os: "macOS"
  },
  { 
    name: "macOS - Chrome 139", 
    value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
    os: "macOS"
  },
  { 
    name: "macOS - Chrome 138", 
    value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
    os: "macOS"
  },
  { 
    name: "macOS - Chrome 137", 
    value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
    os: "macOS"
  },
  { 
    name: "macOS - Chrome 136", 
    value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
    os: "macOS"
  },
  { 
    name: "macOS - Chrome 135", 
    value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
    os: "macOS"
  },
  { 
    name: "macOS - Chrome 134", 
    value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
    os: "macOS"
  },
  { 
    name: "macOS - Chrome 133", 
    value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
    os: "macOS"
  },
  { 
    name: "macOS - Chrome 132", 
    value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
    os: "macOS"
  },
  { 
    name: "macOS - Chrome 131", 
    value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    os: "macOS"
  },
  { 
    name: "macOS - Chrome 130", 
    value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    os: "macOS"
  },
];

// Import WebGL Renderer Library từ constants
const WEBGL_RENDERER_LIBRARY = [
  // === INTEL (Windows & macOS) ===
  { vendor: 'Intel Inc.', renderer: 'Intel Iris OpenGL Engine', os: ['Windows', 'macOS'] },
  { vendor: 'Intel Inc.', renderer: 'Intel Iris Pro OpenGL Engine', os: ['Windows', 'macOS'] },
  { vendor: 'Intel Inc.', renderer: 'Intel HD Graphics 630', os: ['Windows'] },
  { vendor: 'Intel Inc.', renderer: 'Intel HD Graphics 620', os: ['Windows'] },
  { vendor: 'Intel Inc.', renderer: 'Intel UHD Graphics 620', os: ['Windows'] },
  { vendor: 'Intel Inc.', renderer: 'Intel UHD Graphics 630', os: ['Windows'] },
  { vendor: 'Intel Inc.', renderer: 'Intel Iris Xe Graphics', os: ['Windows'] },
  { vendor: 'Intel Inc.', renderer: 'Intel Arc A380', os: ['Windows'] },
  { vendor: 'Intel Inc.', renderer: 'Intel Arc A750', os: ['Windows'] },
  { vendor: 'Intel Inc.', renderer: 'Intel Arc A770', os: ['Windows'] },
  { vendor: 'Intel Inc.', renderer: 'Intel(R) UHD Graphics 620', os: ['Windows'] },
  { vendor: 'Intel Inc.', renderer: 'Intel(R) HD Graphics 520', os: ['Windows'] },
  { vendor: 'Intel Inc.', renderer: 'Intel(R) HD Graphics 4000', os: ['Windows'] },
  { vendor: 'Intel Inc.', renderer: 'Intel(R) HD Graphics 3000', os: ['Windows'] },
  { vendor: 'Intel Inc.', renderer: 'Intel(R) GMA 950', os: ['Windows'] },

  // === NVIDIA (Windows) ===
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce GTX 1060/PCIe/SSE2', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce GTX 1070/PCIe/SSE2', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce GTX 1080/PCIe/SSE2', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce RTX 2060/PCIe/SSE2', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce RTX 2070/PCIe/SSE2', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce RTX 2080/PCIe/SSE2', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce RTX 3060/PCIe/SSE2', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce RTX 3070/PCIe/SSE2', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce RTX 3080/PCIe/SSE2', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce RTX 3090/PCIe/SSE2', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce RTX 4060/PCIe/SSE2', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce RTX 4070/PCIe/SSE2', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce RTX 4080/PCIe/SSE2', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce RTX 4090/PCIe/SSE2', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce GTX 1650/PCIe/SSE2', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce GTX 1660/PCIe/SSE2', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce GTX 1660 Ti/PCIe/SSE2', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce MX150/PCIe/SSE2', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce MX250/PCIe/SSE2', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce MX350/PCIe/SSE2', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA Quadro P1000/PCIe/SSE2', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA Quadro P2000/PCIe/SSE2', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA Quadro RTX 4000/PCIe/SSE2', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA Quadro RTX 5000/PCIe/SSE2', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce GTX 1050 Ti/PCIe/SSE2', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce GTX 1050/PCIe/SSE2', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce GT 1030/PCIe/SSE2', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce GT 730/PCIe/SSE2', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce GT 710/PCIe/SSE2', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce GTX 750 Ti/PCIe/SSE2', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce GTX 960/PCIe/SSE2', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce GTX 970/PCIe/SSE2', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce GTX 980/PCIe/SSE2', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce GTX 980 Ti/PCIe/SSE2', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce GTX TITAN X/PCIe/SSE2', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce GTX TITAN Z/PCIe/SSE2', os: ['Windows'] },

  // === AMD (Windows) ===
  { vendor: 'Advanced Micro Devices, Inc.', renderer: 'AMD Radeon RX 580 Series', os: ['Windows'] },
  { vendor: 'Advanced Micro Devices, Inc.', renderer: 'AMD Radeon RX 590 Series', os: ['Windows'] },
  { vendor: 'Advanced Micro Devices, Inc.', renderer: 'AMD Radeon RX 5500 XT', os: ['Windows'] },
  { vendor: 'Advanced Micro Devices, Inc.', renderer: 'AMD Radeon RX 5600 XT', os: ['Windows'] },
  { vendor: 'Advanced Micro Devices, Inc.', renderer: 'AMD Radeon RX 5700 XT', os: ['Windows'] },
  { vendor: 'Advanced Micro Devices, Inc.', renderer: 'AMD Radeon RX 6600 XT', os: ['Windows'] },
  { vendor: 'Advanced Micro Devices, Inc.', renderer: 'AMD Radeon RX 6700 XT', os: ['Windows'] },
  { vendor: 'Advanced Micro Devices, Inc.', renderer: 'AMD Radeon RX 6800 XT', os: ['Windows'] },
  { vendor: 'Advanced Micro Devices, Inc.', renderer: 'AMD Radeon RX 6900 XT', os: ['Windows'] },
  { vendor: 'Advanced Micro Devices, Inc.', renderer: 'AMD Radeon RX 7600', os: ['Windows'] },
  { vendor: 'Advanced Micro Devices, Inc.', renderer: 'AMD Radeon RX 7700 XT', os: ['Windows'] },
  { vendor: 'Advanced Micro Devices, Inc.', renderer: 'AMD Radeon RX 7800 XT', os: ['Windows'] },
  { vendor: 'Advanced Micro Devices, Inc.', renderer: 'AMD Radeon RX 7900 XT', os: ['Windows'] },
  { vendor: 'Advanced Micro Devices, Inc.', renderer: 'AMD Radeon RX 7900 XTX', os: ['Windows'] },
  { vendor: 'Advanced Micro Devices, Inc.', renderer: 'AMD Radeon R9 390', os: ['Windows'] },
  { vendor: 'Advanced Micro Devices, Inc.', renderer: 'AMD Radeon R9 390X', os: ['Windows'] },
  { vendor: 'Advanced Micro Devices, Inc.', renderer: 'AMD Radeon R7 370', os: ['Windows'] },
  { vendor: 'Advanced Micro Devices, Inc.', renderer: 'AMD Radeon R7 260X', os: ['Windows'] },
  { vendor: 'Advanced Micro Devices, Inc.', renderer: 'AMD Radeon HD 7870', os: ['Windows'] },
  { vendor: 'Advanced Micro Devices, Inc.', renderer: 'AMD Radeon HD 7850', os: ['Windows'] },
  { vendor: 'Advanced Micro Devices, Inc.', renderer: 'AMD Radeon Pro WX 7100', os: ['Windows'] },
  { vendor: 'Advanced Micro Devices, Inc.', renderer: 'AMD Radeon Pro WX 8200', os: ['Windows'] },

  // === APPLE (macOS) ===
  { vendor: 'Apple Inc.', renderer: 'Apple M1', os: ['macOS'] },
  { vendor: 'Apple Inc.', renderer: 'Apple M1 Pro', os: ['macOS'] },
  { vendor: 'Apple Inc.', renderer: 'Apple M1 Max', os: ['macOS'] },
  { vendor: 'Apple Inc.', renderer: 'Apple M1 Ultra', os: ['macOS'] },
  { vendor: 'Apple Inc.', renderer: 'Apple M2', os: ['macOS'] },
  { vendor: 'Apple Inc.', renderer: 'Apple M2 Pro', os: ['macOS'] },
  { vendor: 'Apple Inc.', renderer: 'Apple M2 Max', os: ['macOS'] },
  { vendor: 'Apple Inc.', renderer: 'Apple M2 Ultra', os: ['macOS'] },
  { vendor: 'Apple Inc.', renderer: 'Apple M3', os: ['macOS'] },
  { vendor: 'Apple Inc.', renderer: 'Apple M3 Pro', os: ['macOS'] },
  { vendor: 'Apple Inc.', renderer: 'Apple M3 Max', os: ['macOS'] },
  { vendor: 'Apple Inc.', renderer: 'Apple M3 Ultra', os: ['macOS'] },
  { vendor: 'Apple Inc.', renderer: 'Apple GPU', os: ['macOS'] },

  // === INTEL IRIS TRÊN MAC (macOS) ===
  { vendor: 'Apple Inc.', renderer: 'Intel Iris Pro OpenGL Engine', os: ['macOS'] },
  { vendor: 'Apple Inc.', renderer: 'Intel Iris Plus Graphics 640', os: ['macOS'] },
  { vendor: 'Apple Inc.', renderer: 'Intel Iris Graphics 6100', os: ['macOS'] },
  { vendor: 'Apple Inc.', renderer: 'Intel Iris Graphics 550', os: ['macOS'] },
  { vendor: 'Apple Inc.', renderer: 'Intel Iris Graphics 540', os: ['macOS'] },

  // === AMD RADEON PRO TRÊN MAC (macOS) ===
  { vendor: 'Apple Inc.', renderer: 'AMD Radeon Pro 5500M', os: ['macOS'] },
  { vendor: 'Apple Inc.', renderer: 'AMD Radeon Pro 5600M', os: ['macOS'] },
  { vendor: 'Apple Inc.', renderer: 'AMD Radeon Pro 5700 XT', os: ['macOS'] },
  { vendor: 'Apple Inc.', renderer: 'AMD Radeon Pro 560X', os: ['macOS'] },
  { vendor: 'Apple Inc.', renderer: 'AMD Radeon Pro 570X', os: ['macOS'] },
  { vendor: 'Apple Inc.', renderer: 'AMD Radeon Pro 580X', os: ['macOS'] },
  { vendor: 'Apple Inc.', renderer: 'AMD Radeon Pro Vega 56', os: ['macOS'] },
  { vendor: 'Apple Inc.', renderer: 'AMD Radeon Pro Vega 64', os: ['macOS'] },
  { vendor: 'Apple Inc.', renderer: 'AMD Radeon Pro 5300M', os: ['macOS'] },
  { vendor: 'Apple Inc.', renderer: 'AMD Radeon Pro 5500M', os: ['macOS'] },
];

async function main() {
  console.log('🌱 Starting seed...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
    },
  });
  console.log('✅ Created admin user:', admin.username);

  // Seed User Agents
  console.log('📚 Seeding User Agents...');
  let userAgentCount = 0;
  for (const ua of USER_AGENT_LIBRARY) {
    try {
      const browserVersion = extractBrowserVersion(ua.value);
      const platform = extractPlatform(ua.value);
      const platformVersion = extractPlatformVersion(ua.value);
      
      await prisma.userAgent.upsert({
        where: { value: ua.value },
        update: {
          name: ua.name,
          os: ua.os,
          platform: platform,
          browserVersion: browserVersion,
          uaPlatform: platform,
          uaPlatformVersion: platformVersion,
        },
        create: {
          name: ua.name,
          value: ua.value,
          os: ua.os,
          platform: platform,
          browserVersion: browserVersion,
          uaPlatform: platform,
          uaPlatformVersion: platformVersion,
        },
      });
      userAgentCount++;
    } catch (error: any) {
      console.warn(`⚠️ Failed to seed User Agent "${ua.name}":`, error.message);
    }
  }
  console.log(`✅ Seeded ${userAgentCount} User Agents`);

  // Seed WebGL Renderers
  console.log('🎮 Seeding WebGL Renderers...');
  let webglCount = 0;
  for (const gpu of WEBGL_RENDERER_LIBRARY) {
    try {
      // Tạo một entry cho mỗi OS tương thích
      for (const os of gpu.os) {
        await prisma.webglRenderer.upsert({
          where: { renderer: gpu.renderer },
          update: {
            vendor: gpu.vendor,
            os: os,
          },
          create: {
            vendor: gpu.vendor,
            renderer: gpu.renderer,
            os: os,
          },
        });
        webglCount++;
      }
    } catch (error: any) {
      console.warn(`⚠️ Failed to seed WebGL Renderer "${gpu.renderer}":`, error.message);
    }
  }
  console.log(`✅ Seeded ${webglCount} WebGL Renderer entries`);

  // Create sample profiles (giữ nguyên để test)
  const profile1 = await prisma.profile.create({
    data: {
      name: 'Profile 1 - Chrome Windows',
      user_agent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      fingerprint: {
        canvas: 'abc123',
        webgl: 'def456',
        audio: 'ghi789',
      },
    },
  });

  const profile2 = await prisma.profile.create({
    data: {
      name: 'Profile 2 - Firefox MacOS',
      user_agent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',
      fingerprint: {
        canvas: 'xyz123',
        webgl: 'uvw456',
        audio: 'rst789',
      },
    },
  });
  console.log('✅ Created profiles:', profile1.name, profile2.name);

  // Create sample proxies
  const proxy1 = await prisma.proxy.create({
    data: {
      host: '192.168.1.100',
      port: 8080,
      username: 'proxyuser1',
      password: 'proxypass1',
      type: 'http',
      active: true,
    },
  });

  const proxy2 = await prisma.proxy.create({
    data: {
      host: '192.168.1.101',
      port: 1080,
      username: 'proxyuser2',
      password: 'proxypass2',
      type: 'socks5',
      active: true,
    },
  });
  console.log('✅ Created proxies:', `${proxy1.host}:${proxy1.port}`, `${proxy2.host}:${proxy2.port}`);

  // Create sample sessions
  const session1 = await prisma.session.create({
    data: {
      profile_id: profile1.id,
      proxy_id: proxy1.id,
      status: 'idle',
      meta: {
        lastActivity: new Date().toISOString(),
      },
    },
  });

  const session2 = await prisma.session.create({
    data: {
      profile_id: profile2.id,
      proxy_id: proxy2.id,
      status: 'running',
      started_at: new Date(),
      meta: {
        lastActivity: new Date().toISOString(),
      },
    },
  });
  console.log('✅ Created sessions:', session1.id, session2.id);

  // Create sample jobs
  const job1 = await prisma.job.create({
    data: {
      type: 'profile_sync',
      payload: {
        profileId: profile1.id,
        action: 'sync_cookies',
      },
      status: 'queued',
    },
  });

  const job2 = await prisma.job.create({
    data: {
      type: 'proxy_check',
      payload: {
        proxyIds: [proxy1.id, proxy2.id],
      },
      status: 'processing',
    },
  });
  console.log('✅ Created jobs:', job1.type, job2.type);

  // Create sample logs
  await prisma.log.createMany({
    data: [
      {
        level: 'info',
        message: 'Application started successfully',
        meta: { timestamp: new Date().toISOString() },
      },
      {
        level: 'warn',
        message: 'High memory usage detected',
        meta: { usage: '85%' },
      },
      {
        level: 'error',
        message: 'Failed to connect to proxy',
        meta: { proxyId: proxy1.id, error: 'Connection timeout' },
      },
    ],
  });
  console.log('✅ Created logs');

  // Create initial changelog entries
  await prisma.changelog.createMany({
    data: [
      {
        version: 'Unreleased',
        title: 'Comprehensive Fingerprint Injection System',
        type: 'Added',
        category: 'Fingerprint',
        description: 'Add seeded PRNG (xorshift32), Canvas, WebGL/WebGL2/OffscreenCanvas, Audio fingerprint patches',
        files: [
          'src/services/browserService.ts',
          'scripts/inject_before_load.js',
          'scripts/launch_profile.py',
        ],
        author: 'System',
      },
      {
        version: 'Unreleased',
        title: 'Chrome SwiftShader Flags Support',
        type: 'Added',
        category: 'Fingerprint',
        description: 'Add support for --use-gl=swiftshader and --use-angle=swiftshader to mask GPU driver version',
        files: ['src/services/browserService.ts', 'scripts/launch_profile.py'],
        author: 'System',
      },
      {
        version: 'Unreleased',
        title: 'Profile Isolation with Auto Cleanup',
        type: 'Changed',
        category: 'Profile',
        description: 'Each profile now has isolated browser_profiles directory. Auto cleanup when delete/create profile',
        files: ['src/services/profileService.ts'],
        author: 'System',
      },
      {
        version: 'Unreleased',
        title: 'Fix Proxy Foreign Key Constraint',
        type: 'Fixed',
        category: 'Session',
        description: 'Fix foreign key constraint violation when proxy_id does not exist',
        files: ['src/services/sessionService.ts'],
        author: 'System',
      },
      {
        version: 'Unreleased',
        title: 'Changelog Management System',
        type: 'Added',
        category: 'System',
        description: 'Add Changelog model and API endpoints to track project changes',
        files: [
          'prisma/schema.prisma',
          'src/services/changelogService.ts',
          'src/controllers/changelogController.ts',
          'src/routes/changelogRoutes.ts',
        ],
        author: 'System',
      },
      {
        version: 'Unreleased',
        title: 'Library Tables for User Agents and WebGL Renderers',
        type: 'Added',
        category: 'Database',
        description: 'Add UserAgent and WebglRenderer tables to manage libraries dynamically',
        files: [
          'prisma/schema.prisma',
          'src/services/userAgentService.ts',
          'src/services/webglRendererService.ts',
          'src/controllers/userAgentController.ts',
          'src/controllers/webglRendererController.ts',
        ],
        author: 'System',
      },
    ],
  });
  console.log('✅ Created changelog entries');

  // ==========================================================
  // === SEED FINGERPRINT PRESETS (V2.0) ===
  // ==========================================================
  console.log('🌱 Seeding Fingerprint Presets...');
  
  const samplePresets = [
    // Windows 11 Presets
    {
      name: 'Windows 11 - Chrome 140 - NVIDIA RTX 4080',
      description: 'High-end Windows 11 configuration with NVIDIA RTX 4080',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
      platform: 'Win32',
      uaPlatform: 'Windows',
      uaPlatformVersion: '10.0.0',
      uaFullVersion: '140.0.6099.71',
      uaMobile: false,
      browserVersion: 140,
      hardwareConcurrency: 16,
      deviceMemory: 32,
      webglVendor: 'NVIDIA Corporation',
      webglRenderer: 'NVIDIA GeForce RTX 4080/PCIe/SSE2',
      screenWidth: 2560,
      screenHeight: 1440,
      colorDepth: 24,
      pixelRatio: 1.0,
      languages: ['en-US', 'en'],
      timezone: 'America/New_York',
      canvasMode: 'noise',
      audioContextMode: 'noise',
      webglMetadataMode: 'mask',
      webrtcMode: 'fake',
      geolocationMode: 'fake',
      geolocationLatitude: 40.7128,
      geolocationLongitude: -74.0060,
      os: 'Windows 11',
      osVersion: '11',
      isActive: true,
    },
    {
      name: 'Windows 11 - Chrome 140 - AMD RX 7900 XTX',
      description: 'High-end Windows 11 configuration with AMD RX 7900 XTX',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
      platform: 'Win32',
      uaPlatform: 'Windows',
      uaPlatformVersion: '10.0.0',
      uaFullVersion: '140.0.6099.71',
      uaMobile: false,
      browserVersion: 140,
      hardwareConcurrency: 12,
      deviceMemory: 16,
      webglVendor: 'Advanced Micro Devices, Inc.',
      webglRenderer: 'AMD Radeon RX 7900 XTX',
      screenWidth: 1920,
      screenHeight: 1080,
      colorDepth: 24,
      pixelRatio: 1.0,
      languages: ['en-US', 'en'],
      timezone: 'America/Los_Angeles',
      canvasMode: 'noise',
      audioContextMode: 'noise',
      webglMetadataMode: 'mask',
      webrtcMode: 'fake',
      geolocationMode: 'fake',
      geolocationLatitude: 34.0522,
      geolocationLongitude: -118.2437,
      os: 'Windows 11',
      osVersion: '11',
      isActive: true,
    },
    {
      name: 'Windows 10 - Chrome 135 - Intel Iris Xe',
      description: 'Mid-range Windows 10 configuration with Intel integrated graphics',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
      platform: 'Win32',
      uaPlatform: 'Windows',
      uaPlatformVersion: '10.0.0',
      uaFullVersion: '135.0.6778.85',
      uaMobile: false,
      browserVersion: 135,
      hardwareConcurrency: 8,
      deviceMemory: 8,
      webglVendor: 'Intel Inc.',
      webglRenderer: 'Intel Iris Xe Graphics',
      screenWidth: 1920,
      screenHeight: 1080,
      colorDepth: 24,
      pixelRatio: 1.0,
      languages: ['en-US', 'en'],
      timezone: 'Europe/London',
      canvasMode: 'noise',
      audioContextMode: 'noise',
      webglMetadataMode: 'mask',
      webrtcMode: 'fake',
      geolocationMode: 'fake',
      geolocationLatitude: 51.5074,
      geolocationLongitude: -0.1278,
      os: 'Windows 10',
      osVersion: '10',
      isActive: true,
    },
    // macOS Presets
    {
      name: 'macOS - Chrome 140 - Apple M2 Max',
      description: 'High-end macOS configuration with Apple M2 Max',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
      platform: 'MacIntel',
      uaPlatform: 'macOS',
      uaPlatformVersion: '13.0.0',
      uaFullVersion: '140.0.6099.71',
      uaMobile: false,
      browserVersion: 140,
      hardwareConcurrency: 12,
      deviceMemory: 32,
      webglVendor: 'Apple Inc.',
      webglRenderer: 'Apple M2 Max',
      screenWidth: 2560,
      screenHeight: 1600,
      colorDepth: 24,
      pixelRatio: 2.0,
      languages: ['en-US', 'en'],
      timezone: 'America/Los_Angeles',
      canvasMode: 'noise',
      audioContextMode: 'noise',
      webglMetadataMode: 'mask',
      webrtcMode: 'fake',
      geolocationMode: 'fake',
      geolocationLatitude: 37.7749,
      geolocationLongitude: -122.4194,
      os: 'macOS',
      osVersion: '14',
      isActive: true,
    },
    {
      name: 'macOS - Chrome 138 - Apple M1',
      description: 'Mid-range macOS configuration with Apple M1',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
      platform: 'MacIntel',
      uaPlatform: 'macOS',
      uaPlatformVersion: '13.0.0',
      uaFullVersion: '138.0.5993.88',
      uaMobile: false,
      browserVersion: 138,
      hardwareConcurrency: 8,
      deviceMemory: 16,
      webglVendor: 'Apple Inc.',
      webglRenderer: 'Apple M1',
      screenWidth: 1920,
      screenHeight: 1080,
      colorDepth: 24,
      pixelRatio: 2.0,
      languages: ['en-US', 'en'],
      timezone: 'Europe/London',
      canvasMode: 'noise',
      audioContextMode: 'noise',
      webglMetadataMode: 'mask',
      webrtcMode: 'fake',
      geolocationMode: 'fake',
      geolocationLatitude: 51.5074,
      geolocationLongitude: -0.1278,
      os: 'macOS',
      osVersion: '13',
      isActive: true,
    },
  ];

  for (const presetData of samplePresets) {
    try {
      await prisma.fingerprintPreset.upsert({
        where: { name: presetData.name },
        update: presetData,
        create: presetData,
      });
    } catch (error: any) {
      console.warn(`⚠️  Failed to seed preset "${presetData.name}":`, error.message);
    }
  }
  console.log(`✅ Created ${samplePresets.length} Fingerprint Presets`);

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
