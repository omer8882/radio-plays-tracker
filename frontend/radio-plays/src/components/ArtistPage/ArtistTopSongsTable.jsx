import React, { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  Alert,
  Avatar,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import { fetchArtistTopHits, queryKeys } from '../../api';
import SegmentedControl from '../SegmentedControl';

const ARTIST_RANGE_OPTIONS = [
  { value: '30', label: '30 ימים' },
  { value: '365', label: '365 ימים' }
];

const ArtistTopSongsTable = ({ artistId, onSongClick }) => {
  const [range, setRange] = useState('30');

  const days = Number(range);

  const { data, isFetching, isError } = useQuery({
    queryKey: queryKeys.artistTopHits(artistId, days, 10),
    queryFn: ({ signal }) => fetchArtistTopHits(artistId, days, 10, signal),
    enabled: Boolean(artistId),
    placeholderData: keepPreviousData
  });

  const songs = Array.isArray(data)
    ? data.map((song) => ({
        id: song.id ?? song.Id ?? '',
        title: song.title ?? song.Title ?? '',
        artist: song.artist ?? song.Artist ?? '',
        hits: song.hits ?? song.Hits ?? 0,
        imageUrl: song.imageUrl ?? song.ImageUrl ?? ''
      }))
    : [];

  const isLoading = isFetching;
  const errorMessage = isError ? 'אירעה תקלה בטעינת השירים המובילים.' : null;

  return (
    <Paper elevation={1} sx={{ p: 0, width: '100%', boxSizing: 'border-box' }}>
      <Box dir="rtl">
        <Typography variant="h5" component="h2" sx={{ p: 2, pb: 1 }}>
          השירים המובילים
        </Typography>

        <Box sx={{ px: 2, pb: 2 }}>
          <SegmentedControl
            options={ARTIST_RANGE_OPTIONS}
            value={range}
            onChange={setRange}
            ariaLabel="artist range"
          />
        </Box>
        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}

        <Table
        size="small"
        sx={{
          opacity: isLoading ? 0.5 : 1,
          pointerEvents: isLoading ? 'none' : 'auto',
          transition: 'opacity 150ms ease'
        }}
      >
          <TableHead>
            <TableRow>
              <TableCell align="center" sx={{ width: { xs: '5%', sm: '8%' } }}>#</TableCell>
              <TableCell align="center" sx={{ width: { xs: '18%', sm: '15%' } }}></TableCell>
              <TableCell align="right" sx={{ width: { xs: '57%', sm: '57%' } }}>שיר</TableCell>
              <TableCell align="center" sx={{ width: { xs: '20%', sm: '20%' } }}>השמעות</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!isLoading && songs.length === 0 && (
              <TableRow>
                <TableCell align="center" colSpan={4}>
                  אין נתונים לתקופה שנבחרה
                </TableCell>
              </TableRow>
            )}

            {songs.map((song, index) => {
              const rank = index + 1;
              return (
                <TableRow
                  key={song.id}
                  hover
                  onClick={() => onSongClick && onSongClick(song.id)}
                  sx={{ cursor: onSongClick ? 'pointer' : 'default' }}
                >
                  <TableCell align="center" className="num" sx={{ width: { xs: '5%', sm: '8%' } }}>{rank}</TableCell>
                  <TableCell align="center" sx={{ width: { xs: '18%', sm: '15%' }, padding: { xs: '8px', sm: '16px' } }}>
                    <Avatar
                      src={song.imageUrl || undefined}
                      alt={song.title}
                      sx={{ width: { xs: 40, sm: 48 }, height: { xs: 40, sm: 48 }, margin: '0 auto' }}
                    >
                      {(song.title || '?').trim().charAt(0).toUpperCase() || '?'}
                    </Avatar>
                  </TableCell>
                  <TableCell align="right" sx={{ width: { xs: '60%', sm: '57%' } }}>
                    <Typography 
                      variant="subtitle1"
                      sx={{
                        lineHeight: 1.3
                      }}
                    >
                      {song.title}
                    </Typography>
                  </TableCell>
                  <TableCell align="center" className="num" sx={{ width: { xs: '17%', sm: '20%' } }}>{song.hits}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>
    </Paper>
  );
};

export default ArtistTopSongsTable;
