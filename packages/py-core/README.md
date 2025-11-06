# NTG Login Python Core

Python backend implementation replacing Node.js backend, maintaining 100% API compatibility.

## 🏗️ Architecture

- **FastAPI**: REST API server matching Node.js routes exactly
- **SQLAlchemy**: Database ORM mapping to existing Prisma schema
- **RQ + Redis**: Background job processing (replaces BullMQ)
- **Playwright**: Browser automation with fingerprint spoofing
- **Socket.IO**: Realtime events (jobExecution:update, session:update)

## 📋 Prerequisites

- Python 3.9+
- PostgreSQL (same database as Node.js backend)
- Redis (for RQ queue)
- Playwright browsers

## 🚀 Installation

1. **Install Python dependencies:**
```bash
cd packages/py-core
pip install -r requirements.txt
```

2. **Install Playwright browsers:**
```bash
python -m playwright install chromium
```

3. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your settings
```

## 🔧 Configuration

Edit `.env` file:

```env
DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/ntglogin_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
FILE_ENCRYPTION_KEY=64_hex_characters_for_32_bytes
MAX_CONCURRENCY=10
SCREEN_DIR=./data/screenshots
```

**Important**: Generate a secure `FILE_ENCRYPTION_KEY`:
```python
import secrets
print(secrets.token_hex(32))  # 64 hex characters
```

## 🏃 Running

### 1. Start FastAPI Server

```bash
uvicorn api.main:app --reload --port 3000
```

Or using Python module:
```bash
python -m uvicorn api.main:app --reload --port 3000
```

### 2. Start RQ Worker

In a separate terminal:
```bash
rq worker ntg_jobs --url redis://localhost:6379
```

Or set `REDIS_URL` in environment:
```bash
export REDIS_URL=redis://localhost:6379
rq worker ntg_jobs
```

## 📡 API Endpoints

All endpoints match Node.js API contract exactly:

- `POST /api/auth/login` - Login and get JWT token
- `POST /api/auth/register` - Register new user
- `GET /api/profiles` - Get all profiles
- `POST /api/profiles` - Create profile
- `GET /api/proxies` - Get all proxies
- `POST /api/proxies` - Create proxy (password encrypted)
- `GET /api/sessions` - Get all sessions
- `POST /api/sessions` - Create session
- `POST /api/sessions/:id/stop` - Stop session
- `GET /api/jobs` - Get all jobs
- `POST /api/jobs` - Create job
- `GET /api/job-executions?jobId=X` - Get job executions
- `GET /api/logs?level=error&jobExecId=X` - Get logs
- `GET /api/fingerprints` - Get all fingerprints
- `GET /api/workflows` - Get all workflows
- `GET /api/health` - Health check

## 🧪 Testing

Run tests:
```bash
pytest tests/
```

Or specific test:
```bash
pytest tests/test_crypto.py -v
pytest tests/test_injection.py -v
```

## 🔒 Security

- **Proxy Passwords**: Encrypted using AES-256-GCM before storage
- **JWT Tokens**: Used for authentication (same as Node.js backend)
- **Database**: Uses existing Prisma schema (no schema changes)

## 🔄 Worker Jobs

Worker processes these job types:
- `start_session`: Start a browser session
- `stop_session`: Stop a running session
- `run_job_execution`: Execute Playwright automation job

Job flow:
1. API creates Job + JobExecution records
2. Job enqueued to RQ queue
3. Worker picks up job
4. Playwright launches browser with fingerprint
5. Navigates to URL, takes screenshot
6. Updates JobExecution with result
7. Emits socket event

## 📊 Realtime Events

Socket.IO events (via python-socketio):
- `jobExecution:update`: Job execution status changed
- `session:update`: Session status changed

## 🗄️ Database

**Important**: Uses existing PostgreSQL database created by Prisma. No schema changes needed.

Tables used:
- `users` - Authentication
- `profiles` - Browser profiles
- `proxies` - Proxy configurations
- `sessions` - Active sessions
- `jobs` - Job queue
- `logs` - Application logs
- `job_executions` (if exists) - Individual job executions
- `fingerprints` (optional) - Fingerprint templates
- `workflows` (optional) - Workflow definitions

## 🔀 Switching from Node.js Backend

1. **Stop Node.js backend** (if running)
2. **Start Python FastAPI server** on same port (3000)
3. **Start RQ worker** for job processing
4. **Update desktop app** `API_BASE_URL` if needed (default: `http://127.0.0.1:3000`)

UI should work without any code changes!

## 🐛 Troubleshooting

### Database connection errors
- Check `DATABASE_URL` in `.env`
- Ensure PostgreSQL is running
- Verify database exists: `psql -U postgres -l`

### Redis connection errors
- Check `REDIS_URL` in `.env`
- Ensure Redis is running: `redis-cli ping`

### Playwright errors
- Install browsers: `python -m playwright install chromium`
- Check browser installation: `python -m playwright install --help`

### Import errors
- Ensure you're in `packages/py-core` directory
- Install dependencies: `pip install -r requirements.txt`
- Check Python path: `python -c "import sys; print(sys.path)"`

## 📝 Notes

- **No schema changes**: Python backend reads/writes to same tables as Node.js
- **API compatible**: All routes return same JSON structure
- **Proxy passwords**: Encrypted in DB, decrypted when used
- **Screenshots**: Saved to `SCREEN_DIR` (default: `./data/screenshots`)
- **Concurrency**: Controlled by `MAX_CONCURRENCY` env var

## 🔗 Related

- Node.js backend: `packages/backend/` (kept for reference)
- Desktop app: `packages/desktop/` (works with both backends)

