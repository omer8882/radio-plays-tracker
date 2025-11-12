import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Modal, IconButton, Typography, CircularProgress, Link, Avatar, Stack } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';
import StationBreakdown from './StationBreakdown';
import StreamingLinks from './StreamingLinks';
import { API_BASE_URL } from '../config';

const SongDetailsModal = ({ showModal, setShowModal, songId }) => {
  const navigate = useNavigate();
  const [songDetails, setSongDetails] = useState(null);
  const [stationBreakdown, setStationBreakdown] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (showModal && songId) {
      const getDetails = async () => {
        setLoading(true);
        setError(null);
        try {
          const [songDetailsResponse, stationBreakdownResponse] = await Promise.all([
            axios.get(`${API_BASE_URL}/api/get_song_details?song_id=${songId}`),
            axios.get(`${API_BASE_URL}/api/song_plays_by_station?song_id=${songId}`)
          ]);
          setSongDetails(songDetailsResponse.data);
          setStationBreakdown(stationBreakdownResponse.data);
        } catch (err) {
          console.error("Error fetching song details:", err);
          setError('Failed to fetch song details.');
        } finally {
          setLoading(false);
        }
      };

      getDetails();
    }
  }, [showModal, songId]);

  const handleClose = () => {
    setSongDetails(null);
    setStationBreakdown(null);
    setError(null);
    setShowModal(false);
  };

  const handleArtistClick = (artistName) => {
    handleClose();
    navigate(`/artist?name=${encodeURIComponent(artistName)}`);
  };

  return (
    <Modal
      open={showModal}
      onClose={handleClose}
      aria-labelledby="song-details-title"
      aria-describedby="song-details-description"
    >
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '75%',
          maxWidth: '400px',
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          outline: 'none'
        }}
      >
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{ position: 'absolute', top: 8, right: 8 }}
        >
          <CloseIcon />
        </IconButton>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" align="center">
            {error}
          </Typography>
        ) : songDetails ? (
          <>
            <Box sx={{ position: 'absolute', top: 12, left: 12 }}>
              <StreamingLinks 
                streamingLinks={songDetails.externalLinks} 
                title={songDetails.name} 
                artist={songDetails.artists?.[0]?.name}
              />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4 }}>
              <Avatar
                variant="rounded"
                src={songDetails.imageUrl || undefined}
                alt={songDetails.name}
                sx={{ width: 160, height: 160, mb: 2, fontSize: '3rem' }}
              >
                {(songDetails.name || '?').trim().charAt(0).toUpperCase() || '?'}
              </Avatar>
              <Typography id="song-title" variant="h6" component="h2" sx={{ textAlign: 'center' }}>
                {songDetails.name}
              </Typography>
            </Box>

            <Box id="song-details-description" sx={{ mt: 3 }}>
              {songDetails.album?.name && (
                <Typography variant="subtitle1" sx={{ textAlign: 'center', mb: 2 }}>
                  {songDetails.album?.name} <strong>:אלבום</strong>
                </Typography>
              )}

              {songDetails.artists?.length > 0 && (
                <Stack
                  direction="row"
                  justifyContent="center"
                  spacing={2}
                  sx={{ mb: 3, flexWrap: 'wrap' }}
                >
                  {songDetails.artists.map((artist) => (
                    <Stack
                      key={artist.id}
                      direction="column"
                      alignItems="center"
                      spacing={1}
                    >
                      <Avatar
                        src={artist.imageUrl || undefined}
                        alt={artist.name}
                        sx={{ width: 56, height: 56, cursor: 'pointer' }}
                        onClick={() => handleArtistClick(artist.name)}
                      >
                        {(artist.name || '?').trim().charAt(0).toUpperCase() || '?'}
                      </Avatar>
                      <Link
                        component="button"
                        variant="body2"
                        onClick={() => handleArtistClick(artist.name)}
                        sx={{ 
                          cursor: 'pointer',
                          textDecoration: 'none',
                          '&:hover': { textDecoration: 'underline' }
                        }}
                      >
                        {artist.name}
                      </Link>
                    </Stack>
                  ))}
                </Stack>
              )}

              <Typography id="StationBreakdown-title" variant="subtitle2" component="h2" sx={{ textAlign: 'center' }}>
                השמעות לפי תחנה
              </Typography>
              <StationBreakdown stationBreakdown={stationBreakdown} />
            </Box>
          </>
        ) : (
          <Typography align="center">No details available.</Typography>
        )}
      </Box>
    </Modal>
  );
};

export default SongDetailsModal;
