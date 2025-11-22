# Tích Hợp NTG-Core Vào NTGLogin

## Tổng Quan

Sau khi build xong NTG-Core, bạn cần tích hợp nó vào hệ thống NTGLogin để thay thế Chromium mặc định.

## Bước 1: Copy NTG-Core

Sau khi build xong, copy file `ntg-core.exe` và các file liên quan vào:

```
packages/api/browser-core/
├── ntg-core.exe
├── ntg-core.pdb (optional, for debugging)
└── resources/ (các file resources cần thiết)
```

## Bước 2: Cấu Hình BrowserService

File `src/services/browserService.ts` đã được cập nhật để tự động phát hiện và sử dụng NTG-Core nếu có.

Logic hoạt động:
1. Kiểm tra xem `packages/api/browser-core/ntg-core.exe` có tồn tại không
2. Nếu có: Sử dụng NTG-Core với các command line arguments
3. Nếu không: Fallback về Chromium mặc định với JavaScript injection

## Bước 3: Test

1. Tạo một profile mới trong NTGLogin
2. Launch browser
3. Kiểm tra log để xem có dòng:
   ```
   [LIFECYCLE] 🚀 Sử dụng NTG-Core (Custom Build) - Fingerprint ở tầng C++
   ```
4. Test fingerprint tại https://pixelscan.net/

## Command Line Arguments

NTG-Core nhận các tham số sau:

| Argument | Mô tả | Ví dụ |
|----------|-------|-------|
| `--ntg-ua` | User Agent | `--ntg-ua="Mozilla/5.0..."` |
| `--ntg-platform` | Platform | `--ntg-platform="Win32"` |
| `--ntg-concurrency` | CPU cores | `--ntg-concurrency=8` |
| `--ntg-memory` | RAM (GB) | `--ntg-memory=16` |
| `--ntg-gpu-vendor` | WebGL Vendor | `--ntg-gpu-vendor="Intel Inc."` |
| `--ntg-gpu-renderer` | WebGL Renderer | `--ntg-gpu-renderer="Intel Iris..."` |
| `--ntg-screen-width` | Screen Width | `--ntg-screen-width=1920` |
| `--ntg-screen-height` | Screen Height | `--ntg-screen-height=1080` |
| `--ntg-languages` | Languages | `--ntg-languages="en-US,en"` |
| `--ntg-timezone` | Timezone ID | `--ntg-timezone="America/New_York"` |
| `--ntg-seed` | Seed cho deterministic noise | `--ntg-seed=12345` |
| `--ntg-canvas-noise` | Bật canvas noise | (flag, không cần giá trị) |

## Lưu Ý

1. **Performance**: NTG-Core có thể chậm hơn một chút so với Chromium mặc định do các patch C++
2. **Compatibility**: Đảm bảo các patch tương thích với phiên bản Electron/Chromium bạn đang build
3. **Updates**: Khi Electron/Chromium có bản cập nhật, bạn cần rebuild NTG-Core với patches mới

## Troubleshooting

### Lỗi: "Cannot find ntg-core.exe"
- Kiểm tra đường dẫn: `packages/api/browser-core/ntg-core.exe`
- Đảm bảo file đã được copy sau khi build

### Lỗi: "Invalid command line argument"
- Kiểm tra format của các arguments
- Đảm bảo các giá trị string được đặt trong dấu ngoặc kép

### Browser không khởi động
- Kiểm tra log để xem lỗi cụ thể
- Thử fallback về Chromium mặc định bằng cách xóa/đổi tên ntg-core.exe

