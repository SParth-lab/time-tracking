import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  MenuItem,
  Alert,
  AlertTitle,
  Stack,
  Chip,
  InputAdornment,
  Grid,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import {
  Schedule as ClockIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Business as BusinessIcon,
  Notes as NotesIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Replay as RepeatIcon,
} from '@mui/icons-material';
import Layout from '../components/Layout';
import { timeEntryAPI, jobAPI } from '../services/api';
import { toast } from 'react-toastify';
import moment from 'moment';
import { differenceInMinutes, formatDuration, formatDate, addHours } from '../utils/dateUtils';

const TimeEntryFormMUI = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isEdit = !!id;
  const repeatEntry = location.state?.repeatEntry;

  const [jobs, setJobs] = useState([]);
  const [formData, setFormData] = useState({
    jobId: repeatEntry?.jobId?._id || '',
    date: moment(),
    startTime: moment(),
    endTime: null,
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
      setFormData(prev => ({
        ...prev,
        endTime: moment(prev.startTime).add(1, 'hour'),
      }));
    }
  }, [id]);

  // Calculate duration whenever times change
  useEffect(() => {
    if (formData.startTime && formData.endTime) {
      const start = moment(formData.startTime);
      const end = moment(formData.endTime);
      
      // Check if both times are on the same day
      const startOnDate = moment(formData.date)
        .hour(start.hour())
        .minute(start.minute());
      const endOnDate = moment(formData.date)
        .hour(end.hour())
        .minute(end.minute());
      
      if (endOnDate.isSameOrBefore(startOnDate)) {
        setTimeError('End time must be after start time');
        setDuration({ hours: 0, minutes: 0, valid: false });
      } else {
        const mins = differenceInMinutes(endOnDate.toDate(), startOnDate.toDate());
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
      
      setFormData({
        jobId: entry.jobId._id,
        date: moment(entry.startAt),
        startTime: moment(entry.startAt),
        endTime: moment(entry.endAt),
        notes: entry.notes || '',
      });
    } catch (error) {
      toast.error('Failed to fetch time entry');
      navigate('/time-entries');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!duration.valid) {
      toast.error('Please fix the time entry errors');
      return;
    }

    setLoading(true);

    try {
      // Combine date with times
      const startAt = moment(formData.date)
        .hour(formData.startTime.hour())
        .minute(formData.startTime.minute())
        .second(0);
      
      const endAt = moment(formData.date)
        .hour(formData.endTime.hour())
        .minute(formData.endTime.minute())
        .second(0);

      const dataToSend = {
        jobId: formData.jobId,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        notes: formData.notes,
      };

      if (isEdit) {
        await timeEntryAPI.updateTimeEntry(id, dataToSend);
        toast.success('✅ Time entry updated successfully!');
      } else {
        await timeEntryAPI.createTimeEntry(dataToSend);
        toast.success('✅ Time entry created successfully!');
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
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <Typography>Loading...</Typography>
          </Box>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Box mb={3}>
            <Typography variant="h3" gutterBottom>
              {isEdit ? 'Edit Time Entry' : repeatEntry ? 'Repeat Time Entry' : 'Add Time Entry'}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {isEdit ? 'Update your work hours' : 'Track your work hours effortlessly'}
            </Typography>
          </Box>

          {repeatEntry && (
            <Alert severity="info" icon={<RepeatIcon />} sx={{ mb: 3 }}>
              <AlertTitle>Repeating Entry</AlertTitle>
              Repeating entry from {formatDate(repeatEntry.startAt)}
            </Alert>
          )}

          <Paper elevation={2} sx={{ p: 4 }}>
            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                {/* Job Selection */}
                <TextField
                  select
                  label="Select Job"
                  required
                  value={formData.jobId}
                  onChange={(e) => handleChange('jobId', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BusinessIcon color="primary" />
                      </InputAdornment>
                    ),
                  }}
                  helperText={jobs.length === 0 ? 'No active jobs found. Please create a job first.' : ''}
                  error={jobs.length === 0}
                >
                  {jobs.map((job) => (
                    <MenuItem key={job._id} value={job._id}>
                      <Box>
                        <Typography variant="body1">
                          {job.title} - {job.companyName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ₹{(job.currentHourlyRate / 100).toFixed(2)}/hr
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>

                {/* Date Picker */}
                <DatePicker
                  label="Date"
                  value={formData.date}
                  onChange={(newValue) => handleChange('date', newValue)}
                  maxDate={moment()}
                  slotProps={{
                    textField: {
                      required: true,
                      helperText: 'Select the date you worked',
                    },
                  }}
                />

                {/* Time Pickers */}
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TimePicker
                      label="Start Time"
                      value={formData.startTime}
                      onChange={(newValue) => handleChange('startTime', newValue)}
                      slotProps={{
                        textField: {
                          required: true,
                          error: !!timeError,
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TimePicker
                      label="End Time"
                      value={formData.endTime}
                      onChange={(newValue) => handleChange('endTime', newValue)}
                      slotProps={{
                        textField: {
                          required: true,
                          error: !!timeError,
                        },
                      }}
                    />
                  </Grid>
                </Grid>

                {/* Duration Display */}
                {formData.startTime && formData.endTime && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <Alert
                      severity={duration.valid ? 'success' : 'error'}
                      icon={duration.valid ? <CheckIcon /> : <WarningIcon />}
                      sx={{ 
                        backgroundColor: duration.valid ? 'success.light' : 'error.light',
                      }}
                    >
                      {duration.valid ? (
                        <Box>
                          <AlertTitle>Duration Calculated</AlertTitle>
                          <Typography variant="h5" component="span" fontWeight="bold">
                            {formatDuration(duration.hours * 60 + duration.minutes)}
                          </Typography>
                        </Box>
                      ) : (
                        <Box>
                          <AlertTitle>Invalid Time Range</AlertTitle>
                          <Typography>{timeError}</Typography>
                        </Box>
                      )}
                    </Alert>
                  </motion.div>
                )}

                {/* Notes */}
                <TextField
                  label="Notes (Optional)"
                  multiline
                  rows={4}
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  inputProps={{ maxLength: 1000 }}
                  helperText={`${formData.notes.length}/1000 characters`}
                  placeholder="Add details about what you worked on..."
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 2 }}>
                        <NotesIcon color="primary" />
                      </InputAdornment>
                    ),
                  }}
                />

                {/* Action Buttons */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    disabled={loading || !duration.valid || jobs.length === 0}
                    startIcon={loading ? <ClockIcon /> : <SaveIcon />}
                  >
                    {loading ? 'Saving...' : isEdit ? 'Update Entry' : 'Save Entry'}
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    fullWidth
                    onClick={() => navigate('/time-entries')}
                    startIcon={<CancelIcon />}
                  >
                    Cancel
                  </Button>
                </Stack>
              </Stack>
            </form>
          </Paper>
        </motion.div>
      </Container>
    </Layout>
  );
};

export default TimeEntryFormMUI;

