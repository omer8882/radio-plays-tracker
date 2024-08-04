import React from 'react';
import { Box, List, ListItem, Typography, Popover, IconButton } from '@mui/material';

const overlayColor = 'rgba(0, 0, 0, 0.07)';

const SearchResultsPopover = ({ id, open, anchorEl, handleClose, results, textFieldRef }) => {
  return (
    <Popover
      id={id}
      open={open}
      anchorEl={anchorEl}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      PaperProps={{ style: { width: textFieldRef.current ? textFieldRef.current.clientWidth : '100%' } }}
      sx={{ margin: '7px 0px 0px 0px' }}
    >
      <Box sx={{ p: 0, maxHeight: '50vh', overflowY: 'auto' }}>
        <List sx={{ width: '100%', p: '5 0 0 5' }}>
          {results.map((song) => (
            <ListItem
              key={song.id}
              button
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
  );
};

export default SearchResultsPopover;
