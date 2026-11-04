// A station plays one song at a time, so at most one play per station can be
// "now playing": the newest one, and only while it is still recent. Checking
// each row on its own against the time window let two back-to-back plays
// both show the equalizer.

export const NOW_PLAYING_WINDOW_MINUTES = 2.75;

const playedAtMs = (play) => {
    const raw = play?.playedAt ?? play?.PlayedAt;
    if (!raw) {
        return NaN;
    }
    return new Date(raw).getTime();
};

const isWithinWindow = (ms, now) => {
    if (Number.isNaN(ms)) {
        return false;
    }
    const minutes = (now - ms) / (1000 * 60);
    return minutes >= 0 && minutes <= NOW_PLAYING_WINDOW_MINUTES;
};

/**
 * Returns the indexes of the plays that should show as now playing: per
 * station, the newest play, if it started within the window.
 *
 * `getStation` groups plays by station. Lists that are all one station can
 * pass `() => station`.
 */
export const nowPlayingIndexes = (plays, getStation = (play) => play?.station, now = Date.now()) => {
    const newestByStation = new Map();
    (plays ?? []).forEach((play, index) => {
        const ms = playedAtMs(play);
        if (Number.isNaN(ms)) {
            return;
        }
        const key = getStation(play) ?? '';
        const current = newestByStation.get(key);
        if (!current || ms > current.ms) {
            newestByStation.set(key, { ms, index });
        }
    });

    const result = new Set();
    newestByStation.forEach(({ ms, index }) => {
        if (isWithinWindow(ms, now)) {
            result.add(index);
        }
    });
    return result;
};
