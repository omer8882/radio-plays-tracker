import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Box, Typography, Alert, Divider, Avatar, Button } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ArtistRecentPlays from '../components/ArtistPage/ArtistRecentPlays';
import ArtistTopSongsTable from '../components/ArtistPage/ArtistTopSongsTable';
import { fetchArtistPlays, fetchArtistDetails, queryKeys } from '../api';
import { useSongModal } from '../hooks/useSongModal';
import { AVATAR } from '../theme';
import PageMeta from '../components/PageMeta';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

// The API now returns a real timestamp (playedAt), so the day label and the clock
// time are derived rather than parsed back out of a pre-formatted string.
const formatPlayedAt = (playedAt) => {
  if (!playedAt) {
    return { dateLabel: '', timeLabel: '' };
  }

  const parsed = new Date(playedAt);
  if (Number.isNaN(parsed.getTime())) {
    return { dateLabel: '', timeLabel: '' };
  }

  const diffDays = Math.round((startOfDay(new Date()) - startOfDay(parsed)) / MS_PER_DAY);

  let dateLabel;
  if (diffDays === 0) {
    dateLabel = 'היום';
  } else if (diffDays === 1) {
    dateLabel = 'אתמול';
  } else {
    dateLabel = parsed.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  return {
    dateLabel,
    timeLabel: parsed.toLocaleTimeString('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  };
};

const normalizeRecentPlay = (play) => {
  const { dateLabel, timeLabel } = formatPlayedAt(play.playedAt ?? play.PlayedAt);

  return {
    id: play.id ?? play.Id ?? '',
    title: play.title ?? play.Title ?? '',
    artist: play.artist ?? play.Artist ?? '',
    time: timeLabel,
    dateLabel,
    playedAt: play.playedAt ?? play.PlayedAt ?? null,
    station: play.station ?? play.Station ?? '',
    imageUrl: play.imageUrl ?? play.ImageUrl ?? ''
  };
};

const ArtistPage = () => {
  const { artistId } = useParams();
  const navigate = useNavigate();

  const { openSong } = useSongModal();

  const playsQuery = useQuery({
    queryKey: queryKeys.artistPlays(artistId, 10),
    queryFn: ({ signal }) => fetchArtistPlays(artistId, 10, signal),
    enabled: Boolean(artistId)
  });

  const detailsQuery = useQuery({
    queryKey: queryKeys.artistDetails(artistId),
    queryFn: ({ signal }) => fetchArtistDetails(artistId, signal),
    enabled: Boolean(artistId),
    // A missing artist record is a normal outcome, not something to retry.
    retry: false
  });

  const recentPlays = Array.isArray(playsQuery.data)
    ? playsQuery.data.map(normalizeRecentPlay)
    : [];

  const artistDetails = detailsQuery.data
    ? {
        id: detailsQuery.data.id ?? detailsQuery.data.Id ?? '',
        name: detailsQuery.data.name ?? detailsQuery.data.Name ?? '',
        imageUrl: detailsQuery.data.imageUrl ?? detailsQuery.data.ImageUrl ?? ''
      }
    : null;

  const isLoading = playsQuery.isPending;
  const error = playsQuery.isError ? 'אירעה תקלה בטעינת נתוני האמן.' : null;

  if (!artistId) {
    return (
      <Box sx={{ mt: 4 }} dir="rtl">
        <Alert severity="error">לא צוין אמן בכתובת</Alert>
      </Box>
    );
  }

  const heroImageUrl = artistDetails?.imageUrl || recentPlays.find((play) => play.imageUrl)?.imageUrl;
  const displayName = artistDetails?.name
    || recentPlays[0]?.artist
    || '';

  const jsonLd = displayName
    ? {
        '@context': 'https://schema.org',
        '@type': 'MusicGroup',
        name: displayName,
        ...(heroImageUrl ? { image: heroImageUrl } : {})
      }
    : null;

  return (
    <Box>
      <PageMeta
        title={displayName || undefined}
        description={displayName
          ? `השמעות ושירים מובילים של ${displayName} ברדיו הישראלי.`
          : undefined}
        path={`/artist/${artistId}`}
        image={heroImageUrl}
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

      <Box dir="rtl" sx={{ mb: 4, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Avatar
          src={heroImageUrl || undefined}
          alt={displayName}
          sx={{ width: AVATAR.lg, height: AVATAR.lg, fontSize: '1.75rem' }}
        >
          {displayName.trim().charAt(0).toUpperCase()}
        </Avatar>
        <Typography variant="h4" gutterBottom>
          {displayName}
        </Typography>
      </Box>

      {/* Each section renders on its own request rather than waiting for the slowest. */}
      <Box sx={{ mb: 4 }}>
        <ArtistRecentPlays
          plays={recentPlays}
          onSongClick={openSong}
          isLoading={isLoading}
          errorMessage={error}
        />
      </Box>

      <Divider sx={{ my: 4 }} />

      <Box sx={{ mb: 4 }}>
        <ArtistTopSongsTable artistId={artistId} onSongClick={openSong} />
      </Box>
    </Box>
  );
};

export default ArtistPage;
