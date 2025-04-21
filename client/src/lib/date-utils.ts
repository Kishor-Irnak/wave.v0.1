import { format, formatDistance, formatRelative, subDays } from 'date-fns';

export const formatDate = (date: Date | number): string => {
  return format(date, 'MMMM d, yyyy');
};

export const formatDateShort = (date: Date | number): string => {
  return format(date, 'MMM d, yyyy');
};

export const getRelativeTime = (date: Date | number): string => {
  return formatDistance(date, new Date(), { addSuffix: true });
};

export const formatReadingTime = (content: string): string => {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min read`;
};
