from typing import Any, Dict, List, Optional, Tuple
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

    def request_spotify_access_token(self) -> str:
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

    def load_token(self) -> Optional[str]:
        """Loads the access token from a JSON configuration file."""
        config = Helper.load_config()
        token = config.get('spotify').get(self.TOKEN_KEY)
        return token

    def save_token(self, token: str) -> None:
        """Updates the access token in the config file."""
        config = Helper.load_config()
        config['spotify'][self.TOKEN_KEY] = token
        Helper.save_config(config)

    def get_spotify_token(self) -> str:
        """Gets a working spotify access token"""
        token = self.load_token()
        if not self.is_spotify_token_valid(token):
            token = self.get_new_token()
        return token

    def get_new_token(self) -> str:
        token = self.request_spotify_access_token()
        self.save_token(token)
        return token

    def try_load_token(self) -> str:
        token = self.load_token()
        return token if Helper.is_token_valid(token) else self.get_new_token()
    
    def is_spotify_token_valid(self, token: Optional[str]) -> bool:
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

    def update_last_song_recorded(self, station_name: str, id: str) -> None:
        """Updates the last song recorded."""
        config = Helper.load_config()
        config['stations'] = [{**station, self.LAST_SONG_KEY: id} if station['name'] == station_name else station for station in config['stations']]
        Helper.save_config(config)

    def get_last_song_recorded(self, station_name: str) -> Optional[str]:
        """Gets from config the last song recorded"""
        stations = self.get_stations_config()
        last_fetched = next((station[self.LAST_SONG_KEY] for station in stations if station['name'] == station_name), None)
        return last_fetched
    
    def get_stations_config(self) -> List[Dict[str, Any]]:
        config = Helper.load_config()
        return config['stations']
    
    def get_station_config(self, station_name: str) -> Optional[Dict[str, Any]]:
        return next((station for station in self.get_stations_config() if station['name'] == station_name), None)
    

    # --------------------------------
    #       additional metadata     
    # --------------------------------

    def extract_additional_metadata(self, simplified: Dict[str, Any], track: Dict[str, Any], spotify_track: Dict[str, Any]) -> None:
        """Extracts additional metadata from the Spotify track object."""
        apple_music_link = self.extract_applemusic_link(track)
        spotify_link = spotify_track.get('external_urls', {}).get('spotify')
        self.add_external_links(simplified, apple_music_link, spotify_link)

    def extract_applemusic_link(self, track: Dict[str, Any]) -> str:
        """Extracts the Apple Music link from a track object."""
        applemusic_deeplink = self.find_applemusic_deeplink(track)
        if applemusic_deeplink is not None:
            return self.extract_url_from_deeplink(applemusic_deeplink)
        return None

    def find_applemusic_deeplink(self, track):
        """Finds the Apple Music deeplink given track object."""
        options = track.get('hub', {}).get('options', [])
        applemusic_option = next((option for option in options if option.get('caption') == 'OPEN IN' and option.get('providername') == 'applemusic'), None)

        if applemusic_option is not None:
            actions = applemusic_option.get('actions', [])
            action = next((action for action in actions if action.get('name') == 'hub:applemusic:deeplink'), None)
            return action.get('uri') if action is not None else None
        
        return None

    def extract_url_from_deeplink(self, orig_url: str) -> str:
        """Extracts the URL from an intent URL."""
        if orig_url.startswith("intent://"):
            url = self.extract_url_from_intent(orig_url)
        else:
            url = orig_url

        if '&' in url:
            url = url.split('&', 1)[0]

        return url

    def extract_url_from_intent(self, intent_url: str) -> str:
        intent_url = intent_url.replace("intent://", "", 1)
        intent_index = intent_url.find("#Intent")
        core_url = intent_url[:intent_index]
        scheme_index = intent_url.find("scheme=")
        if scheme_index != -1:
            scheme = intent_url[scheme_index + len("scheme="):].split(';')[0]
            url = f"{scheme}://{core_url}"
        else:
            url = f"http://{core_url}"
        return url
        
    def add_external_links(self, track: Dict[str, Any], apple_music_link: Optional[str], spotify_link: Optional[str]) -> None:
        """Adds the Apple Music and Spotify links to the track object."""
        track['external_links'] = {
            'apple_music': apple_music_link,
            'spotify': spotify_link
        }

    # --------------------
    #       SEQUENCE     
    # --------------------

    def capture_stream(self, stream_url: str, station: str, duration: int = 20) -> str:
        """
        Captures a stream from the given stream URL for a specified duration and saves it as an MP3 file.
        Args:
            stream_url (str): The URL of the stream to capture.
            station (str): The name of the station.
            duration (int, optional): The duration of the stream capture in seconds. Defaults to 20.
        Returns:
            str: The file path of the captured stream.
        Raises:
            FileNotFoundError: If the captured stream file is not found.
        """

        response = requests.get(stream_url, stream=True)
        start_time: float = time.time()
        audio_data: bytearray = bytearray()
        filename = f'stream_{station}.mp3'

        for chunk in response.iter_content(chunk_size=1024):
            audio_data.extend(chunk)
            current_time: float = time.time()
            if current_time - start_time > duration:
                break
        
        temp_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), './temp')
        if not os.path.exists(temp_dir):
            os.makedirs(temp_dir)
    
        file_path = os.path.join(temp_dir , filename)
        with open(file_path, 'wb') as file:
            file.write(audio_data)

        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        
        # Live delay cut
        live_delay: Optional[int] = self.get_station_config(station).get(self.LIVE_INTRO_KEY)
        if live_delay:
            audio: AudioSegment = AudioSegment.from_mp3(file_path)
            audio = audio[live_delay * 1000:]
            audio.export(file_path, format="mp3")

        return file_path

    def recognize_song(self, audio_path: str) -> Dict[str, Any]:
        return asyncio.get_event_loop().run_until_complete(self.shazam_song(audio_path))


    async def shazam_song(self, audio_path: str) -> Dict[str, Any]:
        shazam = Shazam()
        song = await shazam.recognize(audio_path)
        return song

    def search_spotify(self, song_title, artist_name) -> Tuple[Optional[Dict[str, Any]], int]:
        regular_query = f'track:{song_title} artist:{artist_name}'
        combined_query = f"{song_title} {artist_name}"
        result: Optional[Dict[str, Any]] = self.search_spotify_request(regular_query)
        return (result, 1) if result else (self.search_spotify_request(combined_query), 2)
    
    def search_spotify_request(self, query) -> Optional[Dict[str, Any]]:
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
    
    def simplify_spotify_data(self, raw) -> Dict[str, Any]:
        date_format = "%Y-%m-%dT%H:%M:%SZ"
        track_played: datetime = datetime.now()
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

    def capture_song(self, station, stream_url) -> None:
        snippet_filepath: str = self.capture_stream(stream_url, station, 10)

        song_info: Dict[str, Any] = self.recognize_song(snippet_filepath)

        if not song_info or 'track' not in song_info:
            #self.logger.info("No song recognized.", extra={'station': station})
            return
        
        track = song_info['track']
        title, artist = track['title'], track['subtitle']

        (spotify_song_info, try_num) = self.search_spotify(title, artist)
        
        if not spotify_song_info:
            self.logger.warning(f'Spotify did not find: {title} by {artist}', extra={'station': station})
            return
        if spotify_song_info['id'] == self.get_last_song_recorded(station):
            return
        

        self.logger.info(f'Spotify found: {title} by {artist} ({try_num if try_num == 1 else f"{try_num}, orig: {title} by {artist}"})', extra={'station': station})

        simplified: Dict[str, Any] = self.simplify_spotify_data(spotify_song_info)
        self.extract_additional_metadata(simplified, track, spotify_song_info)
        self.es_con.index_song_if_needed(simplified)
        self.es_con.index_play(simplified, station)
        self.update_last_song_recorded(station, simplified['id'])

if __name__ == '__main__':
    recognize = RecognizeSongs()
    stations = recognize.get_stations_config()
    while True:
        #start_time = time.perf_counter()
        for station in stations:
            try:
                recognize.capture_song(station['name'], station['stream_url'])
            except Exception as e:
                recognize.logger.error(f"Something went wrong capturing '{station['name']}'. Details: {e}", extra={'station': station['name']})
        #elapsed_time = (time.perf_counter() - start_time)
        #print(f"{datetime.now()} - Elapsed time: {int(elapsed_time)}s")
        #time.sleep(40)