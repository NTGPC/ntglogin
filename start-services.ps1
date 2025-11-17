Write-Host "Starting NTGLOGIN Services..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Starting Backend (port 3000)..." -ForegroundColor Yellow
$backendScript = "cd D:\NTGLOGIN; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendScript

Start-Sleep -Seconds 3

Write-Host "Starting Admin Web (port 5175)..." -ForegroundColor Yellow
$frontendScript = "cd D:\NTGLOGIN\packages\admin-web; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendScript

Start-Sleep -Seconds 5

Write-Host ""
Write-Host "Services starting in separate windows..." -ForegroundColor Green
Write-Host "   - Backend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "   - Admin Web: http://localhost:5175" -ForegroundColor Cyan
Write-Host ""
Write-Host "Please wait a few seconds for services to start!" -ForegroundColor Yellow
Write-Host "Check the new PowerShell windows for startup logs." -ForegroundColor Gray

