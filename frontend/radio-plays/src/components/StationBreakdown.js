// StationBreakdown.js
import React from 'react';
import { Box, Typography } from '@mui/material';

// Import station logos
import eco99Logo from '../assets/eco99_logo.png';
import glglzLogo from '../assets/glglz_logo.png';
import fm100Logo from '../assets/100fm_logo.png';
import kan88Logo from '../assets/kan88_logo.png';
import fm103Logo from '../assets/103fm_logo.png';
import galatzLogo from '../assets/galatz_logo.png';

const stationsInfo = {
    'glglz': {
      logo: glglzLogo,
      bgColor: '#D1C4E9'
    },
    'eco99': {
      logo: eco99Logo,
      bgColor: '#BBDEFB'
    },
    'radius100': {
      logo: fm100Logo,
      bgColor: '#cccc31'
    },
    'kan88': {
      logo: kan88Logo,
      bgColor: '#b38bae'
    },
    '103fm': {
      logo: fm103Logo,
      bgColor: '#64D1DE'
    },
    'galatz': {
      logo: galatzLogo,
      bgColor: '#f0f0f0'
    }
};

const StationBreakdown = ({ stationBreakdown }) => {
return (
    <Box>
        {Object.keys(stationBreakdown).length > 0 ? (
            <Box sx={{ display: 'flex', padding: '3px' , justifyContent: 'center'}}>
            <Box sx={{ backgroundColor: '#f0f0f0', borderRadius: '10px', display: 'inline-flex', gap: '0px' }}>
              {Object.entries(stationBreakdown).map(([station, plays], index) => (
                    <Box key={station}
                    sx={{
                        backgroundColor: stationsInfo[station].bgColor,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '10px 10px 7px 10px',
                        borderRadius: Object.entries(stationBreakdown).length === 1 ? '10px' : index === 0 ? '10px 0px 0px 10px' : index === Object.entries(stationBreakdown).length - 1 ? '0px 10px 10px 0px' : '0', 
                        transition: 'transform 0.3s, box-shadow 0.3s',
                        '&:hover': {
                            transform: 'scale(1.03)',
                            boxShadow: '0 3px 5px rgba(0, 0, 0, 0.2)',
                        },
                      }}>
                        <Box component="img" src={stationsInfo[station].logo} alt={`${station} logo`} sx={{ width: '30px', height: '30px', objectFit: 'contain' }} />
                        <Typography sx={{ textAlign: 'center' , marginTop: '8px'}}><strong>{plays}</strong></Typography>
                    </Box>
                ))}
            </Box>
            </Box>
        ) : (
            <Typography></Typography>
        )}
    </Box>
);
};

export default StationBreakdown;