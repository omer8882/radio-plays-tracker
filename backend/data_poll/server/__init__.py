from fastapi import FastAPI
from . import routes

def create_server():
    app = FastAPI()
    routes.initialize_routes(app)
    return app
