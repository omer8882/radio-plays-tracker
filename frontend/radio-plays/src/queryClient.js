import { QueryClient } from '@tanstack/react-query';

// Play data is aggregate and changes at most once per recognizer cycle, so a
// short stale window removes the refetch-and-blank behaviour when switching
// stations, flipping 7/30, or navigating between routes.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});

export default queryClient;
