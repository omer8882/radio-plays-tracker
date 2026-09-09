import React from 'react';
import { List, Paper, Typography, Box, Alert } from '@mui/material';
import SongListItem from '../SongListItem';

const ArtistRecentPlays = ({ plays, onSongClick, isLoading, errorMessage }) => {
  return (
    <Paper elevation={1} sx={{ p: 0, width: '100%', boxSizing: 'border-box' }}>
      <Box>
        <Typography dir="rtl" variant="h5" component="h2" sx={{ p: 2, pb: 1 }}>
          השמעות אחרונות
        </Typography>

        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}

        {!isLoading && plays.length === 0 ? (
          <Typography align="center" sx={{ py: 2 }}>
            אין השמעות להצגה
          </Typography>
        ) : (
          <List>
            {plays.map((play, index) => (
              <SongListItem
                key={`${play.id}-${index}`}
                song={{
                  time: play.time,
                  dateLabel: play.dateLabel,
                  playedAt: play.playedAt,
                  title: play.title,
                  artist: play.artist,
                  station: play.station,
                  id: play.id,
                  imageUrl: play.imageUrl || play.ImageUrl || ''
                }}
                onClick={() => onSongClick && onSongClick(play.id)}
              />
            ))}
          </List>
        )}
      </Box>
    </Paper>
  );
};

export default ArtistRecentPlays;
