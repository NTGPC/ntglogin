// File: packages/admin-web/src/constants/webgl-renderers.ts
// Thư viện card đồ họa cho WebGL fingerprinting - CHỈ Windows và macOS

export interface WebGLRenderer {
  vendor: string;
  renderer: string;
  category: 'Intel' | 'NVIDIA' | 'AMD' | 'Apple';
  os: string[]; // OS tương thích: 'Windows' hoặc 'macOS'
}

export const WEBGL_RENDERER_LIBRARY: WebGLRenderer[] = [
  // === INTEL (Windows & macOS) ===
  { vendor: 'Intel Inc.', renderer: 'Intel Iris OpenGL Engine', category: 'Intel', os: ['Windows', 'macOS'] },
  { vendor: 'Intel Inc.', renderer: 'Intel Iris Pro OpenGL Engine', category: 'Intel', os: ['Windows', 'macOS'] },
  { vendor: 'Intel Inc.', renderer: 'Intel HD Graphics 630', category: 'Intel', os: ['Windows'] },
  { vendor: 'Intel Inc.', renderer: 'Intel HD Graphics 620', category: 'Intel', os: ['Windows'] },
  { vendor: 'Intel Inc.', renderer: 'Intel UHD Graphics 620', category: 'Intel', os: ['Windows'] },
  { vendor: 'Intel Inc.', renderer: 'Intel UHD Graphics 630', category: 'Intel', os: ['Windows'] },
  { vendor: 'Intel Inc.', renderer: 'Intel Iris Xe Graphics', category: 'Intel', os: ['Windows'] },
  { vendor: 'Intel Inc.', renderer: 'Intel Arc A380', category: 'Intel', os: ['Windows'] },
  { vendor: 'Intel Inc.', renderer: 'Intel Arc A750', category: 'Intel', os: ['Windows'] },
  { vendor: 'Intel Inc.', renderer: 'Intel Arc A770', category: 'Intel', os: ['Windows'] },
  { vendor: 'Intel Inc.', renderer: 'Intel(R) UHD Graphics 620', category: 'Intel', os: ['Windows'] },
  { vendor: 'Intel Inc.', renderer: 'Intel(R) HD Graphics 520', category: 'Intel', os: ['Windows'] },
  { vendor: 'Intel Inc.', renderer: 'Intel(R) HD Graphics 4000', category: 'Intel', os: ['Windows'] },
  { vendor: 'Intel Inc.', renderer: 'Intel(R) HD Graphics 3000', category: 'Intel', os: ['Windows'] },
  { vendor: 'Intel Inc.', renderer: 'Intel(R) GMA 950', category: 'Intel', os: ['Windows'] },

  // === NVIDIA (Windows) ===
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce GTX 1060/PCIe/SSE2', category: 'NVIDIA', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce GTX 1070/PCIe/SSE2', category: 'NVIDIA', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce GTX 1080/PCIe/SSE2', category: 'NVIDIA', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce RTX 2060/PCIe/SSE2', category: 'NVIDIA', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce RTX 2070/PCIe/SSE2', category: 'NVIDIA', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce RTX 2080/PCIe/SSE2', category: 'NVIDIA', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce RTX 3060/PCIe/SSE2', category: 'NVIDIA', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce RTX 3070/PCIe/SSE2', category: 'NVIDIA', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce RTX 3080/PCIe/SSE2', category: 'NVIDIA', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce RTX 3090/PCIe/SSE2', category: 'NVIDIA', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce RTX 4060/PCIe/SSE2', category: 'NVIDIA', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce RTX 4070/PCIe/SSE2', category: 'NVIDIA', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce RTX 4080/PCIe/SSE2', category: 'NVIDIA', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce RTX 4090/PCIe/SSE2', category: 'NVIDIA', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce GTX 1650/PCIe/SSE2', category: 'NVIDIA', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce GTX 1660/PCIe/SSE2', category: 'NVIDIA', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce GTX 1660 Ti/PCIe/SSE2', category: 'NVIDIA', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce MX150/PCIe/SSE2', category: 'NVIDIA', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce MX250/PCIe/SSE2', category: 'NVIDIA', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce MX350/PCIe/SSE2', category: 'NVIDIA', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA Quadro P1000/PCIe/SSE2', category: 'NVIDIA', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA Quadro P2000/PCIe/SSE2', category: 'NVIDIA', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA Quadro RTX 4000/PCIe/SSE2', category: 'NVIDIA', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA Quadro RTX 5000/PCIe/SSE2', category: 'NVIDIA', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce GTX 1050 Ti/PCIe/SSE2', category: 'NVIDIA', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce GTX 1050/PCIe/SSE2', category: 'NVIDIA', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce GT 1030/PCIe/SSE2', category: 'NVIDIA', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce GT 730/PCIe/SSE2', category: 'NVIDIA', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce GT 710/PCIe/SSE2', category: 'NVIDIA', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce GTX 750 Ti/PCIe/SSE2', category: 'NVIDIA', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce GTX 960/PCIe/SSE2', category: 'NVIDIA', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce GTX 970/PCIe/SSE2', category: 'NVIDIA', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce GTX 980/PCIe/SSE2', category: 'NVIDIA', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce GTX 980 Ti/PCIe/SSE2', category: 'NVIDIA', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce GTX TITAN X/PCIe/SSE2', category: 'NVIDIA', os: ['Windows'] },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce GTX TITAN Z/PCIe/SSE2', category: 'NVIDIA', os: ['Windows'] },

  // === AMD (Windows) ===
  { vendor: 'Advanced Micro Devices, Inc.', renderer: 'AMD Radeon RX 580 Series', category: 'AMD', os: ['Windows'] },
  { vendor: 'Advanced Micro Devices, Inc.', renderer: 'AMD Radeon RX 590 Series', category: 'AMD', os: ['Windows'] },
  { vendor: 'Advanced Micro Devices, Inc.', renderer: 'AMD Radeon RX 5500 XT', category: 'AMD', os: ['Windows'] },
  { vendor: 'Advanced Micro Devices, Inc.', renderer: 'AMD Radeon RX 5600 XT', category: 'AMD', os: ['Windows'] },
  { vendor: 'Advanced Micro Devices, Inc.', renderer: 'AMD Radeon RX 5700 XT', category: 'AMD', os: ['Windows'] },
  { vendor: 'Advanced Micro Devices, Inc.', renderer: 'AMD Radeon RX 6600 XT', category: 'AMD', os: ['Windows'] },
  { vendor: 'Advanced Micro Devices, Inc.', renderer: 'AMD Radeon RX 6700 XT', category: 'AMD', os: ['Windows'] },
  { vendor: 'Advanced Micro Devices, Inc.', renderer: 'AMD Radeon RX 6800 XT', category: 'AMD', os: ['Windows'] },
  { vendor: 'Advanced Micro Devices, Inc.', renderer: 'AMD Radeon RX 6900 XT', category: 'AMD', os: ['Windows'] },
  { vendor: 'Advanced Micro Devices, Inc.', renderer: 'AMD Radeon RX 7600', category: 'AMD', os: ['Windows'] },
  { vendor: 'Advanced Micro Devices, Inc.', renderer: 'AMD Radeon RX 7700 XT', category: 'AMD', os: ['Windows'] },
  { vendor: 'Advanced Micro Devices, Inc.', renderer: 'AMD Radeon RX 7800 XT', category: 'AMD', os: ['Windows'] },
  { vendor: 'Advanced Micro Devices, Inc.', renderer: 'AMD Radeon RX 7900 XT', category: 'AMD', os: ['Windows'] },
  { vendor: 'Advanced Micro Devices, Inc.', renderer: 'AMD Radeon RX 7900 XTX', category: 'AMD', os: ['Windows'] },
  { vendor: 'Advanced Micro Devices, Inc.', renderer: 'AMD Radeon R9 390', category: 'AMD', os: ['Windows'] },
  { vendor: 'Advanced Micro Devices, Inc.', renderer: 'AMD Radeon R9 390X', category: 'AMD', os: ['Windows'] },
  { vendor: 'Advanced Micro Devices, Inc.', renderer: 'AMD Radeon R7 370', category: 'AMD', os: ['Windows'] },
  { vendor: 'Advanced Micro Devices, Inc.', renderer: 'AMD Radeon R7 260X', category: 'AMD', os: ['Windows'] },
  { vendor: 'Advanced Micro Devices, Inc.', renderer: 'AMD Radeon HD 7870', category: 'AMD', os: ['Windows'] },
  { vendor: 'Advanced Micro Devices, Inc.', renderer: 'AMD Radeon HD 7850', category: 'AMD', os: ['Windows'] },
  { vendor: 'Advanced Micro Devices, Inc.', renderer: 'AMD Radeon Pro WX 7100', category: 'AMD', os: ['Windows'] },
  { vendor: 'Advanced Micro Devices, Inc.', renderer: 'AMD Radeon Pro WX 8200', category: 'AMD', os: ['Windows'] },

  // === APPLE (macOS) ===
  { vendor: 'Apple Inc.', renderer: 'Apple M1', category: 'Apple', os: ['macOS'] },
  { vendor: 'Apple Inc.', renderer: 'Apple M1 Pro', category: 'Apple', os: ['macOS'] },
  { vendor: 'Apple Inc.', renderer: 'Apple M1 Max', category: 'Apple', os: ['macOS'] },
  { vendor: 'Apple Inc.', renderer: 'Apple M1 Ultra', category: 'Apple', os: ['macOS'] },
  { vendor: 'Apple Inc.', renderer: 'Apple M2', category: 'Apple', os: ['macOS'] },
  { vendor: 'Apple Inc.', renderer: 'Apple M2 Pro', category: 'Apple', os: ['macOS'] },
  { vendor: 'Apple Inc.', renderer: 'Apple M2 Max', category: 'Apple', os: ['macOS'] },
  { vendor: 'Apple Inc.', renderer: 'Apple M2 Ultra', category: 'Apple', os: ['macOS'] },
  { vendor: 'Apple Inc.', renderer: 'Apple M3', category: 'Apple', os: ['macOS'] },
  { vendor: 'Apple Inc.', renderer: 'Apple M3 Pro', category: 'Apple', os: ['macOS'] },
  { vendor: 'Apple Inc.', renderer: 'Apple M3 Max', category: 'Apple', os: ['macOS'] },
  { vendor: 'Apple Inc.', renderer: 'Apple M3 Ultra', category: 'Apple', os: ['macOS'] },
  { vendor: 'Apple Inc.', renderer: 'Apple GPU', category: 'Apple', os: ['macOS'] },

  // === INTEL IRIS TRÊN MAC (macOS) ===
  { vendor: 'Apple Inc.', renderer: 'Intel Iris Pro OpenGL Engine', category: 'Apple', os: ['macOS'] },
  { vendor: 'Apple Inc.', renderer: 'Intel Iris Plus Graphics 640', category: 'Apple', os: ['macOS'] },
  { vendor: 'Apple Inc.', renderer: 'Intel Iris Graphics 6100', category: 'Apple', os: ['macOS'] },
  { vendor: 'Apple Inc.', renderer: 'Intel Iris Graphics 550', category: 'Apple', os: ['macOS'] },
  { vendor: 'Apple Inc.', renderer: 'Intel Iris Graphics 540', category: 'Apple', os: ['macOS'] },

  // === AMD RADEON PRO TRÊN MAC (macOS) ===
  { vendor: 'Apple Inc.', renderer: 'AMD Radeon Pro 5500M', category: 'Apple', os: ['macOS'] },
  { vendor: 'Apple Inc.', renderer: 'AMD Radeon Pro 5600M', category: 'Apple', os: ['macOS'] },
  { vendor: 'Apple Inc.', renderer: 'AMD Radeon Pro 5700 XT', category: 'Apple', os: ['macOS'] },
  { vendor: 'Apple Inc.', renderer: 'AMD Radeon Pro 560X', category: 'Apple', os: ['macOS'] },
  { vendor: 'Apple Inc.', renderer: 'AMD Radeon Pro 570X', category: 'Apple', os: ['macOS'] },
  { vendor: 'Apple Inc.', renderer: 'AMD Radeon Pro 580X', category: 'Apple', os: ['macOS'] },
  { vendor: 'Apple Inc.', renderer: 'AMD Radeon Pro Vega 56', category: 'Apple', os: ['macOS'] },
  { vendor: 'Apple Inc.', renderer: 'AMD Radeon Pro Vega 64', category: 'Apple', os: ['macOS'] },
  { vendor: 'Apple Inc.', renderer: 'AMD Radeon Pro 5300M', category: 'Apple', os: ['macOS'] },
  { vendor: 'Apple Inc.', renderer: 'AMD Radeon Pro 5500M', category: 'Apple', os: ['macOS'] },
];

// Helper functions
export function getWebGLRenderersByOS(os: string): WebGLRenderer[] {
  return WEBGL_RENDERER_LIBRARY.filter(gpu => 
    gpu.os.includes(os) || gpu.os.length === 0
  );
}

export function getWebGLRenderersByCategory(category: WebGLRenderer['category']): WebGLRenderer[] {
  return WEBGL_RENDERER_LIBRARY.filter(gpu => gpu.category === category);
}

export function findWebGLRenderer(renderer: string): WebGLRenderer | undefined {
  return WEBGL_RENDERER_LIBRARY.find(gpu => gpu.renderer === renderer);
}

