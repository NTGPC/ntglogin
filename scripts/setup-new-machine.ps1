# Setup New Machine Script
# This script helps set up the database on a new machine
# Usage: .\scripts\setup-new-machine.ps1

param(
    [string]$BackupFile = ""
)

Write-Host "=== NTG Login - New Machine Setup ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Docker
Write-Host "Step 1: Checking Docker..." -ForegroundColor Yellow
$dockerVersion = docker --version
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Docker is installed: $dockerVersion" -ForegroundColor Green
} else {
    Write-Host "X Docker is not installed or not running!" -ForegroundColor Red
    Write-Host "Please install Docker Desktop first." -ForegroundColor Yellow
    exit 1
}

# Step 2: Start Docker services
Write-Host ""
Write-Host "Step 2: Starting Docker services..." -ForegroundColor Yellow
docker-compose up -d postgres

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ PostgreSQL container started" -ForegroundColor Green
} else {
    Write-Host "X Failed to start PostgreSQL!" -ForegroundColor Red
    exit 1
}

# Wait for database to be ready
Write-Host "Waiting for database to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Step 3: Run Prisma migrations
Write-Host ""
Write-Host "Step 3: Running Prisma migrations..." -ForegroundColor Yellow
npx prisma migrate deploy

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Database schema created" -ForegroundColor Green
} else {
    Write-Host "X Migration failed!" -ForegroundColor Red
    exit 1
}

# Step 4: Restore backup if provided
if ($BackupFile -and (Test-Path $BackupFile)) {
    Write-Host ""
    Write-Host "Step 4: Restoring database backup..." -ForegroundColor Yellow
    Get-Content $BackupFile | docker exec -i -e PGPASSWORD=1593579 ntglogin_postgres psql -U postgres ntglogin_db
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Database restored from backup" -ForegroundColor Green
    } else {
        Write-Host "X Restore failed!" -ForegroundColor Red
    }
} else {
    Write-Host ""
    Write-Host "Step 4: No backup file provided, skipping restore." -ForegroundColor Yellow
    Write-Host "To restore later, run:" -ForegroundColor White
    Write-Host "  .\scripts\restore-database.ps1 -BackupFile `"path\to\backup.sql`"" -ForegroundColor Cyan
}

# Step 5: Generate Prisma Client
Write-Host ""
Write-Host "Step 5: Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Prisma Client generated" -ForegroundColor Green
} else {
    Write-Host "X Prisma Client generation failed!" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Setup Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Update .env file with correct DATABASE_URL" -ForegroundColor White
Write-Host "  2. Run: npm install" -ForegroundColor White
Write-Host "  3. Run: npm run dev" -ForegroundColor White
Write-Host ""

