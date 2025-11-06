# Cách thêm dữ liệu mẫu

Database đang trống, bạn có 2 cách để thêm dữ liệu:

## Cách 1: Tạo dữ liệu qua Frontend UI (Dễ nhất) ⭐

1. **Mở frontend**: http://localhost:5173
2. **Đăng nhập**: 
   - Username: `admin`
   - Password: `admin123` (hoặc tạo user mới nếu chưa có)
3. **Tạo Profiles**:
   - Vào tab "Profiles"
   - Click "+ Add Profile"
   - Điền tên và user agent
   - Click "Create"
4. **Tạo Proxies**:
   - Vào tab "Proxies"
   - Click "+ Add Proxy"
   - Điền thông tin proxy
   - Click "Create"
5. **Tạo Sessions** (tùy chọn):
   - Vào tab "Sessions"
   - Click "+ Create Session"
   - Chọn Profile và Proxy
   - Click "Create"

## Cách 2: Seed qua Python script (Nếu database đã kết nối)

```bash
cd packages/py-core
python seed_db.py
```

**Lưu ý**: Đảm bảo:
- Docker PostgreSQL đang chạy: `docker-compose up -d`
- File `.env` có DATABASE_URL đúng password

## Cách 3: Tạo Admin user trước (Nếu chưa có)

Nếu không login được, bạn có thể đăng ký user mới:
- Vào http://localhost:3000/docs
- POST `/api/auth/register`
- Body: `{"username": "admin", "password": "admin123"}`

