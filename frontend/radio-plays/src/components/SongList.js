import React, { useEffect, useState } from 'react';
import { List, Box } from '@mui/material';
import SongListItem from './SongListItem';
import axios from 'axios';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import './SongList.css'; // Ensure to add relevant CSS

const SongList = ({ station }) => {
  /*const sim_songs = [
                      {time: "11:11", title: "אדי באדי", artist: "שחר טבוך, אדם בוחבוט"},
                      {time: "11:09", title: "Von Dutch", artist: "Charli XCX"},
                      {time: "11:05", title: "בלב מדבר", artist: "מאיר אריאל"}
  ] ;*/
  const ghost_data = [
    {time: " ", title: " ", artist: " "},
    {time: " ", title: " ", artist: " "},
    {time: " ", title: " ", artist: " "},
    {time: " ", title: " ", artist: " "},
    {time: " ", title: " ", artist: " "},
    {time: " ", title: " ", artist: " "},
    {time: " ", title: " ", artist: " "}
  ] ;
  const error_songs = [
    {time: "00:00", title: "server error", artist: ""}
  ] ;
  
  const [songs, setSongs] = useState([]);
  const [displayedSongs, setDisplayedData] = useState(ghost_data);
  //const [loading, setLoading] = useState(true);


  const fetchData = async () => {
    //setLoading(true);
    setDisplayedData(songs == [] ? ghost_data : songs);
    try {
      const response = await axios.get(`https://server.mahushma.com/api/station_last_plays?station=${station}`);
      const newSongs = response.data;
      const existingSongIds = new Set(displayedSongs.map(song => song.id));
      newSongs.forEach(song => {
        if (!existingSongIds.has(song.id)) {
            displayedSongs.pop();
            displayedSongs.unshift(song);
            existingSongIds.add(song.id);
        }
      });

      setDisplayedData(response.data)
    } catch (err) {
      console.error("Error fetching songs:", err);
      setDisplayedData(error_songs)
    } finally {
      //setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh data every 60 seconds
    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, [station]);

  return (
    <Box>
      <List>
        <TransitionGroup component={null}>
          {displayedSongs.map((song, index) => (
            <CSSTransition key={song.id} timeout={500} classNames="fade-slide">
              <SongListItem song={song} />
            </CSSTransition>
          ))}
        </TransitionGroup>
      </List>
    </Box>
  );
};

export default SongList;
