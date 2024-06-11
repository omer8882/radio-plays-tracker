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
        
    @app.route('/api/search', methods=['GET'])
    def search():
        query = request.args.get('query')
        if query is None:
            return "No query", 404
        try:
            results = dbc.search(query)
            return jsonify(results)
        except Exception as e:
            return "Server Error: "+str(e), 500
        
    @app.route('/api/top_hits', methods=['GET'])
    def top_hits():
        days = request.args.get('days')
        top_n = request.args.get('topn')
        if days is None:
            days = 7
        else:
            days = int(days)
        if top_n is None:
            top_n = 5
        else:
            top_n = int(top_n)
        try:
            results = dbc.top_hits(days, top_n)
            return jsonify(results)
        except Exception as e:
            return "Server Error: "+str(e), 500