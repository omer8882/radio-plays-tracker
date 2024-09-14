import React from 'react';
import { AppBar, Toolbar, Typography } from '@mui/material';
import RadioIcon from '@mui/icons-material/Radio';

const TopToolbar = () => {
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
      dir='rtl'
    >
      <Toolbar sx={{ justifyContent: 'space-between', padding: 0, margin: 0, minHeight: '50px', height: '40px'}}>
        <RadioIcon />
        <Typography variant="subtitle1" style={{ fontWeight: 'bold' }} sx={{ paddingRight: '10px', flexGrow: 1, color: '#FFFFFF'}}>
          מה הושמע ברדיו
        </Typography>

      </Toolbar>
    </AppBar>
  );
};

export default TopToolbar;
