# 🚀 Lệnh chạy theo thứ tự

## 1. Chuẩn bị môi trường

```bash
# Bước 1: Đảm bảo Docker services đang chạy (PostgreSQL + Redis)
docker-compose up -d

# Kiểm tra services
docker-compose ps
```

## 2. Setup Python backend

```bash
# Bước 2: Vào thư mục py-core
cd packages/py-core

# Bước 3: Tạo virtual environment (optional nhưng recommended)
python -m venv venv

# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Bước 4: Cài đặt dependencies
pip install -r requirements.txt

# Bước 5: Cài đặt Playwright browsers
python -m playwright install chromium

# Bước 6: Tạo file .env
cp env.example.txt .env

# Bước 7: Generate encryption key và update .env
python -c "import secrets; print('FILE_ENCRYPTION_KEY=' + secrets.token_hex(32))"
# Copy output vào file .env
```

## 3. Khởi động services

### Terminal 1: FastAPI Server

```bash
cd packages/py-core
uvicorn api.main:app --reload --port 3000
```

Hoặc:
```bash
python -m uvicorn api.main:app --reload --port 3000
```

### Terminal 2: RQ Worker

```bash
cd packages/py-core
export REDIS_URL=redis://localhost:6379  # Linux/Mac
# hoặc
set REDIS_URL=redis://localhost:6379     # Windows CMD
# hoặc
$env:REDIS_URL="redis://localhost:6379"  # Windows PowerShell

rq worker ntg_jobs --url redis://localhost:6379
```

Hoặc nếu đã set trong .env:
```bash
rq worker ntg_jobs
```

## 4. Test API

### Test 1: Health Check

```bash
curl http://localhost:3000/api/health
```

### Test 2: Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Lưu token từ response.

### Test 3: Get Profiles

```bash
curl http://localhost:3000/api/profiles \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Test 4: Create Session

```bash
curl -X POST http://localhost:3000/api/sessions \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"profile_id": 1, "proxy_id": 1, "status": "running"}'
```

### Test 5: Get Job Executions

```bash
curl "http://localhost:3000/api/job-executions?jobId=1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Test 6: Get Logs

```bash
curl "http://localhost:3000/api/logs?level=info&jobExecId=1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 5. Khởi động Desktop App (nếu có)

```bash
cd packages/desktop
npm install
npm run electron:dev
```

Đảm bảo desktop app có config `API_BASE_URL=http://127.0.0.1:3000`

## Tóm tắt lệnh

```bash
# Terminal 1
cd packages/py-core
uvicorn api.main:app --reload --port 3000

# Terminal 2
cd packages/py-core
rq worker ntg_jobs --url redis://localhost:6379

# Terminal 3 (Desktop - nếu có)
cd packages/desktop
npm run electron:dev
```

## Kiểm tra screenshot

Screenshots được lưu tại `packages/py-core/data/screenshots/` (hoặc `SCREEN_DIR` trong .env)

```bash
ls -la packages/py-core/data/screenshots/
```

