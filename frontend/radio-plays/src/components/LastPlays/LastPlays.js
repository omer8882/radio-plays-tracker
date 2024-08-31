import React, { useState } from 'react';
import SongList from '../SongList';
import { Box, ToggleButton, ToggleButtonGroup, Typography} from '@mui/material';

import eco99Logo from '../../assets/eco99_logo.png';
import glglzLogo from '../../assets/glglz_logo.png';
import fm100Logo from '../../assets/100fm_logo.png';
import kan88Logo from '../../assets/kan88_logo.png';
import fm103Logo from '../../assets/103fm_logo.png';
import galatzLogo from '../../assets/galatz_logo.png';

const stationsInfo = [
    { name: 'galatz', logo: galatzLogo, bgColor: '#f5f5f5' },
    { name: '103fm', logo: fm103Logo, bgColor: '#64D1DE' },
    { name: 'kan88', logo: kan88Logo, bgColor: '#b38bae' },
    { name: 'radius100', logo: fm100Logo, bgColor: '#cccc31' },
    { name: 'eco99', logo: eco99Logo, bgColor: '#BBDEFB' },
    { name: 'glglz', logo: glglzLogo, bgColor: '#D1C4E9' },
];

const LastPlays = () => {
    const [selectedStation, setSelectedStation] = useState(stationsInfo[stationsInfo.length-1]);

    const handleStationChange = (event, newStation) => {
        if (newStation !== null) {
            setSelectedStation(newStation);
        }
    };

    return (
        <Box sx={{ justifyContent: 'center', display: 'flex', flexWrap: 'wrap'}} alignItems="center" maxWidth="600px">
            <Typography variant="h5" font align="center" sx={{margin:"8px 0px 8px 0px"}}>:השמעות אחרונות</Typography>

            <ToggleButtonGroup value={selectedStation} exclusive onChange={handleStationChange} aria-label="station selection" dir="ltr" 
                sx={{ width: '100%' }}>
                {stationsInfo.map((station) => (
                    <ToggleButton
                        key={station.name}
                        value={station}
                        aria-label={station.name}
                        sx={{
                            color: station.bgColor,
                            width: '100%',
                            margin: '1px 1px 0px 1px',
                            padding: '10px',
                            borderRadius: '8px 8px 0px 0px',
                            borderBottom: 'none',
                            '&.Mui-selected, &.Mui-selected:hover': {
                                backgroundColor: station.bgColor,
                            }
                        }}
                    >
                        <Box component="img" src={station.logo} alt={`${station.name} logo`} sx={{display: 'flex', justifyContent: 'space-between', width: '100%', height: '30px', objectFit: 'contain' }} />
                    </ToggleButton>
                ))}
            </ToggleButtonGroup>
                
            <SongList station={selectedStation} />
        </Box>
    );
};

export default LastPlays;
