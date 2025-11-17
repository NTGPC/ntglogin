import fs from 'fs';
import path from 'path';

let gpuList: any[] = [];
let isLoaded = false;

export interface GPUEntry {
  brand: string;
  series: string;
  model: string;
  device_id: string;
  device_id_decimal: number;
  architecture: string;
  directx: string;
  shader_model: string;
  angle: string;
}

export function loadGPUData(): GPUEntry[] {
  if (isLoaded && gpuList.length > 0) {
    return gpuList;
  }

  try {
    const gpuDataPath = path.join(process.cwd(), 'data', 'gpu_full_angle.json');
    
    if (!fs.existsSync(gpuDataPath)) {
      console.error(`[GPU Service] File không tồn tại: ${gpuDataPath}`);
      return [];
    }

    const rawData = fs.readFileSync(gpuDataPath, 'utf-8');
    gpuList = JSON.parse(rawData);
    isLoaded = true;

    console.log(`[GPU Service] ✅ Đã tải thành công ${gpuList.length} card đồ họa.`);
    return gpuList;
  } catch (error) {
    console.error('[GPU Service] ❌ Lỗi khi tải file GPU JSON:', error);
    return [];
  }
}

export function getGPUList(): GPUEntry[] {
  if (!isLoaded) {
    loadGPUData();
  }
  return gpuList;
}

export function getGPUByAngle(angle: string): GPUEntry | undefined {
  if (!isLoaded) {
    loadGPUData();
  }
  return gpuList.find(gpu => gpu.angle === angle);
}

export function getGPUsByBrand(brand: string): GPUEntry[] {
  if (!isLoaded) {
    loadGPUData();
  }
  return gpuList.filter(gpu => gpu.brand.toLowerCase() === brand.toLowerCase());
}

export function getGPUsBySeries(series: string): GPUEntry[] {
  if (!isLoaded) {
    loadGPUData();
  }
  return gpuList.filter(gpu => gpu.series.toLowerCase() === series.toLowerCase());
}

