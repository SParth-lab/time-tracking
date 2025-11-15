/**
 * Currency utility functions
 * All monetary values are stored as integers in paise to avoid floating-point errors
 * 1 Rupee = 100 Paise
 */

/**
 * Convert rupees to paise
 * @param {number|string} rupees - Amount in rupees
 * @returns {number} Amount in paise (integer)
 */
export const rupeesToPaise = (rupees) => {
  return Math.round(parseFloat(rupees) * 100);
};

/**
 * Convert paise to rupees
 * @param {number} paise - Amount in paise
 * @returns {string} Amount in rupees with 2 decimal places
 */
export const paiseToRupees = (paise) => {
  return (paise / 100).toFixed(2);
};

/**
 * Format paise as currency string
 * @param {number} paise - Amount in paise
 * @returns {string} Formatted currency string (e.g., "₹25.50")
 */
export const formatCurrency = (paise) => {
  return `₹${paiseToRupees(paise)}`;
};

/**
 * Validate hourly rate input
 * @param {string|number} value - Input value
 * @returns {Object} { valid: boolean, message?: string, paise?: number }
 */
export const validateHourlyRate = (value) => {
  const rupees = parseFloat(value);
  
  if (isNaN(rupees)) {
    return { valid: false, message: 'Please enter a valid number' };
  }
  
  if (rupees < 0) {
    return { valid: false, message: 'Rate must be positive' };
  }
  
  if (rupees > 100000) {
    return { valid: false, message: 'Rate seems too high' };
  }
  
  // Check for excessive decimal places
  const paise = Math.round(rupees * 100);
  const reconstructed = paise / 100;
  
  if (Math.abs(rupees - reconstructed) > 0.001) {
    return { 
      valid: false, 
      message: 'Rate can only have up to 2 decimal places' 
    };
  }
  
  return { valid: true, paise };
};

/**
 * Calculate duration in hours from start and end times
 * @param {Date|string} startAt - Start time
 * @param {Date|string} endAt - End time
 * @returns {number} Duration in hours
 */
export const calculateDuration = (startAt, endAt) => {
  const start = new Date(startAt);
  const end = new Date(endAt);
  const durationMs = end - start;
  return durationMs / (1000 * 60 * 60);
};

/**
 * Format duration in hours to human-readable string
 * @param {number} hours - Duration in hours
 * @returns {string} Formatted duration (e.g., "8.5 hrs")
 */
export const formatDuration = (hours) => {
  return `${hours.toFixed(2)} hrs`;
};

