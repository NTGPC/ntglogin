#!/bin/bash
# ==========================================================
# Script: Build NTG-Core
# Mục đích: Biên dịch Electron với các patch đã áp dụng
# ==========================================================

set -e

echo "=========================================="
echo "NTG-Core: Build"
echo "=========================================="

BUILD_DIR="build"
SRC_DIR="$BUILD_DIR/src"
OUT_DIR="$SRC_DIR/out/Release"

if [ ! -d "$SRC_DIR" ]; then
    echo "❌ Error: Mã nguồn chưa được tải. Chạy ./scripts/setup-source.sh trước"
    exit 1
fi

cd "$SRC_DIR"

echo ""
echo "🔨 Đang tạo cấu hình build..."
echo ""

# Tạo cấu hình build (Release, tối ưu tốc độ)
gn gen out/Release --args="import(\"//electron/build/args/release.gn\") is_component_build=false symbol_level=0"

echo ""
echo "🔨 Đang bắt đầu build..."
echo "   ⚠️  CẢNH BÁO: Quá trình này mất từ 4-10 giờ tùy máy!"
echo "   ⚠️  CPU và RAM sẽ được sử dụng tối đa!"
echo ""
read -p "Nhấn Enter để tiếp tục hoặc Ctrl+C để hủy..."

# Build Electron
ninja -C out/Release electron

echo ""
echo "✅ Build hoàn tất!"
echo ""
echo "File thực thi: $OUT_DIR/electron.exe"
echo ""
echo "Bước tiếp theo:"
echo "  1. Chạy: ./scripts/package.sh"
echo "  2. Copy ntg-core.exe vào packages/api/browser-core/"
echo ""

