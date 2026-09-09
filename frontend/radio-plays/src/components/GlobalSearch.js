import React, { useEffect, useState } from 'react';
import { Autocomplete, TextField, Box, Typography, InputAdornment, CircularProgress } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { searchSongs, queryKeys } from '../api';
import { useSongModal } from '../hooks/useSongModal';
import { AVATAR, RADIUS } from '../theme';

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;

const GlobalSearch = () => {
  const [inputValue, setInputValue] = useState('');
  const [debounced, setDebounced] = useState('');
  const { openSong } = useSongModal();

  // Debounce so typing does not fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(inputValue.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [inputValue]);

  const enabled = debounced.length >= MIN_QUERY_LENGTH;

  const { data, isFetching } = useQuery({
    queryKey: queryKeys.search(debounced),
    queryFn: ({ signal }) => searchSongs(debounced, signal),
    enabled,
    placeholderData: keepPreviousData
  });

  const options = enabled && Array.isArray(data) ? data : [];

  return (
    <Autocomplete
      dir="rtl"
      freeSolo
      size="small"
      options={options}
      filterOptions={(items) => items}
      inputValue={inputValue}
      onInputChange={(_, value, reason) => {
        if (reason !== 'reset') {
          setInputValue(value);
        }
      }}
      onChange={(_, option) => {
        if (option && typeof option !== 'string') {
          openSong(option.id);
          setInputValue('');
        }
      }}
      getOptionLabel={(option) => (typeof option === 'string' ? option : option.name || '')}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      noOptionsText={enabled && !isFetching ? 'לא נמצאו שירים' : 'הקלידו לחיפוש'}
      renderOption={(props, option) => (
        <Box component="li" {...props} key={option.id} sx={{ gap: 1.5, display: 'flex' }}>
          <Box
            component="img"
            src={option.imageUrl || undefined}
            alt=""
            sx={{ width: AVATAR.sm, height: AVATAR.sm, borderRadius: `${RADIUS.sm}px`, objectFit: 'cover', flexShrink: 0, bgcolor: 'app.overlay' }}
          />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" noWrap>{option.name}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {option.artists?.map((artist) => artist.name).join(', ')}
            </Typography>
          </Box>
        </Box>
      )}
      sx={{ width: { xs: 150, sm: 240, md: 300 } }}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="חיפוש שיר או אמן"
          variant="outlined"
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              borderRadius: 2
            }
          }}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <InputAdornment position="start">
                {isFetching ? <CircularProgress size={16} /> : <SearchIcon fontSize="small" />}
              </InputAdornment>
            )
          }}
        />
      )}
    />
  );
};

export default GlobalSearch;
