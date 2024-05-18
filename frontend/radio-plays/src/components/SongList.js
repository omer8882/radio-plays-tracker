import React, { useEffect, useState } from 'react';
import { List, Typography, Box } from '@mui/material';
import SongListItem from './SongListItem';
import axios from 'axios';

const SongList = ({ station }) => {
  const [songs, setSongs] = useState([]);

  // useEffect(() => {
  //   // Fetch songs from the API
  //   axios.get(`/api/songs?station=${station}`)
  //     .then(response => {
  //       setSongs(response.data);
  //     })
  //     .catch(error => {
  //       console.error("Error fetching songs:", error);
  //     });
  // }, [station]);

  useEffect(() => {
    const sim_songs = [
                        {time: "11:11", title: "נאדי באדי", artist: "שחר טבוך, אדם בוחבוט"},
                        {time: "11:09", title: "Von Dutch", artist: "Charli XCX"},
                        {time: "11:05", title: "בלב מדבר", artist: "מאיר אריאל"}
                      ] ;
    setSongs(sim_songs)
  }, [station]);

  return (
    <Box>
      <List>
        {songs.map(song => (
          <SongListItem key={song.id} song={song} />
        ))}
      </List>
    </Box>
  );
};

export default SongList;
