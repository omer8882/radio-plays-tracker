import React, { useEffect, useRef, useState } from 'react';
import {
  Autocomplete, TextField, Box, Typography, InputAdornment,
  CircularProgress, IconButton, ClickAwayListener
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { searchSongs, queryKeys } from '../api';
import { useSongModal } from '../hooks/useSongModal';
import { AVATAR, RADIUS } from '../theme';

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;

/**
 * Collapsed to an icon by default and expanded on tap. A permanently open field
 * squeezed the toolbar on phones - it got clipped at the edge and left no room
 * for the nav links.
 */
const GlobalSearch = () => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [debounced, setDebounced] = useState('');
  const inputRef = useRef(null);
  const { openSong } = useSongModal();

  // Debounce so typing does not fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(inputValue.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [inputValue]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  const enabled = debounced.length >= MIN_QUERY_LENGTH;

  const { data, isFetching } = useQuery({
    queryKey: queryKeys.search(debounced),
    queryFn: ({ signal }) => searchSongs(debounced, signal),
    enabled,
    placeholderData: keepPreviousData
  });

  const options = enabled && Array.isArray(data) ? data : [];

  const close = () => {
    setOpen(false);
    setInputValue('');
  };

  if (!open) {
    return (
      <IconButton
        aria-label="חיפוש"
        onClick={() => setOpen(true)}
        sx={{ color: '#FFFFFF' }}
      >
        <SearchIcon />
      </IconButton>
    );
  }

  return (
    <ClickAwayListener onClickAway={() => { if (!inputValue) close(); }}>
      {/* Expanded, the field takes the whole toolbar on phones and a fixed
          width from sm up, so it never competes with the nav links. */}
      <Box sx={{
        position: { xs: 'absolute', sm: 'static' },
        insetInline: { xs: 8, sm: 'auto' },
        zIndex: { xs: 2, sm: 'auto' },
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        width: { xs: 'auto', sm: 280 }
      }}>
        <Autocomplete
          dir="rtl"
          freeSolo
          fullWidth
          size="small"
          open={enabled}
          options={options}
          filterOptions={(items) => items}
          inputValue={inputValue}
          onInputChange={(_, value, reason) => {
            if (reason !== 'reset') setInputValue(value);
          }}
          onChange={(_, option) => {
            if (option && typeof option !== 'string') {
              openSong(option.id);
              close();
            }
          }}
          getOptionLabel={(option) => (typeof option === 'string' ? option : option.name || '')}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          noOptionsText="לא נמצאו שירים"
          renderOption={(props, option) => (
            <Box component="li" {...props} key={option.id} sx={{ gap: 1.5, display: 'flex' }}>
              <Box
                component="img"
                src={option.imageUrl || undefined}
                alt=""
                sx={{
                  width: AVATAR.sm, height: AVATAR.sm, borderRadius: `${RADIUS.sm}px`,
                  objectFit: 'cover', flexShrink: 0, bgcolor: 'app.overlay'
                }}
              />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" noWrap>{option.name}</Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {option.artists?.map((artist) => artist.name).join(', ')}
                </Typography>
              </Box>
            </Box>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              inputRef={inputRef}
              placeholder="חיפוש שיר או אמן"
              variant="outlined"
              onKeyDown={(event) => { if (event.key === 'Escape') close(); }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'background.paper',
                  borderRadius: `${RADIUS.md}px`
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
        <IconButton aria-label="סגירת חיפוש" onClick={close} size="small" sx={{ color: '#FFFFFF' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
    </ClickAwayListener>
  );
};

export default GlobalSearch;
