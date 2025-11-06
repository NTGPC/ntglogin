# Deployment Guide - Push to GitHub & Database Migration

## Bước 1: Chạy Migration để tạo bảng Changelog

```powershell
cd D:\NTGLOGIN

# Generate Prisma Client
npm run prisma:generate

# Tạo migration cho bảng Changelog
npx prisma migrate dev --name add_changelog_table

# Hoặc nếu muốn tạo migration file mà không apply ngay
npx prisma migrate dev --name add_changelog_table --create-only
```

## Bước 2: Seed Changelog Data

```powershell
# Chạy seed để thêm changelog entries ban đầu
npm run seed
```

## Bước 3: Push Code lên GitHub

Xem file `GITHUB_SETUP.md` để biết chi tiết.

Tóm tắt:
```powershell
git add .
git commit -m "feat: Add fingerprint injection system and changelog management"
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
git push -u origin main
```

## Bước 4: Verify

1. Kiểm tra trên GitHub: code đã được push
2. Kiểm tra database: bảng `changelogs` đã được tạo
3. Test API: `GET /api/changelogs` để xem changelog entries

## API Endpoints cho Changelog

### Get all changelogs
```
GET /api/changelogs
GET /api/changelogs?limit=10
```

### Get by version
```
GET /api/changelogs/version/Unreleased
```

### Get by type
```
GET /api/changelogs/type?type=Added
```

### Get by category
```
GET /api/changelogs/category?category=Fingerprint
```

### Create changelog
```
POST /api/changelogs
Body: {
  "version": "1.0.0",
  "title": "New Feature",
  "type": "Added",
  "category": "Feature",
  "description": "Description here",
  "files": ["file1.ts", "file2.ts"],
  "author": "Your Name"
}
```

### Update changelog
```
PUT /api/changelogs/:id
Body: { ... }
```

### Delete changelog
```
DELETE /api/changelogs/:id
```

## Lưu ý

- Bảng `changelogs` sẽ được tạo trong database sau khi chạy migration
- Seed script sẽ tự động thêm các changelog entries ban đầu
- Có thể quản lý changelog qua API hoặc trực tiếp trong database

