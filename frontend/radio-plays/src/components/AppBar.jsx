import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import RadioIcon from '@mui/icons-material/Radio';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import GlobalSearch from './GlobalSearch';

const NAV_ITEMS = [
  { to: '/', label: 'כל התחנות' },
  { to: '/top-hits', label: 'להיטים' }
];

const TopToolbar = () => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: 'app.appBar',
        borderBottom: '1px solid',
        borderColor: 'app.hairline'
      }}
      dir="rtl"
    >
      <Toolbar variant="dense" sx={{ gap: 0.5, minHeight: 52, position: 'relative' }}>
        <Box
          component={RouterLink}
          to="/"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: '#FFFFFF',
            textDecoration: 'none',
            ml: { xs: 0.5, sm: 2 }
          }}
        >
          <RadioIcon fontSize="small" />
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 700, whiteSpace: 'nowrap', fontSize: { xs: '0.9rem', sm: '1rem' } }}
          >
            מה הושמע ברדיו
          </Typography>
        </Box>

        {NAV_ITEMS.map(({ to, label }) => {
          const active = isActive(to);
          return (
            <Button
              key={to}
              component={RouterLink}
              to={to}
              disableRipple={false}
              sx={{
                color: '#FFFFFF',
                fontWeight: active ? 700 : 500,
                borderRadius: 0,
                px: { xs: 1, sm: 1.5 },
                minWidth: 'auto',
                borderBottom: '2px solid',
                borderColor: active ? '#FFFFFF' : 'transparent',
                backgroundColor: active ? 'app.appBarActive' : 'transparent',
                '&:hover': {
                  backgroundColor: 'app.appBarActive'
                }
              }}
            >
              {label}
            </Button>
          );
        })}

        <Box sx={{ flexGrow: 1 }} />
        <GlobalSearch />
      </Toolbar>
    </AppBar>
  );
};

export default TopToolbar;
