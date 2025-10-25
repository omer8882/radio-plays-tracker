// StationBreakdown.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
    '100fm': {
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
      bgColor: '#ebe834'
    }
};

const StationBreakdown = ({ stationBreakdown }) => {
  const containerRef = useRef(null);
  const [isRtl, setIsRtl] = useState(false);

  const entries = useMemo(() => Object.entries(stationBreakdown ?? {})
    .map(([station, plays]) => {
      const normalized = typeof station === 'string'
        ? station.replace(/\s+/g, '').toLowerCase()
        : station;
      const info = normalized ? stationsInfo[normalized] : undefined;

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
      <Box sx={{ display: 'flex', padding: '3px', justifyContent: 'center' }}>
        <Box
          ref={containerRef}
          sx={{ backgroundColor: '#f0f0f0', borderRadius: '10px', display: 'inline-flex', gap: '0px' }}
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
                padding: '10px 10px 7px 10px',
                borderRadius,
                transition: 'transform 0.3s, box-shadow 0.3s',
                '&:hover': {
                  transform: 'scale(1.03)',
                  boxShadow: '0 3px 5px rgba(0, 0, 0, 0.2)',
                },
              }}
            >
              <Box component="img" src={info.logo} alt={`${key} logo`} sx={{ width: '30px', height: '30px', objectFit: 'contain' }} />
              <Typography sx={{ textAlign: 'center', marginTop: '8px' }}><strong>{plays}</strong></Typography>
            </Box>
          );
          })}
        </Box>
      </Box>
    </Box>
  );
};

export default StationBreakdown;