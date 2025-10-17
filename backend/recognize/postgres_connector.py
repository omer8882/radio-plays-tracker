import json
import os
import psycopg2
from psycopg2.extras import Json, execute_values
from datetime import datetime
from helper import Helper

class PostgresConnector:
    def __init__(self, station_name='glglz'):
        self.station_name = station_name
        log_path = os.getenv('WORKER_POSTGRES_LOG', 'postgres_indexing.log')
        self.logger = Helper.get_rotating_logger('PostgresScriptLogger', log_file=log_path)
        self.conn = self._get_db_connection()
        self.station_id = self._get_or_create_station(station_name)

    def _get_db_connection(self):
        """Create PostgreSQL database connection"""
        config = Helper.load_config().get('postgres', {})
        try:
            conn = psycopg2.connect(
                host=config.get('host', 'localhost'),
                port=config.get('port', 5432),
                database=config.get('database', 'radio_plays'),
                user=config.get('user', 'postgres'),
                password=config.get('password', 'postgres'),
                options='-c timezone=Asia/Jerusalem'  # Set session timezone to Israel
            )
            conn.autocommit = False
            self.logger.info("Connected to PostgreSQL database")
            return conn
        except Exception as e:
            self.logger.error(f"Failed to connect to PostgreSQL: {e}")
            raise

    def _get_or_create_station(self, station_name):
        """Get station ID or create if doesn't exist"""
        try:
            with self.conn.cursor() as cur:
                cur.execute("SELECT id FROM stations WHERE name = %s", (station_name,))
                result = cur.fetchone()
                if result:
                    return result[0]
                else:
                    # Station doesn't exist, create it
                    cur.execute(
                        "INSERT INTO stations (name, display_name) VALUES (%s, %s) RETURNING id",
                        (station_name, station_name.upper())
                    )
                    station_id = cur.fetchone()[0]
                    self.conn.commit()
                    self.logger.info(f"Created new station: {station_name} with ID {station_id}")
                    return station_id
        except Exception as e:
            self.conn.rollback()
            self.logger.error(f"Error getting/creating station: {e}")
            raise

    def _artist_exists(self, artist_id):
        """Check if artist exists in database"""
        with self.conn.cursor() as cur:
            cur.execute("SELECT 1 FROM artists WHERE id = %s", (artist_id,))
            return cur.fetchone() is not None

    def _album_exists(self, album_id):
        """Check if album exists in database"""
        with self.conn.cursor() as cur:
            cur.execute("SELECT 1 FROM albums WHERE id = %s", (album_id,))
            return cur.fetchone() is not None

    def _song_exists(self, song_id):
        """Check if song exists in database"""
        with self.conn.cursor() as cur:
            cur.execute("SELECT 1 FROM songs WHERE id = %s", (song_id,))
            return cur.fetchone() is not None

    def index_artists(self, artists):
        """Insert artists if they don't exist"""
        try:
            with self.conn.cursor() as cur:
                for artist in artists:
                    if not self._artist_exists(artist['id']):
                        cur.execute(
                            """INSERT INTO artists (id, name) VALUES (%s, %s)
                               ON CONFLICT (id) DO NOTHING""",
                            (artist['id'], artist['name'])
                        )
                self.conn.commit()
        except Exception as e:
            self.conn.rollback()
            self.logger.error(f"Error indexing artists: {e}")
            raise

    def index_album(self, album):
        """Insert album and its artists if they don't exist"""
        try:
            with self.conn.cursor() as cur:
                # Insert album artists first
                if 'artists' in album:
                    self.index_artists(album['artists'])

                # Insert album if it doesn't exist
                if not self._album_exists(album['id']):
                    release_date = None
                    if album.get('release_date'):
                        try:
                            release_date = datetime.strptime(album['release_date'], "%Y-%m-%d").date()
                        except:
                            pass

                    cur.execute(
                        """INSERT INTO albums (id, name, release_date) 
                           VALUES (%s, %s, %s)
                           ON CONFLICT (id) DO NOTHING""",
                        (album['id'], album['name'], release_date)
                    )

                    # Insert album-artist relationships
                    if 'artists' in album:
                        for idx, artist in enumerate(album['artists']):
                            cur.execute(
                                """INSERT INTO album_artists (album_id, artist_id, artist_order) 
                                   VALUES (%s, %s, %s)
                                   ON CONFLICT (album_id, artist_id) DO NOTHING""",
                                (album['id'], artist['id'], idx)
                            )
                self.conn.commit()
        except Exception as e:
            self.conn.rollback()
            self.logger.error(f"Error indexing album: {e}")
            raise

    def index_song_if_needed(self, song):
        """Insert song with all relationships if it doesn't exist"""
        try:
            with self.conn.cursor() as cur:
                # Insert artists first
                if 'artists' in song:
                    self.index_artists(song['artists'])

                # Insert album
                if 'album' in song:
                    self.index_album(song['album'])

                # Check if song exists
                if not self._song_exists(song['id']):
                    # Convert external_links to JSON
                    external_links = Json(song.get('external_links', {}))

                    # Insert song
                    cur.execute(
                        """INSERT INTO songs (id, name, album_id, duration_ms, popularity, external_links) 
                           VALUES (%s, %s, %s, %s, %s, %s)
                           ON CONFLICT (id) DO UPDATE SET
                               external_links = EXCLUDED.external_links,
                               updated_at = CURRENT_TIMESTAMP""",
                        (
                            song['id'],
                            song['name'],
                            song['album']['id'] if 'album' in song else None,
                            song.get('duration_ms', 0),
                            song.get('popularity', 0),
                            external_links
                        )
                    )

                    # Insert song-artist relationships
                    if 'artists' in song:
                        for idx, artist in enumerate(song['artists']):
                            cur.execute(
                                """INSERT INTO song_artists (song_id, artist_id, artist_order) 
                                   VALUES (%s, %s, %s)
                                   ON CONFLICT (song_id, artist_id) DO NOTHING""",
                                (song['id'], artist['id'], idx)
                            )

                    artist_names = ', '.join([artist['name'] for artist in song['artists']])
                    album_year = song['album'].get('release_date', '')[:4] if 'album' in song else ''
                    self.logger.info(f"Indexed: {artist_names} - {song['name']} ({album_year})")

                self.conn.commit()
        except Exception as e:
            self.conn.rollback()
            self.logger.error(f"Error indexing song: {e}")
            raise

    def index_play(self, full_record, station=None):
        """Insert a play record"""
        try:
            station_id = self.station_id
            if station:
                # Get station ID for the specified station
                with self.conn.cursor() as cur:
                    cur.execute("SELECT id FROM stations WHERE name = %s", (station,))
                    result = cur.fetchone()
                    if result:
                        station_id = result[0]

            with self.conn.cursor() as cur:
                # Parse played_at timestamp
                # Note: The timestamp from recognizer is already in local (Israel) time
                # despite having 'Z' suffix - it uses datetime.now() which is local time
                played_at_str = full_record['played_at'].replace('Z', '').replace('T', ' ')
                played_at = datetime.fromisoformat(played_at_str)

                # Insert play record (ignore if duplicate)
                cur.execute(
                    """INSERT INTO plays (song_id, station_id, played_at) 
                       VALUES (%s, %s, %s)
                       ON CONFLICT (song_id, station_id, played_at) DO NOTHING""",
                    (full_record['id'], station_id, played_at)
                )
                self.conn.commit()
        except Exception as e:
            self.conn.rollback()
            self.logger.error(f"Error indexing play: {e}")
            raise

    def mark_as_archived(self, file_path):
        """Mark a file as archived by adding 'archived': true."""
        try:
            with open(file_path, 'r+', encoding='utf-8') as file:
                data = json.load(file)
            data['archived'] = True
            with open(file_path, 'w', encoding='utf-8') as file:
                json.dump(data, file, ensure_ascii=False, indent=4)
        except Exception as e:
            self.logger.exception(f"Failed to mark file as archived: {e}")

    def update_station(self, file_name):
        """Update current station based on filename"""
        station_names = Helper.get_station_names()
        station_name = next((s for s in station_names if s in file_name), self.station_name)
        if station_name != self.station_name:
            self.station_name = station_name
            self.station_id = self._get_or_create_station(station_name)

    def process_file(self, file_path):
        """Process a JSON file and save data to PostgreSQL"""
        import os
        self.update_station(os.path.basename(file_path))
        
        with open(file_path, 'r', encoding='utf-8') as file:
            data = json.load(file)
            if data.get('archived', False):
                return
            
            self.logger.info(f"Processing {file_path} into PostgreSQL database...")
            for record in data['tracks']:
                song_data = record.copy()
                song_data.pop('played_at', None)
                self.index_song_if_needed(song_data)
                self.index_play(record)
        
        self.mark_as_archived(file_path)

    def cleanup_file(self, file_path):
        """Deletes a data file if it holds no data"""
        import os
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                data = json.load(file)
                should_delete = not data.get('tracks')
        except Exception as e:
            return False
        
        if should_delete:
            os.remove(file_path)
            self.logger.info(f'Deleted empty file {file_path}')
            return True
        return False

    def process_files(self, folder_path='.\\simple'):
        """Process all JSON files in a folder"""
        import os
        from tqdm import tqdm
        
        files_to_process = [f for f in os.listdir(folder_path) if f.endswith('.json')]
        total_files = len(files_to_process)
        
        for i, filename in tqdm(enumerate(files_to_process), total=total_files, desc="Processing Files"):
            file_path = os.path.join(folder_path, filename)
            if not self.cleanup_file(file_path):
                self.process_file(file_path)

    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()
            self.logger.info("Closed PostgreSQL connection")

    def __del__(self):
        """Destructor to ensure connection is closed"""
        self.close()
