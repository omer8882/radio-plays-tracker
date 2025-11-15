// SongListItem.js
import React from 'react';
import { ListItem, Box, Typography } from '@mui/material';
import EqualizerIcon from './EqualizerIcon';

const SongListItem = ({ song, onClick }) => {
    const overlayColor = 'rgba(0, 0, 0, 0.07)';
    const coverUrl = song?.imageUrl;
    const coverFallbackLabel = (song?.artist || song?.title || '♫').charAt(0).toUpperCase();
    const timeLabel = song?.time || '';
    const dateLabel = song?.dateLabel || '';

    const isSongPlaying = (playedAt) => {
        if (!playedAt || !playedAt.includes(':')) {
            return false;
        }
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
          className="song-list-item"
          style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '5px 10px',
              backgroundColor: overlayColor,
              margin: '0',
              borderRadius: '0',
              alignItems: 'center'
          }}
        >
            <Box className="song-list-item__time">
                {dateLabel && (
                    <Typography className="song-list-item__date" variant="body2">
                        {dateLabel}
                    </Typography>
                )}
                <Typography variant="subtitle1" sx={{ fontSize: { xs: '0.85rem', sm: '0.9rem' } }}>
                    {timeLabel}
                </Typography>
                {isSongPlaying(timeLabel) && (
                    <EqualizerIcon sx={{ animation: 'equalizer 1s infinite ease-in-out' }} />
                )}
            </Box>

            <Box className="song-list-item__content">
                <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="subtitle1" sx={{ fontSize: { xs: '0.9rem', sm: '0.9rem' }}}>
                        {song.title || ' '}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem' }}}>
                        {song.artist || ' '}
                    </Typography>
                </Box>

                <Box className={`song-list-item__cover${coverUrl ? '' : ' song-list-item__cover--placeholder'}`}>
                    {coverUrl ? (
                        <Box
                            component="img"
                            src={coverUrl}
                            alt={`${song.title || 'Unknown song'} cover art`}
                            loading="lazy"
                            className="song-list-item__cover-image"
                        />
                    ) : (
                        <Typography variant="subtitle2" component="span">
                            {coverFallbackLabel}
                        </Typography>
                    )}
                </Box>
            </Box>
        </ListItem>
    );
};

export default SongListItem;
