import React from 'react';
import { Box, Accordion, AccordionSummary, AccordionDetails, } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SongList from './SongList';

const StationContainer = ({ station, logo, bgColor }) => {
  return (
    <Accordion style={{backgroundColor: bgColor, borderRadius: '15px', margin: '10px 2px 5px 2px', width: '100%'}} sx={{ boxShadow: 6 }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls={`${station}-content`} id={`${station}-header`}>
        <Box display="flex" flexDirection="column" alignItems="center" width="100%">
          <Box component="img" src={logo} alt={`${station} logo`} sx={{ width: '90px', height: '70px', objectFit: 'contain', margin: '5px 0px 5px 0px' }} />
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ padding: '0 0px', }}>
        <SongList station={station}/>
      </AccordionDetails>
    </Accordion>
  );
};

export default StationContainer;
