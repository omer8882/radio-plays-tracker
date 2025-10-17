# Radio Plays Tracker - .NET Migration Guide

## Overview
This guide covers the migration from Elasticsearch + Python/FastAPI to PostgreSQL + C# .NET 8+ for the Radio Plays Tracker backend server.

## Architecture

### New Stack
- **Database**: PostgreSQL 14+ (with pg_trgm extension for fuzzy text search)
- **Backend API**: ASP.NET Core 8+ Web API
- **ORM**: Entity Framework Core 9.0
- **Recognizer**: Python 3.x (updated to write to PostgreSQL)
- **Frontend**: React (no changes required - same API contract)

### Project Structure
```
backend/
├── dotnet-server/              # .NET Backend
│   ├── src/
│   │   ├── RadioPlaysTracker.Api/          # Web API Controllers
│   │   ├── RadioPlaysTracker.Core/         # Domain Models & DTOs
│   │   └── RadioPlaysTracker.Infrastructure/ # Data Access (EF Core)
│   ├── scripts/
│   │   └── init-db.sql                     # Database schema
│   └── RadioPlaysTracker.sln
└── recognize/                  # Python Recognizer (updated)
    ├── recognizer.py
    ├── postgres_connector.py   # NEW: PostgreSQL connector
    ├── config.json            # Updated with postgres config
    └── requirements.txt       # Updated with psycopg2
```

## Prerequisites

1. **.NET 8 SDK or later**
   - Download: https://dotnet.microsoft.com/download
   - Verify: `dotnet --version`

2. **PostgreSQL 14+**
   - Download: https://www.postgresql.org/download/
   - Or use Docker: `docker run --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:14`

3. **Python 3.8+** (for recognizer)
   - With pip installed

4. **psql** (PostgreSQL command line tool) - usually comes with PostgreSQL installation

## Setup Instructions

### Step 1: Setup PostgreSQL Database

#### Option A: Using psql command line
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE radio_plays;

# Exit psql
\q

# Run initialization script
psql -U postgres -d radio_plays -f backend/dotnet-server/scripts/init-db.sql
```

#### Option B: Using pgAdmin or other GUI tools
1. Create a new database named `radio_plays`
2. Open and execute `backend/dotnet-server/scripts/init-db.sql`

#### Verify Database Setup
```sql
-- Connect to database
psql -U postgres -d radio_plays

-- Check tables
\dt

-- Should see: artists, albums, songs, stations, plays, song_artists, album_artists

-- Check stations
SELECT * FROM stations;

-- Should see 6 stations: glglz, 100fm, 103fm, eco99, galatz, kan88
```

### Step 2: Configure .NET API

1. **Update Connection String** in `backend/dotnet-server/src/RadioPlaysTracker.Api/appsettings.Development.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=radio_plays;Username=postgres;Password=YOUR_PASSWORD"
  }
}
```

2. **Test Build**:
```bash
cd backend/dotnet-server
dotnet build
```

3. **Run the API**:
```bash
dotnet run --project src/RadioPlaysTracker.Api/RadioPlaysTracker.Api.csproj
```

The API will start at `http://localhost:5000`

### Step 3: Setup Python Recognizer

1. **Install Dependencies**:
```bash
cd backend/recognize
pip install -r requirements.txt
```

2. **Update config.json**:
Update the `postgres` section with your PostgreSQL credentials:
```json
{
  "spotify": {
    "access_token": "your_spotify_token",
    "client_id": "your_client_id",
    "client_secret": "your_client_secret"
  },
  "postgres": {
    "host": "localhost",
    "port": 5432,
    "database": "radio_plays",
    "user": "postgres",
    "password": "YOUR_PASSWORD"
  },
  "stations": [...]
}
```

3. **Test Recognizer** (optional):
```python
from postgres_connector import PostgresConnector

# Test connection
connector = PostgresConnector('glglz')
print("Connected successfully!")
connector.close()
```

## API Endpoints

All endpoints remain the same as the Python/FastAPI version:

### Station Plays
```
GET /api/station_last_plays?station=glglz&limit=10
```

### Artist Plays
```
GET /api/get_artist_plays?artist=Artist Name&limit=100
```

### Search
```
GET /api/search?query=song name or artist
```

### Top Hits
```
GET /api/top_hits?days=7&top_n=5
```

### Song Plays by Station
```
GET /api/song_plays_by_station?song_id=SPOTIFY_ID&days=30
```

### Search Around Timestamp
```
GET /api/search_around?station=glglz&timestamp=2025-10-11T14:30:00&range_minutes=15
```

### Song Details
```
GET /api/get_song_details?song_id=SPOTIFY_ID
```

## Running in Production

### .NET API

#### Using systemd (Linux)
Create `/etc/systemd/system/radioplays-api.service`:
```ini
[Unit]
Description=Radio Plays Tracker API
After=network.target postgresql.service

[Service]
WorkingDirectory=/path/to/radio-plays-tracker/backend/dotnet-server/src/RadioPlaysTracker.Api
ExecStart=/usr/bin/dotnet RadioPlaysTracker.Api.dll
Restart=always
RestartSec=10
KillSignal=SIGINT
User=www-data
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=DOTNET_PRINT_TELEMETRY_MESSAGE=false

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable radioplays-api
sudo systemctl start radioplays-api
```

#### Using Docker
Create `Dockerfile` in `backend/dotnet-server/`:
```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /source
COPY . .
RUN dotnet restore
RUN dotnet publish -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app .
EXPOSE 5000
ENTRYPOINT ["dotnet", "RadioPlaysTracker.Api.dll"]
```

Build and run:
```bash
docker build -t radioplays-api .
docker run -d -p 5000:5000 --name radioplays-api \
  -e ConnectionStrings__DefaultConnection="Host=host.docker.internal;Port=5432;Database=radio_plays;Username=postgres;Password=YOUR_PASSWORD" \
  radioplays-api
```

### Python Recognizer

Use existing deployment scripts in `scripts/` directory (they should work with minimal changes).

## Migration from Elasticsearch

If you have existing data in Elasticsearch and want to migrate:

### Export from Elasticsearch
```python
from elasticsearch_dsl import Search
from elasticsearch_dsl.connections import connections

# Connect to Elasticsearch
es = connections.create_connection(hosts=['http://localhost:9200'])

# Export songs
songs_search = Search(using=es, index='songs_index').params(size=10000)
songs = [hit.to_dict() for hit in songs_search.execute()]

# Export plays (for each station)
stations = ['glglz', '100fm', '103fm', 'eco99', 'galatz', 'kan88']
all_plays = {}
for station in stations:
    plays_search = Search(using=es, index=f'{station}_plays_index').params(size=10000)
    all_plays[station] = [hit.to_dict() for hit in plays_search.execute()]
```

### Import to PostgreSQL
Use the `postgres_connector.py` to import data:
```python
from postgres_connector import PostgresConnector

connector = PostgresConnector()

# Import songs
for song in songs:
    connector.index_song_if_needed(song)

# Import plays
for station, plays in all_plays.items():
    for play in plays:
        connector.index_play(play, station)

connector.close()
```

## Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check PostgreSQL is listening
psql -U postgres -c "SELECT version();"

# Check database exists
psql -U postgres -l | grep radio_plays
```

### .NET Build Issues
```bash
# Clear nuget cache
dotnet nuget locals all --clear

# Restore packages
dotnet restore

# Rebuild
dotnet build --no-incremental
```

### Python Dependencies
```bash
# Reinstall all requirements
pip install --upgrade --force-reinstall -r requirements.txt

# If psycopg2-binary fails, try psycopg2
pip install psycopg2
```

## Performance Considerations

1. **Indexes**: The init-db.sql script creates all necessary indexes. Monitor query performance and add more as needed.

2. **Connection Pooling**: EF Core handles connection pooling automatically. Default pool size is 100.

3. **Caching**: Consider adding Redis for frequently accessed data (top hits, recent plays) if needed.

4. **Database Maintenance**:
```sql
-- Vacuum and analyze regularly
VACUUM ANALYZE;

-- Reindex if needed
REINDEX DATABASE radio_plays;
```

## Development Tools

### Entity Framework Core Migrations

If you need to modify the database schema:

```bash
# Add migration
cd src/RadioPlaysTracker.Infrastructure
dotnet ef migrations add MigrationName --startup-project ../RadioPlaysTracker.Api

# Update database
dotnet ef database update --startup-project ../RadioPlaysTracker.Api
```

### View Database with Tools
- **pgAdmin**: https://www.pgadmin.org/
- **DBeaver**: https://dbeaver.io/
- **VS Code**: Install PostgreSQL extension

## Next Steps

1. ✅ Database setup
2. ✅ .NET API running
3. ✅ Python recognizer updated
4. ⏳ Frontend configuration (if needed - should work without changes)
5. ⏳ Data migration (if migrating from Elasticsearch)
6. ⏳ Production deployment

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review application logs
3. Check PostgreSQL logs: `/var/log/postgresql/`
4. Review .NET logs in console output

## License

[Your License Here]
