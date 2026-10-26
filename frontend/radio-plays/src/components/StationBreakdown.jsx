// StationBreakdown.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { STATION_INFO } from '../constants/stations';

const StationBreakdown = ({ stationBreakdown, compact = false }) => {
  const containerRef = useRef(null);
  const [isRtl, setIsRtl] = useState(false);

  const entries = useMemo(() => Object.entries(stationBreakdown ?? {})
    .map(([station, plays]) => {
      const normalized = typeof station === 'string'
        ? station.replace(/\s+/g, '').toLowerCase()
        : station;
      const info = normalized ? STATION_INFO[normalized] : undefined;

      if (!info) {
        return null;
      }

      return { key: normalized, plays, info };
    })
    .filter(Boolean), [stationBreakdown]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const element = containerRef.current;
    if (!element) {
      return;
    }

    const detectedDirection = window.getComputedStyle(element).direction;
    setIsRtl(detectedDirection === 'rtl');
  }, [entries]);

  if (entries.length === 0) {
    return <Typography></Typography>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', padding: compact ? 0 : '3px', justifyContent: 'center' }}>
        <Box
          ref={containerRef}
          dir="rtl"
          sx={{ backgroundColor: 'app.overlay', borderRadius: '10px', display: 'inline-flex' }}
        >
          {entries.map(({ key, plays, info }, index) => {
            const isFirst = index === 0;
            const isLast = index === entries.length - 1;

            let borderRadius;
            if (entries.length === 1) {
              borderRadius = '10px';
            } else if (isFirst) {
              borderRadius = isRtl ? '0px 10px 10px 0px' : '10px 0px 0px 10px';
            } else if (isLast) {
              borderRadius = isRtl ? '10px 0px 0px 10px' : '0px 10px 10px 0px';
            } else {
              borderRadius = '0';
            }

            return (
            <Box
              key={key}
              sx={{
                backgroundColor: info.bgColor,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: compact ? '4px 6px 3px 6px' : '10px 10px 7px 10px',
                borderRadius,
                transition: 'transform 0.3s, box-shadow 0.3s',
                '&:hover': {
                  transform: 'scale(1.03)',
                  boxShadow: '0 3px 5px rgba(0, 0, 0, 0.2)',
                }
              }}
            >
              <Box component="img" src={info.logo} alt={`${key} logo`} sx={{ width: compact ? '18px' : '30px', height: compact ? '18px' : '30px', objectFit: 'contain' }} />
              <Typography variant={compact ? 'caption' : 'body1'} sx={{ textAlign: 'center', marginTop: compact ? '2px' : '8px', lineHeight: 1.1 }}><strong>{plays}</strong></Typography>
            </Box>
          );
          })}
        </Box>
      </Box>
    </Box>
  );
};

export default StationBreakdown;