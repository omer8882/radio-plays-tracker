# Radio Recognizer

## Setup

1. Copy the template configuration file:
   ```bash
   cp config.template.json config.json
   ```

2. Edit `config.json` and fill in your actual credentials:
   - Spotify API credentials (client_id, client_secret)
   - PostgreSQL password
   
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the recognizer:
   ```bash
   python recognizer.py
   ```

## Configuration

- `config.json` - Your local configuration with secrets (NOT committed to git)
- `config.template.json` - Template showing the schema (committed to git)

### Configuration Fields

- **spotify.client_id**: Your Spotify API client ID
- **spotify.client_secret**: Your Spotify API client secret
- **spotify.access_token**: Auto-generated, leave empty initially
- **postgres**: Database connection settings
- **stations**: Array of radio stations to monitor
  - **name**: Station identifier (must match database)
  - **stream_url**: Radio stream URL
  - **last_song_recorded**: Track ID of last recorded song (auto-updated)
  - **live_intro**: Optional delay in seconds for live streams

## Environment Variables (Alternative)

You can also use environment variables instead of `config.json`:

```bash
export SPOTIFY_CLIENT_ID="your_client_id"
export SPOTIFY_CLIENT_SECRET="your_client_secret"
export POSTGRES_PASSWORD="your_password"
```
