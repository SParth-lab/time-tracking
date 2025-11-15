const RateChange = require('../models/RateChange');
const logger = require('../config/logger');

/**
 * Calculate salary for a time entry considering rate changes
 * @param {Object} timeEntry - Time entry with startAt, endAt, jobId
 * @param {Array} rateChanges - Array of rate changes for the job (sorted by effectiveAt desc)
 * @returns {Object} - { totalCents, breakdown: [{startAt, endAt, hourlyRateCents, durationHours, payCents}] }
 */
exports.calculateEntrySalary = (timeEntry, rateChanges) => {
  const { startAt, endAt } = timeEntry;
  const breakdown = [];
  let totalCents = 0;

  // Sort rate changes by effectiveAt ascending for easier processing
  const sortedRates = [...rateChanges].sort((a, b) => 
    new Date(a.effectiveAt) - new Date(b.effectiveAt)
  );

  // Find applicable rate changes within or before the time entry period
  const applicableRates = sortedRates.filter(rc => 
    new Date(rc.effectiveAt) <= new Date(endAt)
  );

  if (applicableRates.length === 0) {
    logger.warn(`No rate found for time entry ${timeEntry._id}`);
    return { totalCents: 0, breakdown: [] };
  }

  let currentStart = new Date(startAt);
  const entryEnd = new Date(endAt);

  for (let i = 0; i < applicableRates.length; i++) {
    const currentRate = applicableRates[i];
    const rateEffectiveAt = new Date(currentRate.effectiveAt);

    // If rate becomes effective after entry start
    if (rateEffectiveAt > currentStart) {
      // Use previous rate (or first rate if no previous)
      const prevRate = i > 0 ? applicableRates[i - 1] : currentRate;
      const segmentEnd = rateEffectiveAt < entryEnd ? rateEffectiveAt : entryEnd;
      
      const segment = calculateSegment(currentStart, segmentEnd, prevRate.hourlyRate);
      breakdown.push(segment);
      totalCents += segment.payCents;

      currentStart = rateEffectiveAt;
    }

    // If this is the last rate or next rate is after entry end
    const isLastSegment = i === applicableRates.length - 1 || 
                          new Date(applicableRates[i + 1].effectiveAt) > entryEnd;

    if (isLastSegment && currentStart < entryEnd) {
      const segment = calculateSegment(currentStart, entryEnd, currentRate.hourlyRate);
      breakdown.push(segment);
      totalCents += segment.payCents;
      break;
    }
  }

  return { totalCents: Math.round(totalCents), breakdown };
};

/**
 * Calculate salary for a single time segment
 */
function calculateSegment(startAt, endAt, hourlyRateCents) {
  const durationMs = endAt - startAt;
  const durationHours = durationMs / (1000 * 60 * 60);
  const payCents = durationHours * hourlyRateCents;

  return {
    startAt: startAt.toISOString(),
    endAt: endAt.toISOString(),
    hourlyRateCents,
    durationHours: Math.round(durationHours * 100) / 100, // 2 decimal places
    payCents: Math.round(payCents),
  };
}

/**
 * Get rate changes for a job within a date range
 */
exports.getRateChangesForJob = async (jobId, startDate, endDate) => {
  return await RateChange.find({
    jobId,
    effectiveAt: { $lte: new Date(endDate) },
  }).sort({ effectiveAt: 1 });
};

/**
 * Calculate total salary for multiple time entries grouped by job
 */
exports.calculateJobWiseSalary = async (timeEntries) => {
  // Group entries by job
  const jobGroups = {};
  
  for (const entry of timeEntries) {
    // Handle both populated and non-populated jobId
    const jobId = entry.jobId._id ? entry.jobId._id.toString() : entry.jobId.toString();
    if (!jobGroups[jobId]) {
      jobGroups[jobId] = [];
    }
    jobGroups[jobId].push(entry);
  }

  const results = [];
  let grandTotalCents = 0;

  // Calculate salary for each job
  for (const [jobId, entries] of Object.entries(jobGroups)) {
    // Get all rate changes for this job
    const rateChanges = await RateChange.find({ jobId }).sort({ effectiveAt: 1 });

    let jobTotalCents = 0;
    const entryDetails = [];

    for (const entry of entries) {
      const { totalCents, breakdown } = exports.calculateEntrySalary(entry, rateChanges);
      jobTotalCents += totalCents;
      
      entryDetails.push({
        entryId: entry._id,
        startAt: entry.startAt,
        endAt: entry.endAt,
        notes: entry.notes,
        totalCents,
        breakdown,
      });
    }

    results.push({
      jobId,
      job: entries[0].jobId, // Populated job object
      totalCents: jobTotalCents,
      entries: entryDetails,
    });

    grandTotalCents += jobTotalCents;
  }

  return {
    jobWiseSalary: results,
    grandTotalCents,
  };
};

