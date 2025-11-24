from typing import Any, Dict, List, Optional, Tuple, Protocol, Set
from pydub import AudioSegment
import os, sys, requests, time, base64, json
from datetime import datetime, timezone, timedelta
import asyncio
from dataclasses import dataclass
from abc import ABC, abstractmethod
from pathlib import Path
#sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from helper import Helper
from postgres_connector import PostgresConnector
from shazamio import Shazam

# Timezone handling with fallback
try:
    from zoneinfo import ZoneInfo
except ImportError:  # pragma: no cover - fallback for older Python versions
    from importlib import import_module

    ZoneInfo = import_module('backports.zoneinfo').ZoneInfo

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
        spotify_config = self.config.get('spotify', {})
        self.client_id = spotify_config.get('client_id')
        self.client_secret = spotify_config.get('client_secret')

        if not self.client_id or not self.client_secret:
            raise ValueError("Spotify client credentials are not configured")

        self.state_path = self._resolve_state_path()
        self.station_state = self._load_state()
    
    def get_stations(self) -> List[StationConfig]:
        stations_config = self.config.get('stations') or []
        state_lookup = (self.station_state or {}).get('stations', {})
        stations: List[StationConfig] = []

        for station in stations_config:
            name = station.get('name')
            stream_url = station.get('stream_url')
            if not name or not stream_url:
                continue

            state_entry = state_lookup.get(name)
            if isinstance(state_entry, str):
                last_song_state = state_entry
            elif isinstance(state_entry, dict):
                last_song_state = state_entry.get(self.LAST_SONG_KEY)
            else:
                last_song_state = None

            stations.append(
                StationConfig(
                    name=name,
                    stream_url=stream_url,
                    last_song_recorded=last_song_state or station.get(self.LAST_SONG_KEY),
                    live_intro=station.get(self.LIVE_INTRO_KEY)
                )
            )

        return stations
    
    def update_last_song_recorded(self, station_name: str, song_id: str) -> None:
        self.config['stations'] = [
            {**station, self.LAST_SONG_KEY: song_id}
            if station.get('name') == station_name
            else station
            for station in (self.config.get('stations') or [])
        ]

        stations_state = self.station_state.setdefault('stations', {})
        stations_state[station_name] = {self.LAST_SONG_KEY: song_id}
        self._save_state()

    def _resolve_state_path(self) -> str:
        explicit_path = os.getenv('WORKER_STATE_PATH')
        if explicit_path:
            return explicit_path

        config_path = os.getenv('WORKER_CONFIG_PATH')
        if config_path:
            base_dir = os.path.dirname(os.path.abspath(config_path)) or os.getcwd()
            return os.path.join(base_dir, 'station_state.json')

        base_dir = os.path.dirname(os.path.abspath(__file__))
        return os.path.join(base_dir, 'station_state.json')

    def _default_state(self) -> Dict[str, Dict[str, Dict[str, Optional[str]]]]:
        stations_config = self.config.get('stations') or []
        return {
            'stations': {
                station.get('name'): {self.LAST_SONG_KEY: station.get(self.LAST_SONG_KEY)}
                for station in stations_config
                if station.get('name')
            }
        }

    def _load_state(self) -> Dict[str, Dict[str, Dict[str, Optional[str]]]]:
        default_state = self._default_state()
        try:
            with open(self.state_path, 'r', encoding='utf-8') as file:
                data = json.load(file)
            if not isinstance(data, dict):
                return default_state
        except FileNotFoundError:
            return default_state
        except json.JSONDecodeError:
            return default_state

        stations_section = data.get('stations', {})
        if not isinstance(stations_section, dict):
            data['stations'] = default_state['stations']
            return data

        normalized = {}
        for name, value in stations_section.items():
            if isinstance(value, dict):
                normalized[name] = value
            else:
                normalized[name] = {self.LAST_SONG_KEY: value}

        default_map = (default_state or {}).get('stations', {})
        for name, default_value in default_map.items():
            normalized.setdefault(name, default_value)
        data['stations'] = normalized
        return data

    def _save_state(self) -> None:
        directory = os.path.dirname(self.state_path)
        if directory and not os.path.exists(directory):
            os.makedirs(directory, exist_ok=True)

        with open(self.state_path, 'w', encoding='utf-8') as file:
            json.dump(self.station_state, file, ensure_ascii=False, indent=2)

class SpotifyClient:
    DEFAULT_TIMEOUT = (5, 10)  # (connect, read)

    def __init__(self, client_id: str, client_secret: str, request_timeout: Tuple[int, int] = None):
        self.client_id = client_id
        self.client_secret = client_secret
        self._token: Optional[str] = None
        self._timeout = request_timeout or self.DEFAULT_TIMEOUT
    
    def get_token(self) -> str:
        if not self._token or not self._is_token_valid():
            self._token = self._request_new_token()
        return self._token
    
    def _request_new_token(self) -> str:
        client_credentials = f"{self.client_id}:{self.client_secret}"
        client_credentials_b64 = base64.b64encode(client_credentials.encode()).decode()
        
        try:
            response = requests.post(
                "https://accounts.spotify.com/api/token",
                headers={'Authorization': f'Basic {client_credentials_b64}'},
                data={'grant_type': 'client_credentials'},
                timeout=self._timeout
            )
        except requests.exceptions.RequestException as exc:
            raise ConnectionError(f"Error getting access token: {exc}") from exc
        
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
                params={'q': 'test', 'type': 'track', 'limit': 1},
                timeout=self._timeout
            )
            return response.status_code == 200
        except requests.exceptions.RequestException:
            return False

    def get_artist_images(self, artist_ids: List[str]) -> Dict[str, Optional[str]]:
        """Fetch primary image URLs for the supplied Spotify artist IDs."""
        if not artist_ids:
            return {}

        unique_ids: List[str] = []
        seen: Set[str] = set()
        for artist_id in artist_ids:
            if artist_id and artist_id not in seen:
                unique_ids.append(artist_id)
                seen.add(artist_id)

        images: Dict[str, Optional[str]] = {}
        for start in range(0, len(unique_ids), 50):  # Spotify caps at 50 IDs per request
            chunk = unique_ids[start:start + 50]
            try:
                response = requests.get(
                    "https://api.spotify.com/v1/artists",
                    headers={'Authorization': f'Bearer {self.get_token()}'},
                    params={'ids': ','.join(chunk)},
                    timeout=self._timeout
                )
                response.raise_for_status()
            except requests.exceptions.RequestException as exc:
                raise ConnectionError(f"Error fetching artist metadata from Spotify: {exc}") from exc

            for artist in response.json().get('artists', []):
                artist_id = artist.get('id')
                images[artist_id] = self._select_largest_image(artist.get('images') or [])

        return images

    @staticmethod
    def _select_largest_image(images: List[Dict[str, Any]]) -> Optional[str]:
        if not images:
            return None

        def width(image: Dict[str, Any]) -> int:
            try:
                return int(image.get('width') or 0)
            except (TypeError, ValueError):
                return 0

        primary = max(images, key=width)
        return primary.get('url')
    
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
                params={'q': query, 'type': 'track', 'limit': 1},
                timeout=self._timeout
            )
            response.raise_for_status()
            
            search_results = response.json()
            return search_results['tracks']['items'][0] if search_results['tracks']['items'] else None
            
        except requests.exceptions.RequestException as e:
            raise ConnectionError(f"Error searching Spotify: {str(e)}")

class StreamCapture:
    STREAM_TIMEOUT = (35, 65)  # (connect, read)

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
        try:
            response = requests.get(stream_url, stream=True, timeout=self.STREAM_TIMEOUT)
            response.raise_for_status()
        except requests.exceptions.RequestException as exc:
            raise ConnectionError(f"Failed downloading stream '{stream_url}': {exc}") from exc

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
    def __init__(self, db_connector: PostgresConnector, spotify_client: SpotifyClient, logger=None):
        self.db_connector = db_connector
        self.spotify_client = spotify_client
        self.logger = logger
    
    def process_track(self, track: Dict[str, Any], shazam_track: Dict[str, Any], spotify_track: Dict[str, Any], station: str) -> None:
        artist_images: Dict[str, Optional[str]] = {}
        if self.spotify_client:
            try:
                artist_images = self._fetch_artist_images(spotify_track)
            except Exception as exc:
                if self.logger:
                    self.logger.warning(
                        f"Failed to enrich artist imagery via Spotify: {exc}",
                        extra={'station': station}
                    )
                artist_images = {}

        simplified = self._simplify_spotify_data(spotify_track, shazam_track, artist_images)
        self._add_external_links(simplified, shazam_track, spotify_track)
        self.db_connector.index_song_if_needed(simplified)
        self.db_connector.index_play(simplified, station)
    
    def _fetch_artist_images(self, raw: Dict[str, Any]) -> Dict[str, Optional[str]]:
        artist_ids: List[str] = []
        seen: Set[str] = set()

        for artist in raw.get("artists", []):
            artist_id = artist.get("id")
            if artist_id and artist_id not in seen:
                artist_ids.append(artist_id)
                seen.add(artist_id)

        album = raw.get("album") or {}
        for artist in album.get("artists", []):
            artist_id = artist.get("id")
            if artist_id and artist_id not in seen:
                artist_ids.append(artist_id)
                seen.add(artist_id)

        if not artist_ids:
            return {}

        stored_images: Dict[str, Optional[str]] = {}

        try:
            stored_images = self.db_connector.get_artist_images(artist_ids)
        except Exception as exc:
            if self.logger:
                self.logger.warning(
                    f"Failed loading cached artist images: {exc}",
                    extra={'station': 'system'}
                )

        missing_ids: List[str] = [artist_id for artist_id in artist_ids if not stored_images.get(artist_id)]

        if missing_ids:
            spotify_images = self.spotify_client.get_artist_images(missing_ids)
            for artist_id, image in spotify_images.items():
                stored_images[artist_id] = image

            for artist_id in missing_ids:
                stored_images.setdefault(artist_id, None)

        return stored_images

    def _build_artist_payload(
        self,
        artists: List[Dict[str, Any]],
        artist_images: Dict[str, Optional[str]],
        fallback_image: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        payload: List[Dict[str, Any]] = []
        for index, artist in enumerate(artists):
            artist_id = artist.get("id")
            image_url = artist_images.get(artist_id)
            if not image_url and fallback_image and index == 0:
                image_url = fallback_image

            payload.append({
                "id": artist_id,
                "name": artist.get("name"),
                "image_url": image_url
            })

        return payload

    def _simplify_spotify_data(
        self,
        raw: Dict[str, Any],
        shazam_track: Dict[str, Any],
        artist_images: Dict[str, Optional[str]]
    ) -> Dict[str, Any]:
        # Always use Israel timezone regardless of server location
        israel_tz = ZoneInfo('Asia/Jerusalem')
        israel_now = datetime.now(timezone.utc).astimezone(israel_tz)

        album = raw.get("album", {})
        album_images = album.get("images") or []
        album_image_url = self._select_primary_image(album_images)

        shazam_images = (shazam_track or {}).get("images", {}) if shazam_track else {}
        shazam_song_image = shazam_images.get("coverarthq") or shazam_images.get("coverart")
        shazam_artist_image = shazam_images.get("background")

        song_image_url = album_image_url or shazam_song_image

        track_artists = self._build_artist_payload(
            raw.get("artists", []),
            artist_images,
            shazam_artist_image
        )

        album_artists = self._build_artist_payload(
            album.get("artists", []),
            artist_images
        )
        
        return {
            "played_at": israel_now.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "id": raw.get("id"),
            "name": raw.get("name"),
            "artists": track_artists,
            "album": {
                "id": album.get("id"),
                "name": album.get("name"),
                "artists": album_artists,
                "release_date": album.get("release_date"),
                "image_url": album_image_url or shazam_song_image
            },
            "duration_ms": raw.get("duration_ms"),
            "popularity": raw.get("popularity"),
            "image_url": song_image_url
        }

    def _select_primary_image(self, images: List[Dict[str, Any]]) -> Optional[str]:
        if not images:
            return None

        def image_width(image: Dict[str, Any]) -> int:
            return int(image.get("width") or 0)

        primary = max(images, key=image_width)
        return primary.get("url")
    
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
    STATION_TIMEOUT_SECONDS = 100

    def __init__(self):
        self.config_manager = ConfigManager()
        self.spotify_client = SpotifyClient(
            self.config_manager.client_id,
            self.config_manager.client_secret
        )
        self.stream_capture = StreamCapture()
        self.song_recognizer = SongRecognizer()
        self.logger = Helper.get_rotating_logger(
            'RadioPlaysFetch',
            log_file='radio_plays_fetch.log',
            station_info=True
        )
        self.track_processor = TrackProcessor(PostgresConnector(), self.spotify_client, self.logger)
        self.heartbeat_path = self._resolve_heartbeat_path()
    
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
            self.logger.info(
                f"Polling cycle started for {len(stations)} stations",
                extra={'station': 'system'}
            )
            cycle_started = time.perf_counter()
            for station in stations:
                station_started = time.perf_counter()
                try:
                    await asyncio.wait_for(
                        self.process_station(station),
                        timeout=self.STATION_TIMEOUT_SECONDS
                    )
                except asyncio.TimeoutError:
                    self.logger.error(
                        f"Processing station '{station.name}' timed out after {self.STATION_TIMEOUT_SECONDS}s",
                        extra={'station': station.name}
                    )
                else:
                    elapsed = time.perf_counter() - station_started
                    self.logger.debug(
                        f"Finished station '{station.name}' in {elapsed:.1f}s",
                        extra={'station': station.name}
                    )
                finally:
                    self._write_heartbeat()
            cycle_elapsed = time.perf_counter() - cycle_started
            self.logger.info(
                f"Polling cycle completed in {cycle_elapsed:.1f}s",
                extra={'station': 'system'}
            )
            await asyncio.sleep(20)

    def _resolve_heartbeat_path(self) -> Path:
        env_path = os.getenv('WORKER_HEARTBEAT_PATH')
        if env_path:
            return Path(env_path)
        base_dir = Path(os.getenv('WORKER_CONFIG_PATH') or os.path.dirname(os.path.abspath(__file__)))
        return Path(base_dir) / 'recognizer.heartbeat'

    def _write_heartbeat(self) -> None:
        try:
            self.heartbeat_path.parent.mkdir(parents=True, exist_ok=True)
            self.heartbeat_path.write_text(datetime.utcnow().isoformat() + 'Z', encoding='utf-8')
        except OSError as exc:
            self.logger.warning(
                f"Failed to update heartbeat file '{self.heartbeat_path}': {exc}",
                extra={'station': 'system'}
            )

if __name__ == '__main__':
    print("Starting Radio Plays Tracker...")
    tracker = RadioPlaysTracker()
    asyncio.run(tracker.run())