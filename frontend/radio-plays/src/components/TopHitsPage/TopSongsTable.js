import React from 'react';
import {
  Alert,
  Avatar,
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

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const getDateOnly = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const formatDateLabel = (targetDate) => {
  const today = getDateOnly(new Date());
  const startOfTarget = getDateOnly(targetDate);
  const diffDays = Math.floor((today - startOfTarget) / MS_PER_DAY);

  if (diffDays === 0) {
    return 'היום';
  }

  if (diffDays === 1) {
    return 'אתמול';
  }

  return targetDate.toLocaleDateString('he-IL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

const formatDateTimeParts = (value) => {
  if (!value) {
    return { dateLabel: '-', timeLabel: '' };
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return { dateLabel: value, timeLabel: '' };
  }

  return {
    dateLabel: formatDateLabel(parsed),
    timeLabel: parsed.toLocaleTimeString('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  };
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
  errorMessage,
  onSongClick
}) => (
  <Paper elevation={4} sx={{ p: 1, width: '100%', boxSizing: 'border-box' }}>
    <Box dir="rtl">
      <Typography margin="7px 7px 9px 7px" variant="h5" component="h2" gutterBottom>
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
            <TableCell align="center" sx={{ width: { xs: '5%', sm: '5%' } }}>#</TableCell>
            <TableCell align="center" sx={{ width: { xs: '10%', sm: '12%' } }}></TableCell>
            <TableCell align="right" sx={{ width: { xs: '42%', sm: '28%' } }}>שיר</TableCell>
            <TableCell align="center" sx={{ width: { xs: '5%', sm: '10%' } }}>השמעות</TableCell>
            <TableCell align="center" sx={{ width: { xs: '0%', sm: '25%' }, display: { xs: 'none', sm: 'table-cell' } }}>תחנות מובילות</TableCell>
            <TableCell align="center" sx={{ width: { xs: '30%', sm: '20%' } }}>הושמע לאחרונה</TableCell>
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
            const handleRowClick = () => {
              if (onSongClick) {
                onSongClick(song.id);
              }
            };
            const handleRowKeyDown = (event) => {
              if (!onSongClick) {
                return;
              }
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onSongClick(song.id);
              }
            };

            const { dateLabel, timeLabel } = formatDateTimeParts(song.lastPlayedAt);

            return (
              <TableRow
                key={song.id}
                hover
                onClick={handleRowClick}
                onKeyDown={handleRowKeyDown}
                tabIndex={onSongClick ? 0 : undefined}
                role={onSongClick ? 'button' : undefined}
                sx={{ cursor: onSongClick ? 'pointer' : 'default' }}
              >
                <TableCell align="center" sx={{ width: { xs: '5%', sm: '5%' } }}>{rank}</TableCell>
                <TableCell align="center" sx={{ width: { xs: '10%', sm: '12%' }, padding: { xs: '3px', sm: '12px' } }}>
                  <Avatar
                    src={song.imageUrl || undefined}
                    alt={song.title}
                    sx={{ width: { xs: 40, sm: 55 }, height: { xs: 40, sm: 55 }, margin: '0 auto' }}
                  >
                    {(song.title || '?').trim().charAt(0).toUpperCase() || '?'}
                  </Avatar>
                </TableCell>
                <TableCell align="right" sx={{ width: { xs: '42%', sm: '28%' } }}>
                  <Typography 
                    variant="subtitle1"
                    sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, lineHeight: 1.3 }}
                  >
                    {song.title}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                  >
                    {song.artist}
                  </Typography>
                  {song.album && (
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ display: { xs: 'none', sm: 'block' } }}
                    >
                      אלבום: {song.album}
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="center" sx={{ width: { xs: '2%', sm: '10%' } }}>
                  <Typography variant="subtitle1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>{song.plays}</Typography>
                </TableCell>
                <TableCell align="center" sx={{ width: { xs: '0%', sm: '25%' }, display: { xs: 'none', sm: 'table-cell' } }}>
                  <StationBreakdown stationBreakdown={stations} />
                </TableCell>
                <TableCell 
                  align="center" 
                  sx={{ 
                    width: { xs: '25%', sm: '20%' }
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
                      {dateLabel}
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontSize: { xs: '0.8rem', sm: '0.87rem' } }}>
                      {timeLabel}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Box display="flex" justifyContent="space-between" alignItems="center" mt={3}>
        <Button variant="text" onClick={onPrev} disabled={page === 0 || isLoading}>
          קדימה
        </Button>
        <Typography variant="body2">עמוד {page + 1}</Typography>
        <Button variant="text" onClick={onNext} disabled={!hasMore || isLoading}>
          אחורה
        </Button>
      </Box>
    </Box>
  </Paper>
);

export default TopSongsTable;
