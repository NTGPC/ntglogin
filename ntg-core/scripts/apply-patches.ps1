# ==========================================================
# Script: Apply C++ Patches (PowerShell)
# Mục đích: Áp dụng các patch C++ vào mã nguồn Chromium
# ==========================================================

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "NTG-Core: Apply Patches" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$buildDir = "build"
$srcDir = "$buildDir\src"
$patchesDir = "patches"

if (-not (Test-Path $srcDir)) {
    Write-Host "❌ Error: Mã nguồn chưa được tải. Chạy .\scripts\setup-source.ps1 trước" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔧 Đang áp dụng patches..." -ForegroundColor Yellow
Write-Host ""

# Danh sách các patch cần áp dụng
$patches = @(
    @{
        PatchFile = "navigator.patch"
        TargetFile = "third_party\blink\renderer\core\frame\navigator.cc"
    },
    @{
        PatchFile = "webgl.patch"
        TargetFile = "third_party\blink\renderer\modules\webgl\webgl_rendering_context_base.cc"
    },
    @{
        PatchFile = "canvas.patch"
        TargetFile = "third_party\blink\renderer\modules\canvas\canvas2d\canvas_rendering_context_2d.cc"
    },
    @{
        PatchFile = "user_agent.patch"
        TargetFile = "content\common\user_agent.cc"
    }
)

$appliedCount = 0
$skippedCount = 0

foreach ($patch in $patches) {
    $patchPath = Join-Path $patchesDir $patch.PatchFile
    $targetPath = Join-Path $srcDir $patch.TargetFile
    
    if (-not (Test-Path $patchPath)) {
        Write-Host "⚠️  Warning: Không tìm thấy patch: $patchPath" -ForegroundColor Yellow
        $skippedCount++
        continue
    }
    
    if (-not (Test-Path $targetPath)) {
        Write-Host "⚠️  Warning: Không tìm thấy file target: $targetPath" -ForegroundColor Yellow
        Write-Host "   (Có thể đường dẫn đã thay đổi trong phiên bản Chromium mới)" -ForegroundColor Gray
        Write-Host "   Hãy tìm file tương ứng trong thư mục src\" -ForegroundColor Gray
        $skippedCount++
        continue
    }
    
    Write-Host "  📝 Áp dụng: $($patch.PatchFile) -> $($patch.TargetFile)" -ForegroundColor Cyan
    
    # Backup file gốc
    $backupPath = "$targetPath.backup"
    Copy-Item $targetPath $backupPath -Force
    Write-Host "     ✅ Đã backup file gốc: $backupPath" -ForegroundColor Green
    
    # TODO: Implement patch merging logic
    # Hiện tại chỉ backup, cần merge code thủ công hoặc dùng git patch format
    Write-Host "     ⚠️  Cần merge code thủ công từ patch file" -ForegroundColor Yellow
    Write-Host "        Xem nội dung patch: $patchPath" -ForegroundColor Gray
    
    $appliedCount++
}

Write-Host ""
Write-Host "✅ Hoàn tất áp dụng patches!" -ForegroundColor Green
Write-Host "   Applied: $appliedCount, Skipped: $skippedCount" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  Lưu ý: Các patch này là code mẫu. Bạn cần:" -ForegroundColor Yellow
Write-Host "  1. Kiểm tra đường dẫn file trong phiên bản Chromium hiện tại" -ForegroundColor Gray
Write-Host "  2. Merge code thủ công từ patch files vào các file target" -ForegroundColor Gray
Write-Host "  3. Hoặc sử dụng git patch format để apply tự động" -ForegroundColor Gray
Write-Host "  4. Test kỹ lưỡng trước khi build" -ForegroundColor Gray
Write-Host ""

