import fs from 'fs';
import path from 'path';

let userAgentList: any[] = [];
let isLoaded = false;

export interface UserAgentEntry {
  name: string;
  value: string;
  os: string;
}

export function loadUserAgentLibrary(): UserAgentEntry[] {
  if (isLoaded && userAgentList.length > 0) {
    return userAgentList;
  }

  try {
    const uaDataPath = path.join(process.cwd(), 'data', 'user_agents.json');
    
    if (!fs.existsSync(uaDataPath)) {
      console.error(`[UserAgent Library] File không tồn tại: ${uaDataPath}`);
      return [];
    }

    const rawData = fs.readFileSync(uaDataPath, 'utf-8');
    userAgentList = JSON.parse(rawData);
    isLoaded = true;

    console.log(`[UserAgent Library] ✅ Đã tải thành công ${userAgentList.length} User-Agents.`);
    return userAgentList;
  } catch (error) {
    console.error('[UserAgent Library] ❌ Lỗi khi tải file User-Agent JSON:', error);
    return [];
  }
}

export function getUserAgentList(): UserAgentEntry[] {
  if (!isLoaded) {
    loadUserAgentLibrary();
  }
  return userAgentList;
}

export function getUserAgentByValue(value: string): UserAgentEntry | undefined {
  if (!isLoaded) {
    loadUserAgentLibrary();
  }
  return userAgentList.find(ua => ua.value === value);
}

export function getUserAgentsByOS(os: string): UserAgentEntry[] {
  if (!isLoaded) {
    loadUserAgentLibrary();
  }
  return userAgentList.filter(ua => ua.os.toLowerCase() === os.toLowerCase());
}

