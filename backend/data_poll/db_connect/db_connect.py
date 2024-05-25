import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from elasticsearch_dsl import Search
from elasticsearch_dsl.connections import connections
from recognize.helper import Helper
from server.models import *


class NoResults(Exception):
        def __init__(self, message="No results from database"):
            self.message = message
            super().__init__(self.message)

class DataConnect:
    def __init__(self):
        self.create_elastic_connection()
        self.songs_index = "songs_index"
    
    def create_elastic_connection(self):
        elastic_config = Helper.load_config().get('elastic')
        elastic_url = elastic_config.get("url", "http://localhost:9200")
        elastic_user = elastic_config.get("user", "elastic")
        elastic_password = elastic_config.get("password", "password")
        self.client = connections.create_connection(
            hosts=elastic_url,
            http_auth=(elastic_user, elastic_password)
        )

    def fetch_data(self, index, query):
        s = Search(using=self.client, index=index).query(query)
        response = s.execute()
        return response
    
    # # # # # # # # # # # # #
    # # #  Converters   # # #
    # # # # # # # # # # # # #

    def response_to_plays(self, response):
        plays = []
        for hit in response:
            play = Play(song_id=hit.song_id, played_at=hit.played_at)
            plays.append(play)
        return plays

    # # # # # # # # # # #
    # # #  Queries  # # #
    # # # # # # # # # # #

    def get_song_info(self, song_id):
        s = Search(using=self.client, index=self.songs_index).query('match', id=song_id)
        response = s.execute()
        if response.hits.total.value > 0:
            return response.hits[0].to_dict()
        else:
            raise NoResults('Song not found')

    def get_last_plays(self, index, size=10):
        # Query the last X plays by sorting on played_at in descending order
        s = Search(using=self.client, index=index).sort({'played_at': {'order': 'desc'}})[:size]
        response = s.execute()
        plays = self.response_to_plays(response)
        return plays
    
    def get_plays_in_range(self, index, start, end, size):
        # Create a search object with a range query and set the size and sorting parameters
        s = (Search(using=self.client, index=index)
             .query('range', played_at={'gte': start, 'lte': end})
             .sort('-played_at')
             [:size])
        response = s.execute()
        plays = self.response_to_plays(response)
        return plays
    
    def plays_list_to_songs_list(self, plays: List[Play]):
        songs = []
        for play in plays:
            song = self.get_song_info(play.song_id)
            song['played_at'] = play.played_at
            songs.append(song)
        return songs
    
    def convert_to_clock_time(self, date_time):
        try:
            return datetime.strptime(date_time, "%Y-%m-%dT%H:%M:%S").strftime("%H:%M")
        except:
            try:
                return datetime.strptime(date_time, "%Y-%m-%dT%H:%M:%SZ").strftime("%H:%M")
            except:
                try:
                    return datetime.fromisoformat(date_time).strftime("%H:%M")
                except Exception as e:
                    return datetime

    def get_last_plays_from_station(self, station):
        plays = self.get_last_plays(f'{station}_plays_index')
        songs = self.plays_list_to_songs_list(plays)
        results =[]
        for song in songs:
            result = {"title": song['name'], 'artist': ', '.join([artist['name'] for artist in song['artists']]), 'time': self.convert_to_clock_time(song['played_at'])}
            results.append(result)
        return results