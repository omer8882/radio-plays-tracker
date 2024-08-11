from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import routes

def create_server():
    app = FastAPI()

    origins = [
        "http://localhost",
        "http://localhost:3000",
        "https://mahushma.com",  # Add your frontend domain here
    ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    routes.initialize_routes(app)
    return app
