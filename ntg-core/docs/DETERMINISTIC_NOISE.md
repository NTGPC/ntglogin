# Deterministic Noise - Chiến Lược Nhiễu Xác Định

## Tổng Quan

Deterministic Noise là kỹ thuật tạo nhiễu (noise) vào Canvas fingerprint một cách **xác định** dựa trên một seed cố định. Điều này đảm bảo:

- **Cùng seed → Cùng noise → Fingerprint ổn định**
- **Khác seed → Khác noise → Fingerprint khác nhau**

## Tại Sao Cần Deterministic Noise?

### Vấn Đề Với Random Noise

Nếu mỗi lần F5 lại tạo noise ngẫu nhiên khác nhau:
- Canvas fingerprint sẽ thay đổi mỗi lần
- Website có thể phát hiện: "Fingerprint không ổn định → Có thể là bot"
- Dễ bị flag là automation

### Giải Pháp: Deterministic Noise

Với deterministic noise:
- Cùng profile → Cùng seed → Cùng noise → Fingerprint ổn định
- Website thấy fingerprint ổn định → Tin là real browser
- Khác profile → Khác seed → Khác noise → Fingerprint khác nhau

## Cơ Chế Hoạt Động

### 1. Database Layer

Mỗi profile có một `fingerprintSeed` duy nhất (UUID):
```prisma
model Profile {
  fingerprintSeed String @default(uuid()) // Hạt giống duy nhất
  // ...
}
```

### 2. Backend Layer

Backend truyền seed xuống C++ core qua command line:
```typescript
`--ntg-seed=${profile.fingerprintSeed}`
`--ntg-canvas-mode=${canvasMode}`
```

### 3. C++ Core Layer

C++ core nhận seed và tạo noise xác định:

```cpp
// Băm seed string thành hash number (deterministic)
uint32_t seed_hash = base::PersistentHash(seed_str);

// Áp dụng noise dựa trên hash
for (size_t i = 0; i < length; i += 4) {
  if ((i + seed_hash) % 500 == 0) {
    // Thay đổi pixel dựa trên seed_hash
    int noise = (seed_hash % 3) - 1; // -1, 0, hoặc 1
    pixels[i + 2] += noise; // Thay đổi kênh Blue
  }
}
```

## Thuật Toán Noise

### Công Thức

1. **Hash Seed**: `seed_hash = PersistentHash(fingerprintSeed)`
2. **Chọn Pixel**: Chỉ thay đổi pixel thứ `i` nếu `(i + seed_hash) % 500 == 0`
3. **Tính Noise**: `noise = (seed_hash % 3) - 1` → -1, 0, hoặc 1
4. **Áp Dụng**: `pixel[i+2] = clamp(pixel[i+2] + noise, 0, 255)`

### Đặc Điểm

- **Tỷ lệ thay đổi**: ~0.2% pixel (1/500)
- **Độ lớn noise**: ±1 trong kênh Blue
- **Deterministic**: Cùng seed → Cùng pattern
- **Không nhìn thấy**: Mắt thường không phát hiện được

## WebGL Spoofing

Tương tự, WebGL Vendor và Renderer được fake từ command line:

```cpp
if (pname == UNMASKED_VENDOR_WEBGL) {
  return command_line->GetSwitchValueASCII("ntg-webgl-vendor");
}
if (pname == UNMASKED_RENDERER_WEBGL) {
  return command_line->GetSwitchValueASCII("ntg-webgl-renderer");
}
```

## Tại Sao Không Làm Crash Browser?

### Canvas Noise

- **An toàn**: Chỉ thay đổi giá trị số trong mảng pixel
- **Không ảnh hưởng**: Không thay đổi cấu trúc dữ liệu
- **Tối ưu**: Chỉ thay đổi 0.2% pixel

### WebGL Spoofing

- **Chọn lọc**: Chỉ intercept 2 câu hỏi cụ thể (VENDOR, RENDERER)
- **Không can thiệp**: Các câu hỏi khác vẫn dùng logic gốc
- **Không ảnh hưởng**: Không can thiệp vào quy trình vẽ 3D

## Test & Verification

### Test Canvas Noise

1. Tạo profile với seed cụ thể
2. Launch browser
3. Vào https://pixelscan.net/
4. Lấy Canvas fingerprint
5. F5 và lấy lại → Phải giống nhau
6. Tạo profile khác → Fingerprint phải khác

### Test WebGL Spoofing

1. Tạo profile với WebGL vendor/renderer cụ thể
2. Launch browser
3. Vào https://pixelscan.net/
4. Kiểm tra WebGL Vendor/Renderer → Phải khớp với profile

## Lưu Ý

1. **Seed phải unique**: Mỗi profile phải có seed riêng
2. **Seed phải stable**: Không thay đổi sau khi tạo
3. **Mode phải đúng**: Chỉ áp dụng noise khi `canvasMode == "noise"`
4. **Performance**: Noise chỉ áp dụng khi `getImageData()` được gọi

## Tương Lai

Có thể mở rộng:
- AudioContext noise (deterministic)
- ClientRects noise (deterministic)
- Font fingerprinting spoofing
- Timezone spoofing ở tầng C++

