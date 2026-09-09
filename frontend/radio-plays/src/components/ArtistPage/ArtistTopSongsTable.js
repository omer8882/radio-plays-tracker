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
  Tab,
  Tabs,
  Typography
} from '@mui/material';
import { fetchArtistTopHits, queryKeys } from '../../api';

const ArtistTopSongsTable = ({ artistName, onSongClick }) => {
  const [selectedTab, setSelectedTab] = useState(0); // 0 = 30 days, 1 = 365 days

  const days = selectedTab === 0 ? 30 : 365;

  const { data, isFetching, isError } = useQuery({
    queryKey: queryKeys.artistTopHits(artistName, days, 10),
    queryFn: ({ signal }) => fetchArtistTopHits(artistName, days, 10, signal),
    enabled: Boolean(artistName),
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

  const handleTabChange = (_, newValue) => {
    setSelectedTab(newValue);
  };

  return (
    <Paper elevation={1} sx={{ p: 0, width: '100%', boxSizing: 'border-box' }}>
      <Box dir="rtl">
        <Typography variant="h5" component="h2" sx={{ p: 2, pb: 1 }}>
          השירים המובילים
        </Typography>

        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="30 ימים" />
          <Tab label="365 ימים" />
        </Tabs>
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
