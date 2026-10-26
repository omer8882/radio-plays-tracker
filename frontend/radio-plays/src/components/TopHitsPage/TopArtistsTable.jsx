import React from 'react';
import { useNavigate } from 'react-router-dom';
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
import Pagination from '../Pagination';

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

  const handleArtistClick = (artistId) => {
    navigate(`/artist/${encodeURIComponent(artistId)}`);
  };

  return (
    <Paper elevation={1} sx={{ p: 1, width: '100%', boxSizing: 'border-box' }}>
      <Box dir="rtl">
        <Typography variant="h5" component="h2" sx={{ p: 2, pb: 1 }}>
          האמנים המושמעים ביותר
        </Typography>
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
            <TableCell align="center" sx={{ width: { xs: '8%', sm: '5%' } }}>#</TableCell>
            <TableCell align="center" sx={{ width: { xs: '15%', sm: '12%' } }}></TableCell>
            <TableCell align="right" sx={{ width: { xs: '32%', sm: '28%' } }}>אמן</TableCell>
            <TableCell align="center" sx={{ width: { xs: '22%', sm: '15%' } }}>השמעות</TableCell>
            <TableCell align="center" sx={{ width: { xs: '23%', sm: '15%' } }}>שירים שונים</TableCell>
            <TableCell align="center" sx={{ width: { xs: '0%', sm: '25%' }, display: { xs: 'none', sm: 'table-cell' } }}>תחנה מובילה</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {!isLoading && artists.length === 0 && (
            <TableRow>
              <TableCell align="center" colSpan={6}>
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
                onClick={() => handleArtistClick(artist.id)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell align="center" className="num" sx={{ width: { xs: '8%', sm: '5%' } }}>{rank}</TableCell>
                <TableCell align="center" sx={{ width: { xs: '15%', sm: '12%' }, padding: { xs: '6px', sm: '16px' } }}>
                  <Avatar
                    src={artist.imageUrl || undefined}
                    alt={artist.name}
                    sx={{ width: { xs: 40, sm: 48 }, height: { xs: 40, sm: 48 }, margin: '0 auto' }}
                  >
                    {(artist.name || '?').trim().charAt(0).toUpperCase() || '?'}
                  </Avatar>
                </TableCell>
                <TableCell align="center" sx={{ width: { xs: '32%', sm: '28%' } }}>
                  <Typography 
                    variant="subtitle1"
                    sx={{ lineHeight: 1.3 }}
                  >
                    {artist.name}
                  </Typography>
                </TableCell>
                <TableCell 
                  align="center" 
                  sx={{ 
                    width: { xs: '22%', sm: '15%' }
                  }}
                >
                  {artist.plays}
                </TableCell>
                <TableCell 
                  align="center" 
                  sx={{ 
                    width: { xs: '23%', sm: '15%' }
                  }}
                >
                  {artist.uniqueSongs}
                </TableCell>
                <TableCell 
                  align="center" 
                  sx={{ 
                    width: { xs: '0%', sm: '25%' },
                    display: { xs: 'none', sm: 'table-cell' }
                  }}
                >
                  {topStationLabel ? `${topStationLabel} (${artist.topStationPlays})` : '—'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Pagination
        page={page}
        hasMore={hasMore}
        onPrev={onPrev}
        onNext={onNext}
        disabled={isLoading}
      />
    </Box>
  </Paper>
  );
};

export default TopArtistsTable;
