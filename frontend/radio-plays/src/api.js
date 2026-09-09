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
  artistPlays: (artist, limit) => ['artistPlays', artist, limit],
  artistDetails: (name) => ['artistDetails', name],
  artistTopHits: (artist, days, limit) => ['artistTopHits', artist, days, limit],
  songDetails: (songId) => ['songDetails', songId],
  songStations: (songId) => ['songStations', songId],
  search: (query) => ['search', query]
};

export const fetchStationPlays = (station, page, limit, signal) =>
  get('/api/station_last_plays', { station, page, limit }, signal);

export const fetchTopHits = (days, limit, signal) =>
  get('/api/top_hits', { days: Number(days), top_n: limit }, signal);

export const fetchTopSongs = (days, station, page, limit, signal) =>
  get('/api/top_songs', { days: Number(days), station: station || undefined, page, limit }, signal);

export const fetchTopArtists = (days, station, page, limit, signal) =>
  get('/api/top_artists', { days: Number(days), station: station || undefined, page, limit }, signal);

export const fetchArtistPlays = (artist, limit, signal) =>
  get('/api/get_artist_plays', { artist, limit }, signal);

export const fetchArtistDetails = (name, signal) =>
  get('/api/artist_details', { name }, signal);

export const fetchArtistTopHits = (artist, days, limit, signal) =>
  get('/api/artist_top_hits', { artist, days, limit }, signal);

export const fetchSongDetails = (songId, signal) =>
  get('/api/get_song_details', { song_id: songId }, signal);

export const fetchSongStations = (songId, signal) =>
  get('/api/song_plays_by_station', { song_id: songId }, signal);

export const searchSongs = (query, signal) =>
  get('/api/search', { query }, signal);

export default client;
