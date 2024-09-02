import os
import json
from tqdm import tqdm
from helper import Helper

class ElasticConnector:
    def __init__(self, station_name='glglz'):
        self.songs_index_name = 'songs_index'
        self.plays_index_name = 'plays_index' if station_name == 'glglz' else f'{station_name}_plays_index'
        self.logger = Helper.get_rotating_logger('ElasticScriptLogger', log_file='elastic_indexing.log')
        self.es = Helper.get_es_connection()

    def index_song_if_needed(self, song):
        if not self.es.exists(index=self.songs_index_name, id=song['id']):
            self.es.index(index=self.songs_index_name, id=song['id'], document=song)
            self.logger.info(f"Indexed: {', '.join([artist['name'] for artist in song['artists']])} - {song['name']} ({song['album']['release_date'][:4]})")
        else:
            existing_song = self.es.get(index=self.songs_index_name, id=song['id'])
            if 'external_links' not in existing_song['_source']:
                self.es.index(index=self.songs_index_name, id=song['id'], document=song)
                self.logger.info(f"Reindexed: {', '.join([artist['name'] for artist in song['artists']])} - {song['name']} ({song['album']['release_date'][:4]}) with external links: {song['external_links']}")

    def index_play(self, full_record, station = None):
        play_document = {'song_id': full_record['id'], 'played_at': full_record['played_at']}
        index = f'{station}_plays_index' if station else self.plays_index_name
        self.es.index(index=index, id=full_record['played_at'], document=play_document)

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

    def update_plays_index(self, file_name):
        station_names = Helper.get_station_names()
        station_name = next((s for s in station_names if s in file_name), None)
        self.plays_index_name = 'plays_index' if station_name == 'glglz' else f'{station_name}_plays_index'

    def process_file(self, file_path):
        """Saves into elasticsearch data in a simplified format"""
        self.update_plays_index(os.path.basename(file_path))
        with open(file_path, 'r', encoding='utf-8') as file:
            data = json.load(file)
            if data.get('archived', False):
                return
            self.logger.info(f"Archiving into Elastic database {file_path}...")
            for record in data['tracks']:
                song_data = record.copy()
                song_data.pop('played_at', None)
                self.index_song_if_needed(song_data)
                self.index_play(record)
        self.mark_as_archived(file_path)
    
    def cleanup_file(self, file_path):
        """Deletes a simplified data file if it holds no data"""
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
        """Archives data of all simplified files in a folder"""
        files_to_process = [f for f in os.listdir(folder_path) if f.endswith('.json')]
        total_files = len(files_to_process)
        for i, filename in tqdm(enumerate(files_to_process), total=total_files, desc="Processing Files"):
            file_path = os.path.join(folder_path, filename)
            if not self.cleanup_file(file_path):
                self.process_file(file_path)