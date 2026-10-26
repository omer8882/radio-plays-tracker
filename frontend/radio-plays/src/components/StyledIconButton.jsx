import React from 'react';
import { IconButton, Box } from '@mui/material';

const StyledIconButton = ({ href, ariaLabel, iconSrc, iconSize = 30 }) => {
  return (
    <IconButton
      component="a"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      sx={{ 
        padding: 0, 
        width: iconSize, 
        height: iconSize 
      }}
      aria-label={ariaLabel}
    >
      <Box 
        component="img" 
        src={iconSrc} 
        alt={ariaLabel} 
        sx={{ width: iconSize, height: iconSize, objectFit: 'contain' }} 
      />
    </IconButton>
  );
};

export default StyledIconButton;
