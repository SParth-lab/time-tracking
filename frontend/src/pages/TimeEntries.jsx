import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/Layout';
import { timeEntryAPI, jobAPI } from '../services/api';
import { toast } from 'react-toastify';
import { formatDate, formatTime } from '../utils/dateUtils';
import moment from 'moment';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { 
  Button, CircularProgress, Box, TextField, MenuItem, 
  Chip, IconButton, Tooltip, Dialog, DialogTitle, 
  DialogContent, DialogActions, DialogContentText 
} from '@mui/material';
import { 
  FaClock, FaCalendarAlt, FaFilter, FaPlus, FaEdit, 
  FaTrash, FaBriefcase, FaChartBar, FaCalendarDay,
  FaCalendarWeek
} from 'react-icons/fa';

const TimeEntries = () => {
  const [entries, setEntries] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    jobId: '',
    startDate: null, // moment object
    endDate: null, // moment object
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, entryId: null });
  const [showFilters, setShowFilters] = useState(false);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalHours = entries.reduce((sum, entry) => sum + ((entry.cachedMinutes || 0) / 60), 0);
    const totalEntries = entries.length;
    const uniqueJobs = new Set(entries.map(e => e.jobId?._id)).size;
    
    return {
      totalHours: totalHours.toFixed(2),
      totalEntries,
      uniqueJobs,
    };
  }, [entries]);

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    fetchTimeEntries();
  }, [filters, page]);

  const fetchJobs = async () => {
    try {
      const response = await jobAPI.getJobs({ active: true });
      setJobs(response.data.jobs);
    } catch (error) {
      console.error('Failed to fetch jobs');
    }
  };

  const fetchTimeEntries = async () => {
    try {
      const params = { page, limit: 20 };
      if (filters.jobId) params.jobId = filters.jobId;
      if (filters.startDate) params.startDate = moment(filters.startDate).format('YYYY-MM-DD');
      if (filters.endDate) params.endDate = moment(filters.endDate).format('YYYY-MM-DD');

      const response = await timeEntryAPI.getTimeEntries(params);
      setEntries(response.data.timeEntries);
      setTotalPages(response.data.pages);
    } catch (error) {
      toast.error('Failed to fetch time entries');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteDialog({ open: true, entryId: id });
  };

  const handleDeleteConfirm = async () => {
    try {
      await timeEntryAPI.deleteTimeEntry(deleteDialog.entryId);
      toast.success('Time entry deleted successfully');
      setDeleteDialog({ open: false, entryId: null });
      fetchTimeEntries();
    } catch (error) {
      toast.error('Failed to delete time entry');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, entryId: null });
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
    setPage(1); // Reset to first page on filter change
  };

  const clearFilters = () => {
    setFilters({
      jobId: '',
      startDate: null,
      endDate: null,
    });
    setPage(1);
  };

  const setQuickFilter = (preset) => {
    const today = moment();
    let startDate, endDate;

    switch (preset) {
      case 'today':
        startDate = today.clone().startOf('day');
        endDate = today.clone().endOf('day');
        break;
      case 'yesterday':
        startDate = today.clone().subtract(1, 'day').startOf('day');
        endDate = today.clone().subtract(1, 'day').endOf('day');
        break;
      case 'thisWeek':
        startDate = today.clone().startOf('week');
        endDate = today.clone().endOf('week');
        break;
      case 'lastWeek':
        startDate = today.clone().subtract(1, 'week').startOf('week');
        endDate = today.clone().subtract(1, 'week').endOf('week');
        break;
      case 'thisMonth':
        startDate = today.clone().startOf('month');
        endDate = today.clone().endOf('month');
        break;
      case 'lastMonth':
        startDate = today.clone().subtract(1, 'month').startOf('month');
        endDate = today.clone().subtract(1, 'month').endOf('month');
        break;
      default:
        return;
    }

    setFilters({
      ...filters,
      startDate,
      endDate,
    });
    setPage(1);
  };

  if (loading) {
    return (
      <Layout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress size={60} />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 sm:px-0">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div className="flex items-center gap-3">
              <FaClock className="text-3xl sm:text-4xl text-primary-600" />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Time Entries</h1>
                <p className="text-sm text-gray-600">Track and manage your work hours</p>
              </div>
            </div>
            <Button
              component={Link}
              to="/time-entries/new"
              variant="contained"
              startIcon={<FaPlus />}
              size="large"
              sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
            >
              New Time Entry
            </Button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 sm:p-6"
            >
              <FaClock className="text-2xl sm:text-3xl mb-2 opacity-80" />
              <p className="text-xs sm:text-sm opacity-90 mb-1">Total Hours</p>
              <p className="text-2xl sm:text-3xl font-bold">{stats.totalHours}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
              className="card bg-gradient-to-br from-green-500 to-green-600 text-white p-4 sm:p-6"
            >
              <FaChartBar className="text-2xl sm:text-3xl mb-2 opacity-80" />
              <p className="text-xs sm:text-sm opacity-90 mb-1">Total Entries</p>
              <p className="text-2xl sm:text-3xl font-bold">{stats.totalEntries}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 sm:p-6"
            >
              <FaBriefcase className="text-2xl sm:text-3xl mb-2 opacity-80" />
              <p className="text-xs sm:text-sm opacity-90 mb-1">Active Jobs</p>
              <p className="text-2xl sm:text-3xl font-bold">{stats.uniqueJobs}</p>
            </motion.div>
          </div>
        </motion.div>

        {/* Quick Filters & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="card mb-6"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <FaFilter className="text-primary-600 text-lg" />
              <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
              {(filters.jobId || filters.startDate || filters.endDate) && (
                <Chip 
                  label="Active" 
                  color="primary" 
                  size="small" 
                  sx={{ fontWeight: 'bold' }}
                />
              )}
            </div>
            <Button
              variant="text"
              size="small"
              onClick={() => setShowFilters(!showFilters)}
              endIcon={showFilters ? '▲' : '▼'}
            >
              {showFilters ? 'Hide' : 'Show'} Filters
            </Button>
          </div>

          {/* Quick Date Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Chip
              icon={<FaCalendarDay />}
              label="Today"
              onClick={() => setQuickFilter('today')}
              variant="outlined"
              clickable
            />
            <Chip
              icon={<FaCalendarDay />}
              label="Yesterday"
              onClick={() => setQuickFilter('yesterday')}
              variant="outlined"
              clickable
            />
            <Chip
              icon={<FaCalendarWeek />}
              label="This Week"
              onClick={() => setQuickFilter('thisWeek')}
              variant="outlined"
              clickable
            />
            <Chip
              icon={<FaCalendarWeek />}
              label="Last Week"
              onClick={() => setQuickFilter('lastWeek')}
              variant="outlined"
              clickable
            />
            <Chip
              icon={<FaCalendarAlt />}
              label="This Month"
              onClick={() => setQuickFilter('thisMonth')}
              variant="outlined"
              clickable
            />
            <Chip
              icon={<FaCalendarAlt />}
              label="Last Month"
              onClick={() => setQuickFilter('lastMonth')}
              variant="outlined"
              clickable
            />
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
              >
                <TextField
                  select
                  label="Job"
                  name="jobId"
                  value={filters.jobId}
                  onChange={handleFilterChange}
                  fullWidth
                  variant="outlined"
                >
                  <MenuItem value="">All Jobs</MenuItem>
                  {jobs.map((job) => (
                    <MenuItem key={job._id} value={job._id}>
                      {job.title} - {job.companyName}
                    </MenuItem>
                  ))}
                </TextField>

                <DatePicker
                  label="Start Date"
                  value={filters.startDate}
                  onChange={(newValue) => {
                    setFilters({ ...filters, startDate: newValue });
                    setPage(1);
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      variant: 'outlined',
                    },
                  }}
                  maxDate={moment()}
                />

                <DatePicker
                  label="End Date"
                  value={filters.endDate}
                  onChange={(newValue) => {
                    setFilters({ ...filters, endDate: newValue });
                    setPage(1);
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      variant: 'outlined',
                    },
                  }}
                  minDate={filters.startDate}
                  maxDate={moment()}
                />

                <Button
                  onClick={clearFilters}
                  variant="outlined"
                  fullWidth
                  sx={{ height: '56px' }}
                >
                  Clear All
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Time Entries */}
        {entries.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500 mb-4">No time entries found</p>
            <Link to="/time-entries/new" className="btn btn-primary">
              Create your first time entry
            </Link>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {entries.map((entry) => (
                <motion.div
                  key={entry._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-base text-gray-900">
                        {entry.jobId?.title || 'N/A'}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {entry.jobId?.companyName || ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary-600">
                        {((entry.cachedMinutes || 0) / 60).toFixed(2)} hrs
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-1 mb-3">
                    <p className="text-xs sm:text-sm text-gray-600">
                      📅 {formatDate(entry.startAt, 'MMM DD, YYYY')}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      🕐 {formatTime(entry.startAt)} - {formatTime(entry.endAt)}
                    </p>
                    {entry.notes && (
                      <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                        📝 {entry.notes}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    <Button
                      component={Link}
                      to={`/time-entries/${entry._id}/edit`}
                      variant="outlined"
                      startIcon={<FaEdit />}
                      fullWidth
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDeleteClick(entry._id)}
                      variant="outlined"
                      color="error"
                      startIcon={<FaTrash />}
                      fullWidth
                    >
                      Delete
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block card overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Job
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Start Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      End Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {entries.map((entry) => (
                    <tr key={entry._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {entry.jobId?.title || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {entry.jobId?.companyName || ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(entry.startAt, 'MMM DD, YYYY')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTime(entry.startAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTime(entry.endAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {((entry.cachedMinutes || 0) / 60).toFixed(2)} hrs
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {entry.notes || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <Tooltip title="Edit entry">
                            <IconButton
                              component={Link}
                              to={`/time-entries/${entry._id}/edit`}
                              color="primary"
                              size="small"
                            >
                              <FaEdit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete entry">
                            <IconButton
                              onClick={() => handleDeleteClick(entry._id)}
                              color="error"
                              size="small"
                            >
                              <FaTrash />
                            </IconButton>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Box className="mt-6 flex justify-center items-center gap-4">
                <Button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  variant="outlined"
                >
                  Previous
                </Button>
                <Box className="px-4 py-2">
                  <span className="text-gray-700 font-medium">
                    Page {page} of {totalPages}
                  </span>
                </Box>
                <Button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  variant="outlined"
                >
                  Next
                </Button>
              </Box>
            )}
          </>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialog.open}
          onClose={handleDeleteCancel}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Delete Time Entry?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete this time entry? This action cannot be undone and will permanently remove this record.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={handleDeleteCancel} variant="outlined">
              Cancel
            </Button>
            <Button onClick={handleDeleteConfirm} variant="contained" color="error" autoFocus>
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </Layout>
  );
};

export default TimeEntries;

