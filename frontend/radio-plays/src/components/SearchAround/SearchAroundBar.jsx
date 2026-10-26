import React, { useState } from 'react';
import { Typography, Box, MenuItem, TextField, Button } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimeField } from '@mui/x-date-pickers/TimeField';
import SearchIcon from '@mui/icons-material/Search';
import { STATIONS } from '../../constants/stations';

// Compact by design: this is a secondary tool sitting above the content people
// came for, so it should read as one quiet line rather than a slab of
// full-height controls. The inline copy is the label; the fields carry none.
const FIELD_HEIGHT = 34;

const fieldSx = {
  '& .MuiInputBase-root': {
    height: FIELD_HEIGHT,
    fontSize: '0.8125rem',
    backgroundColor: 'background.paper'
  },
  '& .MuiInputBase-input': { py: 0 },
  '& .MuiSvgIcon-root': { fontSize: '1.05rem' }
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
          rowGap: 1,
          columnGap: 0.75,
          backgroundColor: 'app.card',
          borderRadius: '10px',
          px: 1.5,
          py: 1,
          width: '100%',
          boxSizing: 'border-box',
          border: '1px solid',
          borderColor: 'app.hairline'
        }}
      >
        <Typography variant="body2" color="text.secondary">מה הושמע ב</Typography>

        <DatePicker
          value={selectedDate}
          onChange={setSelectedDate}
          format="dd/MM/yy"
          slotProps={{ textField: { size: 'small', sx: { ...fieldSx, width: 118 } } }}
        />

        <Typography variant="body2" color="text.secondary">בסביבות</Typography>

        <TimeField
          value={selectedTime}
          format="HH:mm"
          onChange={setSelectedTime}
          size="small"
          sx={{ ...fieldSx, width: 62 }}
        />

        <Typography variant="body2" color="text.secondary">בתחנה</Typography>

        <TextField
          select
          value={selectedStation}
          onChange={(event) => setSelectedStation(event.target.value)}
          size="small"
          sx={{ ...fieldSx, minWidth: 100 }}
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
          size="small"
          aria-label="חיפוש"
          sx={{
            minWidth: 0,
            minHeight: FIELD_HEIGHT,
            height: FIELD_HEIGHT,
            px: 1.25,
            marginInlineStart: 'auto'
          }}
        >
          <SearchIcon fontSize="small" />
        </Button>
      </Box>
    </LocalizationProvider>
  );
};

export default SearchAroundBar;
