import React, { useState, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import axios from 'axios';
import SearchBar from './SearchBar';
import SearchResultsPopover from '../SearchResultsPopover';

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [anchor, setAnchor] = useState(null);
  const textFieldRef = useRef(null);

  const handleSearch = async (event) => {
    console.log("Search triggered");
    setAnchor(textFieldRef.current);
    try {
      const response = await axios.get(`https://server.mahushma.com/api/search?query=${query}`);
      setResults(response.data);
    } catch (error) {
      console.error("Error fetching search results:", error);
    }
  };

  const showSongDetailsItem = (song) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', margin: '0', borderRadius: '0' }}>
      <Box>
        <Typography variant="subtitle1" align="left">{`${song.name} - ${song.artists[0].name}`}</Typography>
        <Typography variant="body2" align="left" color="textSecondary">{`${song.album.name}`}</Typography>
      </Box>
      <Box>
        <Typography variant="subtitle1" align="right"></Typography>
      </Box>
    </Box>
  );

  const handleClose = () => {
    setAnchor(null);
    setResults([]);
  };

  const open = Boolean(anchor);
  const id = open ? 'search-popover' : undefined;

  return (
    <Box>
      <Box display="flex" justifyContent="center" alignItems="center" mb={2}>
        <Box ref={textFieldRef} sx={{ width: '70%' }}>
          <SearchBar query={query} setQuery={setQuery} handleSearch={handleSearch} />
        </Box>
      </Box>
      <SearchResultsPopover
        id={id}
        open={open}
        anchorEl={anchor}
        handleClose={handleClose}
        results={results}
        textFieldRef={textFieldRef}
        showItemDetails={showSongDetailsItem}
      />
    </Box>
  );
};

export default Search;
