import React, { useEffect, useState } from 'react';
import { List, Box } from '@mui/material';
import SongListItem from './SongListItem';
import axios from 'axios';

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
  const [displayedData, setDisplayedData] = useState(ghost_data);
  //const [loading, setLoading] = useState(true);


  const fetchData = async () => {
    //setLoading(true);
    setDisplayedData(songs === [] ? ghost_data : songs);
    try {
      const response = await axios.get(`https://server.mahushma.com/api/station_last_plays?station=${station}`);
      setSongs(response.data);
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
    <Box >
      <List>
        {displayedData.map(song => (
          <SongListItem key={song.id} song={song} />
        ))}
      </List>
    </Box>
  );
};

export default SongList;
