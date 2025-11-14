import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Alert,
  Avatar,
  Box,
  LinearProgress,
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
import { API_BASE_URL } from '../../config';

const ArtistTopSongsTable = ({ artistName, onSongClick }) => {
  const [selectedTab, setSelectedTab] = useState(0); // 0 = 30 days, 1 = 365 days
  const [songs, setSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const days = selectedTab === 0 ? 30 : 365;

  const normalizeTopSong = (song) => ({
    id: song.id ?? song.Id ?? '',
    title: song.title ?? song.Title ?? '',
    artist: song.artist ?? song.Artist ?? '',
    hits: song.hits ?? song.Hits ?? 0,
    imageUrl: song.imageUrl ?? song.ImageUrl ?? ''
  });

  useEffect(() => {
    let isCancelled = false;

    const fetchTopSongs = async () => {
      if (!artistName) return;

      setIsLoading(true);
      setErrorMessage(null);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/artist_top_hits`, {
          params: {
            artist: artistName,
            days: days,
            limit: 10
          }
        });
        if (isCancelled) return;
        const normalizedSongs = Array.isArray(response.data)
          ? response.data.map(normalizeTopSong)
          : [];
        setSongs(normalizedSongs);
      } catch (error) {
        console.error('Error fetching artist top songs:', error);
        if (!isCancelled) {
          setSongs([]);
          setErrorMessage('אירעה תקלה בטעינת השירים המובילים.');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchTopSongs();

    return () => {
      isCancelled = true;
    };
  }, [artistName, days]);

  const handleTabChange = (_, newValue) => {
    setSelectedTab(newValue);
  };

  return (
    <Paper elevation={3} sx={{ p: 0, width: '100%', boxSizing: 'border-box' }}>
      <Box dir="rtl">
        <Typography  padding="16px 16px 6px 16px" variant="h5" component="h2" gutterBottom>
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

        {isLoading && <LinearProgress sx={{ mb: 2 }} />}
        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}

        <Table size="small">
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
                  <TableCell align="center" sx={{ width: { xs: '5%', sm: '8%' } }}>{rank}</TableCell>
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
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                        lineHeight: 1.3
                      }}
                    >
                      {song.title}
                    </Typography>
                  </TableCell>
                  <TableCell align="center" sx={{ width: { xs: '17%', sm: '20%' } }}>{song.hits}</TableCell>
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
