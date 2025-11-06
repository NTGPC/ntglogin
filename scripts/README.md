# Python Selenium Wrapper

Script Python để launch browser với fingerprint injection, tương thích với code Node.js.

## Yêu cầu

```bash
pip install selenium
```

## Cài đặt ChromeDriver

1. Tải ChromeDriver từ https://chromedriver.chromium.org/
2. Đặt vào PATH hoặc chỉnh `CHROMEDRIVER_PATH` trong `launch_profile.py`

## Sử dụng

### 1. Tạo profile JSON

Tạo file `profiles/{id}.json` với format:

```json
{
  "name": "Profile 1",
  "seed": 12345,
  "ua": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...",
  "screen": {
    "width": 1920,
    "height": 1080,
    "dpr": 1
  },
  "canvas": {
    "mode": "Noise"
  },
  "webgl": {
    "metaMode": "Mask",
    "imageMode": "Off"
  },
  "audioContext": {
    "mode": "Noise"
  },
  "clientRects": {
    "mode": "Noise"
  },
  "geo": {
    "enabled": false,
    "lat": null,
    "lon": null
  },
  "webrtc": {
    "useMainIP": false
  },
  "test_url": "https://pixelscan.net/fingerprint-check"
}
```

### 2. Chạy script

Sử dụng profile mẫu có sẵn:

```bash
python scripts/launch_profile.py profiles/profile1.json
```

Hoặc tạo profile mới và chạy:

```bash
python scripts/launch_profile.py profiles/your-profile.json
```

### 2b. Test fingerprint injection (nhanh, không cần mở browser)

Chạy test script để kiểm tra fingerprint injection hoạt động đúng:

```bash
python scripts/test_inject_check.py
```

Script này sẽ:
- Load `inject_before_load.js` và inject vào browser
- Navigate đến pixelscan.net
- Test các tính năng:
  - ✅ Fingerprint injection status
  - ✅ navigator.webdriver (should be false)
  - ✅ WebGL vendor/renderer masking
  - ✅ OfflineAudioContext availability
  - ✅ Canvas fingerprint
  - ✅ Navigator properties (hardwareConcurrency, deviceMemory, platform, languages)
- In kết quả ra terminal (không cần mở DevTools)

### 3. Profile mẫu

File `profiles/profile1.json` là một ví dụ đầy đủ với:
- Seed deterministic: `987654321`
- User Agent: Chrome 139 trên Windows
- Screen: 1366x768
- Canvas: Noise mode
- WebGL: Mask mode với custom vendor/renderer
- AudioContext: Noise mode
- ClientRects: Noise mode
- Geolocation: Enabled với tọa độ Hồ Chí Minh
- WebRTC: Hide local IP
- MAC Address: Custom MAC

## WebGL/GPU Renderer Masking (SwiftShader)

Để ép WebGL dùng SwiftShader renderer ở tầng hệ thống (mask GPU driver version), thêm vào profile:

```json
{
  "webgl": {
    "metaMode": "Mask",
    "useSwiftShader": true
  }
}
```

Khi `useSwiftShader: true`, script sẽ tự động thêm các Chrome flags:
- `--use-gl=swiftshader` - ép WebGL dùng SwiftShader
- `--use-angle=swiftshader` - ANGLE -> swiftshader
- `--disable-software-rasterizer=false`

Điều này giúp mask GPU driver version và ANGLE strings ở tầng hệ thống, không chỉ ở JavaScript level.

## Lưu ý

- Script sẽ tự động inject fingerprint JS vào browser trước khi load page
- User data dir được tạo riêng cho mỗi profile trong `user_data/`
- Fingerprint script được inject qua CDP `Page.addScriptToEvaluateOnNewDocument`
- SwiftShader flags được thêm vào Chrome launch args nếu `webgl.useSwiftShader: true`

## Tích hợp với Node.js

Code Node.js trong `src/services/browserService.ts` sử dụng cùng logic fingerprint injection, đảm bảo tương thích giữa Python và Node.js implementations.

