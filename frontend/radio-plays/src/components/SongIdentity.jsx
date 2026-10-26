import React from 'react';
import { Box, Typography, Avatar, Stack, Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import StreamingLinks from './StreamingLinks';
import { AVATAR, RADIUS } from '../theme';

/**
 * Artwork, title, album and artists for one song.
 *
 * Shared by the modal and the full song page so the two cannot drift — the modal
 * is the page's summary, not a second implementation of it. `size` is the only
 * difference between them.
 */
const SongIdentity = ({ song, size = 'md' }) => {
  const navigate = useNavigate();
  const art = size === 'lg' ? 200 : AVATAR.xl;

  if (!song) {
    return null;
  }

  const goToArtist = (artistId) => {
    if (artistId) {
      navigate(`/artist/${encodeURIComponent(artistId)}`);
    }
  };

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Avatar
          variant="rounded"
          src={song.imageUrl || undefined}
          alt={song.name}
          sx={{
            width: art,
            height: art,
            mb: 2,
            fontSize: '2.5rem',
            borderRadius: `${RADIUS.md}px`
          }}
        >
          {(song.name || '?').trim().charAt(0).toUpperCase() || '?'}
        </Avatar>

        <Typography
          variant={size === 'lg' ? 'h4' : 'h6'}
          component={size === 'lg' ? 'h1' : 'h2'}
          sx={{ textAlign: 'center' }}
        >
          {song.name}
        </Typography>

        {song.album?.name && (
          <Typography variant="subtitle2" dir="rtl" color="text.secondary" sx={{ textAlign: 'center', mt: 1 }}>
            <strong>אלבום:</strong> {song.album.name}
          </Typography>
        )}

        <Box sx={{ mt: 1.5 }}>
          <StreamingLinks
            streamingLinks={song.externalLinks}
            title={song.name}
            artist={song.artists?.[0]?.name}
          />
        </Box>
      </Box>

      {song.artists?.length > 0 && (
        <Stack direction="row" justifyContent="center" spacing={2} sx={{ mt: 3, flexWrap: 'wrap' }}>
          {song.artists.map((artist) => (
            <Stack key={artist.id} direction="column" alignItems="center" spacing={1}>
              <Avatar
                src={artist.imageUrl || undefined}
                alt={artist.name}
                sx={{ width: AVATAR.sm, height: AVATAR.sm, cursor: 'pointer' }}
                onClick={() => goToArtist(artist.id)}
              >
                {(artist.name || '?').trim().charAt(0).toUpperCase() || '?'}
              </Avatar>
              <Link
                component="button"
                variant="body2"
                onClick={() => goToArtist(artist.id)}
                sx={{ cursor: 'pointer' }}
              >
                {artist.name}
              </Link>
            </Stack>
          ))}
        </Stack>
      )}
    </>
  );
};

export default SongIdentity;
