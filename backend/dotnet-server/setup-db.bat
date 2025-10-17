@echo off
REM Setup PostgreSQL Database for Radio Plays Tracker
REM Run this script as Administrator or ensure PostgreSQL service is running

echo ========================================
echo Radio Plays Tracker - Database Setup
echo ========================================
echo.

REM Set PostgreSQL bin directory
set PGBIN=C:\Program Files\PostgreSQL\18\bin
set PATH=%PGBIN%;%PATH%

echo Step 1: Testing PostgreSQL connection...
"%PGBIN%\psql" -U postgres -c "SELECT version();"
if errorlevel 1 (
    echo ERROR: Cannot connect to PostgreSQL!
    echo Please ensure:
    echo   1. PostgreSQL service is running
    echo   2. You know the postgres user password
    pause
    exit /b 1
)

echo.
echo Step 2: Creating database 'radio_plays'...
"%PGBIN%\psql" -U postgres -c "CREATE DATABASE radio_plays;"
if errorlevel 1 (
    echo WARNING: Database might already exist or there was an error
    echo Continuing anyway...
)

echo.
echo Step 3: Initializing database schema...
"%PGBIN%\psql" -U postgres -d radio_plays -f "%~dp0scripts\init-db.sql"
if errorlevel 1 (
    echo ERROR: Failed to initialize schema!
    pause
    exit /b 1
)

echo.
echo ========================================
echo SUCCESS! Database is ready!
echo ========================================
echo.
echo Next steps:
echo 1. Update connection string in src\RadioPlaysTracker.Api\appsettings.Development.json
echo 2. Run: dotnet run --project src\RadioPlaysTracker.Api
echo.
pause
