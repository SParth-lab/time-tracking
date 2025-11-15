const mongoose = require('mongoose');

const timeEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
    index: true,
  },
  startAt: {
    type: Date,
    required: [true, 'Start time is required'],
    index: true,
  },
  endAt: {
    type: Date,
    required: [true, 'End time is required'],
    validate: {
      validator: function(value) {
        return value > this.startAt;
      },
      message: 'End time must be after start time',
    },
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters'],
  },
  cachedMinutes: {
    type: Number,
    min: 0,
  },
}, {
  timestamps: true,
});

// Compound indexes for efficient queries
timeEntrySchema.index({ userId: 1, startAt: -1 });
timeEntrySchema.index({ jobId: 1, startAt: -1 });
timeEntrySchema.index({ userId: 1, jobId: 1, startAt: -1 });

// Calculate and cache duration in minutes before saving
timeEntrySchema.pre('save', function(next) {
  if (this.isModified('startAt') || this.isModified('endAt')) {
    const durationMs = this.endAt - this.startAt;
    this.cachedMinutes = Math.floor(durationMs / (1000 * 60));
  }
  next();
});

module.exports = mongoose.model('TimeEntry', timeEntrySchema);

