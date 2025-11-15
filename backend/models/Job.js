const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
  },
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
  },
  companyOwnerName: {
    type: String,
    required: [true, 'Company owner name is required'],
    trim: true,
  },
  contactNumber: {
    type: String,
    required: [true, 'Contact number is required'],
    trim: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Index for faster queries
jobSchema.index({ createdBy: 1, active: 1 });

module.exports = mongoose.model('Job', jobSchema);

