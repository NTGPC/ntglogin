# 🚀 Quick Start - Chạy Python Backend

## Bước 1: Kiểm tra Docker Services (PostgreSQL + Redis)

```bash
# Kiểm tra Docker services đang chạy
docker-compose ps

# Nếu chưa chạy, khởi động:
docker-compose up -d
```

## Bước 2: Setup Python Environment

```bash
# Vào thư mục py-core
cd packages/py-core

# Cài đặt dependencies
pip install -r requirements.txt

# Cài đặt Playwright browsers
python -m playwright install chromium

# Tạo file .env từ template
copy env.example.txt .env
# (Linux/Mac: cp env.example.txt .env)

# Generate encryption key (32 bytes = 64 hex chars)
python -c "import secrets; print(secrets.token_hex(32))"

# Copy kết quả và paste vào file .env cho dòng FILE_ENCRYPTION_KEY=
# Ví dụ: FILE_ENCRYPTION_KEY=a1b2c3d4e5f6...
```

## Bước 3: Khởi động FastAPI Server

**Terminal 1:**
```bash
cd packages/py-core
uvicorn api.main:app --reload --port 3000
```

Server sẽ chạy tại: http://localhost:3000

## Bước 4: Khởi động RQ Worker

**Terminal 2 (mở terminal mới):**
```bash
cd packages/py-core

# Windows PowerShell:
$env:REDIS_URL="redis://localhost:6379"
rq worker ntg_jobs

# Windows CMD:
set REDIS_URL=redis://localhost:6379
rq worker ntg_jobs

# Linux/Mac:
export REDIS_URL=redis://localhost:6379
rq worker ntg_jobs
```

Hoặc nếu đã set trong .env:
```bash
rq worker ntg_jobs --url redis://localhost:6379
```

## ✅ Kiểm tra hoạt động

Mở trình duyệt hoặc dùng curl:
```bash
# Health check
curl http://localhost:3000/api/health

# Root endpoint
curl http://localhost:3000/
```

## 🔍 Xem logs

- FastAPI server: logs hiển thị trực tiếp trong terminal
- RQ Worker: logs hiển thị khi có job được xử lý

## ⚠️ Lưu ý

- Cần 2 terminal: 1 cho FastAPI server, 1 cho RQ worker
- Đảm bảo PostgreSQL và Redis đang chạy (docker-compose up -d)
- File .env phải có đủ các biến môi trường cần thiết

