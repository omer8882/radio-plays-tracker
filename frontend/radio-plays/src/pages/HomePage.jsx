import React from 'react';
import { Box } from '@mui/material';
import SearchAround from '../components/SearchAround/SearchAround';
import LastPlays from '../components/LastPlays/LastPlays';
import TopHitsPreview from '../components/TopHits';
import PageMeta from '../components/PageMeta';

/**
 * Two equal columns on desktop that share a top edge, stacking on mobile.
 * Replaces a space-around flex row where one column was capped at 600px and the
 * other was uncapped, so they sat at different widths and vertical offsets.
 */
const HomePage = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
    <PageMeta
      description="מה הושמע ברדיו הישראלי - השמעות אחרונות ולהיטים מכל התחנות."
      path="/"
    />
    <SearchAround />

    <Box
      aria-label="Last played on stations"
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 1fr)' },
        gap: 3,
        alignItems: 'start'
      }}
    >
      <LastPlays />
      <TopHitsPreview />
    </Box>
  </Box>
);

export default HomePage;
