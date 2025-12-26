# Create Assessment Engine Database
# Run this script in PowerShell (regular, not admin needed)

Write-Host "Creating assessment_engine database..." -ForegroundColor Cyan
Write-Host ""

# Prompt for password
$password = Read-Host "Enter your PostgreSQL password (the one you set during installation)"

# Set environment variable
$env:PGPASSWORD = $password

# Try to create database
Write-Host "Attempting to create database..." -ForegroundColor Yellow
& "C:\Program Files\PostgreSQL\18\bin\createdb.exe" -U postgres assessment_engine 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "[SUCCESS] Database created!" -ForegroundColor Green
} else {
    Write-Host "[INFO] Database might already exist or there was an error" -ForegroundColor Yellow
    Write-Host "Trying to connect to verify..." -ForegroundColor Yellow
    
    # Try to list databases to verify connection
    & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "\l" | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[SUCCESS] Connection works! Database likely already exists." -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Could not connect. Please check your password." -ForegroundColor Red
        Remove-Item Env:\PGPASSWORD
        exit 1
    }
}

# Clean up
Remove-Item Env:\PGPASSWORD

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Next step: Update .env.local" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Replace the DATABASE_URL line in .env.local with:" -ForegroundColor White
Write-Host "DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/assessment_engine" -ForegroundColor Green
Write-Host ""
Write-Host "(Replace YOUR_PASSWORD with the password you just entered)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
