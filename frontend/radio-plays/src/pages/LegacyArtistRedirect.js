import React from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { Box, Alert, CircularProgress } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { searchSongs } from '../api';

/**
 * Keeps old `/artist?name=…` links working after the move to `/artist/:artistId`.
 *
 * Resolving a name back to an id is best-effort by design: names are not unique,
 * so a link shared before this change may be genuinely ambiguous. We send the
 * visitor to the first artist that matches rather than showing them nothing.
 */
const LegacyArtistRedirect = () => {
  const [searchParams] = useSearchParams();
  const name = searchParams.get('name');

  const { data, isPending, isError } = useQuery({
    queryKey: ['legacyArtistLookup', name],
    queryFn: async ({ signal }) => {
      // Search returns songs with their credited artists, which is the only
      // public way to map a name back to an id.
      const results = await searchSongs(name, signal);
      const artists = (Array.isArray(results) ? results : []).flatMap((song) => song.artists || []);
      const match =
        artists.find((artist) => artist.name === name) ||
        artists.find((artist) => artist.name?.toLowerCase() === name?.toLowerCase());
      return match?.id ?? null;
    },
    enabled: Boolean(name),
    retry: false
  });

  if (!name) {
    return <Navigate to="/" replace />;
  }

  if (isPending) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !data) {
    return (
      <Box dir="rtl" sx={{ mt: 4 }}>
        <Alert severity="warning">לא מצאנו את האמן המבוקש. נסו לחפש אותו למעלה.</Alert>
      </Box>
    );
  }

  return <Navigate to={`/artist/${encodeURIComponent(data)}`} replace />;
};

export default LegacyArtistRedirect;
