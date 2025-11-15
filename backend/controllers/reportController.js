const TimeEntry = require('../models/TimeEntry');
const Job = require('../models/Job');
const RateChange = require('../models/RateChange');
const { calculateJobWiseSalary } = require('../utils/salaryCalculator');
const logger = require('../config/logger');

// @desc    Get salary report
// @route   GET /api/reports/salary
// @access  Private
exports.getSalaryReport = async (req, res, next) => {
  try {
    const { startDate, endDate, jobId } = req.query;

    // Validation
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide start date and end date',
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format',
      });
    }

    if (end < start) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date',
      });
    }

    // Build filter
    const filter = {
      userId: req.user.id,
      startAt: { $gte: start, $lte: end },
    };

    if (jobId) {
      filter.jobId = jobId;
    }

    // Get time entries
    const timeEntries = await TimeEntry.find(filter)
      .populate('jobId', 'title companyName companyOwnerName contactNumber')
      .sort({ startAt: 1 });

    if (timeEntries.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No time entries found for the specified period',
        report: {
          startDate: start,
          endDate: end,
          jobWiseSalary: [],
          grandTotalCents: 0,
          grandTotalDollars: 0,
        },
      });
    }

    // Calculate salary
    const { jobWiseSalary, grandTotalCents } = await calculateJobWiseSalary(timeEntries);

    // Format response
    const formattedReport = {
      startDate: start,
      endDate: end,
      jobWiseSalary: jobWiseSalary.map(jobData => ({
        jobId: jobData.jobId,
        jobTitle: jobData.job.title,
        companyName: jobData.job.companyName,
        totalPaise: jobData.totalCents,
        totalRupees: (jobData.totalCents / 100).toFixed(2),
        entries: jobData.entries.map(entry => ({
          entryId: entry.entryId,
          startAt: entry.startAt,
          endAt: entry.endAt,
          notes: entry.notes,
          totalPaise: entry.totalCents,
          totalRupees: (entry.totalCents / 100).toFixed(2),
          breakdown: entry.breakdown.map(segment => ({
            startAt: segment.startAt,
            endAt: segment.endAt,
            hourlyRatePaise: segment.hourlyRateCents,
            hourlyRateRupees: (segment.hourlyRateCents / 100).toFixed(2),
            durationHours: segment.durationHours,
            payPaise: segment.payCents,
            payRupees: (segment.payCents / 100).toFixed(2),
          })),
        })),
      })),
      grandTotalPaise: grandTotalCents,
      grandTotalRupees: (grandTotalCents / 100).toFixed(2),
    };

    logger.info(`Salary report generated for user: ${req.user.id}, period: ${startDate} to ${endDate}`);

    res.status(200).json({
      success: true,
      report: formattedReport,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get monthly salary report
// @route   GET /api/reports/salary/monthly
// @access  Private
exports.getMonthlySalaryReport = async (req, res, next) => {
  try {
    const { year, month } = req.query;

    // Validation
    if (!year || !month) {
      return res.status(400).json({
        success: false,
        message: 'Please provide year and month',
      });
    }

    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({
        success: false,
        message: 'Invalid year or month',
      });
    }

    // Calculate start and end of month
    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);

    // Reuse the salary report logic
    req.query.startDate = startDate.toISOString();
    req.query.endDate = endDate.toISOString();

    return exports.getSalaryReport(req, res, next);
  } catch (error) {
    next(error);
  }
};

// @desc    Get job-wise salary summary
// @route   GET /api/reports/job-summary
// @access  Private
exports.getJobSalarySummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const filter = { userId: req.user.id };

    if (startDate || endDate) {
      filter.startAt = {};
      if (startDate) {
        filter.startAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.startAt.$lte = new Date(endDate);
      }
    }

    // Get time entries
    const timeEntries = await TimeEntry.find(filter)
      .populate('jobId', 'title companyName')
      .sort({ startAt: 1 });

    if (timeEntries.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No time entries found',
        summary: [],
        totalCents: 0,
        totalDollars: 0,
      });
    }

    // Calculate salary
    const { jobWiseSalary, grandTotalCents } = await calculateJobWiseSalary(timeEntries);

    // Format summary (without detailed breakdown)
    const summary = jobWiseSalary.map(jobData => {
      const totalMinutes = jobData.entries.reduce((sum, entry) => {
        const duration = new Date(entry.endAt) - new Date(entry.startAt);
        return sum + (duration / (1000 * 60));
      }, 0);

      return {
        jobId: jobData.jobId,
        jobTitle: jobData.job.title,
        companyName: jobData.job.companyName,
        totalPaise: jobData.totalCents,
        totalRupees: (jobData.totalCents / 100).toFixed(2),
        totalHours: (totalMinutes / 60).toFixed(2),
        entryCount: jobData.entries.length,
      };
    });

    res.status(200).json({
      success: true,
      summary,
      totalPaise: grandTotalCents,
      totalRupees: (grandTotalCents / 100).toFixed(2),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export salary report as CSV
// @route   GET /api/reports/salary/export
// @access  Private
exports.exportSalaryReport = async (req, res, next) => {
  try {
    const { startDate, endDate, jobId } = req.query;

    // Validation
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide start date and end date',
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Build filter
    const filter = {
      userId: req.user.id,
      startAt: { $gte: start, $lte: end },
    };

    if (jobId) {
      filter.jobId = jobId;
    }

    // Get time entries
    const timeEntries = await TimeEntry.find(filter)
      .populate('jobId', 'title companyName companyOwnerName contactNumber')
      .sort({ startAt: 1 });

    if (timeEntries.length === 0) {
      return res.status(200).json({
        success: false,
        message: 'No time entries found for the specified period',
      });
    }

    // Calculate salary
    const { jobWiseSalary, grandTotalCents } = await calculateJobWiseSalary(timeEntries);

    // Generate CSV
    let csv = 'Job Title,Company Name,Entry Start,Entry End,Duration (Hours),Notes,Segment Start,Segment End,Hourly Rate (₹),Segment Duration (Hours),Segment Pay (₹)\n';

    for (const jobData of jobWiseSalary) {
      for (const entry of jobData.entries) {
        const entryStart = new Date(entry.startAt).toLocaleString();
        const entryEnd = new Date(entry.endAt).toLocaleString();
        const totalDuration = ((new Date(entry.endAt) - new Date(entry.startAt)) / (1000 * 60 * 60)).toFixed(2);
        const notes = (entry.notes || '').replace(/,/g, ';').replace(/\n/g, ' ');

        for (const segment of entry.breakdown) {
          const segmentStart = new Date(segment.startAt).toLocaleString();
          const segmentEnd = new Date(segment.endAt).toLocaleString();
          const hourlyRate = (segment.hourlyRateCents / 100).toFixed(2);
          const segmentPay = (segment.payCents / 100).toFixed(2);

          csv += `"${jobData.job.title}","${jobData.job.companyName}","${entryStart}","${entryEnd}",${totalDuration},"${notes}","${segmentStart}","${segmentEnd}",${hourlyRate},${segment.durationHours},${segmentPay}\n`;
        }
      }
    }

    // Add summary row
    csv += `\nTotal Salary:,,,,,,,,,,₹${(grandTotalCents / 100).toFixed(2)}\n`;

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=salary-report-${startDate}-to-${endDate}.csv`);

    logger.info(`Salary report exported for user: ${req.user.id}, period: ${startDate} to ${endDate}`);

    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
};

