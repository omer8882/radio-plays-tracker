import uvicorn
from server import create_server

app = create_server()

if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=5000, log_level="debug")
