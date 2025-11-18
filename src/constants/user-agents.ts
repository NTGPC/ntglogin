// File: src/constants/user-agents.ts
// Thư viện User-Agent hoàn chỉnh cho các hệ điều hành và trình duyệt phổ biến

export const USER_AGENT_LIBRARY = [
  // --- Windows ---
  { 
    name: "Windows 11 - Chrome 120", 
    value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    os: "Windows 11"
  },
  { 
    name: "Windows 10 - Chrome 119", 
    value: "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    os: "Windows 10"
  },
  { 
    name: "Windows 11 - Firefox 120", 
    value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0",
    os: "Windows 11"
  },
  { 
    name: "Windows 10 - Edge 119", 
    value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.2151.44",
    os: "Windows 10"
  },
  
  // --- macOS ---
  { 
    name: "macOS Sonoma - Chrome 120", 
    value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    os: "macOS"
  },
  { 
    name: "macOS Ventura - Safari 17", 
    value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
    os: "macOS"
  },
  { 
    name: "macOS Monterey - Firefox 119", 
    value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:119.0) Gecko/20100101 Firefox/119.0",
    os: "macOS"
  },
  
  // --- Linux ---
  { 
    name: "Linux Ubuntu - Chrome 120", 
    value: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    os: "Linux"
  },
  { 
    name: "Linux Ubuntu - Firefox 120", 
    value: "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0",
    os: "Linux"
  },
  
  // --- Mobile ---
  { 
    name: "Android 13 - Samsung S23", 
    value: "Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36",
    os: "Android"
  },
  { 
    name: "iOS 17 - iPhone 15 Pro", 
    value: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1",
    os: "iOS"
  },
];

