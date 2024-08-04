from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import routes

def create_server():
    app = FastAPI()

    frontend_ip = '192.168.1.36'

    origins = [
        "http://localhost",
        "http://localhost:3000",
        f"http://{frontend_ip}:3000",
        "http://your-domain.com",  # Add your frontend domain here
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
