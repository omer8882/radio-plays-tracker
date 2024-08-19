import React from 'react';
import { Box, InputBase, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const SearchBar = ({ query, setQuery, handleSearch }) => {
  const handleInputChange = (e) => {
    setQuery(e.target.value);
  };

  const handleKeyDown = (e) => {
    if ( e.key === 'Enter') {
      handleSearch(e);
    }
  };

  return (
    <Box
      sx={{
        margin: "5px 0px 0px 0px",
        padding: "8px",
        borderRadius: "8px",
        border: "1px solid #ccc",
        width: "100%",
        display: "flex",
        justifyContent: "start",
        gap: "0.5em",
        alignItems: "center",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
      }}
    >
      <IconButton onClick={handleSearch} aria-label="Search">
        <SearchIcon />
      </IconButton>
      <InputBase
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        sx={{
          width: "100%",
          border: 'none',
          outline: 'none',
        }}
        placeholder="Search"
      />
    </Box>
  );
};

export default SearchBar;
