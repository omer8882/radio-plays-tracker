import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { test, expect } from 'vitest';
import App from './App';
import theme from './theme';

// Smoke test: the whole app renders its shell with the same providers as
// index.jsx. API calls have no server here and fail quietly (no retries).
test('renders the app shell', () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <MemoryRouter>
            <App />
          </MemoryRouter>
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
  expect(screen.getAllByText('מה הושמע ברדיו').length).toBeGreaterThan(0);
});
