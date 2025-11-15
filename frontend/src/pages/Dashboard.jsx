import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import { jobAPI, timeEntryAPI, reportAPI } from '../services/api';
import { formatDate, formatTime, startOfMonth, endOfMonth, startOfDay, endOfDay, now } from '../utils/dateUtils';
import moment from 'moment';
import { FaBriefcase, FaClock, FaDollarSign, FaPlus, FaChartLine, FaRedo } from 'react-icons/fa';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalHours: 0,
    monthlySalary: 0,
    todayHours: 0,
  });
  const [recentEntries, setRecentEntries] = useState([]);
  const [lastEntry, setLastEntry] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Get jobs
      const jobsResponse = await jobAPI.getJobs();
      const jobs = jobsResponse.data.jobs;

      // Get time entries summary
      const summaryResponse = await timeEntryAPI.getSummary();
      const totalHours = summaryResponse.data.totalHours || 0;

      // Get monthly salary (up to today)
      const nowDate = now();
      const monthStart = startOfMonth(nowDate);
      const monthEnd = endOfMonth(nowDate);
      
      const salaryResponse = await reportAPI.getSalaryReport({
        startDate: monthStart.toISOString(),
        endDate: nowDate.toISOString(),
      });
      const monthlySalary = salaryResponse.data.report.grandTotalRupees || 0;

      // Get today's hours - calculate from today's time entries directly
      const todayStart = startOfDay(nowDate);
      const todayEnd = endOfDay(nowDate);
      
      let todayHours = 0;
      try {
        const todayEntriesResponse = await timeEntryAPI.getTimeEntries({
          startDate: todayStart.toISOString(),
          endDate: todayEnd.toISOString(),
        });
        
        if (todayEntriesResponse.data?.timeEntries?.length > 0) {
          todayEntriesResponse.data.timeEntries.forEach(entry => {
            const minutes = entry.cachedMinutes || 0;
            todayHours += minutes / 60;
          });
        }
      } catch (error) {
        console.error('Error fetching today\'s entries:', error);
        todayHours = 0;
      }

      // Get recent time entries
      const entriesResponse = await timeEntryAPI.getTimeEntries({ limit: 5 });
      const entries = entriesResponse.data.timeEntries;

      setStats({
        totalJobs: jobs.length || 0,
        activeJobs: jobs.filter(j => j.active).length || 0,
        totalHours: (totalHours || 0).toFixed(2),
        monthlySalary: monthlySalary || 0,
        todayHours: (todayHours || 0).toFixed(2),
      });

      setRecentEntries(entries);
      if (entries.length > 0) {
        setLastEntry(entries[0]);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRepeatEntry = () => {
    if (lastEntry) {
      navigate('/time-entries/new', { state: { repeatEntry: lastEntry } });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <Layout>
      <div className="px-4 sm:px-0">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2"
        >
          Welcome Back! 👋
        </motion.h1>
        <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">Track your time and manage your earnings</p>

        {/* Primary Stats - Today's Focus */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.1 }}
            className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold opacity-90">Today's Hours</h3>
              <FaClock className="text-3xl opacity-80" />
              </div>
            <p className="text-4xl font-bold mb-1">{stats.todayHours} hrs</p>
            <p className="text-sm opacity-80">Keep up the great work!</p>
          </motion.div>

          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }}
            className="card bg-gradient-to-br from-green-500 to-green-600 text-white"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold opacity-90">This Month's Earnings</h3>
              <FaDollarSign className="text-3xl opacity-80" />
            </div>
            <p className="text-4xl font-bold mb-1">₹{stats.monthlySalary}</p>
            <p className="text-sm opacity-80">Up to today</p>
          </motion.div>
          </div>

        {/* Quick Action Cards - Big & Clear */}
        {/* Quick Actions */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8"
        >
          <Link 
            to="/jobs/new" 
            className="card card-action card-interactive hover:shadow-xl transition-all p-6 sm:p-8 text-center"
          >
            <div className="bg-primary-500 text-white rounded-full w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <FaBriefcase className="text-xl sm:text-2xl" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">Create Job</h3>
            <p className="text-gray-600 text-xs sm:text-sm">Add a new client or project</p>
          </Link>

          <Link 
            to="/time-entries/new" 
            className="card card-action card-interactive hover:shadow-xl transition-all p-6 sm:p-8 text-center"
          >
            <div className="bg-green-500 text-white rounded-full w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <FaPlus className="text-xl sm:text-2xl" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">Add Time Entry</h3>
            <p className="text-gray-600 text-xs sm:text-sm">Log your work hours</p>
          </Link>

          <Link 
            to="/reports" 
            className="card card-action card-interactive hover:shadow-xl transition-all p-6 sm:p-8 text-center"
          >
            <div className="bg-purple-500 text-white rounded-full w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <FaChartLine className="text-xl sm:text-2xl" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">View Reports</h3>
            <p className="text-gray-600 text-xs sm:text-sm">Check your earnings</p>
          </Link>
        </motion.div>

        {/* Secondary Stats */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8"
        >
          <div className="card text-center p-4 sm:p-6">
            <FaBriefcase className="text-2xl sm:text-3xl text-primary-500 mx-auto mb-2" />
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalJobs}</p>
            <p className="text-xs sm:text-sm text-gray-600">Total Jobs</p>
          </div>
          <div className="card text-center p-4 sm:p-6">
            <div className="text-2xl sm:text-3xl text-green-500 mx-auto mb-2">✓</div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.activeJobs}</p>
            <p className="text-xs sm:text-sm text-gray-600">Active Jobs</p>
          </div>
          <div className="card text-center p-4 sm:p-6">
            <FaClock className="text-2xl sm:text-3xl text-yellow-500 mx-auto mb-2" />
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalHours}</p>
            <p className="text-xs sm:text-sm text-gray-600">Total Hours</p>
          </div>
          <div className="card text-center p-4 sm:p-6">
            <div className="text-2xl sm:text-3xl text-blue-500 mx-auto mb-2">📊</div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{recentEntries.length}</p>
            <p className="text-xs sm:text-sm text-gray-600">Recent Entries</p>
          </div>
        </motion.div>

        {/* Last Entry - Quick Repeat */}
        {lastEntry && (
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.5 }}
            className="card mb-6 sm:mb-8 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">Last Time Entry</h3>
                <p className="text-sm sm:text-base text-gray-700">
                  <span className="font-medium">{lastEntry.jobId?.title || 'N/A'}</span>
                  {' • '}
                  {formatDate(lastEntry.startAt, 'MMM DD, YYYY')}
                  {' • '}
                  {((lastEntry.cachedMinutes || 0) / 60).toFixed(2)} hrs
                </p>
                {lastEntry.notes && (
                  <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">{lastEntry.notes}</p>
                )}
              </div>
              <button
                onClick={handleRepeatEntry}
                className="btn btn-primary flex items-center gap-2 w-full sm:w-auto justify-center"
              >
                <FaRedo /> Repeat Entry
              </button>
            </div>
          </motion.div>
        )}

        {/* Recent Time Entries */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.6 }}
          className="card"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Recent Time Entries</h2>
            <Link to="/time-entries" className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 font-semibold">
              View all →
            </Link>
          </div>
          {recentEntries.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <FaClock className="text-5xl sm:text-6xl text-gray-300 mx-auto mb-3 sm:mb-4" />
              <p className="text-sm sm:text-base text-gray-500 mb-3 sm:mb-4">No time entries yet</p>
              <Link to="/time-entries/new" className="btn btn-primary inline-block">
                Add Your First Entry
              </Link>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {recentEntries.map((entry, index) => (
                <motion.div
                  key={entry._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.05 }}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors gap-2 sm:gap-4"
                >
                  <div className="flex-1 w-full">
                    <p className="font-semibold text-sm sm:text-base text-gray-900">{entry.jobId?.title || 'N/A'}</p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {formatDate(entry.startAt, 'MMM DD, YYYY')} • {formatTime(entry.startAt)} - {formatTime(entry.endAt)}
                    </p>
                    {entry.notes && (
                      <p className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-2">{entry.notes}</p>
                    )}
                  </div>
                  <div className="self-end sm:self-auto sm:text-right">
                    <p className="text-base sm:text-lg font-bold text-primary-600">
                      {((entry.cachedMinutes || 0) / 60).toFixed(2)} hrs
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
};

export default Dashboard;

