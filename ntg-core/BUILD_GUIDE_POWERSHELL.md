# Hướng Dẫn Build NTG-Core (PowerShell)

- **Thời gian build**: 4-10 giờ tùy cấu hình

### Phần Mềm
1. **Windows 10/11** (64-bit)
2. **Visual Studio 2022** với:
   - Desktop development with C++
   - Windows 10/11 SDK
   - C++ CMake tools
3. **depot_tools** từ Google
4. **Git** (đã có sẵn trong depot_tools)
5. **Python 3.x** (đã có sẵn trong depot_tools)

## Bước 1: Cài Đặt Visual Studio 2022

1. Tải Visual Studio 2022 Community (miễn phí): https://visualstudio.microsoft.com/
2. Trong quá trình cài đặt, chọn:
   - ✅ Desktop development with C++
   - ✅ Windows 10 SDK (10.0.19041.0 hoặc mới hơn)
   - ✅ C++ CMake tools

## Bước 2: Cài Đặt depot_tools

1. Tải depot_tools: https://commondatastorage.googleapis.com/chrome-infra-docs/flat/depot_tools/docs/html/depot_tools_tutorial.html
2. Giải nén vào thư mục (ví dụ: `C:\depot_tools`)
3. Thêm vào PATH:
   - Mở "Environment Variables" (Win + R → `sysdm.cpl` → Advanced → Environment Variables)
   - Thêm `C:\depot_tools` vào PATH
   - **QUAN TRỌNG**: Đảm bảo nó đứng trước các đường dẫn khác

4. Mở PowerShell mới (Admin) và test:
   ```powershell
   gclient --version
   ```

## Bước 3: Lấy Mã Nguồn Electron

Mở PowerShell trong thư mục dự án:

```powershell
cd D:\NTGLOGIN
.\ntg-core\scripts\setup-source.ps1
```

**Lưu ý**: 
- Quá trình này sẽ tải ~30GB+ dữ liệu
- Mất 1-2 giờ tùy tốc độ mạng
- Cần ít nhất 100GB dung lượng trống

## Bước 4: Áp Dụng Patches

```powershell
.\ntg-core\scripts\apply-patches.ps1
```

**Lưu ý**: 
- Script sẽ backup các file gốc
- Bạn cần merge code thủ công từ patch files vào các file target
- Hoặc sử dụng git patch format để apply tự động

### Hướng Dẫn Merge Code Thủ Công

1. Mở file patch (ví dụ: `ntg-core\patches\canvas.patch`)
2. Tìm file target trong `build\src\` (ví dụ: `third_party\blink\renderer\modules\canvas\canvas2d\canvas_rendering_context_2d.cc`)
3. Mở file target trong VS Code hoặc editor C++
4. Copy code từ patch và paste vào vị trí phù hợp
5. Đảm bảo include các header cần thiết
6. Kiểm tra syntax

## Bước 5: Build

```powershell
.\ntg-core\scripts\build.ps1
```

**Lưu ý**:
- Quá trình build mất 4-10 giờ
- CPU và RAM sẽ được sử dụng tối đa
- Đảm bảo máy tính được cắm điện và có tản nhiệt tốt

### Tối Ưu Build Time

Nếu máy có nhiều RAM, có thể tăng số jobs:
```powershell
cd build\src
ninja -j 16 -C out/Release electron  # 16 jobs song song
```

## Bước 6: Đóng Gói

```powershell
.\ntg-core\scripts\package.ps1
```

File `ntg-core.exe` sẽ được copy vào `packages\api\browser-core\`

## Bước 7: Test

1. Khởi động lại backend:
   ```powershell
   npm run dev
   ```

2. Tạo profile mới trong NTGLogin

3. Launch browser và kiểm tra log:
   ```
   [LIFECYCLE] 🚀 Sử dụng NTG-Core (Custom Build) - Fingerprint ở tầng C++
   [LIFECYCLE] 📊 Fingerprint Seed: abc-123-xyz
   ```

4. Test fingerprint tại https://pixelscan.net/

## Troubleshooting

### Lỗi: "gclient: command not found"
- Kiểm tra PATH có chứa depot_tools chưa
- Restart PowerShell (Admin)

### Lỗi: "Out of memory" khi build
- Giảm số lượng jobs: `ninja -j 4 -C out/Release electron`
- Đóng các ứng dụng khác
- Tăng virtual memory

### Lỗi: "File not found" khi apply patches
- Đường dẫn file trong Chromium có thể đã thay đổi
- Tìm lại file trong `build\src\` bằng Search
- Cập nhật patch files với đường dẫn mới

### Build bị crash
- Kiểm tra log trong `build\src\out\Release\.ninja_log`
- Thử build lại từ đầu: `gn clean out/Release`
- Kiểm tra Visual Studio đã cài đầy đủ components chưa

### Lỗi compile C++
- Kiểm tra syntax trong các file đã patch
- Đảm bảo đã include đầy đủ headers
- Kiểm tra namespace và class names đúng chưa

## Next Steps

Sau khi build xong, xem `docs/INTEGRATION.md` để tích hợp vào NTGLogin.

## Lưu Ý Quan Trọng

1. **Backup**: Luôn backup file gốc trước khi patch
2. **Test**: Test kỹ lưỡng sau mỗi patch
3. **Version**: Patches có thể cần điều chỉnh theo phiên bản Chromium
4. **Performance**: NTG-Core có thể chậm hơn một chút do các patch C++

