import React from 'react';
import { Box, Paper } from '@mui/material';
import SongList from './SongList';

const StationContainer = ({ station, logo, bgColor }) => {
  return (
    <Paper style={{ padding: '0px', backgroundColor: bgColor, borderRadius: '15px', margin: '20px 2px 10px 2px'}}  sx={{ boxShadow: 4 }}>
      <Box display="flex" flexDirection="column" alignItems="center">
        <Box component="img" src={logo} alt={`${station} logo`} sx={{ width: '90px', height: '70px', objectFit: 'contain', margin: '10px 0px 10px 0px' }} />
        <SongList station={station} />
      </Box>
    </Paper>
  );
};

export default StationContainer;
