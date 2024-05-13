import os
import time
import json
import base64
import logging
import schedule
import requests
from datetime import datetime, timedelta
from elasticsearch import ApiError as ElasticApiError
from logging.handlers import RotatingFileHandler

from elastic_connector import ElasticConnector
from helper import Helper

class RadioPlaysFetch():
    def __init__(self):
        # global parameters
        self.config_filename = 'config.json'
        self.TOKEN_KEY = 'access_token'
        self.LAST_FETCHED_KEY = 'last_time_data_fetched'
        self.RAW_FOLDER = ".\\raw"
        self.SIMPLE_FOLDER = ".\\simple"
        self.SCHEDUELED_INTERVALS = 250 #minutes

        config = Helper.load_config()
        self.client_id = config.get('spotify')['client_id']
        self.client_secret = config.get('spotify')['client_secret']

        self.logger = Helper.get_rotating_logger('RadioPlaysFetch', log_file='radio_plays_fetch.log')

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
        url = f'https://api.spotify.com/v1/playlists/{playlist_id}/tracks' #?limit=100&offset=100
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

    def ensure_folder_exists(self, folder_path):
        if not os.path.exists(folder_path):
            os.makedirs(folder_path)

    # -------------------------
    #       Access Token
    # -------------------------

    def load_token(self):
        """Loads the access token from a JSON configuration file."""
        config = Helper.load_config()
        token = config.get('spotify').get(self.TOKEN_KEY)
        self.logger.info("Loaded access Token:", token)
        return token

    def save_token(self, token: str):
        """Updates the access token in the config file."""
        config = Helper.load_config()
        config['spotify'][self.TOKEN_KEY] = token
        Helper.save_config(config)

    def get_new_token(self):
        token = self.get_spotify_access_token()
        self.save_token(token)
        return token

    def try_load_token(self):
        token = self.load_token()
        return token if token is not None else self.get_new_token()

    # -------------------------
    #          Config
    # -------------------------

    def update_last_fetched_time(self, station_name: str, timestamp: datetime):
        """Updates the last time data was fetched in the config file."""
        config = Helper.load_config()
        config['stations'] = [{**station, self.LAST_FETCHED_KEY: timestamp.isoformat()} if station['name'] == station_name else station for station in config['stations']]
        Helper.save_config(config)
        self.logger.info(f'Updated last fetched time {timestamp}', extra={'station': station_name})

    def get_last_fetched_time(self, station_name: str):
        """Gets from config the last time data was fetched and saved"""
        config = Helper.load_config()
        last_fetched = next((station['last_time_data_fetched'] for station in config['stations'] if station['name'] == station_name), None)
        self.logger.info(f'Loaded last time fetched: {last_fetched}', extra={'station': station_name})
        return last_fetched
    
    def get_stations(self):
        config = Helper.load_config()
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
        raw_station_subfolder = os.path.join(self.RAW_FOLDER, station_name)
        self.ensure_folder_exists(raw_station_subfolder)
        self.save_json_file(raw_data, os.path.join(raw_station_subfolder, entry_filename))
        simplified = self.simplify_spotify_data(station_name, raw_data)
        if len(simplified['tracks']) == 0:
            self.logger.warning(f'No new trakcs were fetched', extra={'station': station_name})
            return
        simple_station_subfoler = os.path.join(self.SIMPLE_FOLDER, station_name)
        self.ensure_folder_exists(simple_station_subfoler)
        simplifies_file_path = os.path.join(simple_station_subfoler, entry_filename)
        self.save_json_file(simplified, simplifies_file_path)
        self.update_last_fetched_time(station_name, timestamp)
        ElasticConnector(station_name).process_file(simplifies_file_path+".json")
        self.logger.info(f'Fetching data and archiving ended succesfuly', extra={'station': station_name})


    def fetch_station_job(self, station_name, playlist_id):
        max_tries = 2
        cur_try = 1
        backoff_time = 5

        while cur_try <= max_tries:
            try:
                self.log_station_tracks(station_name, playlist_id)
                return
            except ElasticApiError as e:
                self.logger.error(f"ElasticApiError on attempt {cur_try} of {max_tries}: {e}", extra={'station': station_name})
                return
            except Exception as e:
                self.logger.warning(f"Failed attempt {cur_try} of {max_tries}: {e}", extra={'station': station_name})
                time.sleep(backoff_time)
                cur_try+=1
    

    def fetch_stations_job(self):
        stations = self.get_stations()
        for station in stations:
            self.fetch_station_job(station['name'], station['playlist_id'])

    def scheduled_fetching(self):
        schedule.every(self.SCHEDUELED_INTERVALS).minutes.do(self.fetch_stations_job)

        while True:
            schedule.run_pending()
            time.sleep(60)

if __name__ == "__main__":
    archiver = RadioPlaysFetch()
    archiver.fetch_stations_job()
    archiver.scheduled_fetching()