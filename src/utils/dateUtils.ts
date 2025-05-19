import { Timestamp } from 'firebase/firestore';

/**
 * Format a date to a string in the format "YYYY-MM-DD"
 */
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Format a date to a string in the format "HH:MM"
 */
export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/**
 * Format a date to a string in the format "YYYY-MM-DD HH:MM"
 */
export const formatDateTime = (date: Date): string => {
  return `${formatDate(date)} ${formatTime(date)}`;
};

/**
 * Get the start of the day for a given date
 */
export const getStartOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

/**
 * Get the end of the day for a given date
 */
export const getEndOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

/**
 * Get the start of the week for a given date (Sunday)
 */
export const getStartOfWeek = (date: Date): Date => {
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() - day);
  result.setHours(0, 0, 0, 0);
  return result;
};

/**
 * Get the end of the week for a given date (Saturday)
 */
export const getEndOfWeek = (date: Date): Date => {
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() + (6 - day));
  result.setHours(23, 59, 59, 999);
  return result;
};

/**
 * Get the start of the month for a given date
 */
export const getStartOfMonth = (date: Date): Date => {
  const result = new Date(date);
  result.setDate(1);
  result.setHours(0, 0, 0, 0);
  return result;
};

/**
 * Get the end of the month for a given date
 */
export const getEndOfMonth = (date: Date): Date => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + 1);
  result.setDate(0);
  result.setHours(23, 59, 59, 999);
  return result;
};

/**
 * Convert a Firestore timestamp to a JavaScript Date
 */
export const timestampToDate = (timestamp: Timestamp): Date => {
  return timestamp.toDate();
};

/**
 * Get an array of dates between start and end dates (inclusive)
 */
export const getDateRange = (startDate: Date, endDate: Date): Date[] => {
  const dates: Date[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
};

/**
 * Get the day name (e.g., "Monday") for a given date
 */
export const getDayName = (date: Date, short: boolean = false): string => {
  const options: Intl.DateTimeFormatOptions = { weekday: short ? 'short' : 'long' };
  return date.toLocaleDateString(undefined, options);
};

/**
 * Get the month name (e.g., "January") for a given date
 */
export const getMonthName = (date: Date, short: boolean = false): string => {
  const options: Intl.DateTimeFormatOptions = { month: short ? 'short' : 'long' };
  return date.toLocaleDateString(undefined, options);
};

/**
 * Calculate the difference in days between two dates
 */
export const getDaysDifference = (date1: Date, date2: Date): number => {
  const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
  const firstDate = new Date(date1);
  const secondDate = new Date(date2);
  
  // Set both dates to the start of the day to ignore time differences
  firstDate.setHours(0, 0, 0, 0);
  secondDate.setHours(0, 0, 0, 0);
  
  const diffDays = Math.round(Math.abs((firstDate.getTime() - secondDate.getTime()) / oneDay));
  return diffDays;
}; 