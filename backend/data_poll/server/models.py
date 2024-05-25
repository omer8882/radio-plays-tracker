from typing import List, Dict
from datetime import datetime

class Artist:
    def __init__(self, id: str, name: str):
        self.id = id
        self.name = name

    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "name": self.name
        }

class Album:
    def __init__(self, id: str, name: str, artists: List[Artist], release_date: str):
        self.id = id
        self.name = name
        self.artists = artists
        self.release_date = datetime.strptime(release_date, "%Y-%m-%d")

    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "name": self.name,
            "artists": [artist.to_dict() for artist in self.artists],
            "release_date": self.release_date.strftime("%Y-%m-%d")
        }

class Song:
    def __init__(self, id: str, name: str, artists: List[Artist], album: Album, duration_ms: int, popularity: int):
        self.id = id
        self.name = name
        self.artists = artists
        self.album = album
        self.duration_ms = duration_ms
        self.popularity = popularity

    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "name": self.name,
            "artists": [artist.to_dict() for artist in self.artists],
            "album": self.album.to_dict(),
            "duration_ms": self.duration_ms,
            "popularity": self.popularity
        }
    
class Play:
    def __init__(self, song_id, played_at):
        self.id = played_at
        self.song_id = song_id
        self.played_at = played_at

    def to_dict(self):
        return {
            "id": self.id,
            "song_id": self.song,
            "played_at": self.artist
        }