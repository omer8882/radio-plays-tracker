import React from 'react';
import { Box, Modal, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import StationBreakdown from './StationBreakdown';

const SongDetailsModal = ({ showModal, setShowModal, songDetails, stationBreakdown }) => {
  return (
    <Modal
      open={showModal}
      onClose={() => setShowModal(false)}
      aria-labelledby="song-details-title"
      aria-describedby="song-details-description"
    >
      <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '74%', maxWidth:'400px', bgcolor: 'background.paper', boxShadow: 24, p: 4 }}>
        <IconButton
          aria-label="close"
          onClick={() => setShowModal(false)}
          sx={{ position: 'absolute', top: 8, right: 8 }}
        >
          <CloseIcon />
        </IconButton>
        <Typography id="song-title" variant="h6" component="h2" sx={{textAlign: 'center' }}>
          {songDetails.name}
        </Typography>
        <Typography id="song-details-description" sx={{ mt: 2, textAlign: 'right' }}>
          <p>{songDetails.artists && songDetails.artists[0] && songDetails.artists[0].name} <strong>:אמן</strong></p>
          <p>{songDetails.album && songDetails.album.name} <strong>:אלבום</strong></p>
          <Typography id="StationBreakdown-title" variant="subtitle2" component="h2" sx={{textAlign: 'center' }}>השמעות לפי תחנה</Typography>
          <StationBreakdown stationBreakdown={stationBreakdown} />
        </Typography>
      </Box>
    </Modal>
  );
};

export default SongDetailsModal;