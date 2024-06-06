import React from 'react';
import { ListItem, Box, Typography } from '@mui/material';

const SongListItem = ({ song }) => {
    const overlayColor = 'rgba(0, 0, 0, 0.07)'; // 10% opaque black
    return (
        <ListItem style={{ display: 'flex', width: '100%', justifyContent: 'space-between', padding: '10px 15px', backgroundColor: overlayColor, margin: '0', borderRadius: '0' }}>
            <Box>
                <Typography variant="subtitle1">{song.time}</Typography>
            </Box>
            <Box>
                <Typography variant="subtitle1" align="right">{song.title}</Typography>
                <Typography variant="body2" color="textSecondary" align="right">{song.artist}</Typography>
            </Box>
        </ListItem>
    );
};

export default SongListItem;
