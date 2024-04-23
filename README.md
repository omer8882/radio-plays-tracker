Here's a template for your `README.md` file:

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

### `ElasticConnector`

The `ElasticConnector` class is responsible for establishing a connection to Elasticsearch and indexing song and play data.

```python
from elastic_connector import ElasticConnector

# Create an instance of ElasticConnector
connector = ElasticConnector()

# Process files in a folder
connector.process_files(folder_path='.\\simple')
```

### `RadioPlaysFetch`

The `RadioPlaysFetch` class fetches music play data from Spotify playlists associated with radio stations and stores them in Elasticsearch.

```python
from radio_plays_fetch import RadioPlaysFetch

# Create an instance of RadioPlaysFetch
fetcher = RadioPlaysFetch()

# Fetch play data for all stations
fetcher.fetch_stations_job()
```

### Schedule Fetching

To schedule regular fetching of play data, run the `scheduled_fetching` method.

```python
fetcher.scheduled_fetching()
```

## Configuration

Update the `config.json` file with your Elasticsearch configuration and Spotify API credentials.

```json
{
  "elastic_url": "http://localhost:9200",
  "elastic_user": "elastic",
  "elastic_password": "password",
  "stations": [
    {
      "name": "glglz",
      "playlist_id": "your-glglz-spotify-playlist-id"
    },
    {
      "name": "radius100",
      "playlist_id": "your-radius100-spotify-playlist-id"
    }
    // Add more stations as needed
  ]
}
```

## License

[MIT License](LICENSE)

## Author

[OMER](https://github.com/omer8882)

Feel free to customize the `README.md` file according to your project's specific requirements and details.