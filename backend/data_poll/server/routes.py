from flask import Flask, request, jsonify
from db_connect.db_connect import DataConnect

dbc = DataConnect()

def initialize_routes(app):
    @app.route('/api/station_last_plays', methods=['GET'])
    def get_station_last_plays():
        station = request.args.get('station')
        if station is None:
            return "No station", 404
        try:
            last_songs = dbc.get_last_plays_from_station(station)
            return jsonify(last_songs)
        except Exception as e:
            return "Server Error: "+str(e), 500
        

    @app.route('/api/get_artist_plays', methods=['GET'])
    def get_artist_plays():
        artist = request.args.get('artist')
        if artist is None:
            return "No artist", 404
        try:
            plays = dbc.get_artist_plays(artist)
            return jsonify(plays)
        except Exception as e:
            return "Server Error: "+str(e), 500