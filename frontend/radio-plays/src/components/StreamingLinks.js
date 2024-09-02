import React from 'react';
import { Box } from '@mui/material';
import StyledIconButton from './StyledIconButton';
import SpotifyIcon from '../assets/spotify-icon.png';
import AppleMusicIcon from '../assets/apple-music-icon.png';
import YouTubeIcon from '../assets/youtube-icon.png';

const StreamingLinks = ({ streamingLinks, title, artist }) => {

  const iconSize = 28; 
  const spotifyLink = (streamingLinks && streamingLinks.spotify) || `https://open.spotify.com/search/${encodeURIComponent(title + " " + artist)}`;
  const appleMusicLink = (streamingLinks && streamingLinks.apple_music) || `https://music.apple.com/search?term=${encodeURIComponent(title + " " + artist)}`;
  const youtubeLink = (streamingLinks && streamingLinks.youtube) || `https://www.youtube.com/results?search_query=${encodeURIComponent(title + " " + artist)}`;

  return (
    <Box  sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.5, }} >

      {spotifyLink && (
        <StyledIconButton
          href={spotifyLink}
          ariaLabel="Spotify"
          iconSrc={SpotifyIcon}
          iconSize={iconSize}
        />
      )}
      
      {appleMusicLink && (
        <StyledIconButton
          href={appleMusicLink}
          ariaLabel="Apple Music"
          iconSrc={AppleMusicIcon}
          iconSize={iconSize}
        />
      )}

      {youtubeLink && (
        <StyledIconButton
          href={youtubeLink}
          ariaLabel="YouTube"
          iconSrc={YouTubeIcon}
          iconSize={iconSize}
        />
      )}
    </Box>
  );
};

export default StreamingLinks;
