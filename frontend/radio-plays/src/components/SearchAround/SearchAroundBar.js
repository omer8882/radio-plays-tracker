import React, { useState } from 'react';
import { Typography, Box, Button, TextField, MenuItem, IconButton } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimeField } from '@mui/x-date-pickers/TimeField';
import SearchIcon from '@mui/icons-material/Search';

const stations = {
  'גלגלצ': 'glglz',
  'רדיוס 100': 'radius100',
  'אקו 99': 'eco99',
  'כאן 88': 'kan88',
  '103 fm': '103fm',
  'גלצ': 'galatz'
};

const SearchAroundBar = ({ onSearch }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [selectedStation, setSelectedStation] = useState('glglz');

  const handleSearch = () => {
    onSearch({
      date: selectedDate,
      time: selectedTime,
      station: selectedStation
    });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box
        display="flex"
        flexWrap="wrap"
        justifyContent="center"
        dir="rtl"
        alignItems="center"
        gap={1}
        style={{
          backgroundColor: "#dedadc", //F5F5F5
          borderRadius: '10px',
          padding: '8px',
          margin: '20px 2px 5px 2px',
          width: '100%',
          boxSizing: 'border-box',
          border: '1px solid',
          borderColor: '#c0c0c0',
        }}
        sx={{ boxShadow: 2 }}
      >
        <Typography variant="subtitle2">מה הושמע ב</Typography>

        <DatePicker
          label="יום"
          value={selectedDate}
          onChange={(newValue) => setSelectedDate(newValue)}
          sx={{ 
            width: 135, 
            '& .MuiInputBase-root': { 
              height: 33, 
              fontSize: '0.8rem' // Make text smaller
            } ,
            '& .MuiSvgIcon-root': {
              fontSize: '1rem',
              padding: 0
            }
          }}
          renderInput={(params) => (
            <TextField {...params} variant="outlined" size="small" />
          )}
        />

        <Typography variant="subtitle2">בסביבות</Typography>

        <TimeField
          label="שעה"
          value={selectedTime}
          format="HH:mm"
          onChange={(newValue) => setSelectedTime(newValue)}
          sx={{ 
            width: 60, 
            '& .MuiInputBase-root': { 
              height: 33, 
              fontSize: '0.8rem' // Make text smaller
            } 
          }}
          renderInput={(params) => (
            <TextField {...params} variant="outlined" size="small" />
          )}
        />

        <Typography variant="subtitle2">בתחנה</Typography>

        <TextField
          select
          label="תחנה"
          value={selectedStation}
          onChange={(event) => setSelectedStation(event.target.value)}
          variant="outlined"
          size="small"
          sx={{ 
            width: 100, 
            '& .MuiInputBase-root': { 
              height: 33, 
              fontSize: '0.8rem' // Make text smaller
            } 
          }}
        >
          {Object.entries(stations).map(([key, value]) => (
            <MenuItem key={key} value={value}>
              {key}
            </MenuItem>
          ))}
        </TextField>

        <IconButton 
          color="primary"
          size="small"
          sx={{ height: 30, fontSize: '0.8rem' }}
          onClick={handleSearch}>
          <SearchIcon fontSize="small" />
        </IconButton>
      </Box>
    </LocalizationProvider>
  );
};

export default SearchAroundBar;
