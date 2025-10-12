import React, { useEffect, useState } from 'react';
import { List, Box } from '@mui/material';
import SongListItem from './SongListItem';
import SongDetailsPage from './SongDetailsPage';
import axios from 'axios';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import './SongList.css';

const SongList = ({ station }) => {
  // Placeholder data for loading and error cases
  const ghost_data = [
    {time: " ", title: " ", artist: " "},
    {time: " ", title: " ", artist: " "},
    {time: " ", title: " ", artist: " "},
    {time: " ", title: " ", artist: " "},
    {time: " ", title: " ", artist: " "},
    {time: " ", title: " ", artist: " "},
    {time: " ", title: " ", artist: " "},
    {time: " ", title: " ", artist: " "},
    {time: " ", title: " ", artist: " "},
    {time: " ", title: " ", artist: " "},
  ];
  const error_songs = [
    { time: "00:00", title: "server error", artist: "" }
  ];
  
  const [displayedSongs, setDisplayedData] = useState(ghost_data);
  const [showModal, setShowModal] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);

  const fetchData = async () => {
    try {
      const response = await axios.get(`https://localhost:5001/api/station_last_plays?station=${station.name}`);
      setDisplayedData(response.data);
    } catch (err) {
      console.error("Error fetching songs:", err);
      setDisplayedData(error_songs);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2 * 60 * 1000); // Refresh every 2 minutes
    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, [station]);

  const handleSongClick = (song) => {
    setSelectedSong(song);
    setShowModal(true);
  };

  return (
    <>
      <Box 
        alignItems="center" 
        sx={{
          backgroundColor: station.bgColor,
          justifyContent: 'center',
          borderRadius: '0px 0px 10px 10px',
          margin: '0px 2px 5px 2px',
          padding: '0px',
          width: '100%',
          boxShadow: 2,
          boxSizing: 'border-box',
          border: '1px solid',
          borderColor: '#c0c0c0',
          borderTop: '0px',
        }}
      >
        <List>
          <TransitionGroup component={null}>
            {displayedSongs.map((song, index) => (
              <CSSTransition key={song.id || index} timeout={500} classNames="fade-slide">
                <SongListItem song={song} onClick={() => handleSongClick(song)} />
              </CSSTransition>
            ))}
          </TransitionGroup>
        </List>
      </Box>

      {selectedSong && (
        <SongDetailsPage
        showModal={showModal}
        setShowModal={setShowModal}
        songId={selectedSong.id}
      />
      )}
    </>
  );
};

export default SongList;
