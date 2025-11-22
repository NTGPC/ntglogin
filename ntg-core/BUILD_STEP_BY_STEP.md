# Hướng Dẫn Build NTG-Core - Từng Bước Chi Tiết

## ⚠️ QUAN TRỌNG TRƯỚC KHI BẮT ĐẦU

Build NTG-Core là quá trình **RẤT PHỨC TẠP** và **TỐN THỜI GIAN**:
- **Tải source code**: 1-2 giờ (30GB+)
- **Build**: 4-10 giờ
- **Yêu cầu**: 32GB+ RAM, 200GB+ dung lượng, CPU 8 cores+

## BƯỚC 1: CHUẨN BỊ MÔI TRƯỜNG

### 1.1. Cài Đặt Visual Studio 2022

1. Tải: https://visualstudio.microsoft.com/downloads/
2. Chọn: **Visual Studio 2022 Community** (miễn phí)
3. Trong quá trình cài đặt, chọn:
   - ✅ **Desktop development with C++**
   - ✅ **Windows 10/11 SDK** (10.0.19041.0 hoặc mới hơn)
   - ✅ **C++ CMake tools**

### 1.2. Cài Đặt depot_tools

1. Tải: https://commondatastorage.googleapis.com/chrome-infra-docs/flat/depot_tools/docs/html/depot_tools_tutorial.html
2. Giải nén vào: `C:\depot_tools`
3. Thêm vào PATH:
   - Win + R → `sysdm.cpl` → Advanced → Environment Variables
   - Thêm `C:\depot_tools` vào **User variables** → Path
   - **QUAN TRỌNG**: Đảm bảo nó đứng **ĐẦU TIÊN** trong PATH
4. Restart PowerShell (Admin)
5. Test:
   ```powershell
   gclient --version
   ```

### 1.3. Kiểm Tra Dung Lượng

Đảm bảo có ít nhất **200GB** dung lượng trống trên ổ C:

```powershell
Get-PSDrive C | Select-Object Free
```

## BƯỚC 2: TẢI MÃ NGUỒN ELECTRON

Mở PowerShell (Admin) trong thư mục dự án:

```powershell
cd D:\NTGLOGIN
.\ntg-core\scripts\setup-source.ps1
```

**Lưu ý**:
- Quá trình này tải ~30GB+ dữ liệu
- Mất 1-2 giờ tùy tốc độ mạng
- Đảm bảo kết nối mạng ổn định

## BƯỚC 3: ÁP DỤNG PATCHES

### 3.1. Chạy Script Apply Patches

```powershell
.\ntg-core\scripts\apply-patches.ps1
```

Script sẽ:
- Backup các file gốc
- Hiển thị danh sách patches cần apply

### 3.2. Merge Code Thủ Công

**QUAN TRỌNG**: Script chỉ backup, bạn cần merge code thủ công:

1. **Mở file patch** (ví dụ: `ntg-core\patches\canvas.patch`)
2. **Tìm file target** trong `build\src\`:
   - `third_party\blink\renderer\modules\canvas\canvas2d\canvas_rendering_context_2d.cc`
3. **Mở file target** trong VS Code hoặc editor C++
4. **Copy code từ patch** và paste vào vị trí phù hợp
5. **Kiểm tra**:
   - Include headers đầy đủ
   - Syntax đúng
   - Namespace và class names đúng

### 3.3. Danh Sách Patches Cần Apply

1. **canvas.patch** → `canvas_rendering_context_2d.cc`
   - Thêm deterministic noise vào `getImageData()`
   - Can thiệp vào `toDataURL()`

2. **webgl.patch** → `webgl_rendering_context_base.cc`
   - Intercept `getParameter()` cho VENDOR và RENDERER

3. **navigator.patch** → `navigator.cc`
   - Fake `hardwareConcurrency()`, `deviceMemory()`, `platform()`

4. **user_agent.patch** → `user_agent.cc`
   - Fake User Agent từ command line

## BƯỚC 4: BUILD

### 4.1. Chạy Script Build

```powershell
.\ntg-core\scripts\build.ps1
```

**CẢNH BÁO**:
- Quá trình này mất **4-10 giờ**
- CPU và RAM sẽ được sử dụng **TỐI ĐA**
- Đảm bảo máy tính được **CẮM ĐIỆN**
- Có **TẢN NHIỆT TỐT**

### 4.2. Tối Ưu Build Time (Tùy Chọn)

Nếu máy có nhiều RAM (64GB+), có thể tăng số jobs:

```powershell
cd build\src
ninja -j 16 -C out/Release electron  # 16 jobs song song
```

**Lưu ý**: Số jobs không nên vượt quá số cores CPU × 2

## BƯỚC 5: ĐÓNG GÓI

```powershell
.\ntg-core\scripts\package.ps1
```

Script sẽ:
- Copy `electron.exe` → `ntg-core.exe`
- Copy các file cần thiết (.dll, .bin, resources)
- Đặt vào `packages\api\browser-core\`

## BƯỚC 6: TEST

### 6.1. Khởi Động Backend

```powershell
npm run dev
```

### 6.2. Tạo Profile Mới

1. Mở: http://localhost:5175/profiles
2. Tạo profile mới
3. Kiểm tra trong database: Profile phải có `fingerprintSeed` (UUID)

### 6.3. Launch Browser

1. Click "Launch" trên profile
2. Kiểm tra log backend, phải thấy:
   ```
   [LIFECYCLE] 🚀 Sử dụng NTG-Core (Custom Build) - Fingerprint ở tầng C++
   [LIFECYCLE] 📊 Fingerprint Seed: abc-123-xyz-...
   [LIFECYCLE] 📊 Canvas Mode: noise
   [LIFECYCLE] 📊 WebGL Vendor: Intel Inc.
   ```

### 6.4. Test Fingerprint

1. Mở: https://pixelscan.net/
2. Lấy Canvas fingerprint
3. **F5** (refresh) và lấy lại
4. **Kết quả mong đợi**: Fingerprint phải **GIỐNG NHAU** (ổn định)

### 6.5. Test WebGL

1. Trong pixelscan.net, kiểm tra WebGL Vendor/Renderer
2. Phải khớp với giá trị trong profile

## TROUBLESHOOTING

### Lỗi: "gclient: command not found"
- Kiểm tra PATH có `C:\depot_tools` chưa
- Restart PowerShell (Admin)
- Chạy: `refreshenv` (nếu có Chocolatey)

### Lỗi: "Out of memory" khi build
- Giảm số jobs: `ninja -j 4 -C out/Release electron`
- Đóng các ứng dụng khác
- Tăng virtual memory trong Windows

### Lỗi: "File not found" khi apply patches
- Tìm lại file trong `build\src\` bằng Search
- Đường dẫn có thể đã thay đổi trong phiên bản Chromium mới
- Cập nhật patch files với đường dẫn mới

### Build bị crash
- Kiểm tra log: `build\src\out\Release\.ninja_log`
- Thử build lại: `gn clean out/Release` rồi build lại
- Kiểm tra Visual Studio đã cài đầy đủ components

### Lỗi compile C++
- Kiểm tra syntax trong các file đã patch
- Đảm bảo đã include đầy đủ headers
- Kiểm tra namespace và class names

### Browser không khởi động với NTG-Core
- Kiểm tra file `ntg-core.exe` có tồn tại không
- Kiểm tra các file .dll và .bin có đầy đủ không
- Thử chạy trực tiếp: `.\packages\api\browser-core\ntg-core.exe --version`

## NEXT STEPS

Sau khi build và test thành công:
1. Tối ưu patches nếu cần
2. Tạo backup của `ntg-core.exe`
3. Document các thay đổi đã thực hiện
4. Cân nhắc tạo automated build pipeline

## LƯU Ý QUAN TRỌNG

1. **Backup**: Luôn backup file gốc trước khi patch
2. **Test**: Test kỹ lưỡng sau mỗi patch
3. **Version**: Patches có thể cần điều chỉnh theo phiên bản Chromium
4. **Performance**: NTG-Core có thể chậm hơn một chút do các patch C++
5. **Updates**: Khi Electron/Chromium có bản cập nhật, cần rebuild với patches mới

