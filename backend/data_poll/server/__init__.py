from flask import Flask
from flask_cors import CORS
from .routes import initialize_routes

app = Flask(__name__)
CORS(app) 

def create_server():
    initialize_routes(app)
    return app