import React from 'react';
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
import StationBreakdown from '../StationBreakdown';

const formatDateTime = (value) => {
  if (!value) {
    return '-';
  }
  try {
    return new Date(value).toLocaleString('he-IL', {
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return value;
  }
};

const buildOrderedBreakdown = (breakdown) => {
  if (!breakdown) {
    return {};
  }

  const aggregated = Object.entries(breakdown).reduce((accumulator, [stationName, count]) => {
    if (typeof count !== 'number') {
      return accumulator;
    }

    const normalized = typeof stationName === 'string'
      ? stationName.replace(/\s+/g, '').toLowerCase()
      : stationName;

    if (!normalized) {
      return accumulator;
    }

    accumulator[normalized] = (accumulator[normalized] ?? 0) + count;
    return accumulator;
  }, {});

  return Object.entries(aggregated)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .reduce((ordered, [stationName, count]) => {
      ordered[stationName] = count;
      return ordered;
    }, {});
};
const TopSongsTable = ({
  songs,
  page,
  pageSize,
  hasMore,
  onNext,
  onPrev,
  isLoading,
  errorMessage
}) => (
  <Paper elevation={4} sx={{ p: 3, width: '100%', boxSizing: 'border-box' }}>
    <Box dir="rtl">
      <Typography variant="h5" component="h2" gutterBottom>
        השירים המושמעים ביותר
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
            <TableCell align="right">שיר</TableCell>
            <TableCell align="right">השמעות</TableCell>
            <TableCell align="right">תחנות מובילות</TableCell>
            <TableCell align="right">הושמע לאחרונה</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {!isLoading && songs.length === 0 && (
            <TableRow>
              <TableCell align="center" colSpan={5}>
                אין נתונים לתקופה שנבחרה
              </TableCell>
            </TableRow>
          )}
          {songs.map((song, index) => {
            const rank = page * pageSize + index + 1;
            const stations = buildOrderedBreakdown(song.stationBreakdown);

            return (
              <TableRow key={song.id} hover>
                <TableCell align="center">{rank}</TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle1">{song.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {song.artist}
                  </Typography>
                  {song.album && (
                    <Typography variant="caption" color="text.secondary">
                      אלבום: {song.album}
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle1">{song.plays}</Typography>
                </TableCell>
                <TableCell align="right">
                  <StationBreakdown stationBreakdown={stations} />
                </TableCell>
                <TableCell align="right">{formatDateTime(song.lastPlayedAt)}</TableCell>
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

export default TopSongsTable;
