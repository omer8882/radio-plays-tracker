import React from 'react';
import { Box, ToggleButton } from '@mui/material';
import { RADIUS } from '../theme';

/**
 * A direction-safe replacement for ToggleButtonGroup.
 *
 * ToggleButtonGroup decides which corners to square from `theme.direction`, not
 * from the DOM's `dir`. Inside a dir="rtl" container it therefore rounds the
 * inner corners and squares the outer ones. Standalone buttons plus logical
 * corner properties follow `dir`, so this cannot desync.
 *
 * `attached` renders it as a tab strip that sits flush on the panel beneath it,
 * matching the station tabs: bottom corners square, no bottom border, and the
 * selected segment takes the panel's colour so the two merge into one shape.
 */
const SegmentedControl = ({
  options,
  value,
  onChange,
  ariaLabel,
  attached = false,
  fullWidth = false,
  attachedColor = 'app.card',
  sx
}) => (
  <Box
    dir="rtl"
    role="group"
    aria-label={ariaLabel}
    sx={{ display: 'flex', width: fullWidth ? '100%' : 'auto', ...sx }}
  >
    {options.map((option, index) => {
      const isFirst = index === 0;
      const isLast = index === options.length - 1;
      const outer = `${attached ? 8 : RADIUS.md}px`;
      const selected = value === option.value;
      return (
        <ToggleButton
          key={option.value}
          value={option.value}
          selected={selected}
          onClick={() => onChange(option.value)}
          aria-label={option.ariaLabel || option.label}
          size="small"
          sx={{
            flex: fullWidth ? 1 : 'none',
            minWidth: 0,
            px: 2,
            py: 1,
            minHeight: attached ? 44 : 40,
            whiteSpace: 'nowrap',
            border: '1px solid',
            borderColor: 'app.hairline',
            backgroundColor: 'background.paper',
            borderRadius: 0,
            borderStartStartRadius: isFirst ? outer : 0,
            borderStartEndRadius: isLast ? outer : 0,
            // Collapse the doubled border where two segments meet.
            borderInlineStartWidth: isFirst ? '1px' : 0,
            ...(attached
              ? {
                  borderBottom: 'none',
                  '&.Mui-selected, &.Mui-selected:hover': {
                    backgroundColor: attachedColor
                  }
                }
              : {
                  borderEndStartRadius: isFirst ? outer : 0,
                  borderEndEndRadius: isLast ? outer : 0
                })
          }}
        >
          {option.label}
        </ToggleButton>
      );
    })}
  </Box>
);

export default SegmentedControl;
