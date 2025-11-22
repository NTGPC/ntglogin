# Quick Start - Build NTG-Core

## ⚠️ TÌNH TRẠNG HIỆN TẠI

### ✅ Đã Hoàn Thành
- ✅ Prisma Client đã được generate (fingerprintSeed field đã sẵn sàng)
- ✅ Visual Studio 2022 đã được cài đặt
- ✅ Tất cả scripts PowerShell đã được tạo
- ✅ Patches C++ đã được chuẩn bị

### ❌ Cần Hoàn Thiện
- ❌ depot_tools chưa được cài đặt
- ❌ Dung lượng ổ cứng không đủ (chỉ còn 15GB, cần ít nhất 200GB)
- ❌ Migration có lỗi (nhưng không ảnh hưởng đến fingerprintSeed vì đã có @default)

## BƯỚC TIẾP THEO

### 1. Giải Quyết Dung Lượng Ổ Cứng

**Vấn đề**: Chỉ còn 15GB, cần ít nhất 200GB để build

**Giải pháp**:
- Dọn dẹp ổ C: Xóa temp files, cache, unused programs
- Hoặc build trên ổ D/E nếu có (cần ít nhất 200GB)
- Hoặc sử dụng external drive

### 2. Cài Đặt depot_tools

1. Tải: https://commondatastorage.googleapis.com/chrome-infra-docs/flat/depot_tools/docs/html/depot_tools_tutorial.html
2. Giải nén vào: `C:\depot_tools` (hoặc ổ khác nếu C không đủ chỗ)
3. Thêm vào PATH:
   ```
   Win + R → sysdm.cpl → Advanced → Environment Variables
   → User variables → Path → New → C:\depot_tools
   ```
4. Restart PowerShell (Admin)
5. Test: `gclient --version`

### 3. Chạy Build Scripts

Sau khi có đủ dung lượng và depot_tools:

```powershell
# Bước 1: Tải source code (1-2 giờ, 30GB+)
.\ntg-core\scripts\setup-source.ps1

# Bước 2: Apply patches (cần merge code thủ công)
.\ntg-core\scripts\apply-patches.ps1

# Bước 3: Build (4-10 giờ)
.\ntg-core\scripts\build.ps1

# Bước 4: Package
.\ntg-core\scripts\package.ps1
```

## LƯU Ý QUAN TRỌNG

1. **Dung lượng**: Build cần 200GB+, đảm bảo có đủ trước khi bắt đầu
2. **Thời gian**: Tổng cộng mất 5-12 giờ (tải + build)
3. **Patches**: Cần merge code thủ công từ patch files vào source code
4. **Test**: Sau khi build, test kỹ lưỡng trước khi dùng production

## TÀI LIỆU THAM KHẢO

- `BUILD_STEP_BY_STEP.md` - Hướng dẫn chi tiết từng bước
- `BUILD_GUIDE_POWERSHELL.md` - Hướng dẫn đầy đủ
- `docs/DETERMINISTIC_NOISE.md` - Giải thích về deterministic noise

