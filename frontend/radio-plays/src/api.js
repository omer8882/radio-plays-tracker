import axios from 'axios';
import { API_BASE_URL } from './config';

const client = axios.create({ baseURL: API_BASE_URL });

const get = async (path, params, signal) => {
  const response = await client.get(path, { params, signal });
  return response.data;
};

// Query keys are the cache identity. Keeping them in one place stops two
// components from caching the same request under different keys.
export const queryKeys = {
  stationPlays: (station, page, limit) => ['stationPlays', station, page, limit],
  topHits: (days, limit) => ['topHits', days, limit],
  topSongs: (days, station, page, limit) => ['topSongs', days, station, page, limit],
  topArtists: (days, station, page, limit) => ['topArtists', days, station, page, limit],
  artistPlays: (artistId, limit) => ['artistPlays', artistId, limit],
  artistDetails: (artistId) => ['artistDetails', artistId],
  artistTopHits: (artistId, days, limit) => ['artistTopHits', artistId, days, limit],
  songDetails: (songId) => ['songDetails', songId],
  songStations: (songId) => ['songStations', songId],
  songPlays: (songId, page, limit) => ['songPlays', songId, page, limit],
  search: (query) => ['search', query],
  stations: () => ['stations']
};

export const fetchStationPlays = (station, page, limit, signal) =>
  get('/api/station_last_plays', { station, page, limit }, signal);

export const fetchTopHits = (days, limit, signal) =>
  get('/api/top_hits', { days: Number(days), top_n: limit }, signal);

export const fetchTopSongs = (days, station, page, limit, signal) =>
  get('/api/top_songs', { days: Number(days), station: station || undefined, page, limit }, signal);

export const fetchTopArtists = (days, station, page, limit, signal) =>
  get('/api/top_artists', { days: Number(days), station: station || undefined, page, limit }, signal);

// Artist calls are keyed on id, never name: the catalogue holds hundreds of
// duplicate artist names, and a performer can exist under both a Hebrew and a
// transliterated entry, so a name resolves to a fragment of their real plays.
export const fetchArtistPlays = (artistId, limit, signal) =>
  get('/api/get_artist_plays', { artist_id: artistId, limit }, signal);

export const fetchArtistDetails = (artistId, signal) =>
  get('/api/artist_details', { id: artistId }, signal);

export const fetchArtistTopHits = (artistId, days, limit, signal) =>
  get('/api/artist_top_hits', { artist_id: artistId, days, limit }, signal);

export const fetchSongDetails = (songId, signal) =>
  get('/api/get_song_details', { song_id: songId }, signal);

export const fetchSongStations = (songId, signal) =>
  get('/api/song_plays_by_station', { song_id: songId }, signal);

export const fetchSongPlays = (songId, page, limit, signal) =>
  get('/api/song_plays', { song_id: songId, page, limit }, signal);

export const fetchStations = (signal) =>
  get('/api/stations', undefined, signal);

export const searchSongs = (query, signal) =>
  get('/api/search', { query }, signal);

export default client;
