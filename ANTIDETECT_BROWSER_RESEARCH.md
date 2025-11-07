# Nghiên Cứu Anti-Detect Browser: GoLogin, GenLogin, GemLogin, GPM Login, MostLogin

## Tổng Quan

Tài liệu này tổng hợp nghiên cứu về các phần mềm anti-detect browser hàng đầu, bao gồm các thuật toán, logic, kỹ thuật fingerprinting và cách implement.

---

## 1. Các Phần Mềm Nghiên Cứu

### 1.1 GoLogin
- **Công nghệ**: Trình duyệt Orbita (Chromium tùy chỉnh)
- **Ngôn ngữ**: JavaScript, C++ (dự đoán)
- **Đặc điểm**:
  - Canvas: Noise, Block, Off
  - WebGL: Mask, Real
  - AudioContext: Noise, Off
  - ClientRects: Noise, Off
  - WebRTC IP leak protection
  - Geolocation spoofing

### 1.2 GenLogin
- **Công nghệ**: Cloud-based, No-code platform
- **Đặc điểm**:
  - Đồng bộ đám mây
  - Quản lý profile không giới hạn
  - Proxy integration
  - Thiết lập nâng cao: màn hình, ổ cứng, ngôn ngữ, Canvas, WebGL

### 1.3 GemLogin
- **Công nghệ**: Antidetect Browser + Automation Platform
- **Đặc điểm**:
  - Drag & drop automation
  - GemStore (marketplace)
  - Chống truy vết mạnh mẽ
  - Thay đổi vân tay trình duyệt và thông tin thiết bị

### 1.4 GPM Login
- **Công nghệ**: Chromium & Firefox based
- **Đặc điểm**:
  - Sync action (copy actions across browsers)
  - No-code automation
  - Profile management
  - Cập nhật thường xuyên

### 1.5 MostLogin
- **Công nghệ**: Free alternative
- **Đặc điểm**:
  - Unlimited profiles
  - Browser isolation
  - Customizable extensions
  - Team collaboration
  - Free API

---

## 2. Các Kỹ Thuật Fingerprinting

### 2.1 Canvas Fingerprinting

**Cách hoạt động:**
- Vẽ text/graphics lên Canvas
- Lấy pixel data qua `toDataURL()` hoặc `getImageData()`
- Hash pixel data để tạo fingerprint

**Các chế độ chống phát hiện:**

#### Noise Mode
```javascript
// Thêm nhiễu ngẫu nhiên vào Canvas output
const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
HTMLCanvasElement.prototype.toDataURL = function(type, quality) {
  const imageData = this.getContext('2d').getImageData(0, 0, this.width, this.height);
  const data = imageData.data;
  
  // Thêm noise dựa trên profileId để đảm bảo tính nhất quán
  const seed = profileId; // Sử dụng profileId làm seed
  for (let i = 0; i < data.length; i += 4) {
    if (Math.random() < 0.01) { // 1% pixels bị thay đổi
      const noise = (seed + i) % 10 - 5; // Noise từ -5 đến 5
      data[i] = Math.max(0, Math.min(255, data[i] + noise));     // R
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); // G
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)); // B
    }
  }
  
  this.getContext('2d').putImageData(imageData, 0, 0);
  return originalToDataURL.call(this, type, quality);
};
```

#### Block Mode
```javascript
// Chặn hoàn toàn việc đọc Canvas
HTMLCanvasElement.prototype.toDataURL = function() {
  throw new Error('Canvas access blocked');
};

CanvasRenderingContext2D.prototype.getImageData = function() {
  throw new Error('Canvas access blocked');
};
```

#### Off Mode
```javascript
// Không can thiệp, trả về giá trị thật
// Không cần override
```

### 2.2 WebGL Fingerprinting

**Các thông số được fingerprint:**
- WebGL Vendor
- WebGL Renderer
- WebGL Version
- WebGL Shading Language Version
- WebGL Extensions
- WebGL Parameters (MAX_TEXTURE_SIZE, MAX_VIEWPORT_DIMS, etc.)

**Các chế độ:**

#### Mask Mode
```javascript
// Thay đổi WebGL parameters để mask fingerprint
const originalGetParameter = WebGLRenderingContext.prototype.getParameter;
WebGLRenderingContext.prototype.getParameter = function(parameter) {
  const profileId = getProfileId();
  
  // Mask các thông số quan trọng
  if (parameter === this.VENDOR) {
    return maskVendor(profileId); // Trả về vendor giả dựa trên profileId
  }
  if (parameter === this.RENDERER) {
    return maskRenderer(profileId); // Trả về renderer giả
  }
  if (parameter === this.SHADING_LANGUAGE_VERSION) {
    return maskShadingVersion(profileId);
  }
  
  return originalGetParameter.call(this, parameter);
};

function maskVendor(profileId) {
  const vendors = [
    'Google Inc. (Intel)',
    'Google Inc. (NVIDIA)',
    'Google Inc. (AMD)',
    'Google Inc. (Apple)'
  ];
  return vendors[profileId % vendors.length];
}
```

#### Real Mode
```javascript
// Trả về giá trị thật từ GPU
// Không cần override
```

#### WebGL Image Mode (Noise/Off)
```javascript
// Tương tự Canvas, thêm noise vào WebGL image data
const originalReadPixels = WebGLRenderingContext.prototype.readPixels;
WebGLRenderingContext.prototype.readPixels = function(x, y, width, height, format, type, pixels) {
  originalReadPixels.call(this, x, y, width, height, format, type, pixels);
  
  if (canvasMode === 'Noise') {
    addNoiseToPixels(pixels, profileId);
  }
};
```

### 2.3 AudioContext Fingerprinting

**Cách hoạt động:**
- Tạo AudioContext và OscillatorNode
- Phân tích frequency data
- Hash frequency data để tạo fingerprint

**Chế độ Noise:**
```javascript
const originalCreateOscillator = AudioContext.prototype.createOscillator;
AudioContext.prototype.createOscillator = function() {
  const oscillator = originalCreateOscillator.call(this);
  const profileId = getProfileId();
  
  const originalStart = oscillator.start;
  oscillator.start = function(when) {
    // Thêm noise vào frequency
    const baseFreq = this.frequency.value;
    const noise = (profileId % 100) / 1000; // Noise nhỏ
    this.frequency.value = baseFreq + noise;
    originalStart.call(this, when);
  };
  
  return oscillator;
};
```

### 2.4 ClientRects Fingerprinting

**Cách hoạt động:**
- Sử dụng `getBoundingClientRect()` để lấy vị trí element
- Các giá trị có thể bị làm tròn khác nhau giữa các trình duyệt/OS

**Chế độ Noise:**
```javascript
const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
Element.prototype.getBoundingClientRect = function() {
  const rect = originalGetBoundingClientRect.call(this);
  const profileId = getProfileId();
  
  // Thêm noise nhỏ vào các giá trị
  const noiseX = (profileId % 10) / 100; // 0.00 - 0.09
  const noiseY = ((profileId * 7) % 10) / 100;
  
  return {
    ...rect,
    x: rect.x + noiseX,
    y: rect.y + noiseY,
    left: rect.left + noiseX,
    top: rect.top + noiseY,
    right: rect.right + noiseX,
    bottom: rect.bottom + noiseY,
    width: rect.width,
    height: rect.height
  };
};
```

### 2.5 WebRTC IP Leak

**Cách chống:**
```javascript
// Chặn WebRTC để tránh leak IP thật
const originalCreateOffer = RTCPeerConnection.prototype.createOffer;
RTCPeerConnection.prototype.createOffer = function() {
  if (!webrtcMainIP) {
    // Chặn WebRTC hoàn toàn
    return Promise.reject(new Error('WebRTC blocked'));
  }
  return originalCreateOffer.call(this);
};

// Hoặc sử dụng proxy IP
const originalCreateAnswer = RTCPeerConnection.prototype.createAnswer;
RTCPeerConnection.prototype.createAnswer = function() {
  // Sử dụng proxy IP thay vì IP thật
  return originalCreateAnswer.call(this);
};
```

### 2.6 Geolocation Spoofing

```javascript
const originalGetCurrentPosition = navigator.geolocation.getCurrentPosition;
navigator.geolocation.getCurrentPosition = function(success, error, options) {
  if (geoEnabled && customGeo) {
    success({
      coords: {
        latitude: customGeo.lat,
        longitude: customGeo.lng,
        accuracy: 10
      },
      timestamp: Date.now()
    });
  } else {
    originalGetCurrentPosition.call(this, success, error, options);
  }
};
```

---

## 3. User Agent & OS Matching

### 3.1 User Agent Generation

**Yêu cầu:**
- UA phải khớp với OS đã chọn
- UA phải khớp với Browser version
- UA phải unique cho mỗi profile

**Format chuẩn:**
```
Mozilla/5.0 (PLATFORM) AppleWebKit/VERSION (KHTML, like Gecko) Chrome/VERSION Safari/VERSION
```

**Platform strings:**
- Windows: `Windows NT 10.0; Win64; x64` (Windows 10/11)
- macOS Intel: `Macintosh; Intel Mac OS X 10_15_7`
- macOS M1/M2/M3/M4: `Macintosh; Intel Mac OS X 10_15_7` (hoặc ARM-specific)
- Linux: `X11; Linux x86_64`
- Android: `Linux; Android 11; ...`
- iOS: `iPhone; CPU iPhone OS 14_0 like Mac OS X`

### 3.2 OS Detection & Normalization

```javascript
function normalizeOS(os) {
  if (!os) return 'Windows';
  const lower = os.toLowerCase();
  if (lower.includes('mac') || lower.includes('macos')) return 'Mac OS';
  if (lower.includes('linux')) return 'Linux';
  if (lower.includes('android')) return 'Android';
  if (lower.includes('ios')) return 'iOS';
  if (lower.includes('windows')) return 'Windows';
  return os;
}
```

---

## 4. Các Thông Số Profile Quan Trọng

### 4.1 Thông Số Cơ Bản
- **Name**: Tên profile
- **User Agent**: Chuỗi UA
- **OS**: Hệ điều hành (Windows 10/11, macOS, Linux, Android, iOS)
- **OS Architecture**: x64, x86, ARM
- **Browser Version**: Chrome/Firefox/Edge version
- **Screen Resolution**: 1920x1080, 1366x768, etc.
- **Timezone**: UTC offset
- **Language**: en-US, vi-VN, etc.

### 4.2 Thông Số Fingerprinting
- **Canvas Mode**: Noise, Block, Off
- **WebGL Image Mode**: Noise, Off
- **WebGL Meta Mode**: Mask, Real
- **AudioContext Mode**: Noise, Off
- **ClientRects Mode**: Noise, Off
- **Geolocation**: Enabled/Disabled + Coordinates
- **WebRTC Main IP**: Enabled/Disabled
- **MAC Address**: Unique MAC cho mỗi profile

### 4.3 Thông Số Proxy
- **Proxy Mode**: Manual, Library
- **Proxy Host**: IP hoặc domain
- **Proxy Port**: Port number
- **Proxy Username**: Optional
- **Proxy Password**: Optional
- **Proxy Type**: HTTP, SOCKS5, etc.

---

## 5. Implementation Best Practices

### 5.1 Deterministic Noise
- Sử dụng `profileId` làm seed cho random number generator
- Đảm bảo noise nhất quán giữa các lần load
- Tránh noise quá lớn (có thể phát hiện)

### 5.2 Consistency Check
- Đảm bảo UA khớp với OS
- Đảm bảo screen resolution hợp lý với OS
- Đảm bảo timezone khớp với geolocation
- Đảm bảo language khớp với OS locale

### 5.3 Uniqueness
- User Agent phải unique
- MAC Address phải unique
- Canvas fingerprint phải unique (nếu dùng Noise)
- WebGL fingerprint phải unique (nếu dùng Mask)

### 5.4 Performance
- Inject scripts trước khi page load
- Sử dụng `page.addInitScript()` trong Puppeteer/Playwright
- Minimize script size
- Cache fingerprint values

---

## 6. Code Structure Example

```typescript
interface FingerprintConfig {
  osName: string;
  osArch: 'x64' | 'x86' | 'arm';
  browserVersion: number;
  screenWidth: number;
  screenHeight: number;
  canvasMode: 'Noise' | 'Block' | 'Off';
  clientRectsMode: 'Noise' | 'Off';
  audioCtxMode: 'Noise' | 'Off';
  webglImageMode: 'Noise' | 'Off';
  webglMetaMode: 'Mask' | 'Real';
  geoEnabled: boolean;
  webrtcMainIP: boolean;
  ua: string;
  mac: string;
  profileId: number;
}

function buildStealthScript(config: FingerprintConfig): string {
  return `
    (function() {
      const config = ${JSON.stringify(config)};
      
      // Canvas spoofing
      if (config.canvasMode === 'Noise') {
        // Inject canvas noise code
      } else if (config.canvasMode === 'Block') {
        // Block canvas access
      }
      
      // WebGL spoofing
      if (config.webglMetaMode === 'Mask') {
        // Mask WebGL parameters
      }
      
      // AudioContext spoofing
      if (config.audioCtxMode === 'Noise') {
        // Add audio noise
      }
      
      // ClientRects spoofing
      if (config.clientRectsMode === 'Noise') {
        // Add rects noise
      }
      
      // WebRTC blocking
      if (!config.webrtcMainIP) {
        // Block WebRTC
      }
      
      // Geolocation spoofing
      if (config.geoEnabled) {
        // Spoof geolocation
      }
      
      // User Agent
      Object.defineProperty(navigator, 'userAgent', {
        get: () => config.ua
      });
      
      // Platform
      Object.defineProperty(navigator, 'platform', {
        get: () => config.osName.includes('Mac') ? 'MacIntel' : 'Win32'
      });
    })();
  `;
}
```

---

## 7. Testing & Validation

### 7.1 Fingerprint Testing Sites
- https://browserleaks.com/canvas
- https://browserleaks.com/webgl
- https://browserleaks.com/audio
- https://coveryourtracks.eff.org/
- https://pixelscan.net/

### 7.2 Validation Checklist
- [ ] Canvas fingerprint unique và nhất quán
- [ ] WebGL fingerprint unique và nhất quán
- [ ] AudioContext fingerprint unique và nhất quán
- [ ] User Agent khớp với OS
- [ ] Screen resolution hợp lý
- [ ] Timezone khớp với geolocation
- [ ] WebRTC không leak IP thật
- [ ] Geolocation trả về đúng giá trị
- [ ] MAC Address unique
- [ ] Profile không bị duplicate

---

## 8. Tài Liệu Tham Khảo

### 8.1 Official Documentation
- GoLogin: https://support.gologin.com/
- GenLogin: https://login-gen.gitbook.io/
- GemLogin: https://gemlogin.vn/
- GPM Login: https://docs.gpmloginapp.com/
- MostLogin: https://www.mostlogin.com/

### 8.2 Technical Resources
- Browser Fingerprinting: https://github.com/fingerprintjs/fingerprintjs
- Canvas Fingerprinting: https://browserleaks.com/canvas
- WebGL Fingerprinting: https://browserleaks.com/webgl
- Audio Fingerprinting: https://browserleaks.com/audio

---

## 9. Kết Luận

Các phần mềm anti-detect browser sử dụng nhiều kỹ thuật phức tạp để tạo ra các profile trình duyệt độc lập:

1. **Fingerprinting Spoofing**: Canvas, WebGL, AudioContext, ClientRects
2. **Network Protection**: WebRTC blocking, Proxy support
3. **Consistency**: UA-OS matching, Screen resolution, Timezone
4. **Uniqueness**: Unique UA, MAC Address, Fingerprints
5. **Deterministic**: Sử dụng seed để đảm bảo tính nhất quán

Việc implement đòi hỏi:
- Hiểu rõ các kỹ thuật fingerprinting
- Đảm bảo tính nhất quán giữa các thông số
- Đảm bảo tính duy nhất cho mỗi profile
- Performance optimization
- Testing kỹ lưỡng

