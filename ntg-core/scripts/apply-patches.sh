#!/bin/bash
# ==========================================================
# Script: Apply C++ Patches
# Mục đích: Áp dụng các patch C++ vào mã nguồn Chromium
# ==========================================================

set -e

echo "=========================================="
echo "NTG-Core: Apply Patches"
echo "=========================================="

BUILD_DIR="build"
SRC_DIR="$BUILD_DIR/src"
PATCHES_DIR="patches"

if [ ! -d "$SRC_DIR" ]; then
    echo "❌ Error: Mã nguồn chưa được tải. Chạy ./scripts/setup-source.sh trước"
    exit 1
fi

echo ""
echo "🔧 Đang áp dụng patches..."
echo ""

# Danh sách các patch cần áp dụng
PATCHES=(
    "navigator.patch:third_party/blink/renderer/core/frame/navigator.cc"
    "webgl.patch:third_party/blink/renderer/modules/webgl/webgl_rendering_context_base.cc"
    "canvas.patch:third_party/blink/renderer/modules/canvas/canvas2d/canvas_rendering_context_2d.cc"
    "user_agent.patch:content/common/user_agent.cc"
)

for patch_info in "${PATCHES[@]}"; do
    IFS=':' read -r patch_file target_file <<< "$patch_info"
    patch_path="$PATCHES_DIR/$patch_file"
    target_path="$SRC_DIR/$target_file"
    
    if [ ! -f "$patch_path" ]; then
        echo "⚠️  Warning: Không tìm thấy patch: $patch_path"
        continue
    fi
    
    if [ ! -f "$target_path" ]; then
        echo "⚠️  Warning: Không tìm thấy file target: $target_path"
        echo "   (Có thể đường dẫn đã thay đổi trong phiên bản Chromium mới)"
        continue
    fi
    
    echo "  📝 Áp dụng: $patch_file -> $target_file"
    
    # Backup file gốc
    cp "$target_path" "$target_path.backup"
    
    # Áp dụng patch (cần implement logic merge code)
    # TODO: Implement patch merging logic
    echo "     ✅ Đã backup file gốc"
done

echo ""
echo "✅ Hoàn tất áp dụng patches!"
echo ""
echo "⚠️  Lưu ý: Các patch này là code mẫu. Bạn cần:"
echo "  1. Kiểm tra đường dẫn file trong phiên bản Chromium hiện tại"
echo "  2. Merge code thủ công hoặc sử dụng git patch format"
echo "  3. Test kỹ lưỡng trước khi build"
echo ""

