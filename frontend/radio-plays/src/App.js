import React from 'react';
import { Box, Typography } from '@mui/material';
import TopHits from './components/TopHits';
import SearchAround from './components/SearchAround/SearchAround';
import LastPlays from './components/LastPlays/LastPlays';
import AppBar from './components/AppBar';

function App() {
  return (
    <Box sx={{ width: '100%', backgroundColor: '#EEEEEE'}}>
      <AppBar />
      
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '90%', mx: 'auto' }}>
        <SearchAround />
        <Box display="flex" justifyContent="space-around" flexWrap="wrap" aria-label="Last played on stations" sx={{ width: '100%', padding: '0 20px' }}>
          <LastPlays />
          <Box my={4}>
            <TopHits />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default App;
