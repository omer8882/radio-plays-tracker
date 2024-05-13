# Radio Plays Tracker

Radio Plays Tracker is a Python application designed to fetch and track music plays from various radio stations using Spotify playlists and store them in an Elasticsearch database. It consists of two main components: `ElasticConnector` and `RadioPlaysFetch`.

## Features

- Fetches music play data from Spotify playlists associated with radio stations.
- Stores fetched data in Elasticsearch for easy retrieval and analysis.
- Supports scheduling of data fetching at regular intervals.
- Provides methods for querying and retrieving play data for specific artists and songs.

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/omer8882/radio-plays-tracker.git
   ```

2. Navigate to the project directory:

   ```bash
   cd radio-plays-tracker
   ```

3. Install the required dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Update the `config.json` file with your Elasticsearch configuration and Spotify API credentials.

## Usage

### `RadioPlaysFetch`

The `RadioPlaysFetch` class fetches music play data from Spotify playlists associated with radio stations and stores them in Elasticsearch.

```python
from radio_plays_fetch import RadioPlaysFetch

# Create an instance of RadioPlaysFetch
fetcher = RadioPlaysFetch()

# Fetch play data for all stations
fetcher.fetch_stations_job()

# Schedule fetching (in minutes)
fetcher.scheduled_fetching(240)
```

### `ElasticConnector`

The `ElasticConnector` class is responsible for establishing a connection to Elasticsearch and indexing song and play data.

```python
from elastic_connector import ElasticConnector

# Create an instance of ElasticConnector
connector = ElasticConnector(station_name)

# Process files in a folder
connector.process_file(folder_path='.\\simple')
# or
connector.process_file(fsimplifies_format_file_path)
```

### `DataConnect`

A class filled with helping methods for querying the saved data from Elastic

```python
from data_connect import DatabaseConnector

dbc = DatabaseConnector()

dbc.print_artist_plays_by_name('charli xcx')
""" Output:
  [23/02/2024 03:15] Icona Pop, Charli XCX - I Love It (feat. Charli XCX) (2019) [glglz]
  [23/02/2024 03:32] Charli XCX, Kim Petras, Jay Park - Unlock It (2021) [glglz]
  [07/03/2024 21:14] Charli XCX - Von dutch (2024) [glglz]
  [24/04/2024 16:28] Charli XCX - Track 10 (2017) [galatz]
  Total plays by artist: 9
  """

dbc.print_song_plays('padam padam')
""" Output:
  12/04/2024 23:04
  03/02/2024 00:18
  Total plays: 2
"""
```

## Configuration

Update the `config.json` file with your Elasticsearch configuration and Spotify API credentials.

```json
{
    "spotify": {
        "access_token": "***secret***",
        "client_id": "***secret***",
        "client_secret": "***secret***"
    },
    "elastic": {
        "url": "http://localhost:9200",
        "user": "elastic",
        "password": "password"
    },
    "stations": [
    {
      "name": "glglz",
      "playlist_id": "glglz-spotify-playlist-id"
    },
    {
      "name": "radius100",
      "playlist_id": "radius100-spotify-playlist-id"
    }
    // Add more stations as needed
  ]
}
```

## License

[MIT License](LICENSE)

## Author

[Omer Dahary](https://github.com/omer8882)