# Hướng Dẫn Build NTG-Core

## Yêu Cầu Hệ Thống

### Phần Cứng Tối Thiểu
- **CPU**: Intel Core i7 hoặc AMD Ryzen 7 (8 cores trở lên)
- **RAM**: 32GB (khuyến nghị 64GB)
- **Ổ cứng**: 200GB+ dung lượng trống (SSD khuyến nghị)
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
   - Mở "Environment Variables"
   - Thêm `C:\depot_tools` vào PATH
   - Đảm bảo nó đứng trước các đường dẫn khác

4. Mở PowerShell mới và test:
   ```powershell
   gclient --version
   ```

## Bước 3: Lấy Mã Nguồn Electron

```powershell
cd D:\NTGLOGIN\ntg-core
.\scripts\setup-source.sh
```

**Lưu ý**: Quá trình này sẽ:
- Tải ~30GB+ dữ liệu
- Mất 1-2 giờ tùy tốc độ mạng
- Cần ít nhất 100GB dung lượng trống

## Bước 4: Áp Dụng Patches

```powershell
.\scripts\apply-patches.sh
```

**Lưu ý**: 
- Các patch trong thư mục `patches/` là code mẫu
- Bạn cần kiểm tra và điều chỉnh đường dẫn file trong phiên bản Chromium hiện tại
- Có thể cần merge code thủ công

## Bước 5: Build

```powershell
.\scripts\build.sh
```

**Lưu ý**:
- Quá trình build mất 4-10 giờ
- CPU và RAM sẽ được sử dụng tối đa
- Đảm bảo máy tính được cắm điện và có tản nhiệt tốt

## Bước 6: Đóng Gói

```powershell
.\scripts\package.sh
```

File `ntg-core.exe` sẽ được copy vào `packages/api/browser-core/`

## Troubleshooting

### Lỗi: "gclient: command not found"
- Kiểm tra PATH có chứa depot_tools chưa
- Restart PowerShell/CMD

### Lỗi: "Out of memory" khi build
- Giảm số lượng jobs: `ninja -j 4 -C out/Release electron`
- Đóng các ứng dụng khác

### Lỗi: "File not found" khi apply patches
- Đường dẫn file trong Chromium có thể đã thay đổi
- Kiểm tra lại đường dẫn trong phiên bản Chromium hiện tại
- Cập nhật patch files

### Build bị crash
- Kiểm tra log trong `out/Release/.ninja_log`
- Thử build lại từ đầu: `gn clean out/Release`

## Tối Ưu Build Time

1. **Sử dụng SSD**: Build trên SSD nhanh hơn HDD 3-5 lần
2. **Tăng RAM**: 64GB RAM cho phép build song song nhiều jobs hơn
3. **Sử dụng ccache**: Cache các object files đã compile
4. **Incremental build**: Chỉ build lại phần thay đổi

## Next Steps

Sau khi build xong, xem `INTEGRATION.md` để tích hợp vào NTGLogin.

