import requests
import base64
import json
import os
from datetime import datetime, timedelta
import schedule
import time
import logging
from logging.handlers import RotatingFileHandler


from elastic_connector import ElasticConnector

class RadioPlaysFetch():
    def __init__(self):
        # global parameters
        self.config_filename = 'config.json'
        self.TOKEN_KEY = 'spotify_access_token'
        self.LAST_FETCHED_KEY = 'last_time_data_fetched'
        self.client_id = '***SECRET***'
        self.client_secret = '***SECRET***'
        self.logger = self.get_rotating_logger('RadioPlaysFetch', 'radio_plays_fetch.log', 10*1024*1024, 5)

    @staticmethod
    def get_rotating_logger(name, log_file='elastic_for_simple.log', max_log_size=10*1024*1024, backup_count=5):
        logger = logging.getLogger(name)
        logger.setLevel(logging.INFO)
        
        if not logger.handlers:
            handler = RotatingFileHandler(log_file, maxBytes=max_log_size, backupCount=backup_count, encoding='utf-8')
            formatter = logging.Formatter('%(asctime)s - %(levelname)s - [%(station)s] %(message)s')
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        
        return logger

    # -------------------------
    #       Web Requests
    # -------------------------

    def get_spotify_access_token(self):
        client_credentials = f"{self.client_id}:{self.client_secret}"
        client_credentials_b64 = base64.b64encode(client_credentials.encode()).decode()

        url = 'https://accounts.spotify.com/api/token'
        headers = {'Authorization': f'Basic {client_credentials_b64}'}
        data = {'grant_type': 'client_credentials'}

        response = requests.post(url, headers=headers, data=data)

        if response.status_code == 200:
            token = response.json().get('access_token')
            self.logger.info(f'New access token: {token}')
            return token
        else:
            raise Exception(f'Error getting access token: {response.status_code}, {response.text}')

    def get_spotify_playlist_tracks(self, playlist_id: str, token: str):
        url = f'https://api.spotify.com/v1/playlists/{playlist_id}/tracks'
        headers = {'Authorization': f'Bearer {token}'}

        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            return response.json()  # Returns the JSON response
        elif response.status_code == 401: # Unauthorized
            return None
        else:
            raise Exception(f'Error fetching playlist tracks: {response.status_code}, {response.text}')

    # -------------------------
    #       Handle Data
    # -------------------------

    def simplify_spotify_data(self, station_name, original_json):
        simplified_tracks = []
        date_format = "%Y-%m-%dT%H:%M:%SZ"
        last_fetched = datetime.fromisoformat(self.get_last_fetched_time(station_name))

        for item in original_json['items']:
            track_played: datetime = datetime.strptime(item.get("added_at"), date_format) + timedelta(hours=3) # hours = 3 if daylight_savings else 2 (Verify this)
            if track_played <= last_fetched:
                continue
            track = {
                "played_at": track_played.isoformat(),
                "id": item["track"].get("id"),
                "name": item["track"].get("name"),
                "artists": [
                    {"id": artist.get("id"), "name": artist.get("name")}
                    for artist in item["track"]["artists"]
                ],
                "album": {
                    "id": item["track"]["album"].get("id"),
                    "name": item["track"]["album"].get("name"),
                    "artists": [
                        {"id": artist.get("id"), "name": artist.get("name")}
                        for artist in item["track"]["album"]["artists"]
                    ],
                    "release_date": item["track"]["album"].get("release_date")
                },
                "duration_ms": item["track"].get("duration_ms"),
                "popularity": item["track"].get("popularity")
            }
            simplified_tracks.append(track)

        return {"tracks": simplified_tracks}

    def read_json_file(self, file_path: str):
        with open(file_path, 'r', encoding='utf-8') as file:
            return json.load(file)
        
    def save_json_file(self, data, file_path: str):
        with open(f'{file_path}.json', 'w', encoding='utf-8') as file:
            json.dump(data, file, indent=4, ensure_ascii=False)

    def timestamped_filename(self, station_name: str, timestamp: datetime):
        return f'{station_name}_tracks-{timestamp.strftime("%Y-%m-%d_%H-%M-%S")}'

    # -------------------------
    #       Access Token
    # -------------------------

    def load_token(self):
        """Loads the access token from a JSON configuration file."""
        config = self.load_config()
        token = config.get(self.TOKEN_KEY)
        self.logger.info("Loaded access Token:", token)
        return token

    def save_token(self, token: str):
        """Updates the access token in the config file."""
        config = self.load_config()
        config[self.TOKEN_KEY] = token
        self.save_config(config)

    def get_new_token(self):
        token = self.get_spotify_access_token()
        self.save_token(token)
        return token

    def try_load_token(self):
        token = self.load_token()
        if token == None:
            token = self.get_new_token()
        return token

    # -------------------------
    #          Config
    # -------------------------

    def save_config(self, data):
        """Saves configuration data to a JSON file."""
        with open(self.config_filename, 'w') as file:
            json.dump(data, file, indent=4)

    def load_config(self):
        """Loads configuration data from a JSON file."""
        if os.path.exists(self.config_filename):
            with open(self.config_filename, 'r') as file:
                return json.load(file)
        return {}

    def update_last_fetched_time(self, station_name: str, timestamp: datetime):
        """Updates the last time data was fetched in the config file."""
        config = self.load_config()
        config['stations'] = [{**station, self.LAST_FETCHED_KEY: timestamp.isoformat()} if station['name'] == station_name else station for station in config['stations']]
        self.save_config(config)
        self.logger.info(f'Updated last fetched time {timestamp}', extra={'station': station_name})

    def get_last_fetched_time(self, station_name: str):
        """Gets from config the last time data was fetched and saved"""
        config = self.load_config()
        last_fetched = next((station['last_time_data_fetched'] for station in config['stations'] if station['name'] == station_name), None)
        self.logger.info(f'Loaded last time fetched: {last_fetched}', extra={'station': station_name})
        return last_fetched
    
    def get_stations(self):
        config = self.load_config()
        return config['stations']

    # -------------------------
    #       Main Loop
    # -------------------------

    def get_tracks_data(self, playlist_id: str):
        token = self.try_load_token()
        raw_data = self.get_spotify_playlist_tracks(playlist_id, token)
        if raw_data == None:
            token = self.get_new_token()
            raw_data = self.get_spotify_playlist_tracks(playlist_id, token)
            if raw_data == None:
                raise Exception("Couldn't connect to Spotify twice.") 
        return raw_data

    def log_station_tracks(self, station_name, playlist_id):
        self.logger.info('Fetching data begun', extra={'station': station_name})
        raw_data = self.get_tracks_data(playlist_id)
        timestamp: datetime = datetime.now()
        entry_filename = self.timestamped_filename(station_name, timestamp)
        self.save_json_file(raw_data, rf".\raw\{entry_filename}")
        simplified = self.simplify_spotify_data(station_name, raw_data)
        simplifies_file_path = rf".\simple\{entry_filename}"
        self.save_json_file(simplified, simplifies_file_path)
        self.update_last_fetched_time(station_name, timestamp)
        ElasticConnector(station_name).process_file(simplifies_file_path+".json")
        self.logger.info(f'Fetching data and archiving ended succesfuly', extra={'station': station_name})


    def fetch_station_job(self, station_name, playlist_id):
        max_tries = 2
        cur_try = 1
        while cur_try <= max_tries:
            try:
                self.log_station_tracks(station_name, playlist_id)
                return
            except Exception as e:
                self.logger.info(f'Failed attempt {cur_try} of {max_tries}: {e}', extra={'station': station_name})
                cur_try+=1
    

    def fetch_stations_job(self):
        stations = self.get_stations()
        for station in stations:
            self.fetch_station_job(station['name'], station['playlist_id'])

    # Schedule the job every 300 minutes
    def scheduled_fetching(self):
        schedule.every(250).minutes.do(self.fetch_stations_job)

        while True:
            schedule.run_pending()
            time.sleep(60)

if __name__ == "__main__":
    archiver = RadioPlaysFetch()
    archiver.fetch_stations_job()
    archiver.scheduled_fetching()