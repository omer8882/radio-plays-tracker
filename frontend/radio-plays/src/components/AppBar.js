import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import RadioIcon from '@mui/icons-material/Radio';
import { Link as RouterLink, useLocation } from 'react-router-dom';

const TopToolbar = () => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <AppBar
      position="static"
      sx={{
        backgroundColor: '#BAB2B5', //b2a7c7
        margin: 0,
        padding: 0,
        boxSizing: 'border-box',
        width: '100%'
      }}
      dir="rtl"
    >
      <Toolbar sx={{ justifyContent: 'flex-start', padding: 0, margin: 0, minHeight: '50px', height: '40px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <RadioIcon />
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#FFFFFF', mr: 1 }}>
            מה הושמע ברדיו
          </Typography>
          <Button
            component={RouterLink}
            to="/"
            color={isActive('/') ? 'inherit' : 'info'}
            sx={{ color: isActive('/') ? '#2E2E2E' : '#FFFFFF' }}
          >
            בית
          </Button>
          <Button
            component={RouterLink}
            to="/top-hits"
            color={isActive('/top-hits') ? 'inherit' : 'info'}
            sx={{ color: isActive('/top-hits') ? '#2E2E2E' : '#FFFFFF' }}
          >
            להיטים
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default TopToolbar;
