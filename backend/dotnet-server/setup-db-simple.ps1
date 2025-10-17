# Radio Plays Tracker - Simple Database Setup
# This script will guide you through setting up the PostgreSQL database

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Radio Plays Tracker - Database Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Set PostgreSQL path
$PGBIN = "C:\Program Files\PostgreSQL\18\bin"
$env:Path = "$PGBIN;$env:Path"

Write-Host "This script will set up your PostgreSQL database." -ForegroundColor Yellow
Write-Host ""
Write-Host "You will be prompted for your PostgreSQL password 3 times:" -ForegroundColor Yellow
Write-Host "  1. To test the connection" -ForegroundColor Gray
Write-Host "  2. To create the database" -ForegroundColor Gray
Write-Host "  3. To initialize the schema" -ForegroundColor Gray
Write-Host ""

$continue = Read-Host "Continue? (Y/n)"
if ($continue -eq 'n' -or $continue -eq 'N') {
    exit 0
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Test connection
Write-Host "[1/3] Testing PostgreSQL connection..." -ForegroundColor Yellow
Write-Host "      (Enter password for user 'postgres')" -ForegroundColor Gray
Write-Host ""
& "$PGBIN\psql.exe" -U postgres -c "SELECT 'Connection successful!' as status;"
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[ERROR] Cannot connect to PostgreSQL!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure PostgreSQL service is running:" -ForegroundColor Yellow
    Write-Host "  services.msc -> postgresql-x64-18 -> Start" -ForegroundColor Gray
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 2: Create database
Write-Host "[2/3] Creating database 'radio_plays'..." -ForegroundColor Yellow  
Write-Host "      (Enter password for user 'postgres' again)" -ForegroundColor Gray
Write-Host ""
& "$PGBIN\psql.exe" -U postgres -c "CREATE DATABASE radio_plays;"
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[WARNING] Database might already exist" -ForegroundColor Yellow
    Write-Host "Continuing to schema initialization..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 3: Initialize schema
Write-Host "[3/3] Initializing database schema..." -ForegroundColor Yellow
Write-Host "      (Enter password for user 'postgres' one last time)" -ForegroundColor Gray  
Write-Host ""
$scriptPath = Join-Path $PSScriptRoot "scripts\init-db.sql"
& "$PGBIN\psql.exe" -U postgres -d radio_plays -f "$scriptPath"

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[ERROR] Failed to initialize schema!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "     SUCCESS! Database is ready!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Verify
Write-Host "Verifying setup (one more password prompt)..." -ForegroundColor Yellow
$stationCount = & "$PGBIN\psql.exe" -U postgres -d radio_plays -tAc "SELECT COUNT(*) FROM stations;" 2>&1
Write-Host ""
Write-Host "[OK] Database has $stationCount radio stations configured" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Update your PostgreSQL password in:" -ForegroundColor White
Write-Host "   src\RadioPlaysTracker.Api\appsettings.Development.json" -ForegroundColor Gray
Write-Host "   (Change 'Password=postgres' to your actual password)" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Run the .NET API:" -ForegroundColor White
Write-Host "   dotnet run --project src\RadioPlaysTracker.Api" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Test it:" -ForegroundColor White  
Write-Host "   Open: http://localhost:5000/api/station_last_plays?station=glglz" -ForegroundColor Gray
Write-Host ""

Read-Host "Press Enter to exit"
