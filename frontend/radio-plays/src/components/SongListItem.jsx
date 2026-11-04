// SongListItem.js
import React from 'react';
import { ListItem, Box, Typography } from '@mui/material';
import EqualizerIcon from './EqualizerIcon';
import { dayLabel } from '../utils/dates';
import { ROW_MIN_HEIGHT } from '../theme';

// `isPlaying` is decided by the list, which knows which play is the newest.
const SongListItem = ({ song, onClick, isPlaying = false }) => {
    const coverUrl = song?.imageUrl;
    const coverFallbackLabel = (song?.artist || song?.title || '♫').charAt(0).toUpperCase();
    const timeLabel = song?.time || '';
    // Falls back to deriving it from the timestamp, so the station feed gets a
    // day marker without every caller having to compute one.
    const dateLabel = song?.dateLabel || dayLabel(song?.playedAt ?? song?.PlayedAt);

    return (
        <ListItem
          button
          onClick={onClick}
          className="song-list-item"
          sx={{
              display: 'flex',
              justifyContent: 'space-between',
              px: 1.5,
              py: 1,
              minHeight: ROW_MIN_HEIGHT,
              backgroundColor: 'app.overlay',
              borderRadius: 0,
              alignItems: 'center'
          }}
        >
            <Box className="song-list-item__time">
                <Typography variant="subtitle2" className="num">
                    {timeLabel}
                </Typography>
                {dateLabel && (
                    <Typography className="song-list-item__date num" variant="caption">
                        {dateLabel}
                    </Typography>
                )}
                {isPlaying && (
                    <EqualizerIcon sx={{ animation: 'equalizer 1s infinite ease-in-out' }} />
                )}
            </Box>

            <Box className="song-list-item__content">
                <Box sx={{ textAlign: 'right', minWidth: 0 }}>
                    <Typography variant="subtitle2" noWrap>
                        {song.title || ' '}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
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
