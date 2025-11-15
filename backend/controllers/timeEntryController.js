const TimeEntry = require('../models/TimeEntry');
const Job = require('../models/Job');
const logger = require('../config/logger');

// @desc    Create time entry
// @route   POST /api/time-entries
// @access  Private
exports.createTimeEntry = async (req, res, next) => {
  try {
    const { jobId, startAt, endAt, notes } = req.body;

    // Validation
    if (!jobId || !startAt || !endAt) {
      return res.status(400).json({
        success: false,
        message: 'Please provide job, start time, and end time',
      });
    }

    // Validate times
    const start = new Date(startAt);
    const end = new Date(endAt);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format',
      });
    }

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time',
      });
    }

    // Check if job exists and user has access
    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    if (job.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add time entries to this job',
      });
    }

    if (!job.active) {
      return res.status(400).json({
        success: false,
        message: 'Cannot add time entries to inactive job',
      });
    }

    // Create time entry
    const timeEntry = await TimeEntry.create({
      userId: req.user.id,
      jobId,
      startAt: start,
      endAt: end,
      notes,
    });

    logger.info(`Time entry created: ${timeEntry._id} by user: ${req.user.id}`);

    res.status(201).json({
      success: true,
      timeEntry,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all time entries for logged in user
// @route   GET /api/time-entries
// @access  Private
exports.getTimeEntries = async (req, res, next) => {
  try {
    const { jobId, startDate, endDate, page = 1, limit = 50 } = req.query;

    const filter = { userId: req.user.id };

    // Filter by job
    if (jobId) {
      filter.jobId = jobId;
    }

    // Filter by date range
    if (startDate || endDate) {
      filter.startAt = {};
      if (startDate) {
        filter.startAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.startAt.$lte = new Date(endDate);
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const timeEntries = await TimeEntry.find(filter)
      .populate('jobId', 'title companyName')
      .sort({ startAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await TimeEntry.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: timeEntries.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      timeEntries,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single time entry
// @route   GET /api/time-entries/:id
// @access  Private
exports.getTimeEntry = async (req, res, next) => {
  try {
    const timeEntry = await TimeEntry.findById(req.params.id)
      .populate('jobId', 'title companyName companyOwnerName contactNumber')
      .populate('userId', 'firstName lastName email');

    if (!timeEntry) {
      return res.status(404).json({
        success: false,
        message: 'Time entry not found',
      });
    }

    // Check ownership
    if (timeEntry.userId._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this time entry',
      });
    }

    res.status(200).json({
      success: true,
      timeEntry,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update time entry
// @route   PUT /api/time-entries/:id
// @access  Private
exports.updateTimeEntry = async (req, res, next) => {
  try {
    let timeEntry = await TimeEntry.findById(req.params.id);

    if (!timeEntry) {
      return res.status(404).json({
        success: false,
        message: 'Time entry not found',
      });
    }

    // Check ownership
    if (timeEntry.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this time entry',
      });
    }

    const { jobId, startAt, endAt, notes } = req.body;

    // Update fields
    if (jobId !== undefined) {
      // Verify job exists and user has access
      const job = await Job.findById(jobId);
      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Job not found',
        });
      }
      if (job.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to use this job',
        });
      }
      timeEntry.jobId = jobId;
    }

    if (startAt !== undefined) {
      timeEntry.startAt = new Date(startAt);
    }

    if (endAt !== undefined) {
      timeEntry.endAt = new Date(endAt);
    }

    if (notes !== undefined) {
      timeEntry.notes = notes;
    }

    // Validate times
    if (timeEntry.endAt <= timeEntry.startAt) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time',
      });
    }

    await timeEntry.save();

    logger.info(`Time entry updated: ${timeEntry._id} by user: ${req.user.id}`);

    res.status(200).json({
      success: true,
      timeEntry,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete time entry
// @route   DELETE /api/time-entries/:id
// @access  Private
exports.deleteTimeEntry = async (req, res, next) => {
  try {
    const timeEntry = await TimeEntry.findById(req.params.id);

    if (!timeEntry) {
      return res.status(404).json({
        success: false,
        message: 'Time entry not found',
      });
    }

    // Check ownership
    if (timeEntry.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this time entry',
      });
    }

    await timeEntry.deleteOne();

    logger.info(`Time entry deleted: ${timeEntry._id} by user: ${req.user.id}`);

    res.status(200).json({
      success: true,
      message: 'Time entry deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get time entries summary
// @route   GET /api/time-entries/summary/stats
// @access  Private
exports.getTimeEntriesSummary = async (req, res, next) => {
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

    // Aggregate by job
    const summary = await TimeEntry.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$jobId',
          totalMinutes: { $sum: '$cachedMinutes' },
          entryCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'jobs',
          localField: '_id',
          foreignField: '_id',
          as: 'job',
        },
      },
      { $unwind: '$job' },
      {
        $project: {
          jobId: '$_id',
          jobTitle: '$job.title',
          companyName: '$job.companyName',
          totalMinutes: 1,
          totalHours: { $divide: ['$totalMinutes', 60] },
          entryCount: 1,
        },
      },
      { $sort: { totalMinutes: -1 } },
    ]);

    const totalMinutes = summary.reduce((sum, item) => sum + item.totalMinutes, 0);

    res.status(200).json({
      success: true,
      summary,
      totalMinutes,
      totalHours: totalMinutes / 60,
    });
  } catch (error) {
    next(error);
  }
};

