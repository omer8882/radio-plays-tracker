import React, { useState } from 'react';
import { Typography, Box, Button, TextField, MenuItem } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimeField } from '@mui/x-date-pickers/TimeField';

const stations = 
{
  'גלגלצ': 'glglz',
  'רדיוס 100': 'radius100',
  'אקו 99': 'eco99',
  'כאן 88': 'kan88',
  '103': 'fm103',
  'גלצ': 'galatz'
}

const SearchAroundBar = ({ onSearch }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [selectedStation, setSelectedStation] = useState('glglz');

  const handleSearch = () => {
    // Call the onSearch function with the selected values
    onSearch({
      date: selectedDate,
      time: selectedTime,
      station: selectedStation
    });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box display="flex" flexWrap="wrap" justifyContent="center" dir="rtl" alignItems="center" gap={2} 
       style={{backgroundColor: "#F5F5F5", borderRadius: '10px', padding:'12px', margin: '10px 2px 5px 2px', width: '100%', boxSizing: 'border-box'}} sx={{ boxShadow: 3 }}>
          <Typography variant="h6">מה הושמע ב</Typography>

          <DatePicker
            label="יום"
            value={selectedDate}
            dir="rtl"
            onChange={(newValue) => setSelectedDate(newValue)}
            sx={{ width: 150, minWidth: 150 }}
            renderInput={(params) => <TextField {...params} variant="outlined" size="small" 
            sx={{ width: 50 }}
            />}
          />

          <Typography variant="h6"> בסביבות </Typography>


          <TimeField
            label="שעה"
            value={selectedTime}
            format="HH:mm"
            dir="rtl"
            onChange={(newValue) => setSelectedTime(newValue)}
            sx={{ width: 80, minWidth: 80 }}
            renderInput={(params) => 
              <TextField  {...params} variant="outlined" size="small"/>}
          />

          <Typography variant="h6"> בתחנה </Typography>

          <TextField
            select
            label="תחנה"
            InputLabelProps={{alignItems: "right"}}
            value={selectedStation}
            onChange={(event) => setSelectedStation(event.target.value)}
            variant="outlined"
            size="small"
            sx={{ width: 'auto', minWidth: 150 }}
            >
            {Object.entries(stations).map(([key, value]) => (
              <MenuItem key={key} value={value}>
                {key}
              </MenuItem>
            ))}
          </TextField>

          <Button
            variant="contained"
            color="primary"
            onClick={handleSearch}>
            חיפוש
          </Button>
      </Box>
    </LocalizationProvider>
  );
};

export default SearchAroundBar;
