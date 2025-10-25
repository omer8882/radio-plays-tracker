import React, { useState } from 'react';
import SongList from '../SongList';
import { Box, ToggleButton, ToggleButtonGroup, Typography} from '@mui/material';
import { STATIONS } from '../../constants/stations';

const LastPlays = () => {
    const [selectedStation, setSelectedStation] = useState(STATIONS[STATIONS.length - 1]);

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
                {STATIONS.map((station) => (
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
