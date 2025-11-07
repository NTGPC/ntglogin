# Hướng Dẫn Đồng Bộ Database

## 📋 Tổng Quan

Hướng dẫn này giúp bạn backup và restore database để chuyển sang máy mới.

## 🔄 Backup Database (Máy Cũ)

### Cách 1: Sử dụng Script (Khuyến nghị)

```powershell
.\scripts\sync-database.ps1
```

Script này sẽ tạo:
- Full backup (schema + data): `database_backups/ntglogin_db_backup_YYYYMMDD_HHMMSS.sql`
- Schema only: `database_backups/schema_YYYYMMDD_HHMMSS.sql`
- Data only: `database_backups/data_YYYYMMDD_HHMMSS.sql`
- Prisma schema: `database_backups/schema.prisma`

### Cách 2: Backup Thủ Công

```powershell
# Full backup
docker exec ntglogin_postgres pg_dump -U postgres ntglogin_db > database_backup.sql

# Schema only
docker exec ntglogin_postgres pg_dump -U postgres --schema-only ntglogin_db > schema.sql

# Data only
docker exec ntglogin_postgres pg_dump -U postgres --data-only ntglogin_db > data.sql
```

## 🚀 Restore Database (Máy Mới)

### Bước 1: Copy Files

Copy thư mục `database_backups` sang máy mới, hoặc copy file backup SQL.

### Bước 2: Setup Máy Mới

```powershell
# Option 1: Sử dụng script tự động
.\scripts\setup-new-machine.ps1 -BackupFile "database_backups\ntglogin_db_backup_YYYYMMDD_HHMMSS.sql"

# Option 2: Manual setup
```

### Bước 3: Manual Setup (Nếu không dùng script)

```powershell
# 1. Start Docker services
docker-compose up -d postgres

# 2. Wait for database to be ready
Start-Sleep -Seconds 5

# 3. Run Prisma migrations
npx prisma migrate deploy

# 4. Restore backup
Get-Content database_backup.sql | docker exec -i -e PGPASSWORD=1593579 ntglogin_postgres psql -U postgres ntglogin_db

# 5. Generate Prisma Client
npx prisma generate
```

## 📝 Chi Tiết Các Script

### `scripts/sync-database.ps1`
- Tạo backup đầy đủ (schema + data)
- Export Prisma schema
- Tạo thư mục `database_backups` với tất cả files cần thiết

### `scripts/backup-database.ps1`
- Tạo backup nhanh (full database)
- Output: `database_backup_YYYYMMDD_HHMMSS.sql`

### `scripts/restore-database.ps1`
- Restore database từ backup file
- Tự động drop và recreate database
- Chạy Prisma migrations sau restore

### `scripts/setup-new-machine.ps1`
- Setup tự động cho máy mới
- Start Docker services
- Run migrations
- Restore backup (nếu có)
- Generate Prisma Client

## ⚠️ Lưu Ý

1. **Backup thường xuyên**: Nên backup trước khi có thay đổi lớn
2. **Kiểm tra file size**: Backup file có thể lớn, đảm bảo có đủ dung lượng
3. **Test restore**: Nên test restore trên máy dev trước khi restore trên máy production
4. **Environment variables**: Đảm bảo `.env` file có `DATABASE_URL` đúng

## 🔍 Kiểm Tra Database

```powershell
# Check container status
docker ps | Select-String "ntglogin_postgres"

# Check database connection
docker exec ntglogin_postgres psql -U postgres -c "\l" | Select-String "ntglogin_db"

# View tables
docker exec ntglogin_postgres psql -U postgres -d ntglogin_db -c "\dt"
```

## 📦 Files Cần Copy Sang Máy Mới

1. `database_backups/` - Thư mục chứa backup files
2. `prisma/schema.prisma` - Database schema
3. `.env` - Environment variables (nhớ update DATABASE_URL)
4. `docker-compose.yml` - Docker configuration

## 🆘 Troubleshooting

### Container không chạy
```powershell
docker-compose up -d postgres
docker ps | Select-String "ntglogin_postgres"
```

### Database connection error
- Kiểm tra `DATABASE_URL` trong `.env`
- Kiểm tra container đã start chưa
- Kiểm tra port 5432 có bị chiếm không

### Restore failed
- Đảm bảo database đã được tạo
- Kiểm tra file backup có hợp lệ không
- Xem logs: `docker logs ntglogin_postgres`

## 📚 Tham Khảo

- [PostgreSQL Backup Documentation](https://www.postgresql.org/docs/current/backup.html)
- [Prisma Migrate Guide](https://www.prisma.io/docs/concepts/components/prisma-migrate)

