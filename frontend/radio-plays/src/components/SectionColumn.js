import React from 'react';
import { Box, Typography } from '@mui/material';

// Height of the control strip that sits between a column heading and its panel.
// Both homepage columns reserve the same height and bottom-align their control,
// so the panels below start on exactly the same line.
export const CONTROL_ROW_HEIGHT = 54;

/**
 * The homepage columns previously had different anatomy — one had its heading
 * outside the card and the other kept its title inside — so their top edges
 * could never line up. This gives both the same three-part shape:
 * heading, control strip, panel.
 */
const SectionColumn = ({ title, control, children, footer }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', minWidth: 0 }}>
    <Typography variant="h5" component="h2" align="center" sx={{ mb: 1 }}>
      {title}
    </Typography>

    <Box
      sx={{
        minHeight: CONTROL_ROW_HEIGHT,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'flex-end'
      }}
    >
      {control}
    </Box>

    {children}

    {footer}
  </Box>
);

export default SectionColumn;
