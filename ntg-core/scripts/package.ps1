# ==========================================================
# Script: Package NTG-Core (PowerShell)
# Mục đích: Đóng gói và đổi tên electron.exe thành ntg-core.exe
# ==========================================================

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "NTG-Core: Package" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$buildDir = "build"
$srcDir = "$buildDir\src"
$outDir = "$srcDir\out\Release"
$packageDir = "packages\api\browser-core"

$electronExe = Join-Path $outDir "electron.exe"

if (-not (Test-Path $electronExe)) {
    Write-Host "❌ Error: File electron.exe chưa được build. Chạy .\scripts\build.ps1 trước" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📦 Đang đóng gói..." -ForegroundColor Yellow
Write-Host ""

# Tạo thư mục package
if (-not (Test-Path $packageDir)) {
    New-Item -ItemType Directory -Path $packageDir -Force | Out-Null
    Write-Host "✅ Đã tạo thư mục: $packageDir" -ForegroundColor Green
}

# Copy electron.exe và đổi tên
$ntgCoreExe = Join-Path $packageDir "ntg-core.exe"
Copy-Item $electronExe $ntgCoreExe -Force
Write-Host "✅ Đã copy electron.exe -> ntg-core.exe" -ForegroundColor Green

# Copy các file cần thiết khác
$requiredFiles = @(
    "v8_context_snapshot.bin",
    "snapshot_blob.bin",
    "icudtl.dat",
    "*.dll"
)

Write-Host ""
Write-Host "📦 Đang copy các file cần thiết..." -ForegroundColor Yellow

foreach ($pattern in $requiredFiles) {
    $files = Get-ChildItem -Path $outDir -Filter $pattern -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        $destPath = Join-Path $packageDir $file.Name
        Copy-Item $file.FullName $destPath -Force
        Write-Host "  ✅ $($file.Name)" -ForegroundColor Gray
    }
}

# Copy thư mục resources nếu có
$resourcesDir = Join-Path $outDir "resources"
if (Test-Path $resourcesDir) {
    $destResourcesDir = Join-Path $packageDir "resources"
    Copy-Item $resourcesDir $destResourcesDir -Recurse -Force
    Write-Host "  ✅ resources\" -ForegroundColor Gray
}

Write-Host ""
Write-Host "✅ Đã đóng gói thành công!" -ForegroundColor Green
Write-Host ""
Write-Host "File: $ntgCoreExe" -ForegroundColor Cyan
Write-Host ""
Write-Host "Bước tiếp theo:" -ForegroundColor Yellow
Write-Host "  1. Cấu hình browserService.ts đã tự động phát hiện ntg-core.exe" -ForegroundColor Gray
Write-Host "  2. Test launch browser với custom core" -ForegroundColor Gray
Write-Host "  3. Kiểm tra fingerprint tại https://pixelscan.net/" -ForegroundColor Gray
Write-Host ""

