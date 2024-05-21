
import os
import json
from elasticsearch import Elasticsearch
from datetime import datetime
from helper import Helper

class NoResults(Exception):
        def __init__(self, message="No results from database"):
            self.message = message
            super().__init__(self.message)

class DatabaseConnector():
    def __init__(self, config_filename='config.json'):
        self.config_filename = config_filename
        self.songs_index_name = 'songs_index'
        index_prefix = 'plays_index'
        stations = Helper.get_station_names()
        self.plays_indices = [f'{s}_{index_prefix}' if s != 'glglz' else index_prefix for s in stations]
        self.es = Helper.get_es_connection()
    
    def get_sources(self, response):
        sources = [hit['_source'] for hit in response['hits']['hits']]
        for (s, res) in zip(sources, response['hits']['hits']):
            index = res['_index'].split('_')[0] 
            s['station'] = index if index!='plays' else 'glglz'
        return sources

    def get_song_by_name(self, song_name) -> dict:
        response = self.es.search(index="songs_index", query={
            "match": {
                "name": song_name
            }
        })
        hits = response['hits']['hits']
        if hits is not None and len(hits) > 0:
            return response['hits']['hits'][0]['_source']
        else:
            raise NoResults('Song not found')
        
    def get_artist_songs_by_name(self, artist_name):
        response = self.es.search(index="songs_index", body={
            "query": {
                "match": {
                "artists.name": artist_name
                }
            }
        }, size=100 )
        songs_results = self.get_sources(response)
        songs_by_artist = []
        for song_result in songs_results:
            for artist in song_result['artists']:
                if str.lower(artist['name']) == str.lower(artist_name):
                    songs_by_artist.append(song_result)
        return songs_by_artist
    
    def print_artist_songs_by_name(self, artist_name):
        songs = self.get_artist_songs_by_name(artist_name)
        for song in songs:
            print(song)
        print(f"Results: {len(songs)}")

    def print_artist_plays_by_name(self, artist_name):
        songs = self.get_artist_songs_by_name(artist_name)
        sum_plays = 0
        all_plays = []
        for song in songs:
            song_plays = self.get_plays_by_song_id(song['id'])
            sum_plays += len(song_plays)
            for play in song_plays:
                play_to_display = song.copy()
                play_to_display['played_at'] = self.parse_datetime(play['played_at'])
                play_to_display['station'] = play['station']
                all_plays.append(play_to_display)

        sorted_plays = sorted(all_plays, key=lambda song: song['played_at'])
        for play in sorted_plays:
            print(f"[{play['played_at'].strftime('%d/%m/%Y %H:%M')}] {', '.join([artist['name'] for artist in play['artists']])} - {play['name']} ({play['album']['release_date'][:4]}) [{play['station']}]")
        print(f"Total plays by artist: {len(sorted_plays)}")

    def parse_datetime(self, played_at):
        try:
            return datetime.strptime(played_at, "%Y-%m-%dT%H:%M:%S")
        except:
            try:
                return datetime.strptime(played_at, "%Y-%m-%dT%H:%M:%SZ")
            except Exception as e:
                raise Exception('Cant parse some time...\n'+e)

    def get_artist_id(self, artist_name):
        songs_by_artist = self.get_artist_songs_by_name(artist_name)
        if songs_by_artist is not None and len(songs_by_artist) > 0:
            for artist in songs_by_artist[0]['artists']:
                if artist['name'] == artist_name:
                    return artist['id']
        raise NoResults('Artist not found')
    
    def get_plays_by_song_id(self, song_id):
        indices = ','.join(self.plays_indices)
        response = self.es.search(index=indices, query={
            "match": {
                "song_id": song_id
            }
        }, size=100)
        return self.get_sources(response)

    def get_song_plays_by_name(self, song_name):
        song = self.get_song_by_name(song_name)
        plays = self.get_plays_by_song_id(song['id'])
        sorted_plays = sorted(plays, key=lambda play: datetime.strptime(play['played_at'], "%Y-%m-%dT%H:%M:%S"), reverse=True)
        return sorted_plays

    def print_song_plays(self, song_name):
        plays = self.get_song_plays_by_name(song_name)
        for play in plays:
            print(datetime.strptime(play['played_at'], "%Y-%m-%dT%H:%M:%S").strftime('%d/%m/%Y %H:%M'))
        print(f"Total plays: {len(plays)}")



    def get_station_plays(self, station):
        return ""

dbc = DatabaseConnector()
print("Use dbc for data connection...")