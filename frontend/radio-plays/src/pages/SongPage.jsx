import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Alert, Divider, Button, List, Skeleton } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import SongIdentity from '../components/SongIdentity';
import StationBreakdown from '../components/StationBreakdown';
import SongListItem from '../components/SongListItem';
import Pagination from '../components/Pagination';
import SongListSkeleton from '../components/SongListSkeleton';
import { STATION_LABEL_LOOKUP } from '../constants/stations';
import PageMeta from '../components/PageMeta';
import {
  fetchSongDetails, fetchSongStations, fetchSongPlays, queryKeys
} from '../api';

const PAGE_SIZE = 20;

const formatPlayedAt = (value) => {
  if (!value) return { dateLabel: '', timeLabel: '' };
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return { dateLabel: '', timeLabel: '' };
  return {
    dateLabel: parsed.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' }),
    timeLabel: parsed.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false })
  };
};

const Stat = ({ label, value }) => (
  <Box sx={{ minWidth: 96 }}>
    <Typography variant="caption" color="text.secondary" component="div">{label}</Typography>
    <Typography variant="h6" className="num">{value}</Typography>
  </Box>
);

const SongPage = () => {
  const { songId } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState(0);

  useEffect(() => { setPage(0); }, [songId]);

  const detailsQuery = useQuery({
    queryKey: queryKeys.songDetails(songId),
    queryFn: ({ signal }) => fetchSongDetails(songId, signal),
    enabled: Boolean(songId)
  });

  const stationsQuery = useQuery({
    queryKey: queryKeys.songStations(songId),
    queryFn: ({ signal }) => fetchSongStations(songId, signal),
    enabled: Boolean(songId)
  });

  const historyQuery = useQuery({
    queryKey: queryKeys.songPlays(songId, page, PAGE_SIZE),
    queryFn: ({ signal }) => fetchSongPlays(songId, page, PAGE_SIZE, signal),
    enabled: Boolean(songId),
    placeholderData: keepPreviousData
  });

  const song = detailsQuery.data;
  const history = historyQuery.data;
  const plays = history?.items ?? [];

  if (detailsQuery.isError) {
    return (
      <Box dir="rtl" sx={{ mt: 4 }}>
        <Alert severity="error">לא הצלחנו לטעון את פרטי השיר.</Alert>
      </Box>
    );
  }

  const artistNames = (song?.artists || []).map((a) => a.name).join(', ');
  const metaDescription = song
    ? `כל ההשמעות של ${song.name}${artistNames ? ` - ${artistNames}` : ''} ברדיו הישראלי.`
    : undefined;

  const jsonLd = song
    ? {
        '@context': 'https://schema.org',
        '@type': 'MusicRecording',
        name: song.name,
        ...(song.imageUrl ? { image: song.imageUrl } : {}),
        ...(song.album?.name ? { inAlbum: { '@type': 'MusicAlbum', name: song.album.name } } : {}),
        ...(song.artists?.length
          ? { byArtist: song.artists.map((a) => ({ '@type': 'MusicGroup', name: a.name })) }
          : {}),
        ...(history?.totalPlays
          ? {
              interactionStatistic: {
                '@type': 'InteractionCounter',
                interactionType: 'https://schema.org/ListenAction',
                userInteractionCount: history.totalPlays
              }
            }
          : {})
      }
    : null;

  return (
    <Box>
      <PageMeta
        title={song ? `${song.name}${artistNames ? ` - ${artistNames}` : ''}` : undefined}
        description={metaDescription}
        path={`/song/${songId}`}
        image={song?.imageUrl}
        jsonLd={jsonLd}
      />

      <Box dir="rtl" sx={{ mb: 1 }}>
        <Button
          onClick={() => navigate(-1)}
          startIcon={<ChevronRightIcon />}
          size="small"
          sx={{ color: 'text.secondary' }}
        >
          חזרה
        </Button>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        {detailsQuery.isPending ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Skeleton variant="rounded" width={200} height={200} />
            <Skeleton variant="text" width={220} height={34} />
            <Skeleton variant="text" width={160} />
          </Box>
        ) : (
          <SongIdentity song={song} size="lg" />
        )}
      </Paper>

      <Paper dir="rtl" sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" component="h2" sx={{ mb: 2 }}>סיכום</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          <Stat label="סה״כ השמעות" value={history ? history.totalPlays : '—'} />
        </Box>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" component="h3" sx={{ mb: 1 }}>השמעות לפי תחנה</Typography>
        {stationsQuery.isPending
          ? <Skeleton variant="rounded" height={64} />
          : <StationBreakdown stationBreakdown={stationsQuery.data} />}
      </Paper>

      <Paper sx={{ overflow: 'hidden' }}>
        <Typography dir="rtl" variant="h5" component="h2" sx={{ p: 2, pb: 1 }}>
          כל ההשמעות
        </Typography>

        <List
          sx={{
            py: 0,
            opacity: historyQuery.isFetching && !historyQuery.isPending ? 0.6 : 1,
            transition: 'opacity 150ms ease'
          }}
        >
          {historyQuery.isPending ? (
            <SongListSkeleton rows={8} />
          ) : plays.length === 0 ? (
            <Typography dir="rtl" align="center" sx={{ py: 3 }} color="text.secondary">
              אין השמעות להצגה
            </Typography>
          ) : (
            plays.map((play, index) => {
              const { dateLabel, timeLabel } = formatPlayedAt(play.playedAt);
              const stationLabel = STATION_LABEL_LOOKUP[play.station] ?? play.station;
              return (
                <SongListItem
                  key={`${play.playedAt}-${index}`}
                  song={{
                    // On a song page every row is the same song, so the useful
                    // second line is the station, not the artist again.
                    title: play.title,
                    artist: stationLabel,
                    time: timeLabel,
                    dateLabel,
                    playedAt: play.playedAt,
                    imageUrl: play.imageUrl
                  }}
                  onClick={() => {}}
                />
              );
            })
          )}
        </List>

        <Box sx={{ p: 1 }}>
          <Pagination
            page={page}
            hasMore={Boolean(history?.hasMore)}
            onPrev={() => setPage((current) => Math.max(current - 1, 0))}
            onNext={() => setPage((current) => current + 1)}
            disabled={historyQuery.isPending}
            prevLabel="חדשים יותר"
            nextLabel="ישנים יותר"
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default SongPage;
