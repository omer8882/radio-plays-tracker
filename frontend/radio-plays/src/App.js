import React from 'react';
import { Box, Container } from '@mui/material';
import { Navigate, Route, Routes } from 'react-router-dom';
import TopToolbar from './components/AppBar';
import HomePage from './pages/HomePage';
import TopHitsPage from './pages/TopHitsPage';
import ArtistPage from './pages/ArtistPage';
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
          <Route path="/artist" element={<ArtistPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Container>

      {/* One modal for the whole app, driven by ?song=<id>. */}
      <SongDetailsPage songId={songId} onClose={closeSong} />
    </Box>
  );
}

export default App;
