import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Modal, IconButton, Typography, CircularProgress, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useQuery } from '@tanstack/react-query';
import StationBreakdown from './StationBreakdown';
import SongIdentity from './SongIdentity';
import { fetchSongDetails, fetchSongStations, queryKeys } from '../api';
import { RADIUS } from '../theme';

const SongDetailsModal = ({ songId, onClose }) => {
  const navigate = useNavigate();
  const enabled = Boolean(songId);

  const detailsQuery = useQuery({
    queryKey: queryKeys.songDetails(songId),
    queryFn: ({ signal }) => fetchSongDetails(songId, signal),
    enabled
  });

  const stationsQuery = useQuery({
    queryKey: queryKeys.songStations(songId),
    queryFn: ({ signal }) => fetchSongStations(songId, signal),
    enabled
  });

  const songDetails = detailsQuery.data ?? null;
  const stationBreakdown = stationsQuery.data ?? null;
  const loading = enabled && (detailsQuery.isPending || stationsQuery.isPending);
  const error = detailsQuery.isError || stationsQuery.isError ? 'לא הצלחנו לטעון את פרטי השיר.' : null;

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal
      open={enabled}
      closeAfterTransition
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
          width: 'min(92vw, 400px)',
          bgcolor: 'background.paper',
          boxShadow: 8,
          borderRadius: `${RADIUS.lg}px`,
          p: 3,
          outline: 'none'
        }}
      >
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{ position: 'absolute', top: 8, left: 8 }}
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
            {/* Same component the full song page uses, so the modal is that
                page's summary rather than a second implementation of it. */}
            <SongIdentity song={songDetails} />

            <Box id="song-details-description" sx={{ mt: 3 }}>
              <Typography variant="subtitle2" component="h3" sx={{ textAlign: 'center', mb: 1 }}>
                השמעות לפי תחנה
              </Typography>
              <StationBreakdown stationBreakdown={stationBreakdown} />

              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Button
                  size="small"
                  onClick={() => {
                    handleClose();
                    navigate(`/song/${encodeURIComponent(songId)}`);
                  }}
                >
                  לעמוד השיר המלא
                </Button>
              </Box>
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
