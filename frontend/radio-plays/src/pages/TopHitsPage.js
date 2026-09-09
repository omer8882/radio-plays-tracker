import React, { useEffect, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  Box,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography
} from '@mui/material';
import TopSongsTable from '../components/TopHitsPage/TopSongsTable';
import TopArtistsTable from '../components/TopHitsPage/TopArtistsTable';
import { fetchTopSongs, fetchTopArtists, queryKeys } from '../api';
import { useSongModal } from '../hooks/useSongModal';
import SegmentedControl from '../components/SegmentedControl';
import { DAY_OPTIONS } from '../constants/dayRanges';
import { STATION_FILTER_OPTIONS, STATION_LABEL_LOOKUP } from '../constants/stations';

const SONGS_PAGE_SIZE = 20;
const ARTISTS_PAGE_SIZE = 20;

const TopHitsPage = () => {
  const [days, setDays] = useState('7');
  const [station, setStation] = useState('');

  const [songPage, setSongPage] = useState(0);
  const [artistPage, setArtistPage] = useState(0);
  const { openSong } = useSongModal();

  useEffect(() => {
    setSongPage(0);
    setArtistPage(0);
  }, [days, station]);

  const songsQuery = useQuery({
    queryKey: queryKeys.topSongs(days, station, songPage, SONGS_PAGE_SIZE),
    queryFn: ({ signal }) => fetchTopSongs(days, station, songPage, SONGS_PAGE_SIZE, signal),
    placeholderData: keepPreviousData
  });

  const artistsQuery = useQuery({
    queryKey: queryKeys.topArtists(days, station, artistPage, ARTISTS_PAGE_SIZE),
    queryFn: ({ signal }) => fetchTopArtists(days, station, artistPage, ARTISTS_PAGE_SIZE, signal),
    placeholderData: keepPreviousData
  });

  const songs = songsQuery.data?.items ?? [];
  const songsHasMore = Boolean(songsQuery.data?.hasMore);
  const artists = artistsQuery.data?.items ?? [];
  const artistsHasMore = Boolean(artistsQuery.data?.hasMore);

  const handleStationChange = (event) => {
    setStation(event.target.value);
  };

  return (
    <Box>
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
        sx={{ mb: 4, alignItems: { xs: 'stretch', sm: 'center' } }}
        dir="rtl"
      >
        <SegmentedControl
          options={DAY_OPTIONS}
          value={days}
          onChange={setDays}
          ariaLabel="days range"
          sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}
        />

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="station-filter-label">תחנה</InputLabel>
          <Select
            labelId="station-filter-label"
            id="station-filter"
            value={station}
            label="תחנה"
            onChange={handleStationChange}
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
        isLoading={songsQuery.isFetching}
        errorMessage={songsQuery.isError ? 'אירעה תקלה בטעינת השירים. נסו לרענן בעוד רגע.' : null}
        onSongClick={openSong}
      />

      <Divider sx={{ my: 4 }} />

      <TopArtistsTable
        artists={artists}
        page={artistPage}
        pageSize={ARTISTS_PAGE_SIZE}
        hasMore={artistsHasMore}
        onNext={() => setArtistPage((prev) => prev + 1)}
        onPrev={() => setArtistPage((prev) => Math.max(prev - 1, 0))}
        isLoading={artistsQuery.isFetching}
        errorMessage={artistsQuery.isError ? 'אירעה תקלה בטעינת האמנים. נסו לרענן בעוד רגע.' : null}
        stationLabels={STATION_LABEL_LOOKUP}
      />
    </Box>
  );
};

export default TopHitsPage;
