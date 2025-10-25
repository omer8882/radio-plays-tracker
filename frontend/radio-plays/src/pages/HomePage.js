import React from 'react';
import { Box } from '@mui/material';
import SearchAround from '../components/SearchAround/SearchAround';
import LastPlays from '../components/LastPlays/LastPlays';
import TopHitsPreview from '../components/TopHits';

const HomePage = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '90%', mx: 'auto' }}>
    <SearchAround />
    <Box display="flex" justifyContent="space-around" flexWrap="wrap" aria-label="Last played on stations" sx={{ width: '100%', padding: '0 20px' }}>
      <LastPlays />
      <Box my={4}>
        <TopHitsPreview />
      </Box>
    </Box>
  </Box>
);

export default HomePage;
