import { createTheme } from '@mui/material/styles';

// The app's own palette, pulled out of the ~10 files that used to hardcode it.
// The dusty mauve family (#BAB2B5 chrome, #dedadc cards) is the existing identity —
// these are the same colors, reconciled onto one scale.
const ground = '#EFEDEE';
const card = '#DEDADC';
const hairline = '#C7C0C3';
const appBar = '#BAB2B5';
const appBarActive = '#A69DA1';
const overlay = 'rgba(0, 0, 0, 0.06)';
const overlayStrong = 'rgba(0, 0, 0, 0.11)';

/**
 * SIZING TOKENS
 *
 * Everything visual comes from here. Components must not invent their own
 * font sizes, radii, elevations or avatar dimensions — that is what made the
 * UI read as uneven (10 different font sizes, 6 elevations, 5 radii).
 *
 * Spacing: MUI's unit is 8px. Use whole and half steps only —
 * 0.5=4  1=8  1.5=12  2=16  3=24  4=32. No 1.25 / 1.875 / 0.625.
 *
 * Elevation: three levels, by role. 0 = flat chrome, 1 = panel, 8 = modal.
 * Nothing else. Random shadow values are what read as "bulky".
 */
export const RADIUS = {
  sm: 6,   // covers, chips, small images
  md: 10,  // panels, cards, inputs
  lg: 14   // modal
};

export const AVATAR = {
  sm: 40,  // dense list rows
  md: 48,  // table rows
  lg: 88,  // artist hero
  xl: 148  // modal artwork
};

// One row height for every tappable list row, comfortably over the 44px
// minimum touch target.
export const ROW_MIN_HEIGHT = 56;

const theme = createTheme({
  palette: {
    mode: 'light',
    // A mauve drawn from the chrome, so buttons and links stop being default blue
    // against a mauve-grey app.
    primary: {
      main: '#6F6169',
      light: '#9A8B93',
      dark: '#4A3F46',
      contrastText: '#FFFFFF'
    },
    secondary: {
      main: '#7E6B93',
      contrastText: '#FFFFFF'
    },
    background: {
      default: ground,
      paper: '#FFFFFF'
    },
    text: {
      primary: '#2A2427',
      secondary: '#6B6167'
    },
    divider: hairline,

    // App-specific surfaces. Reference these instead of writing hex literals.
    app: {
      ground,
      card,
      hairline,
      appBar,
      appBarActive,
      overlay,
      overlayStrong
    }
  },

  shape: {
    borderRadius: RADIUS.md
  },

  // Type scale: 12 / 14 / 16 / 18 / 20 / 24. Components use variants, never
  // a raw fontSize. Sizes are deliberately flat across breakpoints — the old
  // per-breakpoint nudges (0.83 -> 0.9rem) were invisible and just added noise.
  typography: {
    fontFamily: "'Heebo', 'Segoe UI', system-ui, -apple-system, sans-serif",
    h4: { fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.25, letterSpacing: '-0.01em' },
    h5: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.3 },
    h6: { fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.35 },
    subtitle1: { fontSize: '1rem', fontWeight: 500, lineHeight: 1.4 },
    subtitle2: { fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.4 },
    body1: { fontSize: '1rem', lineHeight: 1.5 },
    body2: { fontSize: '0.875rem', lineHeight: 1.5 },
    caption: { fontSize: '0.75rem', lineHeight: 1.4 },
    button: { fontSize: '0.875rem', textTransform: 'none', fontWeight: 600 }
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: ground },
        // Times, play counts and ranks sit in columns; proportional digits make
        // those columns visibly ragged from row to row.
        '.num': { fontVariantNumeric: 'tabular-nums' }
      }
    },
    MuiPaper: {
      defaultProps: { elevation: 1 },
      styleOverrides: {
        root: { backgroundImage: 'none' },
        outlined: { borderColor: hairline }
      }
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: RADIUS.md, minHeight: 40 },
        // MUI spaces button icons with physical margins (marginRight/marginLeft),
        // which are backwards inside a dir="rtl" container and leave the icon
        // crammed against the label. Logical margins follow dir instead.
        startIcon: {
          marginLeft: 0,
          marginRight: 0,
          marginInlineEnd: 8,
          marginInlineStart: -2
        },
        endIcon: {
          marginLeft: 0,
          marginRight: 0,
          marginInlineStart: 8,
          marginInlineEnd: -2
        }
      }
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderColor: hairline,
          minHeight: 44
        }
      }
    },
    MuiToggleButtonGroup: {
      styleOverrides: { grouped: { borderColor: hairline } }
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: hairline,
          paddingTop: 8,
          paddingBottom: 8
        },
        head: {
          fontWeight: 600,
          fontSize: '0.75rem',
          color: '#6B6167',
          whiteSpace: 'nowrap'
        }
      }
    },
    MuiListItem: {
      styleOverrides: {
        root: { minHeight: ROW_MIN_HEIGHT }
      }
    },
    MuiTooltip: { defaultProps: { arrow: true } },
    MuiLink: { defaultProps: { underline: 'hover' } }
  }
});

export default theme;
