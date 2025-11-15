import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/Layout';
import { reportAPI, jobAPI } from '../services/api';
import { toast } from 'react-toastify';
import { formatDate, formatTime, formatForInput, startOfMonth, endOfMonth, getMonthName } from '../utils/dateUtils';
import moment from 'moment';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { 
  TextField, MenuItem, Button, Box, Tabs, Tab, Chip, 
  CircularProgress, Card, CardContent, ToggleButtonGroup, 
  ToggleButton 
} from '@mui/material';
import { 
  FaChartLine, FaBriefcase, FaDollarSign, FaClock, FaFileDownload, 
  FaChevronDown, FaChevronUp, FaCheckCircle, FaCalendarAlt, 
  FaCalendarDay, FaCalendarWeek, FaFilter
} from 'react-icons/fa';

const Reports = () => {
  const [jobs, setJobs] = useState([]);
  const [reportType, setReportType] = useState('custom'); // custom, monthly
  const [filters, setFilters] = useState({
    startDate: startOfMonth(new Date()), // moment object
    endDate: endOfMonth(new Date()), // moment object
    jobId: '',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedJobs, setExpandedJobs] = useState({});

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await jobAPI.getJobs();
      setJobs(response.data.jobs);
    } catch (error) {
      console.error('Failed to fetch jobs');
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      let response;
      if (reportType === 'monthly') {
        response = await reportAPI.getMonthlySalaryReport({
          year: filters.year,
          month: filters.month,
        });
      } else {
        const params = {
          startDate: moment(filters.startDate).format('YYYY-MM-DD'),
          endDate: moment(filters.endDate).format('YYYY-MM-DD'),
        };
        if (filters.jobId) {
          params.jobId = filters.jobId;
        }
        response = await reportAPI.getSalaryReport(params);
      }
      setReport(response.data.report);
      toast.success('✅ Report generated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalHours = () => {
    if (!report || !report.jobWiseSalary) return '0.00';
    let totalMinutes = 0;
    report.jobWiseSalary.forEach(job => {
      if (job.entries && Array.isArray(job.entries)) {
        job.entries.forEach(entry => {
          totalMinutes += (entry.cachedMinutes || 0);
        });
      }
    });
    return ((totalMinutes || 0) / 60).toFixed(2);
  };

  const handleExportCSV = async () => {
    try {
      const params = {
        startDate: reportType === 'monthly' 
          ? moment(new Date(filters.year, filters.month - 1, 1)).format('YYYY-MM-DD')
          : moment(filters.startDate).format('YYYY-MM-DD'),
        endDate: reportType === 'monthly'
          ? moment(new Date(filters.year, filters.month, 0)).format('YYYY-MM-DD')
          : moment(filters.endDate).format('YYYY-MM-DD'),
      };
      if (filters.jobId) {
        params.jobId = filters.jobId;
      }

      const response = await reportAPI.exportSalaryReport(params);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `salary-report-${params.startDate}-to-${params.endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Report exported successfully');
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  const toggleJobExpansion = (jobId) => {
    setExpandedJobs({
      ...expandedJobs,
      [jobId]: !expandedJobs[jobId],
    });
  };

  const setQuickDateFilter = (preset) => {
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
      case 'last30Days':
        startDate = today.clone().subtract(30, 'days').startOf('day');
        endDate = today.clone().endOf('day');
        break;
      case 'last90Days':
        startDate = today.clone().subtract(90, 'days').startOf('day');
        endDate = today.clone().endOf('day');
        break;
      default:
        return;
    }

    setFilters({
      ...filters,
      startDate,
      endDate,
    });
    setReportType('custom');
  };

  return (
    <Layout>
      <div className="px-4 sm:px-0">
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary-100 p-3 rounded-xl">
                <FaChartLine className="text-3xl sm:text-4xl text-primary-600" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Salary Reports</h1>
                <p className="text-sm text-gray-600">Detailed breakdowns with automatic rate calculations</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Report Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card mb-6"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <FaFilter className="text-primary-600 text-lg" />
              <h2 className="text-xl font-semibold text-gray-900">Configure Report</h2>
            </div>
          </div>
          
          {/* Report Type - Using Toggle Buttons */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3">Report Type</p>
            <ToggleButtonGroup
              value={reportType}
              exclusive
              onChange={(e, newValue) => newValue && setReportType(newValue)}
              aria-label="report type"
              fullWidth
              sx={{
                '& .MuiToggleButton-root': {
                  textTransform: 'none',
                  fontWeight: 500,
                  py: 1.5,
                },
              }}
            >
              <ToggleButton value="custom" aria-label="custom date range">
                <FaCalendarAlt className="mr-2" />
                Custom Date Range
              </ToggleButton>
              <ToggleButton value="monthly" aria-label="monthly report">
                <FaCalendarDay className="mr-2" />
                Monthly Report
              </ToggleButton>
            </ToggleButtonGroup>
          </div>

          {/* Quick Date Filters (only for custom reports) */}
          {reportType === 'custom' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <p className="text-sm font-medium text-gray-700 mb-3">Quick Filters</p>
              <div className="flex flex-wrap gap-2">
                <Chip
                  icon={<FaCalendarDay />}
                  label="Today"
                  onClick={() => setQuickDateFilter('today')}
                  variant="outlined"
                  clickable
                  size="medium"
                />
                <Chip
                  icon={<FaCalendarDay />}
                  label="Yesterday"
                  onClick={() => setQuickDateFilter('yesterday')}
                  variant="outlined"
                  clickable
                  size="medium"
                />
                <Chip
                  icon={<FaCalendarWeek />}
                  label="This Week"
                  onClick={() => setQuickDateFilter('thisWeek')}
                  variant="outlined"
                  clickable
                  size="medium"
                />
                <Chip
                  icon={<FaCalendarWeek />}
                  label="Last Week"
                  onClick={() => setQuickDateFilter('lastWeek')}
                  variant="outlined"
                  clickable
                  size="medium"
                />
                <Chip
                  icon={<FaCalendarAlt />}
                  label="This Month"
                  onClick={() => setQuickDateFilter('thisMonth')}
                  variant="outlined"
                  clickable
                  size="medium"
                />
                <Chip
                  icon={<FaCalendarAlt />}
                  label="Last Month"
                  onClick={() => setQuickDateFilter('lastMonth')}
                  variant="outlined"
                  clickable
                  size="medium"
                />
                <Chip
                  icon={<FaCalendarAlt />}
                  label="Last 30 Days"
                  onClick={() => setQuickDateFilter('last30Days')}
                  variant="outlined"
                  clickable
                  size="medium"
                />
                <Chip
                  icon={<FaCalendarAlt />}
                  label="Last 90 Days"
                  onClick={() => setQuickDateFilter('last90Days')}
                  variant="outlined"
                  clickable
                  size="medium"
                />
              </div>
            </motion.div>
          )}

          {/* Date & Filters */}
          <AnimatePresence mode="wait">
            <motion.div
              key={reportType}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="mb-6"
            >
              <p className="text-sm font-medium text-gray-700 mb-3">
                {reportType === 'custom' ? 'Select Date Range' : 'Select Month'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {reportType === 'custom' ? (
                  <>
                    <DatePicker
                      label="Start Date"
                      value={filters.startDate}
                      onChange={(newValue) => setFilters({ ...filters, startDate: newValue })}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          variant: 'outlined',
                          size: 'medium',
                        },
                      }}
                      maxDate={moment()}
                    />
                    <DatePicker
                      label="End Date"
                      value={filters.endDate}
                      onChange={(newValue) => setFilters({ ...filters, endDate: newValue })}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          variant: 'outlined',
                          size: 'medium',
                        },
                      }}
                      minDate={filters.startDate}
                      maxDate={moment()}
                    />
                  </>
                ) : (
                  <>
                    <TextField
                      label="Year"
                      type="number"
                      name="year"
                      value={filters.year}
                      onChange={handleFilterChange}
                      fullWidth
                      variant="outlined"
                      inputProps={{ min: 2020, max: 2100 }}
                    />
                    <TextField
                      select
                      label="Month"
                      name="month"
                      value={filters.month}
                      onChange={handleFilterChange}
                      fullWidth
                      variant="outlined"
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <MenuItem key={i + 1} value={i + 1}>
                          {moment().month(i).format('MMMM')}
                        </MenuItem>
                      ))}
                    </TextField>
                  </>
                )}
                <TextField
                  select
                  label="Job (Optional)"
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
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              onClick={handleGenerateReport}
              disabled={loading}
              variant="contained"
              size="large"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <FaChartLine />}
              fullWidth
              sx={{ 
                minHeight: '48px',
                fontWeight: 600,
                fontSize: '1rem',
              }}
            >
              {loading ? 'Generating Report...' : 'Generate Report'}
            </Button>
            
            {report && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col sm:flex-row gap-3 flex-1"
              >
                <Button
                  onClick={handleExportCSV}
                  variant="outlined"
                  size="large"
                  startIcon={<FaFileDownload />}
                  fullWidth
                  sx={{ minHeight: '48px' }}
                >
                  Export CSV
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Empty State - Before Report Generated */}
        {!report && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card text-center py-12 sm:py-16"
          >
            <div className="max-w-md mx-auto">
              <div className="bg-primary-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaChartLine className="text-4xl text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to Generate Report</h3>
              <p className="text-gray-600 mb-6">
                Select your preferred report type and date range above, then click "Generate Report" to view detailed salary breakdowns
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <FaClock className="text-2xl text-blue-600 mb-2" />
                  <p className="text-sm font-semibold text-gray-900">Accurate Hours</p>
                  <p className="text-xs text-gray-600">Every minute tracked</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <FaDollarSign className="text-2xl text-green-600 mb-2" />
                  <p className="text-sm font-semibold text-gray-900">Auto Calculations</p>
                  <p className="text-xs text-gray-600">Rate changes applied</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <FaBriefcase className="text-2xl text-purple-600 mb-2" />
                  <p className="text-sm font-semibold text-gray-900">Job Breakdown</p>
                  <p className="text-xs text-gray-600">Organized by job</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card text-center py-12 sm:py-16"
          >
            <CircularProgress size={60} />
            <p className="text-gray-600 mt-4 text-lg font-medium">Generating your report...</p>
            <p className="text-gray-500 text-sm mt-2">This may take a few moments</p>
          </motion.div>
        )}

        {/* Report Results */}
        {report && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Trust Message */}
            <div className="success-box">
              <div className="flex items-center gap-2 mb-1">
                <FaCheckCircle className="text-green-600 text-xl" />
                <p className="text-sm text-green-800 font-semibold">
                  Salary Verification
                  </p>
                </div>
              <p className="text-sm text-green-700">
                Your salary includes rate changes applied automatically. All calculations are precise and include every minute worked.
                  </p>
                </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 sm:p-6"
              >
                <FaClock className="text-2xl sm:text-3xl mb-2 opacity-80" />
                <p className="text-xs sm:text-sm opacity-90 mb-1">Total Hours</p>
                <p className="text-2xl sm:text-3xl font-bold">{calculateTotalHours()}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="card bg-gradient-to-br from-green-500 to-green-600 text-white p-4 sm:p-6"
              >
                <FaDollarSign className="text-2xl sm:text-3xl mb-2 opacity-80" />
                <p className="text-xs sm:text-sm opacity-90 mb-1">Total Salary</p>
                <p className="text-2xl sm:text-3xl font-bold">₹{report.grandTotalRupees}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 sm:p-6"
              >
                <FaBriefcase className="text-2xl sm:text-3xl mb-2 opacity-80" />
                <p className="text-xs sm:text-sm opacity-90 mb-1">Total Jobs</p>
                <p className="text-2xl sm:text-3xl font-bold">{report.jobWiseSalary.length}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="card bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-4 sm:p-6"
              >
                <div className="text-2xl sm:text-3xl mb-2 opacity-80">📅</div>
                <p className="text-xs sm:text-sm opacity-90 mb-1">Period</p>
                <p className="text-xs sm:text-sm font-semibold">
                  {formatDate(report.startDate, 'MMM DD')} - {formatDate(report.endDate, 'MMM DD, YYYY')}
                </p>
              </motion.div>
            </div>

            {/* Job-wise Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="card"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FaBriefcase className="text-primary-600" />
                Job-wise Breakdown
              </h2>
              {report.jobWiseSalary.length === 0 ? (
                <div className="text-center py-12">
                  <FaBriefcase className="text-6xl text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">No time entries found</p>
                  <p className="text-sm text-gray-400">Try adjusting your date range or filters</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {report.jobWiseSalary.map((jobData, index) => (
                    <motion.div
                      key={jobData.jobId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className="border-2 border-gray-200 rounded-xl p-5 hover:border-primary-300 transition-colors"
                    >
                      <div
                        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 cursor-pointer"
                        onClick={() => toggleJobExpansion(jobData.jobId)}
                      >
                        <div className="flex items-center gap-3 sm:gap-4 flex-1 w-full sm:w-auto">
                          <div className="bg-primary-100 text-primary-600 rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center flex-shrink-0">
                            <FaBriefcase className="text-lg sm:text-xl" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                              {jobData.jobTitle}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-600 truncate">{jobData.companyName}</p>
                            <p className="text-xs text-gray-500 mt-0.5 sm:mt-1">
                              {jobData.entries.length} {jobData.entries.length === 1 ? 'entry' : 'entries'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto">
                          <div className="text-left sm:text-right">
                            <p className="text-xl sm:text-2xl font-bold text-primary-600">
                              ₹{jobData.totalRupees}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600">
                              Total earned
                            </p>
                          </div>
                          <div className="text-gray-400 text-xl sm:text-2xl flex-shrink-0">
                            {expandedJobs[jobData.jobId] ? <FaChevronUp /> : <FaChevronDown />}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {expandedJobs[jobData.jobId] && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-6 space-y-3"
                        >
                          <div className="bg-blue-50 rounded-lg p-3 mb-4">
                            <p className="text-sm text-blue-700 font-semibold">
                              💡 Tip: Click on each entry to view time and rate details
                            </p>
                          </div>
                          {jobData.entries.map((entry, entryIndex) => (
                            <motion.div
                              key={entry.entryId}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: entryIndex * 0.05 }}
                              className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200"
                            >
                              <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-3">
                                <div className="flex items-start gap-2 sm:gap-3 flex-1 w-full">
                                  <div className="bg-blue-500 text-white rounded-lg p-1.5 sm:p-2 text-center min-w-[50px] sm:min-w-[60px] flex-shrink-0">
                                    <p className="text-xs font-semibold">
                                      {formatDate(entry.startAt, 'MMM')}
                                    </p>
                                    <p className="text-xl sm:text-2xl font-bold">
                                      {formatDate(entry.startAt, 'DD')}
                                    </p>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs sm:text-sm font-bold text-gray-900 mb-1">
                                      {formatDate(entry.startAt, 'dddd, MMMM DD, YYYY')}
                                    </p>
                                    <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-700 mb-1 flex-wrap">
                                      <FaClock className="text-blue-600 flex-shrink-0" />
                                      <span className="whitespace-nowrap">
                                        {formatTime(entry.startAt)} - {formatTime(entry.endAt)}
                                      </span>
                                      <span className="text-gray-500 whitespace-nowrap">
                                        ({((entry.cachedMinutes || 0) / 60).toFixed(2)} hrs)
                                      </span>
                                    </div>
                                    {entry.notes && (
                                      <p className="text-xs sm:text-sm text-gray-600 mt-2 italic line-clamp-2">
                                        📝 {entry.notes}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="self-end sm:self-auto text-right">
                                  <p className="text-lg sm:text-xl font-bold text-green-600">
                                    ₹{entry.totalRupees}
                                  </p>
                                </div>
                              </div>

                              {/* Rate Breakdown */}
                              {entry.breakdown.length > 1 && (
                                <div className="mt-3 pt-3 border-t border-gray-300">
                                  <div className="warning-box">
                                    <p className="text-xs text-yellow-800 font-semibold mb-2 flex items-center gap-1">
                                      ⚠️ Multiple rates applied during this period:
                                  </p>
                                    <div className="space-y-2">
                                  {entry.breakdown.map((segment, idx) => (
                                    <div
                                      key={idx}
                                          className="flex justify-between items-center bg-white rounded-lg p-2"
                                        >
                                          <span className="text-xs text-gray-700">
                                            {formatTime(segment.startAt)} - {formatTime(segment.endAt)}
                                            <span className="ml-2 font-semibold text-primary-600">
                                              @ ₹{segment.hourlyRateRupees}/hr
                                            </span>
                                      </span>
                                          <span className="text-sm font-bold text-gray-900">
                                        ₹{segment.payRupees}
                                      </span>
                                    </div>
                                  ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </div>
    </Layout>
  );
};

export default Reports;

