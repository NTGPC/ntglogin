## Hướng dẫn chạy toàn bộ dự án (Database + Backend + Frontend)

Áp dụng cho Windows (PowerShell). Nếu thiếu module/dependency, chạy phần "Cài đặt phụ thuộc" để tự động cài.

### 1) Yêu cầu hệ thống
- **Node.js** >= 18
- **Docker Desktop** (khuyến nghị để chạy PostgreSQL/Redis/pgAdmin)
- Quyền chạy PowerShell script (mở PowerShell Admin và chạy):

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 2) Chuẩn bị môi trường (.env)
Tại thư mục gốc `D:\NTGLOGIN`, tạo file `.env` (nếu chưa có) với nội dung tối thiểu:

```env
DATABASE_URL="postgresql://postgres:1593579@localhost:5432/ntglogin_db"
REDIS_URL="redis://localhost:6379"
PORT=3000
NODE_ENV=development
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
```

Tham khảo thêm biến môi trường trong `ENV_SETUP.md` nếu cần dùng RSA keys hoặc dịch vụ khác.

### 3) Khởi chạy Database bằng Docker (Khuyến nghị)
Tại thư mục gốc `D:\NTGLOGIN`:

```powershell
docker compose up -d
```

Sau khi chạy xong, kiểm tra:
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- pgAdmin: `http://localhost:5050` (Email: `admin@admin.com` / Password: `admin`)

Xem trạng thái container:

```powershell
docker compose ps
```

### 4) Cài đặt phụ thuộc (root + frontend)

```powershell
# Cài tại root (backend + workspace)
cd D:\NTGLOGIN
npm install

# Cài tại frontend (Admin Web)
cd D:\NTGLOGIN\packages\admin-web
npm install
```

### 5) Generate client, migrate và seed Database (Prisma)

```powershell
cd D:\NTGLOGIN
npm run prisma:generate
npm run prisma:migrate
npm run seed
```

### 6) Chạy Backend

```powershell
cd D:\NTGLOGIN
npm run dev
# Kết quả mong đợi: http://localhost:3000
```

Bạn có thể mở tab PowerShell mới để tiếp tục bước 7.

### 7) Chạy Frontend (Admin Web)

```powershell
cd D:\NTGLOGIN\packages\admin-web
npm run dev
# Kết quả mong đợi: http://localhost:5175
```

Frontend sẽ gọi API từ backend ở `http://localhost:3000` (đảm bảo backend chạy trước).

### 8) Chạy nhanh bằng script (tùy chọn, Windows)
- Chạy riêng frontend: `start-frontend.ps1`
- Khởi động đồng thời (ưu tiên frontend, kiểm tra backend): `start-all-services.ps1`

```powershell
cd D:\NTGLOGIN
./start-all-services.ps1
```

Script sẽ mở cửa sổ mới cho frontend và hiển thị URL truy cập.

### 9) Kiểm tra nhanh

```powershell
# Kiểm tra Backend Health
curl http://localhost:3000/api/health

# Mở Admin Web trên trình duyệt
start http://localhost:5175
```

### 10) Khắc phục lỗi thường gặp
- **Port đang bận**:

```powershell
netstat -ano | findstr :3000
netstat -ano | findstr :5175
taskkill /PID <PID> /F
```

- **Thiếu module/không tìm thấy module**:

```powershell
cd D:\NTGLOGIN; npm install
cd D:\NTGLOGIN\packages\admin-web; npm install
```

- **Frontend không gọi được API (ECONNREFUSED/CORS)**:
  - Đảm bảo backend đang chạy: `curl http://localhost:3000/api/health`
  - Kiểm tra cấu hình CORS trong `src/index.ts`
  - Kiểm tra biến môi trường của frontend (nếu có cấu hình API URL)

- **Docker không lên DB**:

```powershell
docker compose logs -f
docker compose restart
```

### 11) Dừng dịch vụ

```powershell
# Dừng Docker services
cd D:\NTGLOGIN
docker compose down

# Dừng node processes (nếu cần)
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
```

### Ghi chú
- Tài liệu chi tiết backend và API: xem `README.md`
- Hướng dẫn khởi động/troubleshoot nhanh: xem `START_SERVICES.md`
- Biến môi trường nâng cao: xem `ENV_SETUP.md`


