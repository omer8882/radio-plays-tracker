from fastapi import FastAPI, HTTPException, Query
from db_connect.db_connect import DataConnect
from typing import List, Optional

dbc = DataConnect()

def initialize_routes(app: FastAPI):
    @app.get("/api/station_last_plays")
    async def get_station_last_plays(station: str = Query(..., description="The name of the radio station")):
        try:
            last_songs = dbc.get_last_plays_from_station(station)
            return last_songs
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Server Error: {str(e)}")

    @app.get("/api/get_artist_plays")
    async def get_artist_plays(artist: str = Query(..., description="The name of the artist")):
        try:
            plays = dbc.get_artist_plays(artist)
            return plays
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Server Error: {str(e)}")

    @app.get("/api/search")
    async def search(query: str = Query(..., description="The search query")):
        try:
            results = dbc.search(query)
            return results
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Server Error: {str(e)}")

    @app.get("/api/top_hits")
    async def top_hits(days: Optional[int] = Query(7, description="Number of days"), top_n: Optional[int] = Query(5, description="Top N hits")):
        try:
            results = dbc.top_hits(days, top_n)
            return results
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Server Error: {str(e)}")
    
    @app.get("/api/song_plays_by_station")
    async def song_plays_by_station(song_id: str = Query(..., description="The ID of the song"), days: Optional[int] = Query(None, description="Num of last days to count the plays")):
        try:
            station_breakdown = dbc.get_song_plays_by_station(song_id, days)
            return station_breakdown
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Server Error: {str(e)}")