import React, { useState, useRef } from 'react';
import { Box } from '@mui/material';
import axios from 'axios';
import SearchBar from './SearchBar';
import SearchResultsPopover from './SearchResultsPopover';

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [anchor, setAnchor] = useState(null);
  const textFieldRef = useRef(null);

  const handleSearch = async (event) => {
    console.log("Search triggered");
    setAnchor(textFieldRef.current);
    try {
      const response = await axios.get(`http://192.168.1.36:5000/api/search?query=${query}`);
      setResults(response.data);
    } catch (error) {
      console.error("Error fetching search results:", error);
    }
  };

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
      />
    </Box>
  );
};

export default Search;
