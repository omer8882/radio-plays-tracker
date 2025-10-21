import React, { useEffect, useMemo, useState } from 'react';
import { List, Box, Button, Typography } from '@mui/material';
import SongListItem from './SongListItem';
import SongDetailsPage from './SongDetailsPage';
import axios from 'axios';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import './SongList.css';
import { API_BASE_URL } from '../config';

const SongList = ({ station }) => {
  // Placeholder data for loading and error cases
  const ghost_data = [
    {time: " ", title: " ", artist: " "},
    {time: " ", title: " ", artist: " "},
    {time: " ", title: " ", artist: " "},
    {time: " ", title: " ", artist: " "},
    {time: " ", title: " ", artist: " "},
    {time: " ", title: " ", artist: " "},
    {time: " ", title: " ", artist: " "},
    {time: " ", title: " ", artist: " "},
    {time: " ", title: " ", artist: " "},
    {time: " ", title: " ", artist: " "},
  ];
  const error_songs = [
    { time: "00:00", title: "server error", artist: "" }
  ];
  
  const PAGE_SIZE = 10;

  const [displayedSongs, setDisplayedData] = useState(ghost_data);
  const [showModal, setShowModal] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  const stationName = useMemo(() => station.name, [station]);

  useEffect(() => {
    setPage(0);
  }, [stationName]);

  useEffect(() => {
    let isSubscribed = true;

    const fetchData = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/station_last_plays`, {
          params: {
            station: stationName,
            limit: PAGE_SIZE,
            page
          }
        });

        if (!isSubscribed) {
          return;
        }

        const payload = response.data;
        if (Array.isArray(payload)) {
          setDisplayedData(payload);
          setHasMore(payload.length === PAGE_SIZE);
        } else {
          const items = Array.isArray(payload.items) ? payload.items : [];
          setDisplayedData(items);
          setHasMore(Boolean(payload.hasMore));
        }
      } catch (err) {
        console.error("Error fetching songs:", err);
        if (!isSubscribed) {
          return;
        }
        setDisplayedData(error_songs);
        setHasMore(false);
        setErrorMessage('הייתה בעיה בטעינת הנתונים, נסו שוב בעוד רגע.');
      } finally {
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    if (page === 0) {
      const interval = setInterval(fetchData, 2 * 60 * 1000); // Refresh first page every 2 minutes
      return () => {
        isSubscribed = false;
        clearInterval(interval);
      };
    }

    return () => {
      isSubscribed = false;
    };
  }, [stationName, page]);

  const handleSongClick = (song) => {
    setSelectedSong(song);
    setShowModal(true);
  };

  return (
    <>
      <Box 
        alignItems="center" 
        sx={{
          backgroundColor: station.bgColor,
          justifyContent: 'center',
          borderRadius: '0px 0px 10px 10px',
          margin: '0px 2px 5px 2px',
          padding: '0px',
          width: '100%',
          boxShadow: 2,
          boxSizing: 'border-box',
          border: '1px solid',
          borderColor: '#c0c0c0',
          borderTop: '0px',
        }}
      >
  <List>
          <TransitionGroup component={null}>
            {displayedSongs.map((song, index) => (
                <SongListItem song={song} onClick={() => handleSongClick(song)} />
            ))}
          </TransitionGroup>
        </List>
      </Box>

      <Box display="flex" alignItems="center" justifyContent="space-between" mt={1} px={1}>
        <Button
          variant="text"
          onClick={() => setPage((current) => Math.max(current - 1, 0))}
          disabled={page === 0 || isLoading}
        >
          חדשים יותר
        </Button>
        <Typography variant="body2">
          עמוד {page + 1}
        </Typography>
        <Button
          variant="text"
          onClick={() => setPage((current) => current + 1)}
          disabled={!hasMore || isLoading}
        >
          ישנים יותר
        </Button>
      </Box>

      {errorMessage && (
        <Typography variant="caption" color="error" display="block" align="center" mt={1}>
          {errorMessage}
        </Typography>
      )}

      {selectedSong && (
        <SongDetailsPage
        showModal={showModal}
        setShowModal={setShowModal}
        songId={selectedSong.id}
      />
      )}
    </>
  );
};

export default SongList;
