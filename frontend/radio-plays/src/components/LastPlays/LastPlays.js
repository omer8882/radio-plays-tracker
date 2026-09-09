import React, { useState } from 'react';
import SongList from '../SongList';
import { Box, ToggleButton } from '@mui/material';
import { STATIONS } from '../../constants/stations';
import SectionColumn from '../SectionColumn';

const LastPlays = () => {
    const [selectedStation, setSelectedStation] = useState(STATIONS[0]);

    /*
      Deliberately not a ToggleButtonGroup: the group squares off the "inner"
      corners of the end buttons based on theme.direction, which desyncs from
      this strip's dir="rtl". Each tab is a self-contained button and only the
      two outer corners are rounded with logical properties, so the strip reads
      as one bar and a direction change can never square off the wrong side.
    */
    const tabs = (
        <Box
            dir="rtl"
            role="group"
            aria-label="station selection"
            sx={{ display: 'flex', width: '100%' }}
        >
            {STATIONS.map((station, index) => {
                const isSelected = selectedStation.name === station.name;
                const isFirst = index === 0;
                const isLast = index === STATIONS.length - 1;
                return (
                    <ToggleButton
                        key={station.name}
                        value={station.name}
                        selected={isSelected}
                        onClick={() => setSelectedStation(station)}
                        aria-label={station.displayName}
                        sx={{
                            flex: 1,
                            minWidth: 0,
                            py: 1,
                            px: 0.5,
                            border: '1px solid',
                            borderColor: 'app.hairline',
                            borderBottom: 'none',
                            borderRadius: 0,
                            borderStartStartRadius: '8px',
                            borderStartEndRadius: '8px',
                            ...(isFirst ? {} : { borderStartStartRadius: 0 }),
                            ...(isLast ? {} : { borderStartEndRadius: 0 }),
                            borderInlineStartWidth: isFirst ? '1px' : 0,
                            backgroundColor: 'background.paper',
                            '&.Mui-selected, &.Mui-selected:hover': {
                                backgroundColor: station.bgColor
                            }
                        }}
                    >
                        <Box
                            component="img"
                            src={station.logo}
                            alt={`${station.displayName} logo`}
                            sx={{ width: '100%', height: 28, objectFit: 'contain' }}
                        />
                    </ToggleButton>
                );
            })}
        </Box>
    );

    return (
        <SectionColumn title="השמעות אחרונות" control={tabs}>
            <SongList station={selectedStation} />
        </SectionColumn>
    );
};

export default LastPlays;
