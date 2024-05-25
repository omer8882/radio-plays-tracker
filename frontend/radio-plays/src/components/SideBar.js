import React from 'react';
import { List, ListItem, ListItemText, Typography } from '@mui/material';

const SideBar = () => {
  const topHits = [
    { id: 1, title: 'Hit Song 1' },
    { id: 2, title: 'Hit Song 2' },
    // Add more top hits data here
  ];

  return (
    <div>
      <Typography variant="h6">Top Hits</Typography>
      <List>
        {topHits.map(hit => (
          <ListItem key={hit.id}>
            <ListItemText primary={hit.title} />
          </ListItem>
        ))}
      </List>
    </div>
  );
};

export default SideBar;
