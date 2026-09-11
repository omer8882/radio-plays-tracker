import React from 'react';
import { Box, Container } from '@mui/material';
import { Navigate, Route, Routes } from 'react-router-dom';
import TopToolbar from './components/AppBar';
import HomePage from './pages/HomePage';
import TopHitsPage from './pages/TopHitsPage';
import ArtistPage from './pages/ArtistPage';
import LegacyArtistRedirect from './pages/LegacyArtistRedirect';
import SongPage from './pages/SongPage';
import StationPage from './pages/StationPage';
import SongDetailsPage from './components/SongDetailsPage';
import { useSongModal } from './hooks/useSongModal';

function App() {
  const { songId, closeSong } = useSongModal();

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', backgroundColor: 'background.default' }}>
      <TopToolbar />
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/top-hits" element={<TopHitsPage />} />
          <Route path="/station/:stationName" element={<StationPage />} />
          <Route path="/song/:songId" element={<SongPage />} />
          <Route path="/artist/:artistId" element={<ArtistPage />} />
          {/* Legacy ?name= links redirect to the id-based route. */}
          <Route path="/artist" element={<LegacyArtistRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Container>

      {/* One modal for the whole app, driven by ?song=<id>. */}
      <SongDetailsPage songId={songId} onClose={closeSong} />
    </Box>
  );
}

export default App;
