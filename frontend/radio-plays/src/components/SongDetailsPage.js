import React, { useState, useEffect } from 'react';
import { Box, Modal, IconButton, Typography, CircularProgress } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';
import StationBreakdown from './StationBreakdown';
import StreamingLinks from './StreamingLinks';

const SongDetailsModal = ({ showModal, setShowModal, songId }) => {
  const [songDetails, setSongDetails] = useState(null);
  const [stationBreakdown, setStationBreakdown] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log("showModal = " + showModal + ", songId = " + songId)
    if (showModal && songId) {
      const getDetails = async () => {
        setLoading(true);
        setError(null);
        try {
          const [songDetailsResponse, stationBreakdownResponse] = await Promise.all([
            axios.get(`https://localhost:5001/api/get_song_details?song_id=${songId}`),
            axios.get(`https://localhost:5001/api/song_plays_by_station?song_id=${songId}`)
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
            <Typography id="song-title" variant="h6" component="h2" sx={{ textAlign: 'center', marginTop: '12px' }}>
              {songDetails.name}
            </Typography>
            <Typography id="song-details-description" sx={{ mt: 2, textAlign: 'right' }}>
              <p>
                {songDetails.artists?.[0]?.name} <strong>:אמן</strong>
              </p>
              <p>
                {songDetails.album?.name} <strong>:אלבום</strong>
              </p>
              <Typography id="StationBreakdown-title" variant="subtitle2" component="h2" sx={{ textAlign: 'center' }}>
                השמעות לפי תחנה
              </Typography>
              <StationBreakdown stationBreakdown={stationBreakdown} />
            </Typography>
          </>
        ) : (
          <Typography align="center">No details available.</Typography>
        )}
      </Box>
    </Modal>
  );
};

export default SongDetailsModal;
