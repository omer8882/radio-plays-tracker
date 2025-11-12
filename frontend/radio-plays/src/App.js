import React from 'react';
import { Box } from '@mui/material';
import { Navigate, Route, Routes } from 'react-router-dom';
import TopToolbar from './components/AppBar';
import HomePage from './pages/HomePage';
import TopHitsPage from './pages/TopHitsPage';
import ArtistPage from './pages/ArtistPage';

function App() {
  return (
    <Box sx={{ width: '100%', minHeight: '100vh', backgroundColor: '#EEEEEE' }}>
      <TopToolbar />
      <Box sx={{ flexGrow: 1, py: 3 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/top-hits" element={<TopHitsPage />} />
          <Route path="/artist" element={<ArtistPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>
    </Box>
  );
}

export default App;
