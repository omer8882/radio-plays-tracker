import React, { useState, useEffect, useRef } from 'react';
import { Box, List, ListItem, Popover } from '@mui/material';
import axios from 'axios';
import SongDetailsPage from './SongDetailsPage';

const overlayColor = 'rgba(0, 0, 0, 0.07)';

const SearchResultsPopover = ({ id, open, anchorEl, handleClose, results, textFieldRef, showItemDetails}) => {
  const [showModal, setShowModal] = useState(false);
  const [songDetails, setSongDetails] = useState({});
  const listRef = useRef(null); // Reference to the List element

  const handleSongClick = async (song) => {
    try {
      setSongDetails(song);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching song details or plays by station:', error);
    }
  };

  useEffect(() => {
    console.log("Effect triggered with open:", open);
  
    if (open && listRef.current) {
        const listHeight = listRef.current.scrollHeight;
        const containerHeight = listRef.current.clientHeight;
        const middlePosition = (listHeight - containerHeight) / 2;
        listRef.current.scrollTop = middlePosition;
    }
  }, [open, results]);

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
        <Box sx={{ p: 0, maxHeight: '75vh', overflowY: 'auto' }} ref={listRef}>
          <List sx={{ width: '100%'}}>
            {results.map((song) => (
              <ListItem
                key={song.id}
                button
                onClick={() => handleSongClick(song)}
                sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', backgroundColor: overlayColor, padding:'0', margin: '0', borderRadius: '0' }} >
                {showItemDetails(song)}
              </ListItem>
            ))}
          </List>
        </Box>
      </Popover>

      <SongDetailsPage
        showModal={showModal}
        setShowModal={setShowModal}
        songDetails={songDetails}
      />
    </>
  );
};

export default SearchResultsPopover;