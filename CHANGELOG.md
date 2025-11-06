# Changelog - NTG Login Admin

Tất cả các thay đổi quan trọng của project sẽ được ghi lại trong file này.

## [Unreleased] - 2025-06-11

### Added - Fingerprint Injection System

#### 1. Comprehensive Fingerprint Injection
- **Seeded PRNG (xorshift32)**: Deterministic random number generator với seed per-profile
- **Canvas Fingerprint**: Deterministic noise, Block, hoặc Off mode
- **WebGL/WebGL2 + OffscreenCanvas**: 
  - Mask vendor/renderer (PolyVendor Inc. / PolyRenderer 1.0)
  - Hide debug extensions (WEBGL_debug_renderer_info)
  - Mutate readPixels deterministically
  - getShaderPrecisionFormat override
  - Support OffscreenCanvas contexts
- **Audio Fingerprint**:
  - OfflineAudioContext patch (quan trọng cho audio hash)
  - Realtime Analyser patch
  - Deterministic noise dựa trên seed
- **ClientRects**: Deterministic jitter cho getBoundingClientRect
- **WebRTC**: Filter local IP addresses (hide private IPs)
- **Geolocation**: Fake coordinates support
- **Navigator Properties**: webdriver, hardwareConcurrency, deviceMemory, platform, languages

#### 2. Chrome Flags Support
- **SwiftShader Renderer**: Support `--use-gl=swiftshader` và `--use-angle=swiftshader` để mask GPU driver version ở tầng hệ thống
- Configurable qua `webgl.useSwiftShader` trong profile

#### 3. Profile Management Improvements
- **Isolated Browser Profiles**: Mỗi profile có thư mục `browser_profiles/profile_{id}` riêng
- **Auto Cleanup**: Tự động xóa thư mục browser_profiles khi xóa profile
- **Clean State**: Profile mới luôn bắt đầu với bộ nhớ sạch (cleanup thư mục cũ nếu có)

#### 4. Python Selenium Wrapper
- **`scripts/launch_profile.py`**: Python script để launch browser với fingerprint injection
- **`scripts/inject_before_load.js`**: Standalone fingerprint injection script
- **`scripts/test_inject_check.py`**: Test script để verify fingerprint injection
- **`scripts/export-fingerprint-script.js`**: Script để export fingerprint script từ Node.js

#### 5. Profile JSON Format
- Support profile JSON với các fields:
  - `seed`: Deterministic seed cho fingerprint
  - `ua`: User Agent
  - `screen`: { width, height, dpr }
  - `canvas`: { mode: 'Noise'|'Off'|'Block' }
  - `webgl`: { metaMode: 'Mask'|'Real', vendor, renderer, useSwiftShader }
  - `audioContext`: { mode: 'Noise'|'Off' }
  - `clientRects`: { mode: 'Noise'|'Off' }
  - `geo`: { enabled, lat, lon }
  - `webrtc`: { useMainIP }
  - `mac`: MAC address

### Changed
- **Browser Service**: Cải thiện fingerprint injection với `Object.defineProperty` thay vì gán trực tiếp
- **Profile Service**: Thêm logic cleanup browser_profiles khi xóa/tạo profile
- **Session Service**: Fix foreign key constraint khi proxy_id không tồn tại

### Technical Details

#### Fingerprint Injection Method
- **Puppeteer**: Sử dụng CDP `Page.addScriptToEvaluateOnNewDocument` (fallback về `evaluateOnNewDocument`)
- **Playwright**: Sử dụng `context.addInitScript()` cho tất cả pages
- **Selenium**: Sử dụng CDP `Page.addScriptToEvaluateOnNewDocument`

#### Deterministic Behavior
- Cùng seed → cùng fingerprint hash (Canvas, WebGL, Audio)
- Khác seed → khác fingerprint hash
- Seed được lưu trong profile và inject vào browser

#### Browser Profile Isolation
- Mỗi profile có `user-data-dir` riêng: `browser_profiles/profile_{id}`
- Cookies, history, localStorage, fonts, plugins được tách biệt
- Session directories: `browser_profiles/profile_{id}_session_{sessionId}`

### Files Added
- `scripts/launch_profile.py` - Python Selenium wrapper
- `scripts/inject_before_load.js` - Standalone fingerprint script
- `scripts/test_inject_check.py` - Test script
- `scripts/export-fingerprint-script.js` - Export script
- `scripts/README.md` - Documentation
- `profiles/profile1.json` - Example profile
- `CHANGELOG.md` - This file

### Files Modified
- `src/services/browserService.ts` - Comprehensive fingerprint injection
- `src/services/profileService.ts` - Profile cleanup logic
- `src/services/sessionService.ts` - Proxy foreign key fix
- `packages/admin-web/src/pages/Profiles.tsx` - UI improvements

---

## Previous Versions

### [Initial] - 2025-06-11
- Basic profile management
- Proxy management with liveness check
- Session management
- Basic browser automation

