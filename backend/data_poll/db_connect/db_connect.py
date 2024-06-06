import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from elasticsearch_dsl import Search
from elasticsearch_dsl.query import Match
from elasticsearch_dsl.connections import connections
from recognize.helper import Helper
from server.models import *

FULL_DATE_TIME_FORMAT = "%d/%m/%Y %H:%M:%S"
THE_TIME_FORMAT = "%H:%M"

class NoResults(Exception):
        def __init__(self, message="No results from database"):
            self.message = message
            super().__init__(self.message)

class DataConnect:
    def __init__(self):
        self.__create_elastic_connection()
        self.songs_index = "songs_index"
        self.plays_indices = [f'{station}_plays_index' for station in Helper.get_station_names()]
    
    def __create_elastic_connection(self):
        elastic_config = Helper.load_config().get('elastic')
        elastic_url = elastic_config.get("url", "http://localhost:9200")
        elastic_user = elastic_config.get("user", "elastic")
        elastic_password = elastic_config.get("password", "password")
        self.client = connections.create_connection(
            hosts=elastic_url,
            http_auth=(elastic_user, elastic_password)
        )

    def __fetch_data(self, index, query):
        s = Search(using=self.client, index=index).query(query)
        response = s.execute()
        return response
    
    # # # # # # # # # # # # #
    # # #  Converters   # # #
    # # # # # # # # # # # # #

    def convert_to_clock_time(self, date_time, format=THE_TIME_FORMAT):
        try:
            return datetime.strptime(date_time, "%Y-%m-%dT%H:%M:%S").strftime(format)
        except:
            try:
                return datetime.strptime(date_time, "%Y-%m-%dT%H:%M:%SZ").strftime(format)
            except:
                try:
                    return datetime.fromisoformat(date_time).strftime(format)
                except Exception as e:
                    return datetime

    def response_to_plays(self, response):
        plays = []
        for hit in response:
            play = Play(song_id=hit.song_id, played_at=hit.played_at)
            plays.append(play)
        return plays
    
    def to_play_model(self, song, time_format="%H:%M"):
        artists = ', '.join([artist['name'] for artist in song['artists']])
        time = self.convert_to_clock_time(song['played_at'], time_format)
        return {"title": song['name'], 'artist': artists, 'time': time, 'station': song.get('station')};

    # # # # # # # # # # #
    # # #  Queries  # # #
    # # # # # # # # # # #

    def __get_song_info(self, song_id):
        s = Search(using=self.client, index=self.songs_index).query('match', id=song_id)
        response = s.execute()
        if response.hits.total.value > 0:
            return response.hits[0].to_dict()
        else:
            raise NoResults('Song not found')

    def __get_last_plays(self, index, size=10):
        # Query the last X plays by sorting on played_at in descending order
        s = Search(using=self.client, index=index).sort({'played_at': {'order': 'desc'}})[:size]
        response = s.execute()
        plays = self.response_to_plays(response)
        return plays
    
    def __get_plays_in_range(self, index, start, end, size):
        # Create a search object with a range query and set the size and sorting parameters
        s = (Search(using=self.client, index=index)
             .query('range', played_at={'gte': start, 'lte': end})
             .sort('-played_at')
             [:size])
        response = s.execute()
        plays = self.response_to_plays(response)
        return plays
    
    def __search_songs(self, title="", artist="") -> dict:
        s = Search(using=self.client, index=self.songs_index).query(Match(name=title, artists_name=artist))
        response = s.execute()
        hits = response.hits.hits
        if hits:
            return hits[0].to_dict()
        else:
            raise NoResults('No Songs Found.')
        
    def __get_artist_songs_by_name(self, artist_name):
        s = Search(using=self.client, index=self.songs_index).query(Match(artists__name=artist_name))[:100]
        response = s.execute()
        songs_results = [hit.to_dict() for hit in response]
        songs_by_artist = []
        for song_result in songs_results:
            for artist in song_result['artists']:
                if artist['name'].lower() == artist_name.lower():
                    songs_by_artist.append(song_result)
        return songs_by_artist
    
    def __get_plays_by_song_id(self, song_id):
        indices = ','.join(self.plays_indices)
        s = Search(using=self.client, index=indices).query(Match(song_id=song_id))[:100]
        response = s.execute()
        return [hit['_source'].to_dict() | {'station': hit['_index'].split('_')[0]} for hit in response['hits']['hits']]
    
    def __plays_list_to_songs_list(self, plays: List[Play]):
        songs = []
        for play in plays:
            song = self.__get_song_info(play.song_id)
            song['played_at'] = play.played_at
            songs.append(song)
        return songs

    # # # # # # # # # # # # # # #
    # # #   Public Methods  # # #
    # # # # # # # # # # # # # # #

    def get_last_plays_from_station(self, station):
        plays = self.__get_last_plays(f'{station}_plays_index')
        songs = self.__plays_list_to_songs_list(plays)
        results = []
        for song in songs:
            #result = {"title": song['name'], 'artist': ', '.join([artist['name'] for artist in song['artists']]), 'time': self.convert_to_clock_time(song['played_at'])}
            result = self.to_play_model(song, THE_TIME_FORMAT)
            results.append(result)
        return results
    
    def get_artist_plays(self, artist_name):
        songs = self.__get_artist_songs_by_name(artist_name)
        sum_plays = 0
        all_plays = []
        for song in songs:
            song_plays = self.__get_plays_by_song_id(song['id'])
            sum_plays += len(song_plays)
            for play in song_plays:
                play_to_display = song.copy()
                play_to_display['played_at'] = play['played_at']
                play_to_display['station'] = play['station']
                all_plays.append(play_to_display)

        sorted_plays = sorted(all_plays, key=lambda song: song['played_at'], reverse=True)
        sorted_plays_to_display = [self.to_play_model(play, FULL_DATE_TIME_FORMAT) for play in sorted_plays]
        return sorted_plays_to_display