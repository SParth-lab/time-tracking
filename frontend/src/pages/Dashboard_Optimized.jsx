import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
  Skeleton,
} from '@mui/material';
import {
  Business as BusinessIcon,
  AccessTime as ClockIcon,
  AttachMoney as MoneyIcon,
  Add as AddIcon,
  Assessment as ReportIcon,
  Replay as RepeatIcon,
} from '@mui/icons-material';
import Layout from '../components/Layout';
import { useJobs, useTimeEntries, useTimeEntrySummary, useSalaryReport } from '../hooks/useApiQueries';
import { formatDate, formatTime, startOfMonth, endOfMonth, now } from '../utils/dateUtils';
import moment from 'moment';

const DashboardOptimized = () => {
  const navigate = useNavigate();

  // Use React Query hooks - automatic caching, deduplication, background refetching
  const { data: jobsData, isLoading: jobsLoading, isError: jobsError } = useJobs();
  const { data: summaryData, isLoading: summaryLoading } = useTimeEntrySummary();
  const { data: recentEntriesData, isLoading: entriesLoading } = useTimeEntries({ limit: 5 });
  
  // Get monthly salary report
  const monthStart = startOfMonth(now());
  const monthEnd = now();
  const { data: salaryData, isLoading: salaryLoading } = useSalaryReport({
    startDate: moment(monthStart).toISOString(),
    endDate: moment(monthEnd).toISOString(),
  });

  // Extract data with fallbacks
  const jobs = jobsData?.jobs || [];
  const totalHours = summaryData?.totalHours || 0;
  const recentEntries = recentEntriesData?.timeEntries || [];
  const monthlySalary = salaryData?.report?.grandTotalRupees || 0;
  const lastEntry = recentEntries[0];

  // Loading state
  const isLoading = jobsLoading || summaryLoading || entriesLoading || salaryLoading;

  const handleRepeatEntry = () => {
    if (lastEntry) {
      navigate('/time-entries/new', { state: { repeatEntry: lastEntry } });
    }
  };

  // Statistics
  const stats = {
    totalJobs: jobs.length,
    activeJobs: jobs.filter(j => j.active).length,
    totalHours: totalHours.toFixed(2),
    monthlySalary,
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <Layout>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Grid container spacing={3}>
            {[1, 2, 3, 4].map((i) => (
              <Grid item xs={12} sm={6} md={3} key={i}>
                <Skeleton variant="rectangular" height={150} sx={{ borderRadius: 2 }} />
              </Grid>
            ))}
          </Grid>
        </Container>
      </Layout>
    );
  }

  // Error state
  if (jobsError) {
    return (
      <Layout>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="error">
            Failed to load dashboard data. Please try refreshing the page.
          </Alert>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Typography variant="h3" gutterBottom>
            Welcome Back! 👋
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Track your time and manage your earnings
          </Typography>
        </motion.div>

        {/* Primary Stats - Today's Focus */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Card sx={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                height: '100%'
              }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h6" sx={{ opacity: 0.9 }}>
                        Total Hours Tracked
                      </Typography>
                      <Typography variant="h3" fontWeight="bold" sx={{ mt: 1 }}>
                        {stats.totalHours} hrs
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                        All time
                      </Typography>
                    </Box>
                    <ClockIcon sx={{ fontSize: 60, opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card sx={{ 
                background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                color: 'white',
                height: '100%'
              }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h6" sx={{ opacity: 0.9 }}>
                        This Month's Earnings
                      </Typography>
                      <Typography variant="h3" fontWeight="bold" sx={{ mt: 1 }}>
                        ₹{stats.monthlySalary}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                        Up to today
                      </Typography>
                    </Box>
                    <MoneyIcon sx={{ fontSize: 60, opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>

        {/* Quick Action Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{ height: '100%' }}
            >
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: 6,
                  },
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  color: 'white',
                }}
                onClick={() => navigate('/jobs/new')}
              >
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <BusinessIcon sx={{ fontSize: 50, mb: 2 }} />
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    Create Job
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Add a new client or project
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} md={4}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              style={{ height: '100%' }}
            >
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: 6,
                  },
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  color: 'white',
                }}
                onClick={() => navigate('/time-entries/new')}
              >
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <AddIcon sx={{ fontSize: 50, mb: 2 }} />
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    Add Time Entry
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Log your work hours
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} md={4}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              style={{ height: '100%' }}
            >
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: 6,
                  },
                  background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                  color: 'white',
                }}
                onClick={() => navigate('/reports')}
              >
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <ReportIcon sx={{ fontSize: 50, mb: 2 }} />
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    View Report
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Check your earnings
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>

        {/* Secondary Stats */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <BusinessIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" fontWeight="bold">
                  {stats.totalJobs}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Jobs
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography sx={{ fontSize: 40, mb: 1 }}>✓</Typography>
                <Typography variant="h4" fontWeight="bold">
                  {stats.activeJobs}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Jobs
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <ClockIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" fontWeight="bold">
                  {stats.totalHours}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Hours
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography sx={{ fontSize: 40, mb: 1 }}>📊</Typography>
                <Typography variant="h4" fontWeight="bold">
                  {recentEntries.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Recent Entries
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Last Entry - Quick Repeat */}
        {lastEntry && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card sx={{ mb: 4, bgcolor: 'primary.50' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Last Time Entry
                    </Typography>
                    <Typography variant="body1">
                      <strong>{lastEntry.jobId?.title || 'N/A'}</strong>
                      {' • '}
                      {formatDate(lastEntry.startAt)}
                      {' • '}
                      {(lastEntry.cachedMinutes / 60).toFixed(2)} hrs
                    </Typography>
                    {lastEntry.notes && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {lastEntry.notes}
                      </Typography>
                    )}
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={<RepeatIcon />}
                    onClick={handleRepeatEntry}
                  >
                    Repeat Entry
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Recent Time Entries */}
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Recent Time Entries</Typography>
              <Button
                component={Link}
                to="/time-entries"
                size="small"
              >
                View All →
              </Button>
            </Box>
            
            {recentEntries.length === 0 ? (
              <Box textAlign="center" py={4}>
                <ClockIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                <Typography color="text.secondary" gutterBottom>
                  No time entries yet
                </Typography>
                <Button
                  variant="contained"
                  component={Link}
                  to="/time-entries/new"
                  startIcon={<AddIcon />}
                  sx={{ mt: 2 }}
                >
                  Add Your First Entry
                </Button>
              </Box>
            ) : (
              <Box>
                {recentEntries.map((entry, index) => (
                  <motion.div
                    key={entry._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.05 }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 2,
                        mb: 1,
                        bgcolor: 'grey.50',
                        borderRadius: 2,
                        '&:hover': {
                          bgcolor: 'grey.100',
                        },
                      }}
                    >
                      <Box flex={1}>
                        <Typography variant="subtitle1" fontWeight="600">
                          {entry.jobId?.title || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(entry.startAt)} • {formatTime(entry.startAt)} - {formatTime(entry.endAt)}
                        </Typography>
                        {entry.notes && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {entry.notes}
                          </Typography>
                        )}
                      </Box>
                      <Box textAlign="right">
                        <Typography variant="h6" color="primary" fontWeight="bold">
                          {(entry.cachedMinutes / 60).toFixed(2)} hrs
                        </Typography>
                      </Box>
                    </Box>
                  </motion.div>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    </Layout>
  );
};

export default DashboardOptimized;

