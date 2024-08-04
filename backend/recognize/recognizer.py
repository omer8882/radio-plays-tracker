from pydub import AudioSegment
import os, sys, requests, time, base64
from datetime import datetime
import asyncio
from shazamio import Shazam
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from helper import Helper
from elastic_connector import ElasticConnector

class RecognizeSongs:
    def __init__(self):
        # global parameters
        self.config_filename = 'config.json'
        self.TOKEN_KEY = 'access_token'
        self.LAST_SONG_KEY = 'last_song_recorded'
        self.LIVE_INTRO_KEY = "live_intro"

        config = Helper.load_config()
        self.client_id = config.get('spotify')['client_id']
        self.client_secret = config.get('spotify')['client_secret']

        self.es_con = ElasticConnector()
        self.logger = Helper.get_rotating_logger('RadioPlaysFetch', log_file='radio_plays_fetch.log', station_info=True)

    # ---------------------------------
    #       SPOTIFY ACCESS TOKEN       
    # ---------------------------------

    def request_spotify_access_token(self):
        client_credentials = f"{self.client_id}:{self.client_secret}"
        client_credentials_b64 = base64.b64encode(client_credentials.encode()).decode()

        url = "https://accounts.spotify.com/api/token"
        headers = {'Authorization': f'Basic {client_credentials_b64}'}
        data = {'grant_type': 'client_credentials'}

        response = requests.post(url, headers=headers, data=data)

        if response.status_code == 200:
            token = response.json().get('access_token')
            return token
        else:
            raise Exception(f'Error getting access token: {response.status_code}, {response.text}')

    def load_token(self):
        """Loads the access token from a JSON configuration file."""
        config = Helper.load_config()
        token = config.get('spotify').get(self.TOKEN_KEY)
        return token

    def save_token(self, token: str):
        """Updates the access token in the config file."""
        config = Helper.load_config()
        config['spotify'][self.TOKEN_KEY] = token
        Helper.save_config(config)

    def get_spotify_token(self):
        """Gets a working spotify access token"""
        token = self.load_token()
        if not self.is_spotify_token_valid(token):
            token = self.get_new_token()
        return token

    def get_new_token(self):
        token = self.request_spotify_access_token()
        self.save_token(token)
        return token

    def try_load_token(self):
        token = self.load_token()
        return token if Helper.is_token_valid(token) else self.get_new_token()
    
    def is_spotify_token_valid(self, token):
        """
        Checks if the given Spotify token is valid by making a search request.

        Parameters:
        token (str): The Spotify API access token to be validated.

        Returns:
        bool: True if the token is valid, False otherwise.
        """
        if not token:
            return False
        validation_url = "https://api.spotify.com/v1/search"
        headers = {
            'Authorization': f'Bearer {token}'
        }
        params = { 'q': 'test', 'type': 'track', 'limit': 1 }
        response = requests.get(validation_url, headers=headers, params=params)
        if response.status_code == 200:
            return True
        elif response.status_code == 401: # Unauthorized
            return False
        else:
            raise ConnectionError()

    # -------------------------
    #          Config
    # -------------------------

    def update_last_song_recorded(self, station_name: str, id: str):
        """Updates the last song recorded."""
        config = Helper.load_config()
        config['stations'] = [{**station, self.LAST_SONG_KEY: id} if station['name'] == station_name else station for station in config['stations']]
        Helper.save_config(config)

    def get_last_song_recorded(self, station_name: str):
        """Gets from config the last song recorded"""
        stations = self.get_stations_config()
        last_fetched = next((station[self.LAST_SONG_KEY] for station in stations if station['name'] == station_name), None)
        return last_fetched
    
    def get_stations_config(self):
        config = Helper.load_config()
        return config['stations']
    
    def get_station_config(self, station_name):
        return next((station for station in self.get_stations_config() if station['name'] == station_name), None)
    
    # --------------------
    #       SEQUENCE     
    # --------------------

    def capture_stream(self, stream_url, station, duration=20):
        response = requests.get(stream_url, stream=True)
        start_time = time.time()
        audio_data = bytearray()
        filename = f'stream_{station}.mp3'

        for chunk in response.iter_content(chunk_size=1024):
            audio_data.extend(chunk)
            current_time = time.time()
            if current_time - start_time > duration:
                break

        with open(filename, 'wb') as file:
            file.write(audio_data)

        file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), filename)
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        
        # Live delay cut
        live_delay = self.get_station_config(station).get(self.LIVE_INTRO_KEY)
        if live_delay:
            audio = AudioSegment.from_mp3(file_path)
            audio = audio[live_delay * 1000:]
            audio.export(file_path, format="mp3")

        return file_path

    def recognize_song(self, audio_path):
        return asyncio.get_event_loop().run_until_complete(self.shazam_song(audio_path))


    async def shazam_song(self, audio_path):
        shazam = Shazam()
        song = await shazam.recognize(audio_path)
        return song

    def search_spotify(self, song_title, artist_name):
        regular_query = f'track:{song_title} artist:{artist_name}'
        combined_query = f"{song_title} {artist_name}"
        result = self.search_spotify_request(regular_query)
        return (result, 1) if result else (self.search_spotify_request(combined_query), 2)
    
    def search_spotify_request(self, query):
        search_url = "https://api.spotify.com/v1/search"
        try:
            token = self.get_spotify_token()
            headers = { 'Authorization': f'Bearer {token}' }
            params = {
                'q': query,
                'type': 'track',
                'limit': 1
            }
            response = requests.get(search_url, headers=headers, params=params)
            search_results = response.json()
            if search_results['tracks']['items']:
                return search_results['tracks']['items'][0]
            return None
        except requests.exceptions.HTTPError as e:
            raise ConnectionError(f"Error trying to get song's info from spotify. [{station}] \n{e}")
    
    def simplify_spotify_data(self, raw):
        date_format = "%Y-%m-%dT%H:%M:%SZ"
        track_played = datetime.now()
        track = {
            "played_at": track_played.strftime(date_format),
            "id": raw.get("id"),
            "name": raw.get("name"),
            "artists": [
                {"id": artist.get("id"), "name": artist.get("name")}
                for artist in raw["artists"]
            ],
            "album": {
                "id": raw["album"].get("id"),
                "name": raw["album"].get("name"),
                "artists": [
                    {"id": artist.get("id"), "name": artist.get("name")}
                    for artist in raw["album"]["artists"]
                ],
                "release_date": raw["album"].get("release_date")
            },
            "duration_ms": raw.get("duration_ms"),
            "popularity": raw.get("popularity")
        }

        return track


    def capture_song(self, station, stream_url):
        snippet_filepath = self.capture_stream(stream_url, station, 10)

        song_info = self.recognize_song(snippet_filepath)

        if not song_info or 'track' not in song_info:
            #self.logger.info("No song recognized.", extra={'station': station})
            return
        
        title, artist = song_info['track']['title'], song_info['track']['subtitle']
        
        (spotify_song_info, try_num) = self.search_spotify(title, artist)
        
        if not spotify_song_info:
            self.logger.warning(f'Spotify did not find: {title} by {artist}', extra={'station': station})
            return
        if spotify_song_info['id'] == self.get_last_song_recorded(station):
            return
        

        self.logger.info(f'Spotify found: {title} by {artist} ({try_num if try_num == 1 else f"{try_num}, orig: {title} by {artist}"})', extra={'station': station})

        simplified = self.simplify_spotify_data(spotify_song_info)
        self.es_con.index_song_if_needed(simplified)
        self.es_con.index_play(simplified, station)
        self.update_last_song_recorded(station, simplified['id'])

if __name__ == '__main__':
    recognize = RecognizeSongs()
    stations = recognize.get_stations_config()
    while True:
        start_time = time.perf_counter()
        for station in stations:
            try:
                recognize.capture_song(station['name'], station['stream_url'])
            except Exception as e:
                recognize.logger.error(f"Something went wrong capturing '{station['name']}'. Details: {e}", extra={'station': station['name']})
        elapsed_time = (time.perf_counter() - start_time)
        print(f"{datetime.now()} - Elapsed time: {int(elapsed_time)}s")
        time.sleep(40)