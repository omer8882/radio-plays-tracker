import React from 'react';
import { ListItem, Box, Skeleton } from '@mui/material';
import { ROW_MIN_HEIGHT } from '../theme';

/**
 * Mirrors SongListItem's structure and 52px content height so the real rows drop
 * in without any layout shift when the request resolves.
 */
const SongListSkeleton = ({ rows = 10 }) => (
  <>
    {Array.from({ length: rows }, (_, index) => (
      <ListItem
        key={index}
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
          <Skeleton variant="text" width={38} height={20} />
        </Box>

        <Box className="song-list-item__content">
          <Box sx={{ textAlign: 'right', flex: 1 }}>
            <Skeleton variant="text" width={`${45 + ((index * 7) % 30)}%`} height={20} sx={{ ml: 'auto' }} />
            <Skeleton variant="text" width={`${28 + ((index * 5) % 20)}%`} height={16} sx={{ ml: 'auto' }} />
          </Box>
          <Skeleton variant="rounded" className="song-list-item__cover" sx={{ borderRadius: '5px' }} />
        </Box>
      </ListItem>
    ))}
  </>
);

export default SongListSkeleton;
