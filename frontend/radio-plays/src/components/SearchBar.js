import React from 'react';
import { TextField, Box } from '@mui/material';

const SearchBar = () => {
  return (
    <Box my={2}>
      <TextField fullWidth variant="outlined" label="Search for a song..." />
    </Box>
  );
};

export default SearchBar;
