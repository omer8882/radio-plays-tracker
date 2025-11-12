import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Box, Typography, Alert, CircularProgress, Divider } from '@mui/material';
import ArtistRecentPlays from '../components/ArtistPage/ArtistRecentPlays';
import ArtistTopSongsTable from '../components/ArtistPage/ArtistTopSongsTable';
import SongDetailsPage from '../components/SongDetailsPage';
import { API_BASE_URL } from '../config';

const ArtistPage = () => {
  const [searchParams] = useSearchParams();
  const artistName = searchParams.get('name');

  const [recentPlays, setRecentPlays] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Song details modal state
  const [selectedSongId, setSelectedSongId] = useState(null);
  const [showSongModal, setShowSongModal] = useState(false);

  useEffect(() => {
    let isCancelled = false;

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
        setRecentPlays(Array.isArray(response.data) ? response.data : []);
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

  return (
    <Box sx={{ width: '90%', mx: 'auto' }}>
      <Box dir="rtl" sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          {artistName}
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
            <ArtistTopSongsTable artistName={artistName} onSongClick={handleSongClick} />
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
