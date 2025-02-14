// SongListItem.js
import React from 'react';
import { ListItem, Box, Typography } from '@mui/material';
import EqualizerIcon from './EqualizerIcon';

const SongListItem = ({ song, onClick }) => {
    const overlayColor = 'rgba(0, 0, 0, 0.07)';

    const isSongPlaying = (playedAt) => {
        const now = new Date();
        const [playedHour, playedMinute] = playedAt.split(':').map(Number);
        const playedTime = new Date(now);
        playedTime.setHours(playedHour, playedMinute, 0, 0); // Set hours and minutes from the playedAt string
        const differenceInMinutes = (now - playedTime) / (1000 * 60); // Convert to minutes
        return differenceInMinutes <= 2.75 && differenceInMinutes >= 0; // Only return true if it's within 2.75 minutes and not in the future
    };

    return (
        <ListItem 
          button 
          onClick={onClick}
          style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '10px 15px',
              backgroundColor: overlayColor,
              margin: '0',
              borderRadius: '0',
              alignItems: 'center'
          }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="subtitle1" sx={{ marginRight: '22px' }}>
                    {song.time}
                </Typography>
                {isSongPlaying(song.time) && (
                  <EqualizerIcon sx={{ animation: 'equalizer 1s infinite ease-in-out' }} />
                )}
            </Box>

            <Box sx={{ textAlign: 'right' }}>
                <Typography variant="subtitle1">{song.title}</Typography>
                <Typography variant="body2" color="textSecondary">
                    {song.artist}
                </Typography>
            </Box>
        </ListItem>
    );
};

export default SongListItem;
