# Script to start all NTGLOGIN services
Write-Host "🚀 NTGLOGIN - Start All Services" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Check if backend is running
Write-Host "📦 Checking Backend (port 3000)..." -ForegroundColor Yellow
$backend = netstat -ano | findstr :3000
if ($backend) {
    Write-Host "   ✅ Backend is running" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Backend not running. Open new terminal and run:" -ForegroundColor Yellow
    Write-Host "      npm run dev" -ForegroundColor White
}

Write-Host ""

# Check if frontend is running
Write-Host "📦 Checking Admin Web (port 5175)..." -ForegroundColor Yellow
$frontend = netstat -ano | findstr :5175
if ($frontend) {
    Write-Host "   ✅ Admin Web is running" -ForegroundColor Green
} else {
    Write-Host "   ▶️  Starting Admin Web..." -ForegroundColor Yellow
    
    # Start Admin Web in new window
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd D:\NTGLOGIN\packages\admin-web; Write-Host 'Starting Admin Web on port 5175...' -ForegroundColor Cyan; npm run dev" -WindowStyle Normal
    
    Write-Host "   ⏳ Waiting 8 seconds for frontend to start..." -ForegroundColor Gray
    Start-Sleep -Seconds 8
    
    # Check again
    $frontend = netstat -ano | findstr :5175
    if ($frontend) {
        Write-Host "   ✅ Admin Web started!" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Admin Web not started. Check new terminal for error logs." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "================================`n" -ForegroundColor Cyan
Write-Host "🌐 URLs:" -ForegroundColor Cyan
Write-Host "   - Backend API: http://localhost:3000" -ForegroundColor White
Write-Host "   - Admin Web: http://localhost:5175" -ForegroundColor White
Write-Host ""
Write-Host "✅ Done! Open browser and visit http://localhost:5175" -ForegroundColor Green
Write-Host ""
