# Radio Plays Tracker - Database Setup Script
# PowerShell version

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Radio Plays Tracker - Database Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Set PostgreSQL bin directory
$PGBIN = "C:\Program Files\PostgreSQL\18\bin"
$env:Path = "$PGBIN;$env:Path"

# Test PostgreSQL connection
Write-Host "Step 1: Testing PostgreSQL connection..." -ForegroundColor Yellow
try {
    & "$PGBIN\psql.exe" -U postgres -c "SELECT version();" 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] PostgreSQL connection successful!" -ForegroundColor Green
    } else {
        throw "Connection failed"
    }
} catch {
    Write-Host "[ERROR] Cannot connect to PostgreSQL!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please ensure:" -ForegroundColor Yellow
    Write-Host "  1. PostgreSQL service is running"
    Write-Host "  2. You know the 'postgres' user password"
    Write-Host ""
    Write-Host "To start PostgreSQL service, run:" -ForegroundColor Cyan
    Write-Host "  net start postgresql-x64-18" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Step 2: Creating database 'radio_plays'..." -ForegroundColor Yellow

# Check if database exists
$dbExists = & "$PGBIN\psql.exe" -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='radio_plays'" 2>&1

if ($dbExists -eq "1") {
    Write-Host "[WARNING] Database 'radio_plays' already exists" -ForegroundColor Yellow
    $response = Read-Host "Do you want to drop and recreate it? (y/N)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        Write-Host "Dropping existing database..." -ForegroundColor Yellow
        & "$PGBIN\psql.exe" -U postgres -c "DROP DATABASE radio_plays;" 2>&1 | Out-Null
        & "$PGBIN\psql.exe" -U postgres -c "CREATE DATABASE radio_plays;" 2>&1 | Out-Null
        Write-Host "[OK] Database recreated!" -ForegroundColor Green
    } else {
        Write-Host "[WARNING] Using existing database" -ForegroundColor Yellow
    }
} else {
    & "$PGBIN\psql.exe" -U postgres -c "CREATE DATABASE radio_plays;" 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Database 'radio_plays' created!" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Failed to create database" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host ""
Write-Host "Step 3: Initializing database schema..." -ForegroundColor Yellow

$scriptPath = Join-Path $PSScriptRoot "scripts\init-db.sql"
& "$PGBIN\psql.exe" -U postgres -d radio_plays -f $scriptPath 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Schema initialized successfully!" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Failed to initialize schema" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Step 4: Verifying setup..." -ForegroundColor Yellow

$tableCount = & "$PGBIN\psql.exe" -U postgres -d radio_plays -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" 2>&1

Write-Host "[OK] Found $tableCount tables" -ForegroundColor Green

$stationCount = & "$PGBIN\psql.exe" -U postgres -d radio_plays -tAc "SELECT COUNT(*) FROM stations;" 2>&1

Write-Host "[OK] Found $stationCount radio stations" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "SUCCESS! Database is ready!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Update your PostgreSQL password in:" -ForegroundColor White
Write-Host "   src\RadioPlaysTracker.Api\appsettings.Development.json" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Run the API server:" -ForegroundColor White
Write-Host "   dotnet run --project src\RadioPlaysTracker.Api" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Update Python recognizer config:" -ForegroundColor White
Write-Host "   ..\recognize\config.json" -ForegroundColor Gray
Write-Host ""

Read-Host "Press Enter to continue"
