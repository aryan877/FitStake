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
 * Formats a timestamp into a countdown with appropriate prefix
 * @param timestamp Unix timestamp in seconds
 * @param prefix The prefix to add before the countdown (e.g., "Starts in" or "Ends in")
 * @returns Formatted string with prefix
 */
export const formatCountdownWithPrefix = (
  timestamp: number,
  prefix: string
): string => {
  const targetDate = dayjs.unix(timestamp);
  const now = dayjs();

  // If the date is in the past
  if (targetDate.isBefore(now)) {
    return prefix === 'Starts in' ? 'Started' : 'Ended';
  }

  const diff = targetDate.diff(now);
  const durationObj = dayjs.duration(diff);

  // If more than 7 days away, show the date
  if (durationObj.asDays() > 7) {
    return `${prefix} ${targetDate.format('MMM D, YYYY')}`;
  }

  // If between 1-7 days, show days + hours + minutes + seconds
  if (durationObj.asDays() >= 1) {
    const days = Math.floor(durationObj.asDays());
    const hours = durationObj.hours();
    const minutes = durationObj.minutes();
    const seconds = durationObj.seconds();

    return `${prefix} ${days}d ${hours}h ${minutes}m ${seconds}s`;
  }

  // If less than a day but more than an hour
  if (durationObj.asHours() >= 1) {
    const hours = Math.floor(durationObj.asHours());
    const minutes = durationObj.minutes();
    const seconds = durationObj.seconds();

    return `${prefix} ${hours}h ${minutes}m ${seconds}s`;
  }

  // If less than an hour but more than a minute
  if (durationObj.asMinutes() >= 1) {
    const minutes = Math.floor(durationObj.asMinutes());
    const seconds = durationObj.seconds();

    return `${prefix} ${minutes}m ${seconds}s`;
  }

  // If less than a minute
  const seconds = Math.floor(durationObj.asSeconds());
  return seconds > 0
    ? `${prefix} ${seconds}s`
    : prefix === 'Starts in'
    ? 'Starting now'
    : 'Ending now';
};

/**
 * Determines if a challenge has started based on its start time
 * @param startTime Unix timestamp in seconds
 * @returns Boolean indicating if challenge has started
 */
export const hasStarted = (startTime: number): boolean => {
  const startDate = dayjs.unix(startTime);
  const now = dayjs();
  return startDate.isBefore(now);
};

/**
 * Formats appropriate time display based on challenge start/end times
 * @param startTime Unix timestamp in seconds for challenge start
 * @param endTime Unix timestamp in seconds for challenge end
 * @returns Formatted string showing either "Starts in" countdown or "Ending in" countdown
 */
export const formatTimeDisplay = (
  startTime: number,
  endTime: number
): string => {
  const now = dayjs();
  const startDate = dayjs.unix(startTime);

  // If challenge hasn't started yet, show "Starts in" countdown
  if (startDate.isAfter(now)) {
    return formatCountdownWithPrefix(startTime, 'Starts in');
  }

  // Otherwise show the regular end countdown
  return formatCountdown(endTime);
};

/**
 * Formats a date for display in a readable format
 * @param timestamp Unix timestamp in seconds or milliseconds, or Date object
 * @returns Formatted date string
 */
export const formatDate = (timestamp: number | Date): string => {
  if (timestamp instanceof Date) {
    // If it's a Date object, convert to unix timestamp in seconds
    return dayjs(timestamp).format('MMM D, YYYY, h:mm A');
  }

  // If it's a unix timestamp in seconds (smaller than year 2100)
  if (timestamp < 4102444800) {
    return dayjs.unix(timestamp).format('MMM D, YYYY, h:mm A');
  }

  // Otherwise, assume it's in milliseconds
  return dayjs(timestamp).format('MMM D, YYYY, h:mm A');
};

/**
 * Returns a relative time string (e.g., "2 days ago")
 * @param timestamp Unix timestamp in seconds
 * @returns Relative time string
 */
export const getRelativeTime = (timestamp: number): string => {
  return dayjs.unix(timestamp).fromNow();
};

// Add default export
const dateFormatting = {
  formatCountdown,
  formatCountdownWithPrefix,
  formatTimeDisplay,
  formatDate,
  getRelativeTime,
  hasStarted,
};

export default dateFormatting;
