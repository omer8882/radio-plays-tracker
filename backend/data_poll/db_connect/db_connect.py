import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from elasticsearch_dsl import Search, Q, A
from elasticsearch_dsl.query import Match
from elasticsearch_dsl.connections import connections
from recognize.helper import Helper
from server.models import *
from datetime import datetime, timedelta

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

    def parse_time(self, date_time):
        try:
            return datetime.strptime(date_time, "%Y-%m-%dT%H:%M:%S")
        except:
            try:
                return datetime.strptime(date_time, "%Y-%m-%dT%H:%M:%SZ")
            except:
                try:
                    return datetime.fromisoformat(date_time)
                except Exception as e:
                    return None

    def convert_to_clock_time(self, date_time, format=THE_TIME_FORMAT):
        parsed_time = self.parse_time(date_time)
        if parsed_time:
            return parsed_time.strftime(format)
        else:
            return None

    def response_to_plays(self, response):
        plays = []
        for hit in response:
            play = Play(song_id=hit.song_id, played_at=hit.played_at)
            plays.append(play)
        return plays
    
    def to_play_model(self, song, time_format="%H:%M"):
        artists = ', '.join([artist['name'] for artist in song['artists']])
        time = self.convert_to_clock_time(song['played_at'], time_format)
        return {"title": song['name'], 'artist': artists, 'time': time, 'station': song.get('station')}
    
    def to_hits_model(self, songs):
        return [{"id": song['id'], "title": song['name'], 'artist': ', '.join([artist['name'] for artist in song['artists']]), 'hits': song['hits']} for song in songs]

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
        s = Search(using=self.client, index=self.songs_index).query(Match(name=title, artists__name=artist))
        response = s.execute()
        hits = response.hits.hits
        if hits:
            return hits[0].to_dict()
        else:
            raise NoResults('No Songs Found.')
        
    def __free_Search(self, query="") -> list:
        # Using multi_match for free text search across multiple fields
        q = Q('multi_match', query=query, fields=['name', 'artists.name'], fuzziness='AUTO')
        s = Search(using=self.client, index=self.songs_index).query(q)
        response = s.execute()
        hits = response.hits.hits
        if hits:
            return [hit.to_dict() for hit in hits]
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
    
    def __get_plays_by_song_id(self, song_id, days):
        indices = ','.join(self.plays_indices)
        s = Search(using=self.client, index=indices).query(Match(song_id=song_id))[:100]
        response = s.execute()
        plays = [hit['_source'].to_dict() | {'station': hit['_index'].split('_')[0]} for hit in response['hits']['hits']]
        
        if days is not None:
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=days)
            plays = [play for play in plays if start_date <= self.parse_time(play['played_at']) <= end_date]
        
        return plays

    def __plays_list_to_songs_list(self, plays: List[Play]):
        songs = []
        for play in plays:
            song = self.__get_song_info(play.song_id)
            song['played_at'] = play.played_at
            songs.append(song)
        return songs
    
    def __get_plays_breakdown_by_station(self, song_id, days=None):
        plays = self.__get_plays_by_song_id(song_id, days)
        station_breakdown = {}
        for play in plays:
            station = play['station']
            if station in station_breakdown:
                station_breakdown[station] += 1
            else:
                station_breakdown[station] = 1
        return station_breakdown
    
    def get_top_played_songs(self, days=7, top_n=5):
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Step 1: Construct the Search object with filter and aggregation
        indices = ','.join(self.plays_indices)
        s = Search(using=self.client, index=indices)
        s = s.filter('range', played_at={'gte': start_date, 'lte': end_date})
        
        # Adding aggregation for top songs by song_id
        a = A('terms', field='song_id.keyword', size=top_n, shard_size=60)
        s.aggs.bucket('top_songs', a)
        
        # Step 2: Execute the search
        response = s.execute()

        # Step 3: Extract top song IDs and counts from the aggregation
        top_song_buckets = response.aggregations.top_songs.buckets
        top_songs_info = [(bucket.key, bucket.doc_count) for bucket in top_song_buckets]
        
        # Step 4: Fetch metadata for top songs from songs_index
        top_songs_metadata = []
        if top_songs_info:
            top_song_ids = [song_id for song_id, _ in top_songs_info]
            q = Q('ids', values=top_song_ids)
            s_meta = Search(using=self.client, index=self.songs_index).query(q)
            metadata_response = s_meta.execute()
            
            # Combine metadata with play counts
            for hit in metadata_response:
                song_data = hit.to_dict()
                song_data['hits'] = next(count for song_id, count in top_songs_info if song_id == hit.meta.id)
                top_songs_metadata.append(song_data)

        # Step 5: Validate the counts
        for hit in top_songs_metadata:
            plays = self.__get_plays_by_song_id(hit['id'], days)
            if plays != hit['hits']:
                print(f"Error: {hit['name']} has {len(plays)} plays but {hit['hits']} hits")
                hit['hits'] = max(hit['hits'], len(plays))

        top_songs_metadata.sort(key=lambda song: song['hits'], reverse=True)
        return top_songs_metadata

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
    
    def search(self, query):
        results = self.__free_Search(query)
        return [r['_source']for r in results]
    
    def top_hits(self, days, top_n):
        top_hits = self.get_top_played_songs(days, top_n)
        return self.to_hits_model(top_hits)

    def get_song_plays_by_station(self, song_id, days=None):
        return self.__get_plays_breakdown_by_station(song_id, days)
