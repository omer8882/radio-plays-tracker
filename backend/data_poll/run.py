import uvicorn
from server import create_server

app = create_server()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000, log_level="debug")
