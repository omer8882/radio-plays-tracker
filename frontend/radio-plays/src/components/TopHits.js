import React, { useState } from 'react';
import { Box, Typography, Paper, List, ListItem, Button } from '@mui/material';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { ROW_MIN_HEIGHT } from '../theme';
import { fetchTopHits, queryKeys } from '../api';
import { useSongModal } from '../hooks/useSongModal';
import SectionColumn from './SectionColumn';
import SegmentedControl from './SegmentedControl';
import { DAY_OPTIONS } from '../constants/dayRanges';
import { Link as RouterLink } from 'react-router-dom';

// Matches SongList's page size so the two homepage columns end at the same height.
const HITS_COUNT = 10;

const TopHits = () => {
  const [timeRange, setTimeRange] = useState('7');
  const { openSong } = useSongModal();

  // top_hits carries stationBreakdown for every hit, so this is the only
  // request the widget needs.
  const { data, isFetching, isPending } = useQuery({
    queryKey: queryKeys.topHits(timeRange, HITS_COUNT),
    queryFn: ({ signal }) => fetchTopHits(timeRange, HITS_COUNT, signal),
    placeholderData: keepPreviousData
  });

  const topHits = Array.isArray(data) ? data : [];

  return (
    <SectionColumn
      title="להיטים"
      control={
        <SegmentedControl
          options={DAY_OPTIONS}
          value={timeRange}
          onChange={setTimeRange}
          ariaLabel="time range"
          attached
          fullWidth
        />
      }
      footer={
        <Box display="flex" justifyContent="center" sx={{ pt: 1 }}>
          <Button component={RouterLink} to="/top-hits" size="small" variant="text">
            מעבר לכל הלהיטים
          </Button>
        </Box>
      }
    >
    <Paper
      sx={{
        backgroundColor: 'app.card',
        p: 0,
        overflow: 'hidden',
        width: '100%',
        borderRadius: '0px 0px 10px 10px',
        border: '1px solid',
        borderTop: 0,
        borderColor: 'app.hairline',
        boxShadow: 1,
        opacity: isFetching && !isPending ? 0.6 : 1,
        transition: 'opacity 150ms ease'
      }}
    >
      <List sx={{ py: 0 }}>
        {topHits.map((hit, i) => (
          <ListItem
            button
            key={i}
            onClick={() => openSong(hit.id)}
            sx={{
              display: 'flex',
              width: '100%',
              justifyContent: 'space-between',
              px: 1.5,
              py: 1,
              minHeight: ROW_MIN_HEIGHT,
              backgroundColor: 'app.overlay',
              borderRadius: 0,
              cursor: 'pointer'
            }}
          >
            <Typography variant="subtitle2" className="num" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
              השמעות: {hit.hits}
            </Typography>
            <Box flexGrow={1} display="flex" justifyContent="flex-end" alignItems="center" gap={1.5} sx={{ minWidth: 0 }}>
              <Box sx={{ textAlign: 'right', minWidth: 0 }}>
                <Typography variant="subtitle2" noWrap>{hit.title}</Typography>
                <Typography variant="caption" color="text.secondary" component="div" noWrap>
                  {hit.artist}
                </Typography>
              </Box>
              <Typography
                variant="subtitle1"
                className="num"
                color="text.secondary"
                sx={{ minWidth: 24, textAlign: 'left', flexShrink: 0 }}
              >
                {i + 1}
              </Typography>
            </Box>
          </ListItem>
        ))}
      </List>
    </Paper>
    </SectionColumn>
  );
};

export default TopHits;
