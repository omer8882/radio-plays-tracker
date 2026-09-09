import React, { useEffect, useState } from 'react';
import { List, Box, Typography } from '@mui/material';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import SongListItem from './SongListItem';
import SongListSkeleton from './SongListSkeleton';
import Pagination from './Pagination';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import './SongList.css';
import { fetchStationPlays, queryKeys } from '../api';
import { useSongModal } from '../hooks/useSongModal';

const PAGE_SIZE = 10;

const SongList = ({ station }) => {
  const [page, setPage] = useState(0);
  const { openSong } = useSongModal();

  const stationName = station.name;

  useEffect(() => {
    setPage(0);
  }, [stationName]);

  const { data, isPending, isError, isFetching } = useQuery({
    queryKey: queryKeys.stationPlays(stationName, page, PAGE_SIZE),
    queryFn: ({ signal }) => fetchStationPlays(stationName, page, PAGE_SIZE, signal),
    // Keep showing the previous station/page while the next one loads, so
    // switching never flashes an empty panel.
    placeholderData: keepPreviousData,
    // Only the newest page is live; older pages never change.
    refetchInterval: page === 0 ? 2 * 60 * 1000 : false
  });

  const payload = data ?? {};
  const songs = Array.isArray(payload) ? payload : (payload.items ?? []);
  const hasMore = Array.isArray(payload) ? payload.length === PAGE_SIZE : Boolean(payload.hasMore);

  return (
    <>
      <Box
        alignItems="center"
        sx={{
          backgroundColor: station.bgColor,
          justifyContent: 'center',
          borderRadius: '0px 0px 10px 10px',
          overflow: 'hidden',
          width: '100%',
          boxShadow: 1,
          boxSizing: 'border-box',
          border: '1px solid',
          borderColor: 'app.hairline',
          borderTop: '0px',
          // Refresh in place rather than moving the page.
          opacity: isFetching && !isPending ? 0.6 : 1,
          transition: 'opacity 150ms ease'
        }}
      >
        <List sx={{ py: 0 }}>
          {isPending ? (
            <SongListSkeleton rows={PAGE_SIZE} />
          ) : (
            <TransitionGroup component={null}>
              {songs.map((song, index) => (
                <CSSTransition key={song.id || index} timeout={400} classNames="fade-slide">
                  <SongListItem song={song} onClick={() => openSong(song.id)} />
                </CSSTransition>
              ))}
            </TransitionGroup>
          )}
        </List>
      </Box>

      <Pagination
        page={page}
        hasMore={hasMore}
        onPrev={() => setPage((current) => Math.max(current - 1, 0))}
        onNext={() => setPage((current) => current + 1)}
        disabled={isPending}
        prevLabel="חדשים יותר"
        nextLabel="ישנים יותר"
      />

      {isError && (
        <Typography variant="caption" color="error" display="block" align="center" mt={1}>
          הייתה בעיה בטעינת הנתונים, נסו שוב בעוד רגע.
        </Typography>
      )}
    </>
  );
};

export default SongList;
