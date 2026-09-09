import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * The open song lives in the URL (`?song=<id>`) rather than in each list's local
 * state. That gives one modal instance for the whole app, shareable links, and a
 * browser/Android back button that closes the modal instead of leaving the page.
 */
export const useSongModal = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const songId = searchParams.get('song');

  // Opening pushes a history entry, so Back closes the modal.
  const openSong = useCallback((id) => {
    if (!id) {
      return;
    }
    const next = new URLSearchParams(searchParams);
    next.set('song', id);
    setSearchParams(next);
  }, [searchParams, setSearchParams]);

  // Closing replaces, so it does not stack a second entry to back through.
  const closeSong = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete('song');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  return { songId, openSong, closeSong };
};

export default useSongModal;
