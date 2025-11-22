# NTG-Core: Custom Electron/Chromium Build

## Tổng Quan

NTG-Core là một custom build của Electron/Chromium với các patch C++ ở tầng thấp nhất để fake digital fingerprint một cách hoàn toàn không thể phát hiện.

## Kiến Trúc

```
ntg-core/
├── patches/          # Các file patch C++ cho Chromium
├── scripts/         # Build automation scripts
├── docs/            # Documentation chi tiết
└── build/           # Output directory (sau khi build)
```

## Quy Trình Build

### Bước 1: Thiết lập môi trường

1. Cài đặt Visual Studio 2022 với C++ Desktop Development
2. Tải và cài đặt depot_tools từ Google
3. Thêm depot_tools vào PATH

### Bước 2: Lấy mã nguồn

```bash
cd ntg-core
./scripts/setup-source.sh
```

### Bước 3: Áp dụng patches

```bash
./scripts/apply-patches.sh
```

### Bước 4: Build

```bash
./scripts/build.sh
```

### Bước 5: Đóng gói

```bash
./scripts/package.sh
```

## Command Line Arguments

NTG-Core nhận các tham số sau để fake fingerprint:

- `--ntg-ua="..."` - User Agent
- `--ntg-platform="..."` - Platform
- `--ntg-concurrency=N` - Hardware Concurrency (CPU cores)
- `--ntg-memory=N` - Device Memory (GB)
- `--ntg-gpu-vendor="..."` - WebGL Vendor
- `--ntg-gpu-renderer="..."` - WebGL Renderer
- `--ntg-screen-width=N` - Screen Width
- `--ntg-screen-height=N` - Screen Height
- `--ntg-languages="..."` - Languages (comma-separated)
- `--ntg-timezone="..."` - Timezone ID

## Tích Hợp Vào NTGLogin

Sau khi build xong, copy `ntg-core.exe` vào `packages/api/browser-core/` và cấu hình trong `browserService.ts`.

Xem chi tiết trong `docs/INTEGRATION.md`.

