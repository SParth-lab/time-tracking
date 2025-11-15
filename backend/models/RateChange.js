const mongoose = require('mongoose');

const rateChangeSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
    index: true,
  },
  hourlyRate: {
    type: Number,
    required: [true, 'Hourly rate is required'],
    min: [0, 'Hourly rate must be positive'],
    // Store in paise to avoid floating point errors (1 Rupee = 100 Paise)
    validate: {
      validator: Number.isInteger,
      message: 'Hourly rate must be stored in paise (integer)',
    },
  },
  effectiveAt: {
    type: Date,
    required: [true, 'Effective date is required'],
    index: true,
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: { createdAt: true, updatedAt: false },
});

// Compound index for efficient rate lookups
rateChangeSchema.index({ jobId: 1, effectiveAt: -1 });

// Prevent modification of rate changes (immutable)
rateChangeSchema.pre('save', function(next) {
  if (!this.isNew) {
    return next(new Error('Rate changes cannot be modified'));
  }
  next();
});

module.exports = mongoose.model('RateChange', rateChangeSchema);

