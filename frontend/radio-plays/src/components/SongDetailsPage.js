import React, { useState, useEffect} from 'react';
import { Box, Modal, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';
import StationBreakdown from './StationBreakdown';
import StreamingLinks from './StreamingLinks';

const SongDetailsModal = ({ showModal, setShowModal, songDetails }) => {
  const songTitle = songDetails.name;
  const artist = songDetails.artists && songDetails.artists[0] && songDetails.artists[0].name;
  const [stationBreakdown, setStationBreakdown] = useState({});

  useEffect(() => {
    const getDetails = async () => {
      const stationBreakdownResponse = await axios.get(`https://server.mahushma.com/api/song_plays_by_station?song_id=${songDetails.id}`);
      setStationBreakdown(stationBreakdownResponse.data);
    };

    if(showModal) getDetails();
  }, [showModal]);

  const handleClose = () => {
    setStationBreakdown({});
    setShowModal(false);
  };

  return (
    <Modal
      open={showModal}
      onClose={handleClose}
      aria-labelledby="song-details-title"
      aria-describedby="song-details-description"
    >
      <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '75%', maxWidth:'400px', bgcolor: 'background.paper', boxShadow: 24, p: 4 }}>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{ position: 'absolute', top: 8, right: 8 }}
        >
          <CloseIcon />
        </IconButton>
        <Box sx={{ position: 'absolute', top: 12, left: 12 }}>
          <StreamingLinks streamingLinks={songDetails.external_links} title={songTitle} artist={artist}/>
        </Box>
        <Typography id="song-title" variant="h6" component="h2" sx={{textAlign: 'center', marginTop: '12px'}}>
          {songTitle}
        </Typography>
        <Typography id="song-details-description" sx={{ mt: 2, textAlign: 'right' }}>
          <p>{artist} <strong>:אמן</strong></p>
          <p>{songDetails.album && songDetails.album.name} <strong>:אלבום</strong></p>
          <Typography id="StationBreakdown-title" variant="subtitle2" component="h2" sx={{textAlign: 'center' }}>השמעות לפי תחנה</Typography>
          <StationBreakdown stationBreakdown={stationBreakdown}/>
        </Typography>
      </Box>
    </Modal>
  );
};

export default SongDetailsModal;