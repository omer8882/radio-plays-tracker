-- Radio Plays Tracker Database Schema
-- PostgreSQL Initialization Script

-- Set timezone to Israel
SET timezone = 'Asia/Jerusalem';

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- For fuzzy text search

-- =====================================================
-- TABLES
-- =====================================================

-- Artists Table
CREATE TABLE IF NOT EXISTS artists (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    image_url VARCHAR(1000),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Albums Table
CREATE TABLE IF NOT EXISTS albums (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    release_date DATE,
    image_url VARCHAR(1000),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Songs Table
CREATE TABLE IF NOT EXISTS songs (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    album_id VARCHAR(255),
    duration_ms INTEGER,
    popularity INTEGER,
    external_links JSONB,  -- {spotify, youtube, apple_music, etc.}
    image_url VARCHAR(1000),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_songs_album FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE SET NULL
);

-- Song Artists Junction Table (Many-to-Many)
CREATE TABLE IF NOT EXISTS song_artists (
    song_id VARCHAR(255) NOT NULL,
    artist_id VARCHAR(255) NOT NULL,
    artist_order INTEGER DEFAULT 0,  -- Track order of artists in credits
    PRIMARY KEY (song_id, artist_id),
    CONSTRAINT fk_song_artists_song FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE,
    CONSTRAINT fk_song_artists_artist FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE
);

-- Album Artists Junction Table (Many-to-Many)
CREATE TABLE IF NOT EXISTS album_artists (
    album_id VARCHAR(255) NOT NULL,
    artist_id VARCHAR(255) NOT NULL,
    artist_order INTEGER DEFAULT 0,
    PRIMARY KEY (album_id, artist_id),
    CONSTRAINT fk_album_artists_album FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE,
    CONSTRAINT fk_album_artists_artist FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE
);

-- Stations Table
CREATE TABLE IF NOT EXISTS stations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Plays Table (Unified across all stations)
CREATE TABLE IF NOT EXISTS plays (
    id BIGSERIAL PRIMARY KEY,
    song_id VARCHAR(255) NOT NULL,
    station_id INTEGER NOT NULL,
    played_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_plays_song FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE,
    CONSTRAINT fk_plays_station FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE,
    CONSTRAINT unique_play UNIQUE (song_id, station_id, played_at)
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Artists indexes
CREATE INDEX IF NOT EXISTS idx_artists_name ON artists(name);
CREATE INDEX IF NOT EXISTS idx_artists_name_trgm ON artists USING gin(name gin_trgm_ops);  -- Fuzzy search

-- Albums indexes
CREATE INDEX IF NOT EXISTS idx_albums_name ON albums(name);
CREATE INDEX IF NOT EXISTS idx_albums_release_date ON albums(release_date);

-- Songs indexes
CREATE INDEX IF NOT EXISTS idx_songs_name ON songs(name);
CREATE INDEX IF NOT EXISTS idx_songs_name_trgm ON songs USING gin(name gin_trgm_ops);  -- Fuzzy search
CREATE INDEX IF NOT EXISTS idx_songs_album_id ON songs(album_id);
CREATE INDEX IF NOT EXISTS idx_songs_popularity ON songs(popularity DESC);

-- Song Artists indexes
CREATE INDEX IF NOT EXISTS idx_song_artists_artist_id ON song_artists(artist_id);
CREATE INDEX IF NOT EXISTS idx_song_artists_song_id ON song_artists(song_id);

-- Album Artists indexes
CREATE INDEX IF NOT EXISTS idx_album_artists_artist_id ON album_artists(artist_id);
CREATE INDEX IF NOT EXISTS idx_album_artists_album_id ON album_artists(album_id);

-- Plays indexes (Critical for performance)
CREATE INDEX IF NOT EXISTS idx_plays_song_id ON plays(song_id);
CREATE INDEX IF NOT EXISTS idx_plays_station_id ON plays(station_id);
CREATE INDEX IF NOT EXISTS idx_plays_played_at ON plays(played_at DESC);
CREATE INDEX IF NOT EXISTS idx_plays_station_played_at ON plays(station_id, played_at DESC);
CREATE INDEX IF NOT EXISTS idx_plays_song_played_at ON plays(song_id, played_at DESC);

-- =====================================================
-- INITIAL DATA - Insert known radio stations
-- =====================================================

INSERT INTO stations (name, display_name) VALUES
    ('glglz', 'Galgalatz'),
    ('100fm', '100FM'),
    ('103fm', '103FM'),
    ('eco99', 'Eco 99FM'),
    ('galatz', 'Galatz (Galei tzahal)'),
    ('kan88', 'Kan 88')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_artists_updated_at ON artists;
CREATE TRIGGER update_artists_updated_at
    BEFORE UPDATE ON artists
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_albums_updated_at ON albums;
CREATE TRIGGER update_albums_updated_at
    BEFORE UPDATE ON albums
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_songs_updated_at ON songs;
CREATE TRIGGER update_songs_updated_at
    BEFORE UPDATE ON songs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VIEWS (Optional - for common queries)
-- =====================================================

-- View: Songs with full artist and album details
CREATE OR REPLACE VIEW v_songs_full AS
SELECT 
    s.id,
    s.name AS song_name,
    s.duration_ms,
    s.popularity,
    s.external_links,
    a.id AS album_id,
    a.name AS album_name,
    a.release_date AS album_release_date,
    COALESCE(
        json_agg(
            json_build_object('id', ar.id, 'name', ar.name) 
            ORDER BY sa.artist_order
        ) FILTER (WHERE ar.id IS NOT NULL), 
        '[]'::json
    ) AS artists
FROM songs s
LEFT JOIN albums a ON s.album_id = a.id
LEFT JOIN song_artists sa ON s.id = sa.song_id
LEFT JOIN artists ar ON sa.artist_id = ar.id
GROUP BY s.id, s.name, s.duration_ms, s.popularity, s.external_links, 
         a.id, a.name, a.release_date;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE artists IS 'Stores unique artist information';
COMMENT ON TABLE albums IS 'Stores album information';
COMMENT ON TABLE songs IS 'Stores song/track information';
COMMENT ON TABLE song_artists IS 'Many-to-many relationship between songs and artists';
COMMENT ON TABLE album_artists IS 'Many-to-many relationship between albums and artists';
COMMENT ON TABLE stations IS 'Radio stations being monitored';
COMMENT ON TABLE plays IS 'Record of when songs were played on stations';

COMMENT ON COLUMN songs.external_links IS 'JSON object containing links to Spotify, YouTube, Apple Music, etc.';
COMMENT ON COLUMN plays.played_at IS 'Timestamp when the song was played on radio';
COMMENT ON COLUMN song_artists.artist_order IS 'Order of artist credits (0 = primary artist)';
