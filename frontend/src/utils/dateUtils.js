import moment from 'moment';

// Configure moment locale (optional - default is English)
moment.locale('en');

// Format date to various formats
export const formatDate = (date, format = 'MMM DD, YYYY') => {
  if (!date) return '';
  return moment(date).format(format);
};

// Format time
export const formatTime = (date, format = 'HH:mm') => {
  if (!date) return '';
  return moment(date).format(format);
};

// Format date and time together
export const formatDateTime = (date, format = 'MMM DD, YYYY HH:mm') => {
  if (!date) return '';
  return moment(date).format(format);
};

// Get start of month (returns moment object)
export const startOfMonth = (date = new Date()) => {
  return moment(date).startOf('month');
};

// Get end of month (returns moment object)
export const endOfMonth = (date = new Date()) => {
  return moment(date).endOf('month');
};

// Get start of day (returns moment object)
export const startOfDay = (date = new Date()) => {
  return moment(date).startOf('day');
};

// Get end of day (returns moment object)
export const endOfDay = (date = new Date()) => {
  return moment(date).endOf('day');
};

// Calculate difference in minutes
export const differenceInMinutes = (endDate, startDate) => {
  return moment(endDate).diff(moment(startDate), 'minutes');
};

// Calculate difference in hours
export const differenceInHours = (endDate, startDate) => {
  return moment(endDate).diff(moment(startDate), 'hours', true);
};

// Format for input fields (YYYY-MM-DD)
export const formatForInput = (date) => {
  if (!date) return '';
  return moment(date).format('YYYY-MM-DD');
};

// Format time for input fields (HH:mm)
export const formatTimeForInput = (date) => {
  if (!date) return '';
  return moment(date).format('HH:mm');
};

// Check if date is valid
export const isValidDate = (date) => {
  return moment(date).isValid();
};

// Get today's date (returns moment object)
export const today = () => {
  return moment();
};

// Parse date string (returns moment object)
export const parseDate = (dateString) => {
  return moment(dateString);
};

// Format for display (friendly format)
export const formatFriendly = (date) => {
  if (!date) return '';
  const m = moment(date);
  const now = moment();
  
  if (m.isSame(now, 'day')) {
    return 'Today';
  }
  if (m.isSame(now.clone().subtract(1, 'day'), 'day')) {
    return 'Yesterday';
  }
  if (m.isSame(now, 'week')) {
    return m.format('dddd'); // Monday, Tuesday, etc.
  }
  return m.format('MMM DD, YYYY');
};

// Format duration (minutes to human readable)
export const formatDuration = (minutes) => {
  if (!minutes || minutes === 0) return '0 min';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins} min`;
  }
  if (mins === 0) {
    return `${hours} hr`;
  }
  return `${hours} hr ${mins} min`;
};

// Add time to date (returns moment object)
export const addHours = (date, hours) => {
  return moment(date).add(hours, 'hours');
};

export const addMinutes = (date, minutes) => {
  return moment(date).add(minutes, 'minutes');
};

// Get current time (returns moment object)
export const now = () => {
  return moment();
};

// Format for API (ISO string)
export const formatForAPI = (date) => {
  if (!date) return '';
  return moment(date).toISOString();
};

// Get month name
export const getMonthName = (month) => {
  return moment().month(month - 1).format('MMMM');
};

// Relative time (e.g., "2 hours ago")
export const fromNow = (date) => {
  if (!date) return '';
  return moment(date).fromNow();
};

export default moment;
