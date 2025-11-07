# Backup Database Script
# Usage: .\scripts\backup-database.ps1

$containerName = "ntglogin_postgres"
$dbName = "ntglogin_db"
$dbUser = "postgres"
$backupFile = "database_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"

Write-Host "Creating database backup..." -ForegroundColor Green

# Check if container is running
$containerStatus = docker ps --filter "name=$containerName" --format "{{.Names}}"
if (-not $containerStatus) {
    Write-Host "Error: Container $containerName is not running!" -ForegroundColor Red
    Write-Host "Please start the container first: docker-compose up -d postgres" -ForegroundColor Yellow
    exit 1
}

# Create backup
docker exec $containerName pg_dump -U $dbUser $dbName > $backupFile

if ($LASTEXITCODE -eq 0) {
    $fileSize = (Get-Item $backupFile).Length / 1KB
    $fileSizeKB = [math]::Round($fileSize, 2)
    Write-Host "✓ Backup created successfully: $backupFile ($fileSizeKB KB)" -ForegroundColor Green
    Write-Host "Location: $(Resolve-Path $backupFile)" -ForegroundColor Cyan
} else {
    Write-Host "X Backup failed!" -ForegroundColor Red
    exit 1
}

