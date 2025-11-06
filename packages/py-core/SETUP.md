# Setup Instructions

## Quick Start

1. **Copy environment file:**
   ```bash
   cp env.example.txt .env
   ```

2. **Generate encryption key:**
   ```python
   python -c "import secrets; print(secrets.token_hex(32))"
   ```
   Copy the output to `FILE_ENCRYPTION_KEY` in `.env`

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   python -m playwright install chromium
   ```

4. **Run services:**
   ```bash
   # Terminal 1: API Server
   uvicorn api.main:app --reload --port 3000

   # Terminal 2: Worker
   rq worker ntg_jobs --url redis://localhost:6379
   ```

## Desktop App Configuration

If using the desktop Electron app, set `API_BASE_URL` environment variable:

```bash
# In packages/desktop/.env or environment
API_BASE_URL=http://127.0.0.1:3000
```

Or update the API client in the desktop app to read from environment.

