# 🐍 Python Core - Quick Start Guide

## ✅ Đã hoàn thành

Đã tạo đầy đủ Python backend thay thế Node.js với:

- ✅ FastAPI server với tất cả routes khớp contract cũ
- ✅ SQLAlchemy models map đúng Prisma schema
- ✅ RQ worker với Playwright automation
- ✅ Encryption (AES-256-GCM) cho proxy passwords
- ✅ Fingerprint injection service
- ✅ Screenshot storage
- ✅ Tests cho crypto và injection
- ✅ Socket.IO cho realtime events

## 🚀 Khởi chạy nhanh

### Bước 1: Setup môi trường

```bash
cd packages/py-core

# Tạo .env từ template
cp env.example.txt .env

# Tạo encryption key (chạy Python):
python -c "import secrets; print('FILE_ENCRYPTION_KEY=' + secrets.token_hex(32))"
# Copy output vào .env
```

### Bước 2: Cài đặt dependencies

```bash
pip install -r requirements.txt
python -m playwright install chromium
```

### Bước 3: Khởi động services

**Terminal 1 - API Server:**
```bash
uvicorn api.main:app --reload --port 3000
```

**Terminal 2 - RQ Worker:**
```bash
rq worker ntg_jobs --url redis://localhost:6379
```

### Bước 4: Test API

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Get profiles
curl http://localhost:3000/api/profiles \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📁 Cấu trúc file

```
packages/py-core/
├── api/
│   ├── main.py              # FastAPI app entry point
│   ├── auth.py              # JWT auth utilities
│   ├── middleware.py        # Auth middleware
│   ├── compat.py            # Compatibility layer
│   └── routes/              # All API routes
│       ├── auth.py
│       ├── profiles.py
│       ├── proxies.py
│       ├── sessions.py
│       ├── jobs.py
│       ├── job_executions.py
│       ├── logs.py
│       ├── fingerprints.py
│       ├── workflows.py
│       └── health.py
├── db/
│   ├── models.py            # SQLAlchemy models
│   ├── database.py          # DB connection
│   └── __init__.py
├── services/
│   ├── crypto.py            # AES-256-GCM encryption
│   ├── fingerprint_injection.py  # JS injection builder
│   └── storage.py           # Screenshot storage
├── worker/
│   ├── queue.py             # RQ queue setup
│   └── run_job.py           # Job processor (Playwright)
├── tests/
│   ├── test_crypto.py
│   └── test_injection.py
├── requirements.txt
├── env.example.txt
├── README.md
└── SETUP.md
```

## 🔌 API Routes (giống hệt Node.js)

- `POST /api/auth/login` - Login
- `GET /api/profiles` - Get profiles
- `POST /api/profiles` - Create profile
- `GET /api/proxies` - Get proxies
- `POST /api/proxies` - Create proxy
- `GET /api/sessions` - Get sessions
- `POST /api/sessions` - Create session
- `POST /api/sessions/:id/stop` - Stop session
- `GET /api/jobs` - Get jobs
- `POST /api/jobs` - Create job
- `GET /api/job-executions?jobId=X` - Get executions
- `GET /api/logs?jobExecId=X` - Get logs
- `GET /api/fingerprints` - Get fingerprints
- `GET /api/workflows` - Get workflows
- `GET /api/health` - Health check

## 🧪 Test

```bash
# Run all tests
pytest tests/

# Test crypto
pytest tests/test_crypto.py -v

# Test injection
pytest tests/test_injection.py -v
```

## ⚙️ Environment Variables

Xem `env.example.txt` hoặc `.env.example`:

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - JWT signing secret
- `FILE_ENCRYPTION_KEY` - 64 hex chars (32 bytes) for AES-256
- `MAX_CONCURRENCY` - Max concurrent worker jobs
- `SCREEN_DIR` - Screenshot storage directory

## 🔄 Desktop App Integration

Để desktop app gọi Python API, set environment variable:

```bash
API_BASE_URL=http://127.0.0.1:3000
```

Hoặc update API client trong desktop app để đọc từ env/config.

## 📝 Notes

- **Không thay đổi schema DB**: Python backend dùng đúng bảng Prisma đã tạo
- **API compatible**: Tất cả response format giống hệt Node.js
- **Proxy passwords**: Được encrypt bằng AES-256-GCM trước khi lưu DB
- **Screenshots**: Lưu tại `SCREEN_DIR` (mặc định: `./data/screenshots`)

## 🐛 Troubleshooting

**Database connection error:**
- Kiểm tra `DATABASE_URL` trong `.env`
- Đảm bảo PostgreSQL đang chạy
- Verify DB exists: `psql -U postgres -l`

**Redis connection error:**
- Kiểm tra `REDIS_URL`
- Test Redis: `redis-cli ping`

**Import errors:**
- Đảm bảo đang ở thư mục `packages/py-core`
- Install dependencies: `pip install -r requirements.txt`

