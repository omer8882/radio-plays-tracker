import React from 'react';
import { Container, Box, Typography } from '@mui/material';
import TopHits from './components/TopHits';
//import Search from './components/Search';
import SearchAround from './components/SearchAround/SearchAround';
import LastPlays from './components/LastPlays/LastPlays';

function App() {
  return (
    <Container display="flex" >
      <Typography variant="h3" font align="center" sx={{margin:"8px 0px 8px 0px"}}>מה הושמע ברדיו</Typography>
      <SearchAround/>
      <Box display="flex" justifyContent="space-around" flexWrap="wrap" aria-label="Last played on stations">
        <LastPlays/>
        <Box my={4}>
          <TopHits />
        </Box>
      </Box>
    </Container>
  );
}

export default App;
