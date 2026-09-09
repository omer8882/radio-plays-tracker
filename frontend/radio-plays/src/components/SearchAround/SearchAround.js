import React, { useState, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import axios from 'axios';
import SearchAroundBar from './SearchAroundBar';
import SearchResultsPopover from '../SearchResultsPopover';
import { API_BASE_URL } from '../../config';
import { ROW_MIN_HEIGHT } from '../../theme';

const SearchAround = () => {
  const [results, setResults] = useState([]);
  const [anchor, setAnchor] = useState(null);
  const [chosenTimestamp, setChosenTimestamp] = useState(null);
  const [noResults, setNoResults] = useState(false);
  const textFieldRef = useRef(null);

  const handleSearch = async ({ date, time, station }) => {
    // Combine date and time into a single timestamp
    const timestamp = new Date(date);
    timestamp.setHours(time.getHours());
    timestamp.setMinutes(time.getMinutes());
    timestamp.setSeconds(0);
    timestamp.setMilliseconds(0);
    setChosenTimestamp(timestamp);
    setNoResults(false);
    
    // Format as local time (Israel time) without timezone conversion
    // YYYY-MM-DDTHH:MM:SS format (no Z suffix, so backend treats it as local Israel time)
    const year = timestamp.getFullYear();
    const month = String(timestamp.getMonth() + 1).padStart(2, '0');
    const day = String(timestamp.getDate()).padStart(2, '0');
    const hours = String(timestamp.getHours()).padStart(2, '0');
    const minutes = String(timestamp.getMinutes()).padStart(2, '0');
    const seconds = String(timestamp.getSeconds()).padStart(2, '0');
    const formattedTimestamp = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;

    setAnchor(textFieldRef.current);

    try {
  const response = await axios.get(`${API_BASE_URL}/api/search_around?station=${station}&timestamp=${encodeURIComponent(formattedTimestamp)}&range_minutes=40`);
      if (response.data.length > 0) {
        setResults(response.data);
        setNoResults(false);
      } else {
        setResults([]);
        setNoResults(true);
      }
    } catch (error) {
      console.error("Error fetching search around results:", error);
      setResults([]);
      setNoResults(true);
    }
  };

  const showSongDetailsItem = (song, chosenTimestamp) => {
    const chosenTime = new Date(chosenTimestamp).getTime();
    const playedTime = new Date(song.playedAt).getTime();
    const timeDifference = Math.abs(chosenTime - playedTime) / (1000 * 60); // Difference in minutes
    const maxOpacity = 0.2; // Max opacity for closest time
    const minOpacity = 0.0; // Min opacity for furthest time
    const opacity = Math.max(minOpacity, maxOpacity - (timeDifference / 60)); // Assuming 30 minutes range
    const backgroundColor = `rgba(0, 0, 0, ${opacity})`;
  
    return (
      <Box sx={{ display: 'flex', background: backgroundColor, px: 1.5, py: 1, width: '100%', minHeight: ROW_MIN_HEIGHT, alignItems: 'center', justifyContent: 'space-between', borderRadius: 0 }}>
        <Typography variant="subtitle2" className="num" align="left">
          {song?.playedAt?.slice(11, 16)}
        </Typography>
        <Box sx={{ minWidth: 0, marginInlineStart: 2 }}>
          <Typography variant="subtitle2" align="right" noWrap>{song?.name}</Typography>
          <Typography variant="caption" color="text.secondary" align="right" component="div" noWrap>
            {song?.artists[0]?.name}
          </Typography>
        </Box>
      </Box>
    );
  };

  const handleClose = () => {
    setAnchor(null);
    setResults([]);
    setNoResults(false);
  };

  const open = Boolean(anchor);
  const id = open ? 'search-around-popover' : undefined;

  return (
    <Box sx={{ display: 'flex', width: '100%' }}>
      <Box ref={textFieldRef} sx={{ width: '100%' }}>
        <SearchAroundBar onSearch={handleSearch} />
      </Box>
      <SearchResultsPopover
        id={id}
        open={open}
        anchorEl={anchor}
        handleClose={handleClose}
        results={results}
        textFieldRef={textFieldRef}
        showItemDetails={(song) => showSongDetailsItem(song, chosenTimestamp)}
        noResults={noResults}
      />
    </Box>
  );
};
export default SearchAround;
