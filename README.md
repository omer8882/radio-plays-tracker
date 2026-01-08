# Radio Plays Tracker (MaHushma.com)

## Overview

Track what's playing on radio stations in real-time! This project continuously monitors radio stations, recognizes songs using Shazam and Spotify APIs, stores the data in PostgreSQL, and presents it through an interactive web interface.

## ✨ Features

- 🎵 **Real-Time Recognition**: Active monitoring of 6 radio stations (Galglatz, Galatz, 100FM, 103FM, Eco99, Kan88)
- 📊 **Rich Analytics**: View recently played songs, top hits, and search by timestamp
- 🔍 **Search Around**: Remember hearing a song Tuesday at 8am? Search by station and time to find it
- 📈 **Station Breakdown**: See how many times each song was played across different stations
- 🌐 **Public Web UI**: Clean, responsive interface built with React and Material-UI
- 🤖 **AI Assistant Integration**: MCP (Model Context Protocol) server for chatbot access to radio play data

## 🏗️ Architecture

### Backend

#### **Song Recognizer** (`backend/recognize/`)
Python service that captures radio streams and identifies songs.
- **Stack**: Python 3.x, ShazamIO, Spotify API, psycopg2
- **Function**: Continuously listens to radio streams, recognizes songs, enriches metadata
- **Database**: Writes directly to PostgreSQL

#### **API Server** (`backend/dotnet-server/`)
RESTful API built with .NET 8+ following Clean Architecture principles.
- **Stack**: ASP.NET Core Web API, Entity Framework Core, PostgreSQL (Npgsql)
- **Architecture**: Clean Architecture (Api → Core → Infrastructure layers)
- **Endpoints**: 
  - `/api/station_last_plays` - Recent plays by station
  - `/api/top_hits` - Most played songs in last 7/30 days
  - `/api/search_around` - Find songs by timestamp
  - `/api/song_details` - Detailed song information
  - `/api/stations` - List all monitored stations
- **MCP Server**: Built-in Model Context Protocol server at `/mcp` for AI assistant integration
  - Exposes 10 tools for querying radio play data
  - Compatible with Claude, GPT-4, and other MCP-enabled AI assistants
  - See [MCP_SERVER.md](backend/dotnet-server/MCP_SERVER.md) for details

### Frontend (`frontend/radio-plays/`)

React SPA with Material-UI providing an intuitive interface for exploring radio play data.
- **Stack**: React, Material-UI, Axios
- **Features**: Real-time updates, responsive design, station-specific views

### Database

PostgreSQL with normalized schema optimized for time-series queries:
- **Tables**: songs, artists, albums, stations, plays (with junction tables)
- **Indexes**: Optimized for timestamp-based queries and fuzzy text search (pg_trgm)
- **Timezone**: All timestamps stored in (Asia/Jerusalem) time 

## 🚀 Quick Start

### Prerequisites

- Docker Desktop 4.25+ (includes Docker Compose v2)
- Spotify API credentials ([get them here](https://developer.spotify.com/dashboard))

> **Manual setup?** You can still run each service without Docker, but you'll also need PostgreSQL 14+, .NET 8, Python 3.11, and Node.js 18. Those steps are documented below.

### Option A: Docker Compose (recommended)

1. **Copy the environment template**

    ```bash
    cp .env.example .env
    # Windows PowerShell
    # copy .env.example .env
    ```

    Fill in at least `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, and override ports or CORS origins if needed.

2. **Provide recognizer configuration**

    ```bash
    cp backend/recognize/config.template.json backend/recognize/config.json
    ```

    Update the new `config.json` with your Spotify credentials (or rely on environment variables) and any station tweaks. See [CONFIG_MANAGEMENT.md](CONFIG_MANAGEMENT.md) for guidance.

3. **Build and run the stack**

    ```bash
    docker compose up --build
    ```

    Add `-d` once everything looks good to run detached.

    - API: `http://localhost:${API_PORT:-8080}`
    - Frontend: `http://localhost:${FRONTEND_PORT:-3000}`
    - PostgreSQL: `localhost:${POSTGRES_PORT:-5432}`

4. **Optional: expose via Cloudflare Tunnel**

    Populate `CLOUDFLARED_TUNNEL_TOKEN` in `.env` and start with:

    ```bash
    docker compose --profile tunnel up -d
    ```

5. **Stop everything**

    ```bash
    docker compose down
    # Remove named volumes if you need a clean database
    docker compose down -v
    ```

### Option B: Manual setup (advanced)

#### 1. Database

```bash
# Create the database and schema
cd backend/dotnet-server
psql -U postgres -f scripts/init-db.sql
```

#### 2. Configuration

```bash
cd backend/recognize
cp config.template.json config.json
# Edit config.json with your Spotify API keys and PostgreSQL password
```

See [CONFIG_MANAGEMENT.md](CONFIG_MANAGEMENT.md) for details on managing secrets and environment overrides.

#### 3. Run backend services locally

**.NET API Server**

```bash
cd backend/dotnet-server/src/RadioPlaysTracker.Api
dotnet restore
dotnet run
# API runs on https://localhost:5001 by default
```

**Python Song Recognizer**

```bash
cd backend/recognize
pip install -r requirements.txt
python recognizer.py
```

#### 4. Frontend

```bash
cd frontend/radio-plays
npm install
npm start
# Web UI runs on http://localhost:3000
```
## 🛠️ Tech Stack

**Backend**
- .NET 8+ (ASP.NET Core, Entity Framework Core)
- Python 3.x (ShazamIO, psycopg2, requests)
- PostgreSQL 14+ (Npgsql, pg_trgm extension)

**Frontend**
- React 18+
- Material-UI (MUI)
- Axios

**APIs**
- Spotify Web API
- ShazamIO (song recognition)

> **Why so many technologies???** Mixing .NET, Python, PostgreSQL, and React all for one small website justifyingly seems like an overkill, but it's all about embracing challenges and exploring different tools. Each tech was chosen to solve specific problems and honestly - because learning new things is fun.

## 🤝 Contributing

Contributions are welcome! Whether it's bug fixes, new features, or documentation improvements:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.