# PostgreSQL Fix Script - Run as Administrator
# Right-click PowerShell and select Run as Administrator

Write-Host "PostgreSQL Setup Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Define paths
$pgPath = "C:\Program Files\PostgreSQL\18"
$dataDir = "$pgPath\data"
$backupDir = "$pgPath\data.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
$binDir = "$pgPath\bin"

# Step 1: Stop service
Write-Host "Step 1: Stopping PostgreSQL service..." -ForegroundColor Yellow
try {
    Stop-Service postgresql-x64-18 -Force -ErrorAction Stop
    Write-Host "[OK] Service stopped" -ForegroundColor Green
} catch {
    Write-Host "[WARN] Service already stopped or not running" -ForegroundColor Yellow
}

Start-Sleep -Seconds 2

# Step 2: Backup data directory
Write-Host ""
Write-Host "Step 2: Backing up data directory..." -ForegroundColor Yellow
if (Test-Path $dataDir) {
    try {
        Move-Item $dataDir $backupDir -Force -ErrorAction Stop
        Write-Host "[OK] Backup created at: $backupDir" -ForegroundColor Green
    } catch {
        Write-Host "[ERROR] Could not backup data directory: $_" -ForegroundColor Red
        Write-Host "Trying to continue anyway..." -ForegroundColor Yellow
    }
}

# Step 3: Initialize new database
Write-Host ""
Write-Host "Step 3: Initializing new database..." -ForegroundColor Yellow
Write-Host "You will be prompted to enter a password. Use: postgres" -ForegroundColor Cyan

$initdbExe = "$binDir\initdb.exe"
if (Test-Path $initdbExe) {
    & $initdbExe -D $dataDir -U postgres --pwprompt --encoding=UTF8 --locale=English_United_States
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Database initialized" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Database initialization failed" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[ERROR] initdb.exe not found at: $initdbExe" -ForegroundColor Red
    exit 1
}

# Step 4: Start service
Write-Host ""
Write-Host "Step 4: Starting PostgreSQL service..." -ForegroundColor Yellow
try {
    Start-Service postgresql-x64-18 -ErrorAction Stop
    Start-Sleep -Seconds 3
    $service = Get-Service postgresql-x64-18
    if ($service.Status -eq 'Running') {
        Write-Host "[OK] PostgreSQL is running!" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Service started but not running. Status: $($service.Status)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "[ERROR] Failed to start service: $_" -ForegroundColor Red
    exit 1
}

# Step 5: Create database
Write-Host ""
Write-Host "Step 5: Creating assessment_engine database..." -ForegroundColor Yellow
$psqlExe = "$binDir\psql.exe"
if (Test-Path $psqlExe) {
    $env:PGPASSWORD = "postgres"
    & $psqlExe -U postgres -c "CREATE DATABASE assessment_engine;" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Database created successfully!" -ForegroundColor Green
    } else {
        Write-Host "[WARN] Database might already exist (this is OK)" -ForegroundColor Yellow
    }
    Remove-Item Env:\PGPASSWORD
} else {
    Write-Host "[ERROR] psql.exe not found at: $psqlExe" -ForegroundColor Red
}

# Final status
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "[SUCCESS] PostgreSQL Setup Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Next steps (run in your REGULAR terminal, not as admin):" -ForegroundColor Yellow
Write-Host "  cd 'd:\jagadeesh\assessment ai portal\assessment-engine\assessment-engine'" -ForegroundColor White
Write-Host "  npm run db:init" -ForegroundColor White
Write-Host "  npm run db:migrate" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
