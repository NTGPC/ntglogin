# ==========================================================
# Script: Setup Electron Source Code (PowerShell)
# Mục đích: Tải mã nguồn Electron và Chromium
# ==========================================================

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "NTG-Core: Setup Source Code" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Kiểm tra depot_tools
$gclientPath = Get-Command gclient -ErrorAction SilentlyContinue
if (-not $gclientPath) {
    Write-Host "Error: depot_tools chua duoc cai dat hoac chua co trong PATH" -ForegroundColor Red
    Write-Host "   Vui long:" -ForegroundColor Yellow
    Write-Host "   1. Tai depot_tools tu: https://commondatastorage.googleapis.com/chrome-infra-docs/flat/depot_tools/docs/html/depot_tools_tutorial.html" -ForegroundColor Gray
    Write-Host "   2. Giai nen vao thu muc (vi du: C:\depot_tools)" -ForegroundColor Gray
    Write-Host "   3. Them vao PATH va restart PowerShell" -ForegroundColor Gray
    exit 1
}

Write-Host "depot_tools da duoc cai dat" -ForegroundColor Green
Write-Host ""

# Tạo thư mục build
$buildDir = "build"
if (-not (Test-Path $buildDir)) {
    New-Item -ItemType Directory -Path $buildDir | Out-Null
    Write-Host "Da tao thu muc: $buildDir" -ForegroundColor Green
}

Push-Location $buildDir

Write-Host ""
Write-Host "Dang tai ma nguon Electron..." -ForegroundColor Yellow
Write-Host "   (Qua trinh nay mat rat lau, co the 30GB+ du lieu)" -ForegroundColor Gray
Write-Host "   (Co the mat 1-2 gio tuy toc do mang)" -ForegroundColor Gray
Write-Host ""

# Cấu hình gclient
Write-Host "Dang cau hinh gclient..." -ForegroundColor Cyan
$ErrorActionPreference = "Continue"
$result = & gclient config --name="src/electron" --unmanaged https://github.com/electron/electron 2>&1
$ErrorActionPreference = "Stop"

if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne $null) {
    Write-Host "Loi khi cau hinh gclient" -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host ""
Write-Host "Dang sync ma nguon..." -ForegroundColor Yellow
Write-Host "   (Co the mat 1-2 gio tuy toc do mang)" -ForegroundColor Gray
Write-Host ""

# Sync mã nguồn
$ErrorActionPreference = "Continue"
$syncResult = & gclient sync --with_branch_heads --with_tags 2>&1
$ErrorActionPreference = "Stop"

if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne $null) {
    Write-Host "Loi khi sync ma nguon" -ForegroundColor Red
    Pop-Location
    exit 1
}

Pop-Location

Write-Host ""
Write-Host "Hoan tat! Ma nguon da duoc tai ve thu muc: $buildDir\src" -ForegroundColor Green
Write-Host ""
Write-Host "Buoc tiep theo:" -ForegroundColor Yellow
Write-Host "  1. Chay: .\ntg-core\scripts\apply-patches.ps1" -ForegroundColor Gray
Write-Host "  2. Chay: .\ntg-core\scripts\build.ps1" -ForegroundColor Gray
Write-Host ""
