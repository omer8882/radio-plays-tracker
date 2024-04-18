import os
import json
import logging
from logging.handlers import RotatingFileHandler
from elasticsearch import Elasticsearch

class ElasticConnector:
    def __init__(self, station_name, config_filename='config.json'):
        self.config_filename = config_filename
        self.songs_index_name = 'songs_index'
        self.plays_index_name = 'plays_index' if station_name == 'glglz' else f'{station_name}_plays_index'
        self.logger = self.get_rotating_logger('ElasticScriptLogger', 'elastic_indexing.log', 10*1024*1024, 5)
        self.es = self.get_es_connection()

    def load_config(self):
        """Loads configuration data from a JSON file."""
        if os.path.exists(self.config_filename):
            with open(self.config_filename, 'r') as file:
                return json.load(file)
        return {}

    @staticmethod
    def get_rotating_logger(name, log_file='elastic_for_simple.log', max_log_size=10*1024*1024, backup_count=5):
        logger = logging.getLogger(name)
        logger.setLevel(logging.INFO)
        
        if not logger.handlers:
            handler = RotatingFileHandler(log_file, maxBytes=max_log_size, backupCount=backup_count, encoding='utf-8')
            formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        
        return logger

    def get_es_connection(self):
        """Establishes connection to Elasticsearch using configuration."""
        config = self.load_config()
        elastic_url = config.get("elastic_url", "http://localhost:9200")
        elastic_user = config.get("elastic_user", "elastic")
        elastic_password = config.get("elastic_password", "password")
        
        return Elasticsearch(elastic_url, basic_auth=(elastic_user, elastic_password))

    def index_song_if_needed(self, song):
        if not self.es.exists(index=self.songs_index_name, id=song['id']):
            self.es.index(index=self.songs_index_name, id=song['id'], document=song)
            self.logger.info(f"Indexed: {', '.join([artist['name'] for artist in song['artists']])} - {song['name']} ({song['album']['release_date'][:4]})")

    def index_play(self, full_record):
        play_document = {'song_id': full_record['id'], 'played_at': full_record['played_at']}
        self.es.index(index=self.plays_index_name, id=full_record['played_at'], document=play_document)

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

    def process_file(self, file_path):
        with open(file_path, 'r', encoding='utf-8') as file:
            data = json.load(file)
            if data.get('archived', False):
                self.logger.info(f'Skipping elastic processing of {file_path} because it is already archived')
                return
            self.logger.info(f"Archiving into Elastic database {file_path}...")
            for record in data['tracks']:
                song_data = record.copy()
                song_data.pop('played_at', None)
                self.index_song_if_needed(song_data)
                self.index_play(record)
        self.mark_as_archived(file_path)

    def process_files(self, folder_path='.\\simple'):
        files_to_archive = os.listdir(folder_path)
        for filename in files_to_archive:
            if filename.endswith('.json'):
                file_path = os.path.join(folder_path, filename)
                self.process_file(file_path)
