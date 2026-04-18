import { formatAuthorDisplay, formatRelativeTime } from '../breed';

describe('formatAuthorDisplay', () => {
  it('returns first name and dog name when dog name is present', () => {
    expect(formatAuthorDisplay('Chris Smith', 'Koda')).toBe('Chris & Koda');
  });

  it('returns only first name when dog name is absent', () => {
    expect(formatAuthorDisplay('Chris Smith', null)).toBe('Chris');
    expect(formatAuthorDisplay('Chris Smith', undefined)).toBe('Chris');
  });

  it('returns only first name when dog name is empty string', () => {
    expect(formatAuthorDisplay('Chris Smith', '')).toBe('Chris');
    expect(formatAuthorDisplay('Chris Smith', '   ')).toBe('Chris');
  });

  it('handles single-word author name', () => {
    expect(formatAuthorDisplay('Chris', 'Koda')).toBe('Chris & Koda');
    expect(formatAuthorDisplay('Chris', null)).toBe('Chris');
  });
});

describe('formatRelativeTime', () => {
  const now = new Date();

  const dateMinutesAgo = (mins: number) =>
    new Date(now.getTime() - mins * 60 * 1000).toISOString();

  it('returns "Just now" for less than 1 minute ago', () => {
    expect(formatRelativeTime(dateMinutesAgo(0))).toBe('Just now');
  });

  it('returns minutes for less than 1 hour ago', () => {
    expect(formatRelativeTime(dateMinutesAgo(5))).toBe('5m ago');
    expect(formatRelativeTime(dateMinutesAgo(59))).toBe('59m ago');
  });

  it('returns hours for less than 1 day ago', () => {
    expect(formatRelativeTime(dateMinutesAgo(60))).toBe('1h ago');
    expect(formatRelativeTime(dateMinutesAgo(120))).toBe('2h ago');
    expect(formatRelativeTime(dateMinutesAgo(23 * 60))).toBe('23h ago');
  });

  it('returns days for less than 1 week ago', () => {
    expect(formatRelativeTime(dateMinutesAgo(24 * 60))).toBe('1d ago');
    expect(formatRelativeTime(dateMinutesAgo(6 * 24 * 60))).toBe('6d ago');
  });

  it('returns locale date string for older dates', () => {
    const oldDate = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);
    const result = formatRelativeTime(oldDate.toISOString());
    expect(result).toBe(oldDate.toLocaleDateString());
  });
});
