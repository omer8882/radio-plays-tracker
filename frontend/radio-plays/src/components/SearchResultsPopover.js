import React, { useState } from 'react';
import { Box, List, ListItem, Typography, Popover, Modal, IconButton } from '@mui/material';
import axios from 'axios';
import SongDetailsPage from './SongDetailsPage';

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

      <SongDetailsPage
        showModal={showModal}
        setShowModal={setShowModal}
        songDetails={songDetails}
        stationBreakdown={stationBreakdown}
      />
    </>
  );
};

export default SearchResultsPopover;