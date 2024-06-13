import React, { useState } from 'react';
import { TextField, Button, Box, List, ListItem, ListItemText } from '@mui/material';
import axios from 'axios';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    try {
      const response = await axios.get(`http://192.168.56.1:5000/api/search?query=${query}`);
      setResults(response.data);
    } catch (error) {
      console.error("Error fetching search results:", error);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="center" alignItems="center" mb={2}>
        <TextField
          variant="outlined"
          label="Search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{ width: '70%' }}
        />
        <Button variant="contained" color="primary" onClick={handleSearch} sx={{ ml: 2 }}>
          Search
        </Button>
      </Box>
      <List>
        {results.map((song) => (
          <ListItem key={song.id} button>
            <ListItemText
              primary={`${song.name} - ${song.artist}`}
              secondary={`${song.album}`}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default SearchBar;
