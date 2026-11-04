import { describe, it, expect } from 'vitest';
import { nowPlayingIndexes } from './nowPlaying';

const now = Date.parse('2026-11-04T12:00:00Z');
const minutesAgo = (m) => new Date(now - m * 60 * 1000).toISOString();

describe('nowPlayingIndexes', () => {
  it('marks only the newest play when two are inside the window', () => {
    const plays = [{ playedAt: minutesAgo(0.5) }, { playedAt: minutesAgo(2) }];
    expect([...nowPlayingIndexes(plays, () => 'glglz', now)]).toEqual([0]);
  });

  it('marks nothing when the newest play is too old', () => {
    const plays = [{ playedAt: minutesAgo(4) }, { playedAt: minutesAgo(8) }];
    expect(nowPlayingIndexes(plays, () => 'glglz', now).size).toBe(0);
  });

  it('allows one play per station in mixed lists', () => {
    const plays = [
      { station: 'a', playedAt: minutesAgo(1) },
      { station: 'b', playedAt: minutesAgo(1.5) },
      { station: 'a', playedAt: minutesAgo(2) }
    ];
    expect([...nowPlayingIndexes(plays, undefined, now)].sort()).toEqual([0, 1]);
  });

  it('ignores missing or invalid timestamps', () => {
    const plays = [{ playedAt: 'nope' }, {}, { PlayedAt: minutesAgo(1) }];
    expect([...nowPlayingIndexes(plays, () => 'x', now)]).toEqual([2]);
  });
});
