import React from 'react';
import { Box, ToggleButton } from '@mui/material';
import { RADIUS } from '../theme';

/**
 * A direction-safe replacement for ToggleButtonGroup.
 *
 * ToggleButtonGroup decides which corners to square from `theme.direction`, not
 * from the DOM's `dir`. Inside a dir="rtl" container it therefore rounds the
 * inner corners and squares the outer ones — the same bug the station tab strip
 * had. Standalone buttons plus logical corner properties follow `dir`, so this
 * cannot desync.
 *
 * Both 7/30 pickers use this, so they look identical on the homepage and the
 * Top Hits page instead of being two hand-rolled variants.
 */
const SegmentedControl = ({ options, value, onChange, ariaLabel, sx }) => (
  <Box
    dir="rtl"
    role="group"
    aria-label={ariaLabel}
    sx={{ display: 'inline-flex', ...sx }}
  >
    {options.map((option, index) => {
      const isFirst = index === 0;
      const isLast = index === options.length - 1;
      const outer = `${RADIUS.md}px`;
      return (
        <ToggleButton
          key={option.value}
          value={option.value}
          selected={value === option.value}
          onClick={() => onChange(option.value)}
          aria-label={option.ariaLabel || option.label}
          size="small"
          sx={{
            px: 2,
            py: 0.75,
            minHeight: 40,
            whiteSpace: 'nowrap',
            backgroundColor: 'background.paper',
            borderRadius: 0,
            borderStartStartRadius: isFirst ? outer : 0,
            borderEndStartRadius: isFirst ? outer : 0,
            borderStartEndRadius: isLast ? outer : 0,
            borderEndEndRadius: isLast ? outer : 0,
            // Collapse the doubled border where two segments meet.
            borderInlineStartWidth: isFirst ? '1px' : 0
          }}
        >
          {option.label}
        </ToggleButton>
      );
    })}
  </Box>
);

export default SegmentedControl;
