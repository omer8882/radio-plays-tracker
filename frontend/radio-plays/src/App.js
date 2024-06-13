import React from 'react';
import { Container, Box, Typography } from '@mui/material';
import StationContainer from './components/StationContainer';
import TopHits from './components/TopHits';
import eco99Logo from './assets/eco99_logo.png';
import glglzLogo from './assets/glglz_logo.png';
import fm100Logo from './assets/100fm_logo.png';
import kan88Logo from './assets/kan88_logo.png';

function App() {
  return (
    <Container display="flex" >
      <Typography variant="h3" font align="center">מה הושמע ברדיו</Typography>
      <Box display="flex" justifyContent="space-around" flexWrap="wrap">
        <StationContainer 
          station="glglz" 
          logo={glglzLogo} 
          bgColor="#D1C4E9"
        />
        <StationContainer 
          station="eco99" 
          logo={eco99Logo} 
          bgColor="#BBDEFB"
        />
        <StationContainer 
          station="radius100" 
          logo={fm100Logo} 
          bgColor="#cccc31"
        />
        <StationContainer 
          station="kan88" 
          logo={kan88Logo} 
          bgColor="#b38bae"
        />
        <Box my={4}>
          <TopHits />
        </Box>
      </Box>
    </Container>
  );
}

export default App;
