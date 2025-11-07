# Sync Database Script - For migrating to new machine
# This script creates a complete backup including schema and data
# Usage: .\scripts\sync-database.ps1

$containerName = "ntglogin_postgres"
$dbName = "ntglogin_db"
$dbUser = "postgres"
$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$backupDir = "database_backups"
$backupFile = "$backupDir\ntglogin_db_backup_$timestamp.sql"
$schemaFile = "$backupDir\schema_$timestamp.sql"
$dataFile = "$backupDir\data_$timestamp.sql"

Write-Host "=== Database Sync Script ===" -ForegroundColor Cyan
Write-Host ""

# Create backup directory
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
    Write-Host "Created backup directory: $backupDir" -ForegroundColor Green
}

# Check if container is running
$containerStatus = docker ps --filter "name=$containerName" --format "{{.Names}}"
if (-not $containerStatus) {
    Write-Host "Error: Container $containerName is not running!" -ForegroundColor Red
    Write-Host "Please start the container first: docker-compose up -d postgres" -ForegroundColor Yellow
    exit 1
}

Write-Host "Step 1: Creating full database backup (schema + data)..." -ForegroundColor Yellow
docker exec $containerName pg_dump -U $dbUser -F p $dbName > $backupFile

if ($LASTEXITCODE -eq 0) {
    $fileSize = (Get-Item $backupFile).Length / 1KB
    $fileSizeKB = [math]::Round($fileSize, 2)
    Write-Host "OK Full backup created: $backupFile ($fileSizeKB KB)" -ForegroundColor Green
} else {
    Write-Host "ERROR Backup failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 2: Creating schema-only backup..." -ForegroundColor Yellow
docker exec $containerName pg_dump -U $dbUser -F p --schema-only $dbName > $schemaFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "OK Schema backup created: $schemaFile" -ForegroundColor Green
} else {
    Write-Host "ERROR Schema backup failed!" -ForegroundColor Red
}

Write-Host ""
Write-Host "Step 3: Creating data-only backup..." -ForegroundColor Yellow
docker exec $containerName pg_dump -U $dbUser -F p --data-only $dbName > $dataFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "OK Data backup created: $dataFile" -ForegroundColor Green
} else {
    Write-Host "ERROR Data backup failed!" -ForegroundColor Red
}

Write-Host ""
Write-Host "Step 4: Exporting Prisma schema..." -ForegroundColor Yellow
Copy-Item "prisma\schema.prisma" "$backupDir\schema.prisma" -Force
Write-Host "OK Prisma schema exported" -ForegroundColor Green

Write-Host ""
Write-Host "=== Backup Summary ===" -ForegroundColor Cyan
Write-Host "Backup Directory: $(Resolve-Path $backupDir)" -ForegroundColor White
Write-Host "Full Backup: $backupFile" -ForegroundColor White
Write-Host "Schema Only: $schemaFile" -ForegroundColor White
Write-Host "Data Only: $dataFile" -ForegroundColor White
Write-Host "Prisma Schema: $backupDir\schema.prisma" -ForegroundColor White
Write-Host ""
Write-Host "OK Database sync complete! Copy the '$backupDir' folder to your new machine." -ForegroundColor Green
Write-Host ""
Write-Host "To restore on new machine:" -ForegroundColor Yellow
Write-Host "  1. Copy database_backups folder to new machine" -ForegroundColor White
$restoreCmd = ".\scripts\restore-database.ps1 -BackupFile 'database_backups\ntglogin_db_backup_$timestamp.sql'"
Write-Host "  2. Run: $restoreCmd" -ForegroundColor White
$restoreCmd2 = "Get-Content database_backups\ntglogin_db_backup_$timestamp.sql | docker exec -i ntglogin_postgres psql -U postgres ntglogin_db"
Write-Host "  3. Or use: $restoreCmd2" -ForegroundColor White

