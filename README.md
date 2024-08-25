# Radio Plays Tracker (MaHushma.com)

## Overview

This repository contains the complete source code for MaHushma.com, a passion project made for archiving and displaying everything played on selected radio stations. The project actively recognizes songs, logs them into a database, and presents the data through a user-friendly WebUI where users can view and analyze radio play statistics.

## Key Features

- **Active Recognition and Archiving**: Continuously monitoring selected radio stations, recognizing the songs being played, and archiving them in a database.
- **Public Access and Visualization**: Interactive WebUI to explore the archived data, see what has been played on various stations, and detailed statistics.

## Project Structure

### Recognizer

A Python process that actively listens to selected radio stations and recognizes which songs are playing at any given moment (using shazamio), extracts more details about the song (using spotify api) and stores the data in an Elasticsearch database.

**`backend/recognize/`** 
  - **`recognizer.py`**: Logic for recognizing songs played on the radio stations.
  - **`elastic_connector.py`**: Manages interactions with Elasticsearch for indexing.
  - **`config.json`**: Configuration file that defines the stations being monitored, Elasticsearch settings, and other key parameters.

### Server

A Python process handling WebAPI requests using Uvicorn and Swagger to poll existing data from the Elasticsearch database (To be used by the WebUI)

  **`backend/data_poll/`**
  - **`run.py`**: The main script to start the server service
  - **`db_connect/`**
    - **`db_connect.py`**: Contains the logic for connecting to the elastic database.
  - **`server/`**
    - **`models.py`**: Defines the data models
    - **`routes.py`**: Defines the API endpoint routes

### Frontend

A React WebUI showing a variery of ways to view what played on the radio and interact with that data.

- **`frontend/radio-plays-tracker/`**:
  - **Key Features:**:
    - **`Recently Played`**: View the last 10 songs played in each station.
    - **`Search Around`**: Wanna know what song you heard on the radio around 8am last Tuesday? Just search it!
    - **`Top Hits`**: The Top 5 most played songs in the last 7/30 days.
  - Future Features:
    - Search a song to see details about it and breakdown of its number of plays in each station. We already got the data, we just need to give you access to it!
    - "It's great to see the name of the song! Can't you give me the link to the Spotify/Youtube/Apple music?" I can and I will!
    - More details on the songs themselves please, you already got the page to fill it in... ok...


## Installation Instructions

### Backend Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/omer8882/radio-plays-tracker.git
   cd radio-plays-tracker/backend
   ```

2. **Install dependencies**:
   ```bash
   pip install -r data_poll/requirements.txt
   ```

3. **Configure**:
   - Update the `recognize/config.json` file with the necessary settings for your environment, including the radio stations to monitor and Elasticsearch configurations.
    ```json
    {
        "spotify": {
            "access_token": "***secret***",
            "client_id": "***secret***",
            "client_secret": "***secret***"
        },
        "elastic": {
            "url": "http://localhost:9200",
            "user": "elastic",
            "password": "password"
        },
        "stations": [
        {
            "name": "glglz",
            "stream_url": "https://glzwizzlv.bynetcdn.com/glglz_mp3",
            "last_song_recorded": /* Used by Recognizer */
        },
        {
            "name": "radius100",
            "stream_url": "https://cdn.cybercdn.live/Radios_100FM/Audio/icecast.audio",
            "last_song_recorded": /* Used by Recognizer */,
            "live_intro": 5 //(Seconds) if the stream url has a station intro for every time it opens
        }
        // Add more stations as needed
    ]
    }
    ```

4. **Run the Backend Services**:
   - Start the recognition service:
     ```bash
     python recognize/recognizer.py
     ```
   - Start the data polling service (See all avalable API endpoints in `http://localhost:5000/docs#/`):
     ```bash
     python data_poll/run.py
     ```

### Frontend Setup

1. **Navigate to the frontend directory**:
   `cd radio-plays-tracker/frontend/radio-plays-tracker`
2. **Install dependencies**:
   `npm install`
3. **Run the frontend server**:
   `npm start`
4. Access in your web browser at `http://localhost:3000`.

## Contributing

Contributions are welcome! If you'd like to help improve this project, please fork the repository and submit a pull request. Make sure to follow the code style and write clear commit messages.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.