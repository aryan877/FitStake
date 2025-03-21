import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';

// Configure dayjs plugins
dayjs.extend(relativeTime);
dayjs.extend(duration);

/**
 * Formats a timestamp into a human-readable countdown or date string.
 * @param timestamp Unix timestamp in seconds
 * @returns Formatted string representing when the event ends
 */
export const formatCountdown = (timestamp: number): string => {
  const targetDate = dayjs.unix(timestamp);
  const now = dayjs();

  // If the date is in the past
  if (targetDate.isBefore(now)) {
    return 'Ended';
  }

  const diff = targetDate.diff(now);
  const durationObj = dayjs.duration(diff);

  // If more than 7 days away, show the date
  if (durationObj.asDays() > 7) {
    return `Ends on ${targetDate.format('MMM D, YYYY')}`;
  }

  // If between 1-7 days, show days + hours + minutes + seconds
  if (durationObj.asDays() >= 1) {
    const days = Math.floor(durationObj.asDays());
    const hours = durationObj.hours();
    const minutes = durationObj.minutes();
    const seconds = durationObj.seconds();

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }

  // If less than a day but more than an hour
  if (durationObj.asHours() >= 1) {
    const hours = Math.floor(durationObj.asHours());
    const minutes = durationObj.minutes();
    const seconds = durationObj.seconds();

    return `${hours}h ${minutes}m ${seconds}s`;
  }

  // If less than an hour but more than a minute
  if (durationObj.asMinutes() >= 1) {
    const minutes = Math.floor(durationObj.asMinutes());
    const seconds = durationObj.seconds();

    return `${minutes}m ${seconds}s`;
  }

  // If less than a minute
  const seconds = Math.floor(durationObj.asSeconds());
  return seconds > 0 ? `${seconds}s` : 'Ending now';
};

/**
 * Formats a date for display in a readable format
 * @param timestamp Unix timestamp in seconds
 * @returns Formatted date string
 */
export const formatDate = (timestamp: number): string => {
  return dayjs.unix(timestamp).format('MMM D, YYYY');
};

/**
 * Returns a relative time string (e.g., "2 days ago")
 * @param timestamp Unix timestamp in seconds
 * @returns Relative time string
 */
export const getRelativeTime = (timestamp: number): string => {
  return dayjs.unix(timestamp).fromNow();
};
