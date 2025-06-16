from typing import Any, Dict, List, Optional, Tuple, Protocol
from pydub import AudioSegment
import os, sys, requests, time, base64
from datetime import datetime
import asyncio
from shazamio import Shazam
from dataclasses import dataclass
from abc import ABC, abstractmethod
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from helper import Helper
from elastic_connector import ElasticConnector

@dataclass
class StationConfig:
    name: str
    stream_url: str
    last_song_recorded: Optional[str] = None
    live_intro: Optional[int] = None

class ConfigManager:
    TOKEN_KEY = 'access_token'
    LAST_SONG_KEY = 'last_song_recorded'
    LIVE_INTRO_KEY = "live_intro"
    
    def __init__(self):
        self.config = Helper.load_config()
        self.client_id = self.config.get('spotify')['client_id']
        self.client_secret = self.config.get('spotify')['client_secret']
    
    def get_stations(self) -> List[StationConfig]:
        return [
            StationConfig(
                name=station['name'],
                stream_url=station['stream_url'],
                last_song_recorded=station.get(self.LAST_SONG_KEY),
                live_intro=station.get(self.LIVE_INTRO_KEY)
            )
            for station in self.config['stations']
        ]
    
    def update_last_song_recorded(self, station_name: str, song_id: str) -> None:
        self.config['stations'] = [
            {**station, self.LAST_SONG_KEY: song_id} 
            if station['name'] == station_name 
            else station 
            for station in self.config['stations']
        ]
        Helper.save_config(self.config)

class SpotifyClient:
    def __init__(self, client_id: str, client_secret: str):
        self.client_id = client_id
        self.client_secret = client_secret
        self._token: Optional[str] = None
    
    def get_token(self) -> str:
        if not self._token or not self._is_token_valid():
            self._token = self._request_new_token()
        return self._token
    
    def _request_new_token(self) -> str:
        client_credentials = f"{self.client_id}:{self.client_secret}"
        client_credentials_b64 = base64.b64encode(client_credentials.encode()).decode()
        
        response = requests.post(
            "https://accounts.spotify.com/api/token",
            headers={'Authorization': f'Basic {client_credentials_b64}'},
            data={'grant_type': 'client_credentials'}
        )
        
        if response.status_code != 200:
            raise Exception(f'Error getting access token: {response.status_code}, {response.text}')
        
        return response.json()['access_token']
    
    def _is_token_valid(self) -> bool:
        if not self._token:
            return False
            
        try:
            response = requests.get(
                "https://api.spotify.com/v1/search",
                headers={'Authorization': f'Bearer {self._token}'},
                params={'q': 'test', 'type': 'track', 'limit': 1}
            )
            return response.status_code == 200
        except requests.exceptions.RequestException:
            return False
    
    def search_track(self, title: str, artist: str) -> Tuple[Optional[Dict[str, Any]], int]:
        regular_query = f'track:{title} artist:{artist}'
        combined_query = f"{title} {artist}"
        
        result = self._search_request(regular_query)
        if result:
            return result, 1
            
        return self._search_request(combined_query), 2
    
    def _search_request(self, query: str) -> Optional[Dict[str, Any]]:
        try:
            response = requests.get(
                "https://api.spotify.com/v1/search",
                headers={'Authorization': f'Bearer {self.get_token()}'},
                params={'q': query, 'type': 'track', 'limit': 1}
            )
            response.raise_for_status()
            
            search_results = response.json()
            return search_results['tracks']['items'][0] if search_results['tracks']['items'] else None
            
        except requests.exceptions.RequestException as e:
            raise ConnectionError(f"Error searching Spotify: {str(e)}")

class StreamCapture:
    def __init__(self, temp_dir: str = None):
        self.temp_dir = temp_dir or os.path.join(os.path.dirname(os.path.abspath(__file__)), './temp')
        os.makedirs(self.temp_dir, exist_ok=True)
    
    def capture(self, stream_url: str, station: str, duration: int = 20, live_delay: Optional[int] = None) -> str:
        audio_data = self._download_stream(stream_url, duration)
        file_path = self._save_audio(audio_data, station)
        
        if live_delay:
            self._trim_live_delay(file_path, live_delay)
            
        return file_path
    
    def _download_stream(self, stream_url: str, duration: int) -> bytes:
        response = requests.get(stream_url, stream=True)
        start_time = time.time()
        audio_data = bytearray()
        
        for chunk in response.iter_content(chunk_size=1024):
            audio_data.extend(chunk)
            if time.time() - start_time > duration:
                break
                
        return bytes(audio_data)
    
    def _save_audio(self, audio_data: bytes, station: str) -> str:
        file_path = os.path.join(self.temp_dir, f'stream_{station}.mp3')
        with open(file_path, 'wb') as file:
            file.write(audio_data)
        return file_path
    
    def _trim_live_delay(self, file_path: str, live_delay: int) -> None:
        audio = AudioSegment.from_mp3(file_path)
        audio = audio[live_delay * 1000:]
        audio.export(file_path, format="mp3")

class SongRecognizer:
    def __init__(self):
        self.shazam = Shazam()
    
    async def recognize(self, audio_path: str) -> Dict[str, Any]:
        return await self.shazam.recognize(audio_path)

class TrackProcessor:
    def __init__(self, es_connector: ElasticConnector):
        self.es_connector = es_connector
    
    def process_track(self, track: Dict[str, Any], shazam_track: Dict[str, Any], spotify_track: Dict[str, Any], station: str) -> None:
        simplified = self._simplify_spotify_data(spotify_track)
        self._add_external_links(simplified, shazam_track, spotify_track)
        self.es_connector.index_song_if_needed(simplified)
        self.es_connector.index_play(simplified, station)
    
    def _simplify_spotify_data(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "played_at": datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ"),
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
    
    def _add_external_links(self, track: Dict[str, Any], shazam_track: Dict[str, Any], spotify_track: Dict[str, Any]) -> None:
        apple_music_link = self._extract_applemusic_link(shazam_track)
        spotify_link = spotify_track.get('external_urls', {}).get('spotify')
        track['external_links'] = {
            'apple_music': apple_music_link,
            'spotify': spotify_link
        }
    
    def _extract_applemusic_link(self, track: Dict[str, Any]) -> Optional[str]:
        """Extracts the Apple Music link from a track object."""
        applemusic_deeplink = self._find_applemusic_deeplink(track)
        if applemusic_deeplink is not None:
            return self._extract_url_from_deeplink(applemusic_deeplink)
        return None

    def _find_applemusic_deeplink(self, track: Dict[str, Any]) -> Optional[str]:
        """Finds the Apple Music deeplink given track object."""
        options = track.get('hub', {}).get('options', [])
        applemusic_option = next(
            (option for option in options 
             if option.get('caption') == 'OPEN IN' and option.get('providername') == 'applemusic'),
            None
        )

        if applemusic_option is not None:
            actions = applemusic_option.get('actions', [])
            action = next(
                (action for action in actions 
                 if action.get('name') == 'hub:applemusic:deeplink'),
                None
            )
            return action.get('uri') if action is not None else None
        
        return None

    def _extract_url_from_deeplink(self, orig_url: str) -> str:
        """Extracts the URL from an intent URL."""
        if orig_url.startswith("intent://"):
            url = self._extract_url_from_intent(orig_url)
        else:
            url = orig_url

        if '&' in url:
            url = url.split('&', 1)[0]

        return url

    def _extract_url_from_intent(self, intent_url: str) -> str:
        """Extracts the URL from an intent URL."""
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

class RadioPlaysTracker:
    def __init__(self):
        self.config_manager = ConfigManager()
        self.spotify_client = SpotifyClient(
            self.config_manager.client_id,
            self.config_manager.client_secret
        )
        self.stream_capture = StreamCapture()
        self.song_recognizer = SongRecognizer()
        self.track_processor = TrackProcessor(ElasticConnector())
        self.logger = Helper.get_rotating_logger(
            'RadioPlaysFetch',
            log_file='radio_plays_fetch.log',
            station_info=True
        )
    
    async def process_station(self, station: StationConfig) -> None:
        try:
            # Capture stream
            snippet_filepath = self.stream_capture.capture(
                station.stream_url,
                station.name,
                duration=10,
                live_delay=station.live_intro
            )
            
            # Recognize song
            song_info = await self.song_recognizer.recognize(snippet_filepath)
            if not song_info or 'track' not in song_info:
                return
            
            track = song_info['track']
            title, artist = track['title'], track['subtitle']
            
            # Search Spotify
            spotify_track, try_num = self.spotify_client.search_track(title, artist)
            if not spotify_track:
                self.logger.warning(
                    f'Spotify did not find: {title} by {artist}',
                    extra={'station': station.name}
                )
                return
                
            if spotify_track['id'] == station.last_song_recorded:
                return
            
            self.logger.info(
                f'Spotify found: {title} by {artist} ({try_num if try_num == 1 else f"{try_num}, orig: {title} by {artist}"})',
                extra={'station': station.name}
            )
            
            # Process track
            self.track_processor.process_track(spotify_track, track, spotify_track, station.name)
            self.config_manager.update_last_song_recorded(station.name, spotify_track['id'])
            
        except Exception as e:
            self.logger.error(
                f"Error processing station '{station.name}': {str(e)}",
                extra={'station': station.name}
            )
    
    async def run(self):
        while True:
            stations = self.config_manager.get_stations()
            for station in stations:
                await self.process_station(station)
            await asyncio.sleep(40)

if __name__ == '__main__':
    tracker = RadioPlaysTracker()
    asyncio.run(tracker.run())