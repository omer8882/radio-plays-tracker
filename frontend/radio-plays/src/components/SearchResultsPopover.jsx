import React, { useEffect, useRef } from 'react';
import { Box, List, ListItem, Popover, Typography } from '@mui/material';
import { useSongModal } from '../hooks/useSongModal';

const SearchResultsPopover = ({ id, open, anchorEl, handleClose, results, textFieldRef, showItemDetails, noResults = false }) => {
  const { openSong } = useSongModal();
  const listRef = useRef(null); // Reference to the List element

  const handleSongClick = (song) => {
    openSong(song.id);
    handleClose();
  };

  useEffect(() => {
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
        slotProps={{ paper: { sx: { backgroundColor: 'app.card', width: textFieldRef.current ? textFieldRef.current.clientWidth : '100%', borderRadius: 2 } } }}
        sx={{ margin: '7px 0px 0px 0px' }}
      >
        <Box sx={{ p: 0, maxHeight: '75vh', overflowY: 'auto' }} ref={listRef}>
          <List sx={{ width: '100%'}}>
            {noResults ? (
              <ListItem sx={{ display: 'flex', justifyContent: 'center', backgroundColor: 'app.overlay', p: 2 }}>
                <Typography variant="subtitle1" align="center">לא נמצאו שירים לזמן זה</Typography>
              </ListItem>
            ) : (
              results.map((song) => (
                <ListItem
                  key={song.id}
                  button
                  onClick={() => handleSongClick(song)}
                  sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', backgroundColor: 'app.overlay', p: 0, borderRadius: 0 }} >
                  {showItemDetails(song)}
                </ListItem>
              ))
            )}
          </List>
        </Box>
      </Popover>
    </>
  );
};

export default SearchResultsPopover;