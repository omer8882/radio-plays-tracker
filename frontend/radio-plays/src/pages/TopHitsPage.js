import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material';
import TopSongsTable from '../components/TopHitsPage/TopSongsTable';
import TopArtistsTable from '../components/TopHitsPage/TopArtistsTable';
import { API_BASE_URL } from '../config';
import { STATION_FILTER_OPTIONS, STATION_LABEL_LOOKUP } from '../constants/stations';

const SONGS_PAGE_SIZE = 20;
const ARTISTS_PAGE_SIZE = 20;

const TopHitsPage = () => {
  const [days, setDays] = useState('7');
  const [station, setStation] = useState('');

  const [songPage, setSongPage] = useState(0);
  const [songs, setSongs] = useState([]);
  const [songsHasMore, setSongsHasMore] = useState(false);
  const [songsLoading, setSongsLoading] = useState(false);
  const [songsError, setSongsError] = useState(null);

  const [artistPage, setArtistPage] = useState(0);
  const [artists, setArtists] = useState([]);
  const [artistsHasMore, setArtistsHasMore] = useState(false);
  const [artistsLoading, setArtistsLoading] = useState(false);
  const [artistsError, setArtistsError] = useState(null);

  useEffect(() => {
    setSongPage(0);
    setArtistPage(0);
  }, [days, station]);

  useEffect(() => {
    let isCancelled = false;

    const fetchTopSongs = async () => {
      setSongsLoading(true);
      setSongsError(null);
      try {
        const params = {
          days: Number(days),
          page: songPage,
          limit: SONGS_PAGE_SIZE
        };
        if (station) {
          params.station = station;
        }
        const response = await axios.get(`${API_BASE_URL}/api/top_songs`, { params });
        if (isCancelled) {
          return;
        }
        const payload = response.data ?? {};
        setSongs(Array.isArray(payload.items) ? payload.items : []);
        setSongsHasMore(Boolean(payload.hasMore));
      } catch (error) {
        console.error('Error fetching top songs:', error);
        if (!isCancelled) {
          setSongs([]);
          setSongsHasMore(false);
          setSongsError('אירעה תקלה בטעינת השירים. נסו לרענן בעוד רגע.');
        }
      } finally {
        if (!isCancelled) {
          setSongsLoading(false);
        }
      }
    };

    fetchTopSongs();

    return () => {
      isCancelled = true;
    };
  }, [days, station, songPage]);

  useEffect(() => {
    let isCancelled = false;

    const fetchTopArtists = async () => {
      setArtistsLoading(true);
      setArtistsError(null);
      try {
        const params = {
          days: Number(days),
          page: artistPage,
          limit: ARTISTS_PAGE_SIZE
        };
        if (station) {
          params.station = station;
        }
        const response = await axios.get(`${API_BASE_URL}/api/top_artists`, { params });
        if (isCancelled) {
          return;
        }
        const payload = response.data ?? {};
        setArtists(Array.isArray(payload.items) ? payload.items : []);
        setArtistsHasMore(Boolean(payload.hasMore));
      } catch (error) {
        console.error('Error fetching top artists:', error);
        if (!isCancelled) {
          setArtists([]);
          setArtistsHasMore(false);
          setArtistsError('אירעה תקלה בטעינת האמנים. נסו לרענן בעוד רגע.');
        }
      } finally {
        if (!isCancelled) {
          setArtistsLoading(false);
        }
      }
    };

    fetchTopArtists();

    return () => {
      isCancelled = true;
    };
  }, [days, station, artistPage]);

  const handleDaysChange = (_, value) => {
    if (value !== null) {
      setDays(value);
    }
  };

  const handleStationChange = (event) => {
    setStation(event.target.value);
  };

  return (
    <Box sx={{ width: '92%', mx: 'auto' }}>
      <Box dir="rtl" sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          הלהיטים
        </Typography>
        <Typography variant="body1" color="text.secondary">
          השירים הכי מושמעים ברדיו. בשבוע האחרון או בחודש האחרון. האמנים הכי מושמעים ברדיו.
        </Typography>
      </Box>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ mb: 4, alignItems: { xs: 'flex-start', sm: 'center' } }}
        dir="rtl"
      >
        <Box>
          <ToggleButtonGroup
            value={days}
            exclusive
            onChange={handleDaysChange}
            aria-label="days range"
            sx={{
              display: 'inline-flex',
              flexDirection: 'row-reverse',
              '& .MuiToggleButtonGroup-grouped': {
                borderRadius: 0,
                border: '1px solid',
                borderColor: 'divider',
                '&:not(:first-of-type)': {
                  borderLeft: 0,
                }
              },
              '& .MuiToggleButtonGroup-grouped:first-of-type': {
                borderRadius: '10px 0 0 10px',
              },
              '& .MuiToggleButtonGroup-grouped:last-of-type': {
                borderRadius: '0 10px 10px 0',
              }
            }}
          >
            <ToggleButton value="7" aria-label="7 days">
              7 ימים
            </ToggleButton>
            <ToggleButton value="30" aria-label="30 days">
              30 ימים
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <FormControl
          size="small"
          sx={{
            minWidth: 160,
            mt: { xs: 2, sm: 3 },
            mr: { xs: 0, sm: 2 },
            ml: { xs: 0, sm: 0 }
          }}
        >
          <InputLabel id="station-filter-label">תחנה</InputLabel>
          <Select
            labelId="station-filter-label"
            id="station-filter"
            value={station}
            label="תחנה"
            onChange={handleStationChange}
            sx={{
            marginRight: { xs: 2, sm: 2 },
          }}
          >
            {STATION_FILTER_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <TopSongsTable
        songs={songs}
        page={songPage}
        pageSize={SONGS_PAGE_SIZE}
        hasMore={songsHasMore}
        onNext={() => setSongPage((prev) => prev + 1)}
        onPrev={() => setSongPage((prev) => Math.max(prev - 1, 0))}
        isLoading={songsLoading}
        errorMessage={songsError}
      />

      <Divider sx={{ my: 4 }} />

      <TopArtistsTable
        artists={artists}
        page={artistPage}
        pageSize={ARTISTS_PAGE_SIZE}
        hasMore={artistsHasMore}
        onNext={() => setArtistPage((prev) => prev + 1)}
        onPrev={() => setArtistPage((prev) => Math.max(prev - 1, 0))}
        isLoading={artistsLoading}
        errorMessage={artistsError}
        stationLabels={STATION_LABEL_LOOKUP}
      />
    </Box>
  );
};

export default TopHitsPage;
