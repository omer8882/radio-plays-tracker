import React, { useState, useEffect } from 'react';
import { Box, Typography, ToggleButton, ToggleButtonGroup, Paper, List, ListItem, ListItemText } from '@mui/material';
import axios from 'axios';

const overlayColor = 'rgba(0, 0, 0, 0.07)'; // 10% opaque black

const TopHits = () => {
  const [timeRange, setTimeRange] = useState('7');
  const [topHits, setTopHits] = useState([]);

  const sim_hits_7 = [
    { title: "Espresso", artist: "Sabrina Carpenter", hits: 9 },
    { title: "נאדי באדי", artist: "שחר טבוך, אדם בוחבוט", hits: 8 },
    { title: "360", artist: "Charli XCX", hits: 4 }
  ];
  const sim_hits_30 = [
    { title: "Espresso", artist: "Sabrina Carpenter", hits: 33 },
    { title: "נאדי באדי", artist: "שחר טבוך, אדם בוחבוט", hits: 28 },
    { title: "360", artist: "Charli XCX", hits: 12 }
  ];

  useEffect(() => {
    const fetchTopHits = async () => {
      try {
        const response = await axios.get(`http://192.168.1.36:5000/api/top_hits?days=${timeRange}`);
        setTopHits(response.data);
        //setTopHits(timeRange === '7' ? sim_hits_7 : sim_hits_30);
      } catch (error) {
        console.error("Error fetching top hits:", error);
      }
    };

    fetchTopHits();
  }, [timeRange]);

  return (
    <Paper style={{ backgroundColor: '#DCE9C4', padding: '0px', borderRadius: '15px', margin: '10px 2px 5px 2px', width: '100%' }} sx={{ boxShadow: 6 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" style={{ padding: '6px' }}>
        <ToggleButtonGroup
          value={timeRange}
          exclusive
          onChange={(event, newValue) => setTimeRange(newValue)}
          aria-label="time range"
          style={{ margin: '8px 0px 0px 10px' }}
        >
          <ToggleButton value="7" aria-label="7 days">7</ToggleButton>
          <ToggleButton value="30" aria-label="30 days">30</ToggleButton>
        </ToggleButtonGroup>
        <Box flexGrow={1} display="flex" justifyContent="center">
          <Typography variant="h6">להיטים</Typography>
        </Box>
      </Box>
      <List>
        {topHits.map((hit, i) => (
          <ListItem
            key={i}
            style={{
              display: 'flex',
              width: '100%',
              justifyContent: 'space-between',
              padding: '10px 15px',
              backgroundColor: overlayColor,
              margin: '0',
              borderRadius: '0'
            }}
          >
            <Box>
              <Typography variant="subtitle1">השמעות: {hit.hits}</Typography>
            </Box>
            <Box flexGrow={1} display="flex" justifyContent="flex-end">
              <Box textAlign="right">
                <Typography variant="subtitle1">{hit.title}</Typography>
                <Typography variant="body2" color="textSecondary">{hit.artist}</Typography>
              </Box>
              <Typography variant="h6" style={{ marginLeft: '10px' }}>.{i + 1}</Typography>
            </Box>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default TopHits;
