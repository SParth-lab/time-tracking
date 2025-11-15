const Job = require('../models/Job');
const RateChange = require('../models/RateChange');
const TimeEntry = require('../models/TimeEntry');
const logger = require('../config/logger');

// @desc    Create new job
// @route   POST /api/jobs
// @access  Private
exports.createJob = async (req, res, next) => {
  try {
    const { title, companyName, companyOwnerName, contactNumber, initialHourlyRate } = req.body;

    // Validation
    if (!title || !companyName || !companyOwnerName || !contactNumber || !initialHourlyRate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    // Validate hourly rate (should be in paise)
    if (!Number.isInteger(initialHourlyRate) || initialHourlyRate < 0) {
      return res.status(400).json({
        success: false,
        message: 'Hourly rate must be a positive integer (in paise)',
      });
    }

    // Create job
    const job = await Job.create({
      title,
      companyName,
      companyOwnerName,
      contactNumber,
      createdBy: req.user.id,
    });

    // Create initial rate change
    await RateChange.create({
      jobId: job._id,
      hourlyRate: initialHourlyRate,
      effectiveAt: new Date(),
      changedBy: req.user.id,
    });

    logger.info(`Job created: ${job._id} by user: ${req.user.id}`);

    res.status(201).json({
      success: true,
      job,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all jobs for logged in user
// @route   GET /api/jobs
// @access  Private
exports.getJobs = async (req, res, next) => {
  try {
    const { active } = req.query;
    
    const filter = { createdBy: req.user.id };
    if (active !== undefined) {
      filter.active = active === 'true';
    }

    const jobs = await Job.find(filter).sort({ createdAt: -1 });

    // Get current rate for each job
    const jobsWithRates = await Promise.all(
      jobs.map(async (job) => {
        const latestRate = await RateChange.findOne({ jobId: job._id })
          .sort({ effectiveAt: -1 })
          .limit(1);
        
        return {
          ...job.toObject(),
          currentHourlyRate: latestRate ? latestRate.hourlyRate : null,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: jobsWithRates.length,
      jobs: jobsWithRates,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single job
// @route   GET /api/jobs/:id
// @access  Private
exports.getJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    // Check ownership
    if (job.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this job',
      });
    }

    // Get rate history
    const rateHistory = await RateChange.find({ jobId: job._id })
      .sort({ effectiveAt: -1 })
      .populate('changedBy', 'firstName lastName email');

    res.status(200).json({
      success: true,
      job: {
        ...job.toObject(),
        rateHistory,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Private
exports.updateJob = async (req, res, next) => {
  try {
    let job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    // Check ownership
    if (job.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this job',
      });
    }

    const { title, companyName, companyOwnerName, contactNumber, active } = req.body;

    // Update allowed fields
    if (title !== undefined) job.title = title;
    if (companyName !== undefined) job.companyName = companyName;
    if (companyOwnerName !== undefined) job.companyOwnerName = companyOwnerName;
    if (contactNumber !== undefined) job.contactNumber = contactNumber;
    if (active !== undefined) job.active = active;

    await job.save();

    logger.info(`Job updated: ${job._id} by user: ${req.user.id}`);

    res.status(200).json({
      success: true,
      job,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private
exports.deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    // Check ownership
    if (job.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this job',
      });
    }

    // Check if there are time entries
    const timeEntryCount = await TimeEntry.countDocuments({ jobId: job._id });

    if (timeEntryCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete job with existing time entries. Deactivate it instead.',
      });
    }

    await job.deleteOne();

    // Delete associated rate changes
    await RateChange.deleteMany({ jobId: job._id });

    logger.info(`Job deleted: ${job._id} by user: ${req.user.id}`);

    res.status(200).json({
      success: true,
      message: 'Job deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add rate change to job
// @route   POST /api/jobs/:id/rate-change
// @access  Private
exports.addRateChange = async (req, res, next) => {
  try {
    const { hourlyRate, effectiveAt } = req.body;

    // Validation
    if (!hourlyRate || !effectiveAt) {
      return res.status(400).json({
        success: false,
        message: 'Please provide hourly rate and effective date',
      });
    }

    if (!Number.isInteger(hourlyRate) || hourlyRate < 0) {
      return res.status(400).json({
        success: false,
        message: 'Hourly rate must be a positive integer (in paise)',
      });
    }

    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    // Check ownership
    if (job.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this job',
      });
    }

    // Check if rate change already exists for this exact time
    const existingRate = await RateChange.findOne({
      jobId: job._id,
      effectiveAt: new Date(effectiveAt),
    });

    if (existingRate) {
      return res.status(400).json({
        success: false,
        message: 'Rate change already exists for this date and time',
      });
    }

    // Create rate change
    const rateChange = await RateChange.create({
      jobId: job._id,
      hourlyRate,
      effectiveAt: new Date(effectiveAt),
      changedBy: req.user.id,
    });

    logger.info(`Rate change added for job: ${job._id} by user: ${req.user.id}`);

    res.status(201).json({
      success: true,
      rateChange,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get rate history for job
// @route   GET /api/jobs/:id/rate-history
// @access  Private
exports.getRateHistory = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    // Check ownership
    if (job.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this job',
      });
    }

    const rateHistory = await RateChange.find({ jobId: job._id })
      .sort({ effectiveAt: -1 })
      .populate('changedBy', 'firstName lastName email');

    res.status(200).json({
      success: true,
      count: rateHistory.length,
      rateHistory,
    });
  } catch (error) {
    next(error);
  }
};

