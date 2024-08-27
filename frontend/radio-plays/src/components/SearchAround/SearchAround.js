import React, { useState, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import axios from 'axios';
import SearchAroundBar from './SearchAroundBar';
import SearchResultsPopover from '../SearchResultsPopover';

const SearchAround = () => {
  const [results, setResults] = useState([]);
  const [anchor, setAnchor] = useState(null);
  const [chosenTimestamp, setChosenTimestamp] = useState(null);
  const textFieldRef = useRef(null);

  const handleSearch = async ({ date, time, station }) => {
    console.log(`SearchAround triggered: ${date}, ${time}, ${station}`);

    // Combine date and time into a single timestamp
    const timestamp = new Date(date);
    timestamp.setHours(time.getHours() + 3);
    timestamp.setMinutes(time.getMinutes());
    setChosenTimestamp(timestamp)
    
    const formattedTimestamp = timestamp.toISOString().slice(0, 19); // Format as required

    setAnchor(textFieldRef.current);

    try {
      const response = await axios.get(`https://server.mahushma.com/api/search_around?station=${station}&timestamp=${encodeURIComponent(formattedTimestamp)}&range_minutes=40`);
      if (response.data.length > 0)
        setResults(response.data);
      else
        setResults([{ name: 'לא נמצאו שירים לזמן זה', artists: [{ name: '' }], played_at: '' }]);
    } catch (error) {
      console.error("Error fetching search around results:", error);
      setResults([]);
    }
  };

  const showSongDetailsItem = (song, chosenTimestamp) => {
    const chosenTime = new Date(chosenTimestamp).getTime();
    const playedTime = new Date(song.played_at).getTime();
    const timeDifference = Math.abs(chosenTime - playedTime) / (1000 * 60); // Difference in minutes
    const maxOpacity = 0.2; // Max opacity for closest time
    const minOpacity = 0.0; // Min opacity for furthest time
    const opacity = Math.max(minOpacity, maxOpacity - (timeDifference / 60)); // Assuming 30 minutes range
    const backgroundColor = `rgba(0, 0, 0, ${opacity})`;
  
    return (
      <Box sx={{ display: 'flex', background: backgroundColor, padding: '15px 20px', width: '100%', justifyContent: 'space-between', margin: '0', borderRadius: '0' }}>
        <Box>
          <Typography variant="subtitle1" align="left" padding='7px 0px 0px 7px'>{song.played_at.slice(11, 16)}</Typography>
        </Box>
        <Box margin='0px 5px 0px 0px'>
          <Typography variant="subtitle1" align="right">{song.name}</Typography>
          <Typography variant="body2" color="textSecondary" align="right">{song.artists[0].name}</Typography>
        </Box>
      </Box>
    );
  };

  const handleClose = () => {
    setAnchor(null);
    setResults([]);
  };

  const open = Boolean(anchor);
  const id = open ? 'search-around-popover' : undefined;

  return (
    <Box sx={{ display: 'flex', width: '100%',justifyContent: "center"}}>
      <Box ref={textFieldRef} display="flex" justifyContent="center" alignItems="center" mb={2}>
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
      />
    </Box>
  );
};

export default SearchAround;
