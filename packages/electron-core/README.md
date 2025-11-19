# Electron Core - NTGLogin Browser Engine

## Mô tả

Package này chứa lõi Electron để khởi chạy browser profiles với fingerprint spoofing ở tầng sâu nhất.

## Kiến trúc

### Main Process (`src/main.ts`)
- **Session Partition**: Mỗi profile có partition riêng (`persist:PROFILE{id}`) để isolated storage
- **webRequest API**: Can thiệp vào headers (User-Agent, Client Hints) ở tầng mạng
- **BrowserWindow**: Tạo window với preload script
- **IPC Handlers**: `get-injection-script` để load injection script từ file

### Preload Script (`src/preload.ts`)
- Chạy trong browser context với `contextIsolation: true`
- Nhận fingerprint config từ main process qua IPC
- Load và execute `injection_script.js` với placeholders đã được thay thế
- Apply basic fingerprint ngay lập tức

## Cài đặt

```bash
cd packages/electron-core
npm install
npm run build
```

## Sử dụng

```typescript
import { launchProfileWindow } from '@ntglogin/electron-core'

const win = await launchProfileWindow({
  id: 1,
  name: 'Test Profile',
  userAgent: 'Mozilla/5.0...',
  // ... other config
})
```

## Tích hợp với Backend

Backend tự động sử dụng Electron khi:
- `USE_ELECTRON !== 'false'` (default: true)
- Electron package đã được install

Fallback về Playwright/Puppeteer nếu Electron không available.

## Lợi ích so với Playwright/Puppeteer

1. **Session Partition**: Isolated storage thực sự, không phải user-data-dir
2. **webRequest API**: Can thiệp headers ở tầng mạng, trước khi request được gửi
3. **Preload Script**: Chạy trước bất kỳ script nào của trang web
4. **Chromium Flags**: Toàn quyền kiểm soát các cờ khởi chạy
5. **Native Integration**: Không cần external browser process

