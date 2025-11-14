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
    <Paper elevation={3} sx={{ p: 1, width: '100%', boxSizing: 'border-box' }}>
      <Box dir="rtl">
        <Typography margin="7px 7px 9px 7px" variant="h5" component="h2" gutterBottom>
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
            <TableCell align="center" sx={{ width: { xs: '8%', sm: '5%' } }}>#</TableCell>
            <TableCell align="right" sx={{ width: { xs: '40%', sm: '35%' } }}>אמן</TableCell>
            <TableCell align="center" sx={{ width: { xs: '26%', sm: '15%' } }}>השמעות</TableCell>
            <TableCell align="center" sx={{ width: { xs: '26%', sm: '15%' } }}>שירים שונים</TableCell>
            <TableCell align="center" sx={{ width: { xs: '0%', sm: '30%' }, display: { xs: 'none', sm: 'table-cell' } }}>תחנה מובילה</TableCell>
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
                <TableCell align="center" sx={{ width: { xs: '8%', sm: '5%' } }}>{rank}</TableCell>
                <TableCell align="center" sx={{ width: { xs: '40%', sm: '35%' } }}>
                  <Typography 
                    variant="subtitle1"
                    sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, lineHeight: 1.3 }}
                  >
                    {artist.name}
                  </Typography>
                </TableCell>
                <TableCell 
                  align="center" 
                  sx={{ 
                    width: { xs: '26%', sm: '15%' },
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }}
                >
                  {artist.plays}
                </TableCell>
                <TableCell 
                  align="center" 
                  sx={{ 
                    width: { xs: '26%', sm: '15%' },
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }}
                >
                  {artist.uniqueSongs}
                </TableCell>
                <TableCell 
                  align="center" 
                  sx={{ 
                    width: { xs: '0%', sm: '30%' },
                    display: { xs: 'none', sm: 'table-cell' },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  }}
                >
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
