import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import { timeEntryAPI, jobAPI } from '../services/api';
import { toast } from 'react-toastify';
import { format, differenceInMinutes } from 'date-fns';
import { FaClock, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';

const TimeEntryForm = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isEdit = !!id;
  const repeatEntry = location.state?.repeatEntry;

  const [jobs, setJobs] = useState([]);
  const [formData, setFormData] = useState({
    jobId: repeatEntry?.jobId?._id || '',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: format(new Date(), 'HH:mm'),
    endTime: '',
    notes: repeatEntry?.notes || '',
  });
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit);
  const [duration, setDuration] = useState({ hours: 0, minutes: 0, valid: false });
  const [timeError, setTimeError] = useState('');

  useEffect(() => {
    fetchJobs();
    if (isEdit) {
      fetchTimeEntry();
    } else if (!repeatEntry) {
      // Auto-suggest end time (1 hour after start)
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      setFormData(prev => ({
        ...prev,
        endTime: format(oneHourLater, 'HH:mm')
      }));
    }
  }, [id]);

  // Calculate duration whenever times change
  useEffect(() => {
    if (formData.startTime && formData.endTime) {
      const start = new Date(`${formData.date}T${formData.startTime}`);
      const end = new Date(`${formData.date}T${formData.endTime}`);
      
      if (end <= start) {
        setTimeError('End time must be after start time');
        setDuration({ hours: 0, minutes: 0, valid: false });
      } else {
        const mins = differenceInMinutes(end, start);
        const hours = Math.floor(mins / 60);
        const minutes = mins % 60;
        setDuration({ hours, minutes, valid: true });
        setTimeError('');
      }
    }
  }, [formData.startTime, formData.endTime, formData.date]);

  const fetchJobs = async () => {
    try {
      const response = await jobAPI.getJobs({ active: true });
      setJobs(response.data.jobs);
    } catch (error) {
      toast.error('Failed to fetch jobs');
    }
  };

  const fetchTimeEntry = async () => {
    try {
      const response = await timeEntryAPI.getTimeEntry(id);
      const entry = response.data.timeEntry;
      
      const startDate = new Date(entry.startAt);
      const endDate = new Date(entry.endAt);

      setFormData({
        jobId: entry.jobId._id,
        date: format(startDate, 'yyyy-MM-dd'),
        startTime: format(startDate, 'HH:mm'),
        endTime: format(endDate, 'HH:mm'),
        notes: entry.notes || '',
      });
    } catch (error) {
      toast.error('Failed to fetch time entry');
      navigate('/time-entries');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Combine date and time
      const startAt = new Date(`${formData.date}T${formData.startTime}`);
      const endAt = new Date(`${formData.date}T${formData.endTime}`);

      if (endAt <= startAt) {
        toast.error('End time must be after start time');
        setLoading(false);
        return;
      }

      const dataToSend = {
        jobId: formData.jobId,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        notes: formData.notes,
      };

      if (isEdit) {
        await timeEntryAPI.updateTimeEntry(id, dataToSend);
        toast.success('Time entry updated successfully');
      } else {
        await timeEntryAPI.createTimeEntry(dataToSend);
        toast.success('Time entry created successfully');
      }
      navigate('/time-entries');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save time entry');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 sm:px-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isEdit ? 'Edit Time Entry' : repeatEntry ? 'Repeat Time Entry' : 'Add Time Entry'}
          </h1>
          <p className="text-gray-600 mb-6">
            {isEdit ? 'Update your work hours' : 'Track your work hours effortlessly'}
          </p>

          {repeatEntry && (
            <div className="info-box mb-6">
              <p className="text-sm text-blue-800">
                📋 Repeating entry from {format(new Date(repeatEntry.startAt), 'MMM dd, yyyy')}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="card space-y-6">
            <div>
              <label htmlFor="jobId" className="label">
                Select Job <span className="text-red-500">*</span>
              </label>
              <select
                id="jobId"
                name="jobId"
                required
                className="input"
                value={formData.jobId}
                onChange={handleChange}
                aria-label="Select job"
              >
                <option value="">Choose a job...</option>
                {jobs.map((job) => (
                  <option key={job._id} value={job._id}>
                    {job.title} - {job.companyName} (₹{(job.currentHourlyRate / 100).toFixed(2)}/hr)
                  </option>
                ))}
              </select>
              {jobs.length === 0 && (
                <p className="warning-message mt-2">
                  ⚠️ No active jobs found. Please create a job first.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="date" className="label">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="date"
                name="date"
                required
                className="input"
                value={formData.date}
                onChange={handleChange}
                max={format(new Date(), 'yyyy-MM-dd')}
                aria-label="Select date"
              />
              <p className="text-sm text-gray-500 mt-1">
                ℹ️ Select the date you worked
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startTime" className="label">
                  Start Time <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="time"
                    id="startTime"
                    name="startTime"
                    required
                    className={`input ${timeError ? 'input-error' : ''}`}
                    value={formData.startTime}
                    onChange={handleChange}
                    aria-label="Start time"
                  />
                  <FaClock className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label htmlFor="endTime" className="label">
                  End Time <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="time"
                    id="endTime"
                    name="endTime"
                    required
                    className={`input ${timeError ? 'input-error' : ''}`}
                    value={formData.endTime}
                    onChange={handleChange}
                    aria-label="End time"
                  />
                  <FaClock className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Live Duration Display */}
            {formData.startTime && formData.endTime && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-4 rounded-xl border-2 ${
                  duration.valid 
                    ? 'bg-green-50 border-green-300' 
                    : 'bg-red-50 border-red-300'
                }`}
              >
                {duration.valid ? (
                  <div className="flex items-center gap-3">
                    <FaCheckCircle className="text-2xl text-green-600" />
                    <div>
                      <p className="text-sm text-green-700 font-semibold">Duration calculated</p>
                      <p className="text-2xl font-bold text-green-900">
                        {duration.hours > 0 && `${duration.hours} hr `}
                        {duration.minutes > 0 && `${duration.minutes} min`}
                        {duration.hours === 0 && duration.minutes === 0 && '0 min'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <FaExclamationTriangle className="text-2xl text-red-600" />
                    <div>
                      <p className="text-sm text-red-700 font-semibold">Invalid time range</p>
                      <p className="text-sm text-red-600">{timeError}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            <div>
              <label htmlFor="notes" className="label">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                rows="4"
                className="input"
                placeholder="Add details about what you worked on..."
                value={formData.notes}
                onChange={handleChange}
                maxLength="1000"
                aria-label="Notes"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.notes.length}/1000 characters
              </p>
            </div>

            <div className="sticky-footer">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={loading || !duration.valid || jobs.length === 0}
                  className="flex-1 btn btn-primary"
                >
                  {loading ? 'Saving...' : isEdit ? 'Update Entry' : 'Save Entry'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/time-entries')}
                  className="flex-1 btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </Layout>
  );
};

export default TimeEntryForm;

