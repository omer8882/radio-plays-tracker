import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

/**
 * One pagination control for every list. It is dir="rtl", so the previous
 * control sits on the right where a Hebrew reader starts.
 *
 * The tables previously labelled onPrev "קדימה" (forward) and onNext "אחורה"
 * (back), which named each button as its opposite. Labels are overridable so a
 * list can say something more specific, e.g. newer/older for a play feed.
 */
const Pagination = ({
  page,
  hasMore,
  onPrev,
  onNext,
  disabled = false,
  prevLabel = 'הקודם',
  nextLabel = 'הבא'
}) => (
  <Box
    dir="rtl"
    display="flex"
    alignItems="center"
    justifyContent="space-between"
    mt={2}
    px={1}
  >
    <Button
      variant="text"
      onClick={onPrev}
      disabled={page === 0 || disabled}
      startIcon={<ChevronRightIcon />}
    >
      {prevLabel}
    </Button>

    <Typography variant="body2" color="text.secondary">
      עמוד {page + 1}
    </Typography>

    <Button
      variant="text"
      onClick={onNext}
      disabled={!hasMore || disabled}
      endIcon={<ChevronLeftIcon />}
    >
      {nextLabel}
    </Button>
  </Box>
);

export default Pagination;
