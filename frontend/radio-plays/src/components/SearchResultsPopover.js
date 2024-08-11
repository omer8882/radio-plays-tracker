import React, { useState } from 'react';
import { Box, List, ListItem, Typography, Popover, Modal, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';
import StationBreakdown from './StationBreakdown';

const overlayColor = 'rgba(0, 0, 0, 0.07)';

const SearchResultsPopover = ({ id, open, anchorEl, handleClose, results, textFieldRef }) => {
  const [showModal, setShowModal] = useState(false);
  const [songDetails, setSongDetails] = useState({});
  const [stationBreakdown, setStationBreakdown] = useState({});

  const handleSongClick = async (song) => {
    try {
      setSongDetails(song);
      const stationBreakdownResponse = await axios.get(`https://server.mahushma.com/api/song_plays_by_station?song_id=${song.id}`);
      setStationBreakdown(stationBreakdownResponse.data);

      setShowModal(true);
    } catch (error) {
      console.error('Error fetching song details or plays by station:', error);
    }
  };

  return (
    <>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        PaperProps={{ style: { width: textFieldRef.current ? textFieldRef.current.clientWidth : '100%', borderRadius: '16px' } }}
        sx={{ margin: '7px 0px 0px 0px' }}
      >
        <Box sx={{ p: 0, maxHeight: '50vh', overflowY: 'auto' }}>
          <List sx={{ width: '100%', p: '5 0 0 5' }}>
            {results.map((song) => (
              <ListItem
                key={song.id}
                button
                onClick={() => handleSongClick(song)}
                sx={{ display: 'flex', justifyContent: 'space-between', padding: '10px 15px', backgroundColor: overlayColor, margin: '0', borderRadius: '0' }}
              >
                <Box>
                  <Typography variant="subtitle1">{`${song.name} - ${song.artists[0].name}`}</Typography>
                  <Typography variant="body2" color="textSecondary">{`${song.album.name}`}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle1" align="right"></Typography>
                </Box>
              </ListItem>
            ))}
          </List>
        </Box>
      </Popover>

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
    </>
  );
};

export default SearchResultsPopover;