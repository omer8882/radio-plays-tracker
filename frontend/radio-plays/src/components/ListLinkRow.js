import React from 'react';
import { Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { ROW_MIN_HEIGHT } from '../theme';

/**
 * A "go to the full page" link rendered as the final row of a list.
 *
 * Used by both homepage widgets. As a floating button beneath the pagination it
 * read as disconnected and left dead space; as the last row it sits where the
 * eye already is when it reaches the end of the list.
 */
const ListLinkRow = ({ to, children }) => (
  <Box
    component={RouterLink}
    to={to}
    dir="rtl"
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 0.5,
      minHeight: ROW_MIN_HEIGHT - 12,
      px: 1.5,
      backgroundColor: 'app.overlayStrong',
      color: 'text.primary',
      textDecoration: 'none',
      fontWeight: 600,
      fontSize: '0.875rem',
      '&:hover': { textDecoration: 'underline' }
    }}
  >
    {children}
    <ChevronLeftIcon fontSize="small" />
  </Box>
);

export default ListLinkRow;
