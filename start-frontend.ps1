# Script để start Admin Web Frontend
Write-Host "🚀 Starting Admin Web Frontend..." -ForegroundColor Cyan
Write-Host ""

# Navigate to admin-web directory
Set-Location "D:\NTGLOGIN\packages\admin-web"

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠️  node_modules not found. Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Start dev server
Write-Host ""
Write-Host "▶️  Starting Vite dev server on port 5175..." -ForegroundColor Green
Write-Host ""
npm run dev

