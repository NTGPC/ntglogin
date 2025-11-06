Write-Host "🚀 NTGLOGIN - RUN ALL (Database → Backend → Frontend)" -ForegroundColor Cyan
Write-Host "=========================================================`n" -ForegroundColor Cyan

function Ensure-DirInstalled($path) {
    if (-not (Test-Path $path)) { return $false }
    if (-not (Test-Path (Join-Path $path 'node_modules'))) { return $false }
    return $true
}

Set-Location "D:\NTGLOGIN"

# 1) Database (Docker)
Write-Host "🐳 Starting Database services (PostgreSQL, Redis, pgAdmin)…" -ForegroundColor Yellow
try {
    docker compose up -d | Out-Null
    Write-Host "   ✅ Docker services are up" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Docker not available. Please install/start Docker Desktop." -ForegroundColor Red
    exit 1
}

# 2) Backend
Write-Host "`n📦 Backend setup…" -ForegroundColor Yellow
if (-not (Ensure-DirInstalled "D:\NTGLOGIN")) {
    Write-Host "   ⏳ Installing backend dependencies…" -ForegroundColor Gray
    npm install | Out-Null
}

Write-Host "   ▶️  Running prisma generate + migrate + seed…" -ForegroundColor Gray
npm run prisma:generate | Out-Null
npm run prisma:migrate | Out-Null
try { npm run seed | Out-Null } catch {}

Write-Host "   ▶️  Starting Backend (http://localhost:3000)…" -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd D:\NTGLOGIN; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 4

# 3) Frontend
Write-Host "`n🖥️  Frontend (Admin Web) setup…" -ForegroundColor Yellow
Set-Location "D:\NTGLOGIN\packages\admin-web"
if (-not (Test-Path "node_modules")) {
    Write-Host "   ⏳ Installing frontend dependencies…" -ForegroundColor Gray
    npm install | Out-Null
}

Write-Host "   ▶️  Starting Frontend (http://127.0.0.1:5175)…" -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd D:\NTGLOGIN\packages\admin-web; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 3

Write-Host "`n🌐 Open: http://127.0.0.1:5175" -ForegroundColor Cyan
Start-Process "http://127.0.0.1:5175"

Write-Host "`n✅ Done. Use the two opened terminals for logs." -ForegroundColor Green


