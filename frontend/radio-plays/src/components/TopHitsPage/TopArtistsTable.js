import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';

const TopArtistsTable = ({
  artists,
  page,
  pageSize,
  hasMore,
  onNext,
  onPrev,
  isLoading,
  errorMessage,
  stationLabels
}) => {
  const navigate = useNavigate();

  const handleArtistClick = (artistName) => {
    navigate(`/artist?name=${encodeURIComponent(artistName)}`);
  };

  return (
    <Paper elevation={3} sx={{ p: 3, width: '100%', boxSizing: 'border-box' }}>
      <Box dir="rtl">
        <Typography variant="h5" component="h2" gutterBottom>
          האמנים המושמעים ביותר
        </Typography>

      {isLoading && <LinearProgress sx={{ mb: 2 }} />}
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell align="center">#</TableCell>
            <TableCell align="right">אמן</TableCell>
            <TableCell align="right">השמעות</TableCell>
            <TableCell align="right">שירים שונים</TableCell>
            <TableCell align="right">תחנה מובילה</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {!isLoading && artists.length === 0 && (
            <TableRow>
              <TableCell align="center" colSpan={5}>
                אין נתונים לתקופה שנבחרה
              </TableCell>
            </TableRow>
          )}

          {artists.map((artist, index) => {
            const rank = page * pageSize + index + 1;
            const normalizedStation = artist.topStation ? artist.topStation.toLowerCase() : undefined;
            const topStationLabel = artist.topStation
              ? stationLabels?.[artist.topStation] ?? stationLabels?.[normalizedStation] ?? artist.topStation
              : null;
            return (
              <TableRow
                key={artist.id}
                hover
                onClick={() => handleArtistClick(artist.name)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell align="center">{rank}</TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle1">{artist.name}</Typography>
                </TableCell>
                <TableCell align="right">{artist.plays}</TableCell>
                <TableCell align="right">{artist.uniqueSongs}</TableCell>
                <TableCell align="right">
                  {topStationLabel ? `${topStationLabel} (${artist.topStationPlays})` : '—'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Box display="flex" justifyContent="space-between" alignItems="center" mt={3}>
        <Button variant="text" onClick={onPrev} disabled={page === 0 || isLoading}>
          חדשים יותר
        </Button>
        <Typography variant="body2">עמוד {page + 1}</Typography>
        <Button variant="text" onClick={onNext} disabled={!hasMore || isLoading}>
          ישנים יותר
        </Button>
      </Box>
    </Box>
  </Paper>
  );
};

export default TopArtistsTable;
