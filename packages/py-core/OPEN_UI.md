# 🖥️ Mở Giao Diện

## Option 1: FastAPI Swagger UI (Khuyến nghị) ⭐

FastAPI tự động tạo giao diện API documentation rất đẹp!

**Mở trình duyệt và truy cập:**

```
http://localhost:3000/docs
```

Hoặc:

```
http://127.0.0.1:3000/docs
```

Tại đây bạn có thể:
- ✅ Xem tất cả API endpoints
- ✅ Test API trực tiếp trên browser
- ✅ Xem request/response schemas
- ✅ Gửi request và xem kết quả ngay lập tức

## Option 2: FastAPI ReDoc

Giao diện documentation khác (alternative UI):

```
http://localhost:3000/redoc
```

## Option 3: Test với curl hoặc Postman

Nếu muốn test từ command line:

```powershell
# Test login
curl -X POST http://localhost:3000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"username\":\"admin\",\"password\":\"admin123\"}'
```

## Option 4: Tạo Desktop App (Tùy chọn)

Nếu bạn muốn có desktop Electron app, cần tạo riêng. Hiện tại chỉ có backend API.

---

## 🎯 Khuyến nghị

**Mở ngay:** http://localhost:3000/docs

Đây là giao diện Swagger UI, rất tiện để test và xem API!

