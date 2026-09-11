const MS_PER_DAY = 24 * 60 * 60 * 1000;

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

/**
 * "היום" / "אתמול" / dd/mm/yy for a play timestamp.
 *
 * Lives here because three surfaces derived it separately before, and the
 * station feed had no day marker at all — every row just said a time, with no
 * way to tell where yesterday began.
 */
export const dayLabel = (playedAt) => {
  if (!playedAt) {
    return '';
  }
  const parsed = new Date(playedAt);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  const diffDays = Math.round((startOfDay(new Date()) - startOfDay(parsed)) / MS_PER_DAY);
  if (diffDays === 0) return 'היום';
  if (diffDays === 1) return 'אתמול';

  return parsed.toLocaleDateString('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  });
};

export default dayLabel;
