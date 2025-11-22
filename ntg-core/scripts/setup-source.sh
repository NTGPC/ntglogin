#!/bin/bash
# ==========================================================
# Script: Setup Electron Source Code
# Mục đích: Tải mã nguồn Electron và Chromium
# ==========================================================

set -e

echo "=========================================="
echo "NTG-Core: Setup Source Code"
echo "=========================================="

# Kiểm tra depot_tools
if ! command -v gclient &> /dev/null; then
    echo "❌ Error: depot_tools chưa được cài đặt hoặc chưa có trong PATH"
    echo "   Vui lòng tải từ: https://commondatastorage.googleapis.com/chrome-infra-docs/flat/depot_tools/docs/html/depot_tools_tutorial.html"
    exit 1
fi

# Tạo thư mục build
BUILD_DIR="build"
if [ ! -d "$BUILD_DIR" ]; then
    mkdir -p "$BUILD_DIR"
fi

cd "$BUILD_DIR"

echo ""
echo "📥 Đang tải mã nguồn Electron..."
echo "   (Quá trình này mất rất lâu, có thể 30GB+ dữ liệu)"
echo ""

# Cấu hình gclient
gclient config --name="src/electron" --unmanaged https://github.com/electron/electron

echo ""
echo "📥 Đang sync mã nguồn..."
echo "   (Có thể mất 1-2 giờ tùy tốc độ mạng)"
echo ""

# Sync mã nguồn
gclient sync --with_branch_heads --with_tags

echo ""
echo "✅ Hoàn tất! Mã nguồn đã được tải về thư mục: $BUILD_DIR/src"
echo ""
echo "Bước tiếp theo:"
echo "  1. Chạy: ./scripts/apply-patches.sh"
echo "  2. Chạy: ./scripts/build.sh"
echo ""

