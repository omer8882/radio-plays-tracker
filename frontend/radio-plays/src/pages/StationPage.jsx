import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Alert, IconButton, List } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import SongListItem from '../components/SongListItem';
import SongListSkeleton from '../components/SongListSkeleton';
import Pagination from '../components/Pagination';
import SegmentedControl from '../components/SegmentedControl';
import PageMeta from '../components/PageMeta';
import { DAY_OPTIONS } from '../constants/dayRanges';
import { STATION_INFO } from '../constants/stations';
import { useSongModal } from '../hooks/useSongModal';
import { AVATAR, RADIUS } from '../theme';
import {
  fetchStationPlays, fetchStations, fetchTopSongs, fetchTopArtists, queryKeys
} from '../api';

const PAGE_SIZE = 15;
const TOP_LIMIT = 10;

const PANELS = [
  { value: 'songs', label: 'שירים מובילים' },
  { value: 'artists', label: 'אמנים מובילים' }
];

const RankRow = ({ index, title, subtitle, plays, imageUrl, onClick }) => (
  <Box
    onClick={onClick}
    sx={{
      display: 'flex', alignItems: 'center', gap: 1.5,
      px: 1.5, py: 1, minHeight: 56,
      backgroundColor: 'app.overlay',
      cursor: onClick ? 'pointer' : 'default',
      '&:hover': onClick ? { backgroundColor: 'app.overlayStrong' } : {}
    }}
  >
    <Typography variant="subtitle1" className="num" color="text.secondary" sx={{ minWidth: 22 }}>
      {index}
    </Typography>
    <Box
      component="img"
      src={imageUrl || undefined}
      alt=""
      sx={{
        width: AVATAR.sm, height: AVATAR.sm, borderRadius: `${RADIUS.sm}px`,
        objectFit: 'cover', flexShrink: 0, bgcolor: 'app.overlay'
      }}
    />
    <Box sx={{ minWidth: 0, flex: 1 }}>
      <Typography variant="subtitle2" noWrap>{title}</Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary" component="div" noWrap>{subtitle}</Typography>
      )}
    </Box>
    <Typography variant="subtitle2" className="num" sx={{ whiteSpace: 'nowrap' }}>{plays}</Typography>
  </Box>
);

const StationPage = () => {
  const { stationName } = useParams();
  const navigate = useNavigate();
  const { openSong } = useSongModal();
  const [page, setPage] = useState(0);
  const [days, setDays] = useState('7');
  const [panel, setPanel] = useState('songs');

  useEffect(() => { setPage(0); }, [stationName]);

  const info = STATION_INFO[stationName];

  const stationsQuery = useQuery({
    queryKey: queryKeys.stations(),
    queryFn: ({ signal }) => fetchStations(signal)
  });

  const playsQuery = useQuery({
    queryKey: queryKeys.stationPlays(stationName, page, PAGE_SIZE),
    queryFn: ({ signal }) => fetchStationPlays(stationName, page, PAGE_SIZE, signal),
    enabled: Boolean(stationName),
    placeholderData: keepPreviousData,
    refetchInterval: page === 0 ? 2 * 60 * 1000 : false
  });

  // Only the visible panel fetches; switching tabs is instant afterwards
  // because react-query keeps what it already has.
  const songsQuery = useQuery({
    queryKey: queryKeys.topSongs(days, stationName, 0, TOP_LIMIT),
    queryFn: ({ signal }) => fetchTopSongs(days, stationName, 0, TOP_LIMIT, signal),
    enabled: Boolean(stationName) && panel === 'songs',
    placeholderData: keepPreviousData
  });

  const artistsQuery = useQuery({
    queryKey: queryKeys.topArtists(days, stationName, 0, TOP_LIMIT),
    queryFn: ({ signal }) => fetchTopArtists(days, stationName, 0, TOP_LIMIT, signal),
    enabled: Boolean(stationName) && panel === 'artists',
    placeholderData: keepPreviousData
  });

  const summary = (stationsQuery.data || []).find((s) => s.name === stationName);
  const displayName = info?.displayName || summary?.displayName || stationName;
  const heading = `מה הושמע ${info?.inLabel || displayName}`;
  const plays = playsQuery.data?.items ?? [];

  if (!info && stationsQuery.isFetched && !summary) {
    return (
      <Box dir="rtl" sx={{ mt: 4 }}>
        <Alert severity="error">התחנה לא נמצאה.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <PageMeta
        title={heading}
        description={`${heading} — השמעות אחרונות, השירים והאמנים המושמעים ביותר.`}
        path={`/station/${stationName}`}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'RadioStation',
          name: displayName,
          ...(summary?.totalPlays
            ? {
                interactionStatistic: {
                  '@type': 'InteractionCounter',
                  interactionType: 'https://schema.org/ListenAction',
                  userInteractionCount: summary.totalPlays
                }
              }
            : {})
        }}
      />

      {/*
        One compact band instead of a back-button row, a tall banner card and a
        summary card stacked on top of each other. Back, identity and title are
        a single element so the plays feed starts near the top of the screen.
      */}
      <Box
        dir="rtl"
        sx={{
          display: 'flex', alignItems: 'center', gap: 1.5,
          backgroundColor: info?.bgColor || 'app.card',
          border: '1px solid', borderColor: 'app.hairline',
          borderRadius: `${RADIUS.md}px ${RADIUS.md}px 0 0`,
          px: 1.5, py: 1
        }}
      >
        <IconButton aria-label="חזרה" size="small" onClick={() => navigate(-1)}>
          <ChevronRightIcon />
        </IconButton>
        {info?.logo && (
          <Box component="img" src={info.logo} alt="" sx={{ height: 32, objectFit: 'contain' }} />
        )}
        <Typography variant="h6" component="h1" noWrap sx={{ minWidth: 0 }}>
          {heading}
        </Typography>
      </Box>

      {/* The plays are the point of the page, so they come first and sit
          directly under the header with no card of their own. */}
      <Paper
        sx={{
          overflow: 'hidden',
          borderRadius: `0 0 ${RADIUS.md}px ${RADIUS.md}px`,
          borderTop: 0,
          mb: 3
        }}
      >
        <List
          sx={{
            py: 0,
            opacity: playsQuery.isFetching && !playsQuery.isPending ? 0.6 : 1,
            transition: 'opacity 150ms ease'
          }}
        >
          {playsQuery.isPending ? (
            <SongListSkeleton rows={PAGE_SIZE} />
          ) : plays.length === 0 ? (
            <Typography dir="rtl" align="center" color="text.secondary" sx={{ py: 3 }}>
              אין השמעות להצגה
            </Typography>
          ) : (
            plays.map((song, index) => (
              <SongListItem key={song.id || index} song={song} onClick={() => openSong(song.id)} />
            ))
          )}
        </List>
        <Box sx={{ p: 1 }}>
          <Pagination
            page={page}
            hasMore={Boolean(playsQuery.data?.hasMore)}
            onPrev={() => setPage((c) => Math.max(c - 1, 0))}
            onNext={() => setPage((c) => c + 1)}
            disabled={playsQuery.isPending}
            prevLabel="חדשים יותר"
            nextLabel="ישנים יותר"
          />
        </Box>
      </Paper>

      {/* Secondary detail, tabbed rather than stacked side by side — there is
          not enough width on a phone for two columns. */}
      <Box dir="rtl" sx={{ display: 'flex' }}>
        <SegmentedControl
          options={PANELS}
          value={panel}
          onChange={setPanel}
          ariaLabel="station panels"
          attached
          attachedColor="background.paper"
          fullWidth
        />
      </Box>

      <Paper sx={{ overflow: 'hidden', borderRadius: `0 0 ${RADIUS.md}px ${RADIUS.md}px`, borderTop: 0 }}>
        <Box dir="rtl" sx={{ px: 1.5, pt: 1.5 }}>
            <SegmentedControl
              options={DAY_OPTIONS}
              value={days}
              onChange={setDays}
              ariaLabel="days range"
            />
        </Box>

        {panel === 'songs' && (
          <List sx={{ py: 0, mt: 1.5 }}>
            {songsQuery.isPending && <SongListSkeleton rows={5} />}
            {!songsQuery.isPending && (songsQuery.data?.items || []).length === 0 && (
              <Typography dir="rtl" align="center" color="text.secondary" sx={{ py: 3 }}>
                אין נתונים לתקופה שנבחרה
              </Typography>
            )}
            {!songsQuery.isPending && (songsQuery.data?.items || []).map((song, i) => (
              <RankRow
                key={song.id}
                index={i + 1}
                title={song.title}
                subtitle={song.artist}
                plays={song.plays}
                imageUrl={song.imageUrl}
                onClick={() => openSong(song.id)}
              />
            ))}
          </List>
        )}

        {panel === 'artists' && (
          <List sx={{ py: 0, mt: 1.5 }}>
            {artistsQuery.isPending && <SongListSkeleton rows={5} />}
            {!artistsQuery.isPending && (artistsQuery.data?.items || []).length === 0 && (
              <Typography dir="rtl" align="center" color="text.secondary" sx={{ py: 3 }}>
                אין נתונים לתקופה שנבחרה
              </Typography>
            )}
            {!artistsQuery.isPending && (artistsQuery.data?.items || []).map((artist, i) => (
              <RankRow
                key={artist.id}
                index={i + 1}
                title={artist.name}
                subtitle={`${artist.uniqueSongs} שירים שונים`}
                plays={artist.plays}
                imageUrl={artist.imageUrl}
                onClick={() => navigate(`/artist/${encodeURIComponent(artist.id)}`)}
              />
            ))}
          </List>
        )}

      </Paper>
    </Box>
  );
};

export default StationPage;
