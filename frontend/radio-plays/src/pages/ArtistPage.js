import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Box, Typography, Alert, CircularProgress, Divider, Avatar } from '@mui/material';
import ArtistRecentPlays from '../components/ArtistPage/ArtistRecentPlays';
import ArtistTopSongsTable from '../components/ArtistPage/ArtistTopSongsTable';
import SongDetailsPage from '../components/SongDetailsPage';
import { API_BASE_URL } from '../config';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const normalizeDateLabel = (datePart) => {
  if (!datePart) {
    return '';
  }

  const [day, month, year] = datePart.split('/').map((segment) => parseInt(segment, 10));
  if ([day, month, year].some((value) => Number.isNaN(value))) {
    return datePart;
  }

  const targetDate = new Date(year, month - 1, day);
  if (Number.isNaN(targetDate.getTime())) {
    return datePart;
  }

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfTarget = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const diffDays = Math.round((startOfToday - startOfTarget) / MS_PER_DAY);

  if (diffDays === 0) {
    return 'היום';
  }

  if (diffDays === 1) {
    return 'אתמול';
  }

  return datePart;
};

const extractTimeParts = (rawValue) => {
  if (!rawValue || typeof rawValue !== 'string') {
    return { dateLabel: '', timeLabel: '' };
  }

  const tokens = rawValue
    .replace(/\r/g, '')
    .split(/\s+/)
    .filter(Boolean);

  const datePart = tokens[0] || '';
  const timePart = tokens[1] || rawValue.trim();

  return {
    dateLabel: normalizeDateLabel(datePart),
    timeLabel: timePart
  };
};

const ArtistPage = () => {
  const [searchParams] = useSearchParams();
  const artistName = searchParams.get('name');

  const [recentPlays, setRecentPlays] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [artistDetails, setArtistDetails] = useState(null);

  // Song details modal state
  const [selectedSongId, setSelectedSongId] = useState(null);
  const [showSongModal, setShowSongModal] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const normalizeRecentPlay = (play) => {
      const rawTime = play.time ?? play.Time ?? '';
      const { dateLabel, timeLabel } = extractTimeParts(rawTime);

      return {
        id: play.id ?? play.Id ?? '',
        title: play.title ?? play.Title ?? '',
        artist: play.artist ?? play.Artist ?? '',
        time: timeLabel || '',
        dateLabel,
        station: play.station ?? play.Station ?? '',
        imageUrl: play.imageUrl ?? play.ImageUrl ?? ''
      };
    };

    const fetchArtistPlays = async () => {
      if (!artistName) {
        setError('לא צוין שם אמן');
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/get_artist_plays`, {
          params: {
            artist: artistName,
            limit: 10
          }
        });
        if (isCancelled) return;
        const plays = Array.isArray(response.data) ? response.data.map(normalizeRecentPlay) : [];
        setRecentPlays(plays);
      } catch (err) {
        console.error('Error fetching artist plays:', err);
        if (!isCancelled) {
          setRecentPlays([]);
          setError('אירעה תקלה בטעינת נתוני האמן.');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchArtistPlays();

    return () => {
      isCancelled = true;
    };
  }, [artistName]);

  useEffect(() => {
    let isCancelled = false;

    const fetchArtistDetails = async () => {
      if (!artistName) {
        setArtistDetails(null);
        return;
      }

      setArtistDetails(null);

      try {
        const response = await axios.get(`${API_BASE_URL}/api/artist_details`, {
          params: { name: artistName }
        });

        if (isCancelled) return;

        const details = response?.data || {};
        const normalized = {
          id: details.id ?? details.Id ?? '',
          name: details.name ?? details.Name ?? artistName,
          imageUrl: details.imageUrl ?? details.ImageUrl ?? ''
        };

        setArtistDetails(normalized);
      } catch (err) {
        if (isCancelled) return;

        if (err?.response?.status === 404) {
          setArtistDetails(null);
        } else {
          console.error('Error fetching artist details:', err);
          setArtistDetails(null);
        }
      }
    };

    fetchArtistDetails();

    return () => {
      isCancelled = true;
    };
  }, [artistName]);

  const handleSongClick = (songId) => {
    setSelectedSongId(songId);
    setShowSongModal(true);
  };

  if (!artistName) {
    return (
      <Box sx={{ width: '90%', mx: 'auto', mt: 4 }} dir="rtl">
        <Alert severity="error">לא צוין שם אמן בכתובת</Alert>
      </Box>
    );
  }

  const heroImageUrl = artistDetails?.imageUrl || recentPlays.find((play) => play.imageUrl)?.imageUrl;
  const displayName = artistDetails?.name || artistName;

  return (
    <Box sx={{ width: '90%', mx: 'auto' }}>
      <Box dir="rtl" sx={{ mb: 4, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Avatar
          src={heroImageUrl || undefined}
          alt={displayName}
          sx={{ width: 96, height: 96, fontSize: '2rem' }}
        >
          {displayName.trim().charAt(0).toUpperCase()}
        </Avatar>
        <Typography variant="h4" gutterBottom>
          {displayName}
        </Typography>
      </Box>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!isLoading && !error && (
        <>
          {/* Recent Plays Section */}
          <Box sx={{ mb: 4 }}>
            <ArtistRecentPlays 
              plays={recentPlays}
              onSongClick={handleSongClick}
              isLoading={isLoading}
              errorMessage={error}
            />
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* Top Songs Section */}
          <Box sx={{ mb: 4 }}>
            <ArtistTopSongsTable artistName={artistDetails?.name || artistName} onSongClick={handleSongClick} />
          </Box>
        </>
      )}

      {/* Song Details Modal */}
      <SongDetailsPage
        showModal={showSongModal}
        setShowModal={setShowSongModal}
        songId={selectedSongId}
      />
    </Box>
  );
};

export default ArtistPage;
