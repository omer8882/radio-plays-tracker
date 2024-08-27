import React from 'react';
import { Container, Box, Typography } from '@mui/material';
import StationContainer from './components/StationContainer';
import TopHits from './components/TopHits';
import eco99Logo from './assets/eco99_logo.png';
import glglzLogo from './assets/glglz_logo.png';
import fm100Logo from './assets/100fm_logo.png';
import kan88Logo from './assets/kan88_logo.png';
import fm103Logo from './assets/103fm_logo.png';
import galatzLogo from './assets/galatz_logo.png';
//import Search from './components/Search';
import SearchAround from './components/SearchAround/SearchAround';



function App() {
  return (
    <Container display="flex" >
      <Typography variant="h3" font align="center" sx={{margin:"8px 0px 8px 0px"}}>מה הושמע ברדיו</Typography>
      <SearchAround/>
      <Typography variant="h5" font align="center" sx={{margin:"8px 0px 8px 0px"}}>:השמעות אחרונות</Typography>
      <Box display="flex" justifyContent="space-around" flexWrap="wrap" aria-label="Last played on stations">
        <StationContainer 
          station="glglz" 
          logo={glglzLogo} 
          bgColor="#D1C4E9"
          aria-label="השמעות אחרונות בגלגלצ"
        />
        <StationContainer 
          station="eco99" 
          logo={eco99Logo} 
          bgColor="#BBDEFB"
          aris-label="השמעות אחרונות באקו 99"
        />
        <StationContainer 
          station="radius100" 
          logo={fm100Logo} 
          bgColor="#cccc31"
          aria-label="השמעות אחרונות ברדיוס 100"
        />
        <StationContainer 
          station="kan88" 
          logo={kan88Logo} 
          bgColor="#b38bae"
          aria-label="השמעות אחרונות בכאן 88"
        />
        <StationContainer 
          station="103fm" 
          logo={fm103Logo} 
          bgColor="#64D1DE"
          aria-label="השמעות אחרונות ב103fm"
        />
        <StationContainer 
          station="galatz" 
          logo={galatzLogo} 
          bgColor="#f0f0f0"
          aria-label="השמעות אחרונות בגלי צהל"
        />
        <Box my={4}>
          <TopHits />
        </Box>
      </Box>
    </Container>
  );
}

export default App;
