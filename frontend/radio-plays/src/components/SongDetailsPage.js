import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Modal, IconButton, Typography, CircularProgress, Link, Avatar, Stack } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useQuery } from '@tanstack/react-query';
import StationBreakdown from './StationBreakdown';
import StreamingLinks from './StreamingLinks';
import { AVATAR, RADIUS } from '../theme';
import { fetchSongDetails, fetchSongStations, queryKeys } from '../api';

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

  const handleArtistClick = (artistName) => {
    handleClose();
    navigate(`/artist?name=${encodeURIComponent(artistName)}`);
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
            <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
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
                sx={{ width: AVATAR.xl, height: AVATAR.xl, mb: 2, fontSize: '2.5rem', borderRadius: `${RADIUS.md}px` }}
              >
                {(songDetails.name || '?').trim().charAt(0).toUpperCase() || '?'}
              </Avatar>
              <Typography id="song-title" variant="h6" component="h2" sx={{ textAlign: 'center' }}>
                {songDetails.name}
              </Typography>
            </Box>

            <Box id="song-details-description" sx={{ mt: 3 }}>
              {songDetails.album?.name && (
                <Typography variant="subtitle1" dir="rtl" sx={{ textAlign: 'center', mb: 2 }}>
                  <strong>אלבום:</strong> {songDetails.album?.name}
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
                        sx={{ width: AVATAR.sm, height: AVATAR.sm, cursor: 'pointer' }}
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
