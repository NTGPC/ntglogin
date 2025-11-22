#!/bin/bash
# ==========================================================
# Script: Package NTG-Core
# Mục đích: Đóng gói và đổi tên electron.exe thành ntg-core.exe
# ==========================================================

set -e

echo "=========================================="
echo "NTG-Core: Package"
echo "=========================================="

BUILD_DIR="build"
SRC_DIR="$BUILD_DIR/src"
OUT_DIR="$SRC_DIR/out/Release"
PACKAGE_DIR="packages/api/browser-core"

if [ ! -f "$OUT_DIR/electron.exe" ]; then
    echo "❌ Error: File electron.exe chưa được build. Chạy ./scripts/build.sh trước"
    exit 1
fi

echo ""
echo "📦 Đang đóng gói..."
echo ""

# Tạo thư mục package
mkdir -p "$PACKAGE_DIR"

# Copy electron.exe và đổi tên
cp "$OUT_DIR/electron.exe" "$PACKAGE_DIR/ntg-core.exe"

# Copy các file cần thiết khác (resources, DLLs, etc.)
# TODO: Xác định các file cần thiết và copy chúng

echo "✅ Đã đóng gói thành công!"
echo ""
echo "File: $PACKAGE_DIR/ntg-core.exe"
echo ""
echo "Bước tiếp theo:"
echo "  1. Cấu hình browserService.ts để sử dụng ntg-core.exe"
echo "  2. Test launch browser với custom core"
echo ""

