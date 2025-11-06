# Hướng dẫn Push Code lên GitHub

## Bước 1: Kiểm tra Git Status

```powershell
cd D:\NTGLOGIN
git status
```

## Bước 2: Thêm các file vào Git

```powershell
# Thêm tất cả các file mới và thay đổi
git add .

# Hoặc thêm từng file cụ thể
git add CHANGELOG.md
git add scripts/
git add src/
git add prisma/schema.prisma
```

## Bước 3: Commit Changes

```powershell
git commit -m "feat: Add comprehensive fingerprint injection system

- Add seeded PRNG (xorshift32) for deterministic fingerprints
- Add Canvas, WebGL/WebGL2/OffscreenCanvas, Audio fingerprint patches
- Add Chrome SwiftShader flags support
- Add Python Selenium wrapper and test scripts
- Add profile isolation with auto cleanup
- Add Changelog model to database
- Fix proxy foreign key constraint issues"
```

## Bước 4: Tạo Repository trên GitHub (nếu chưa có)

1. Đăng nhập vào GitHub
2. Click "New repository"
3. Đặt tên: `ntglogin` (hoặc tên bạn muốn)
4. Chọn Public hoặc Private
5. **KHÔNG** tạo README, .gitignore, hoặc license (vì đã có sẵn)
6. Click "Create repository"

## Bước 5: Thêm Remote và Push

```powershell
# Thêm remote (thay YOUR_USERNAME và REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Hoặc nếu đã có remote, kiểm tra:
git remote -v

# Nếu đã có remote nhưng sai URL, sửa:
git remote set-url origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Push lên GitHub
git branch -M main
git push -u origin main
```

## Bước 6: Verify

Kiểm tra trên GitHub xem code đã được push thành công.

## Lưu ý

### Files KHÔNG được commit:
- `.env` - Environment variables
- `browser_profiles/` - Browser profile data
- `secrets/` - Secret keys
- `node_modules/` - Dependencies
- `dist/` - Build output
- `generated/` - Generated files

Tất cả đã được thêm vào `.gitignore`.

### Nếu gặp lỗi:

**Lỗi: "remote origin already exists"**
```powershell
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
```

**Lỗi: "failed to push some refs"**
```powershell
git pull origin main --rebase
git push -u origin main
```

**Lỗi: "authentication failed"**
- Sử dụng Personal Access Token thay vì password
- Hoặc setup SSH keys

## Tạo Personal Access Token (nếu cần)

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token
3. Chọn scopes: `repo` (full control)
4. Copy token và dùng khi push (thay password)

