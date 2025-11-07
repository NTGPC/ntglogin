# Restore Database Script
# Usage: .\scripts\restore-database.ps1 -BackupFile "database_backup.sql"

param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile
)

$containerName = "ntglogin_postgres"
$dbName = "ntglogin_db"
$dbUser = "postgres"
$dbPassword = "1593579"

Write-Host "Restoring database from backup..." -ForegroundColor Green

# Check if backup file exists
if (-not (Test-Path $BackupFile)) {
    Write-Host "Error: Backup file not found: $BackupFile" -ForegroundColor Red
    exit 1
}

# Check if container is running
$containerStatus = docker ps --filter "name=$containerName" --format "{{.Names}}"
if (-not $containerStatus) {
    Write-Host "Error: Container $containerName is not running!" -ForegroundColor Red
    Write-Host "Please start the container first: docker-compose up -d postgres" -ForegroundColor Yellow
    exit 1
}

Write-Host "Waiting for database to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Drop and recreate database (WARNING: This will delete existing data!)
Write-Host "Dropping existing database (if exists)..." -ForegroundColor Yellow
docker exec -e PGPASSWORD=$dbPassword $containerName psql -U $dbUser -c "DROP DATABASE IF EXISTS $dbName;" postgres

Write-Host "Creating new database..." -ForegroundColor Yellow
docker exec -e PGPASSWORD=$dbPassword $containerName psql -U $dbUser -c "CREATE DATABASE $dbName;" postgres

# Restore backup
Write-Host "Restoring backup file: $BackupFile" -ForegroundColor Yellow
Get-Content $BackupFile | docker exec -i -e PGPASSWORD=$dbPassword $containerName psql -U $dbUser $dbName

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Database restored successfully!" -ForegroundColor Green
    
    # Run Prisma migrations to ensure schema is up to date
    Write-Host "Running Prisma migrations..." -ForegroundColor Yellow
    npx prisma migrate deploy
    
    Write-Host "✓ Database sync complete!" -ForegroundColor Green
} else {
    Write-Host "X Restore failed!" -ForegroundColor Red
    exit 1
}

