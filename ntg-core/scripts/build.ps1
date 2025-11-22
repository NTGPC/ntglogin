# ==========================================================
# Script: Build NTG-Core (PowerShell)
# Mục đích: Biên dịch Electron với các patch đã áp dụng
# ==========================================================

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "NTG-Core: Build" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$buildDir = "build"
$srcDir = "$buildDir\src"
$outDir = "$srcDir\out\Release"

if (-not (Test-Path $srcDir)) {
    Write-Host "❌ Error: Mã nguồn chưa được tải. Chạy .\scripts\setup-source.ps1 trước" -ForegroundColor Red
    exit 1
}

# Kiểm tra gn và ninja
$gnPath = Get-Command gn -ErrorAction SilentlyContinue
$ninjaPath = Get-Command ninja -ErrorAction SilentlyContinue

if (-not $gnPath -or -not $ninjaPath) {
    Write-Host "❌ Error: gn hoặc ninja chưa được cài đặt" -ForegroundColor Red
    Write-Host "   Đảm bảo depot_tools đã được thêm vào PATH" -ForegroundColor Yellow
    exit 1
}

Push-Location $srcDir

Write-Host ""
Write-Host "🔨 Đang tạo cấu hình build..." -ForegroundColor Yellow
Write-Host ""

# Tạo cấu hình build (Release, tối ưu tốc độ)
$gnArgs = @(
    "gen",
    "out/Release",
    "--args=`"import(\`"//electron/build/args/release.gn\`") is_component_build=false symbol_level=0`""
)

& gn $gnArgs

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Lỗi khi tạo cấu hình build" -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host ""
Write-Host "🔨 Đang bắt đầu build..." -ForegroundColor Yellow
Write-Host "   ⚠️  CẢNH BÁO: Quá trình này mất từ 4-10 giờ tùy máy!" -ForegroundColor Red
Write-Host "   ⚠️  CPU và RAM sẽ được sử dụng tối đa!" -ForegroundColor Red
Write-Host "   ⚠️  Đảm bảo máy tính được cắm điện và có tản nhiệt tốt!" -ForegroundColor Red
Write-Host ""
$confirm = Read-Host "Nhấn Enter để tiếp tục hoặc Ctrl+C để hủy"

# Build Electron
Write-Host ""
Write-Host "🔨 Đang build Electron..." -ForegroundColor Cyan
Write-Host "   (Quá trình này sẽ mất rất lâu, vui lòng đợi...)" -ForegroundColor Gray
Write-Host ""

& ninja -C out/Release electron

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Lỗi khi build" -ForegroundColor Red
    Pop-Location
    exit 1
}

Pop-Location

Write-Host ""
Write-Host "✅ Build hoàn tất!" -ForegroundColor Green
Write-Host ""
Write-Host "File thực thi: $outDir\electron.exe" -ForegroundColor Cyan
Write-Host ""
Write-Host "Bước tiếp theo:" -ForegroundColor Yellow
Write-Host "  1. Chạy: .\ntg-core\scripts\package.ps1" -ForegroundColor Gray
Write-Host "  2. Copy ntg-core.exe vào packages\api\browser-core\" -ForegroundColor Gray
Write-Host ""

