import React from 'react';
import { Box } from '@mui/material';
import './EqualizerIcon.css'; // Separate CSS for the animation

const EqualizerIcon = () => {
  return (
    <Box className="equalizer">
      <Box className="bar"></Box>
      <Box className="bar"></Box>
      <Box className="bar"></Box>
      <Box className="bar"></Box>
      <Box className="bar"></Box>
    </Box>
  );
};

export default EqualizerIcon;
