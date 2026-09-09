import React, { useState } from 'react';
import { Typography, Box, MenuItem, TextField, Button } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimeField } from '@mui/x-date-pickers/TimeField';
import SearchIcon from '@mui/icons-material/Search';
import { STATIONS } from '../../constants/stations';

// The controls read as one sentence, so each field's own label would just repeat
// the word before it. The inline copy is the label; the fields carry none.
const fieldSx = {
  '& .MuiInputBase-root': { height: 40, backgroundColor: 'background.paper' }
};

const SearchAroundBar = ({ onSearch }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [selectedStation, setSelectedStation] = useState('glglz');

  const handleSearch = () => {
    onSearch({ date: selectedDate, time: selectedTime, station: selectedStation });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box
        dir="rtl"
        component="form"
        onSubmit={(event) => {
          event.preventDefault();
          handleSearch();
        }}
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          rowGap: 1.5,
          columnGap: 1,
          backgroundColor: 'app.card',
          borderRadius: 2,
          p: 1.5,
          width: '100%',
          boxSizing: 'border-box',
          border: '1px solid',
          borderColor: 'app.hairline',
          boxShadow: 1
        }}
      >
        <Typography variant="subtitle1">מה הושמע ב</Typography>

        <DatePicker
          value={selectedDate}
          onChange={setSelectedDate}
          format="dd/MM/yyyy"
          slotProps={{ textField: { size: 'small', sx: { ...fieldSx, width: 150 } } }}
        />

        <Typography variant="subtitle1">בסביבות</Typography>

        <TimeField
          value={selectedTime}
          format="HH:mm"
          onChange={setSelectedTime}
          size="small"
          sx={{ ...fieldSx, width: 80 }}
        />

        <Typography variant="subtitle1">בתחנה</Typography>

        <TextField
          select
          value={selectedStation}
          onChange={(event) => setSelectedStation(event.target.value)}
          size="small"
          sx={{ ...fieldSx, minWidth: 130 }}
        >
          {STATIONS.map((station) => (
            <MenuItem key={station.name} value={station.name}>
              {station.displayName}
            </MenuItem>
          ))}
        </TextField>

        <Button
          type="submit"
          variant="contained"
          startIcon={<SearchIcon />}
          sx={{ height: 40, marginInlineStart: 'auto' }}
        >
          חיפוש
        </Button>
      </Box>
    </LocalizationProvider>
  );
};

export default SearchAroundBar;
