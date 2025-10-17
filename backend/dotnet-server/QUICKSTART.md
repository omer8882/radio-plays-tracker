# 🚀 Quick Start Guide

## 5-Minute Setup

### 1. Install PostgreSQL (if not already installed)

**Windows:**
```powershell
# Using Chocolatey
choco install postgresql

# Or download from: https://www.postgresql.org/download/windows/
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

### 2. Create Database

```bash
# Create database
createdb -U postgres radio_plays

# Initialize schema
psql -U postgres -d radio_plays -f backend/dotnet-server/scripts/init-db.sql
```

### 3. Configure & Run .NET API

```bash
cd backend/dotnet-server

# Update password in appsettings.Development.json (line 4)
# Change "Password=postgres" to your PostgreSQL password

# Run
dotnet run --project src/RadioPlaysTracker.Api
```

API now running at http://localhost:5000

### 4. Setup Python Recognizer

```bash
cd backend/recognize

# Install dependencies
pip install -r requirements.txt

# Update config.json with:
# 1. Your Spotify credentials
# 2. Your PostgreSQL password (in "postgres" section)

# Run recognizer
python recognizer.py
```

### 5. Test It!

Open browser or use curl:

```bash
# Get last plays from a station
curl "http://localhost:5000/api/station_last_plays?station=glglz"

# Search for songs
curl "http://localhost:5000/api/search?query=imagine"

# Top hits
curl "http://localhost:5000/api/top_hits?days=7&top_n=5"
```

## What's Different from the Old System?

### Database
- ❌ Elasticsearch
- ✅ PostgreSQL with pg_trgm for fuzzy search

### API Server  
- ❌ Python FastAPI
- ✅ C# .NET 8 Web API

### Recognizer
- ❌ Writes to Elasticsearch
- ✅ Writes to PostgreSQL

### Frontend
- ✅ **No changes needed!** Same API endpoints and response format

## Common Commands

### Database Management
```bash
# Connect to database
psql -U postgres -d radio_plays

# View tables
\dt

# Check song count
SELECT COUNT(*) FROM songs;

# Check plays count
SELECT COUNT(*) FROM plays;

# View recent plays
SELECT s.name, st.name as station, p.played_at 
FROM plays p 
JOIN songs s ON p.song_id = s.id 
JOIN stations st ON p.station_id = st.id 
ORDER BY p.played_at DESC LIMIT 10;
```

### .NET API
```bash
# Build
dotnet build

# Run (development)
dotnet run --project src/RadioPlaysTracker.Api

# Run (production)
dotnet run --project src/RadioPlaysTracker.Api --configuration Release

# Watch mode (auto-reload on code changes)
dotnet watch --project src/RadioPlaysTracker.Api
```

### Python Recognizer
```bash
# Run once
python recognizer.py

# Process existing JSON files
python -c "from postgres_connector import PostgresConnector; PostgresConnector().process_files('./simple')"
```

## Troubleshooting

### "Connection refused" when connecting to PostgreSQL
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql  # Linux
# or
brew services list  # macOS
# or
Get-Service -Name postgresql*  # Windows PowerShell

# Start if not running
sudo systemctl start postgresql  # Linux
brew services start postgresql  # macOS
```

### ".NET SDK not found"
```bash
# Verify installation
dotnet --version

# If not installed, download from:
# https://dotnet.microsoft.com/download
```

### "psycopg2-binary installation failed"
```bash
# Try regular psycopg2
pip install psycopg2

# Or install with build dependencies
# Linux:
sudo apt install python3-dev libpq-dev
pip install psycopg2

# macOS:
brew install postgresql
pip install psycopg2
```

## What's Next?

1. **Configure Stations**: Edit `backend/recognize/config.json` to add/remove radio stations
2. **Customize Frontend**: Update CORS origins in `backend/dotnet-server/src/RadioPlaysTracker.Api/Program.cs` (line 28)
3. **Deploy**: See full README.md for production deployment instructions
4. **Monitor**: Check logs in `backend/recognize/` directory

## API Documentation

Once the API is running, visit:
- Swagger UI: http://localhost:5000/swagger (if enabled)
- OpenAPI spec: http://localhost:5000/openapi/v1.json

## Need Help?

Full documentation: [README.md](./README.md)

---

**Congratulations! Your Radio Plays Tracker is now running on PostgreSQL + .NET! 🎉**
