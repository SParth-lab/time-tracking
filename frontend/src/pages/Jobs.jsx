import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import { jobAPI } from '../services/api';
import { toast } from 'react-toastify';
import { 
  Card, CardContent, CardActions, Button, Chip, Typography, 
  IconButton, Box, Grid, CircularProgress, Tabs, Tab, Dialog,
  DialogTitle, DialogContent, DialogContentText, DialogActions
} from '@mui/material';
import { 
  Business as BusinessIcon, 
  Person as PersonIcon, 
  Phone as PhoneIcon, 
  AttachMoney as MoneyIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PowerSettingsNew as PowerIcon,
  Add as AddIcon,
  WorkOutline as WorkIcon
} from '@mui/icons-material';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(0); // 0=all, 1=active, 2=inactive
  const [deleteDialog, setDeleteDialog] = useState({ open: false, jobId: null, jobTitle: '' });

  useEffect(() => {
    fetchJobs();
  }, [filter]);

  const fetchJobs = async () => {
    try {
      let params = {};
      if (filter === 1) params.active = true;
      if (filter === 2) params.active = false;
      const response = await jobAPI.getJobs(params);
      setJobs(response.data.jobs);
    } catch (error) {
      toast.error('Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (job) => {
    setDeleteDialog({ open: true, jobId: job._id, jobTitle: job.title });
  };

  const handleDeleteConfirm = async () => {
    try {
      await jobAPI.deleteJob(deleteDialog.jobId);
      toast.success('Job deleted successfully');
      setDeleteDialog({ open: false, jobId: null, jobTitle: '' });
      fetchJobs();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete job');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, jobId: null, jobTitle: '' });
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      await jobAPI.updateJob(id, { active: !currentStatus });
      toast.success(`Job ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchJobs();
    } catch (error) {
      toast.error('Failed to update job status');
    }
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
      <Box sx={{ px: { xs: 2, sm: 0 } }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box display="flex" alignItems="center" gap={2}>
              <WorkIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              <Typography variant="h3" component="h1" fontWeight="bold">
                Jobs
              </Typography>
            </Box>
            <Button
              component={Link}
              to="/jobs/new"
              variant="contained"
              startIcon={<AddIcon />}
              size="large"
              sx={{ borderRadius: '12px' }}
            >
              New Job
            </Button>
          </Box>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Manage your jobs and track hourly rates
          </Typography>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Box sx={{ mb: 4, borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={filter} onChange={(e, newValue) => setFilter(newValue)}>
              <Tab label="All" />
              <Tab label="Active" />
              <Tab label="Inactive" />
            </Tabs>
          </Box>
        </motion.div>

        {/* Jobs Grid */}
        {jobs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card sx={{ textAlign: 'center', py: 8 }}>
              <CardContent>
                <WorkIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h5" gutterBottom color="text.secondary">
                  No jobs found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {filter === 1 ? 'No active jobs at the moment' : filter === 2 ? 'No inactive jobs' : "Let's create your first job to get started"}
                </Typography>
                <Button
                  component={Link}
                  to="/jobs/new"
                  variant="contained"
                  startIcon={<AddIcon />}
                  size="large"
                >
                  Create Your First Job
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <Grid container spacing={3}>
            {jobs.map((job, index) => (
              <Grid item xs={12} sm={6} lg={4} key={job._id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card 
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 6,
                      }
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      {/* Header with Title and Status */}
                      <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                        <Box flex={1}>
                          <Typography variant="h6" component="h3" fontWeight="bold" gutterBottom>
                            {job.title}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <BusinessIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {job.companyName}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip
                          label={job.active ? 'Active' : 'Inactive'}
                          color={job.active ? 'success' : 'default'}
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                      </Box>

                      {/* Job Details */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 2 }}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <PersonIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                          <Typography variant="body2" color="text.secondary">
                            <strong>Owner:</strong> {job.companyOwnerName}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <PhoneIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                          <Typography variant="body2" color="text.secondary">
                            <strong>Contact:</strong> {job.contactNumber}
                          </Typography>
                        </Box>
                        <Box 
                          display="flex" 
                          alignItems="center" 
                          gap={1}
                          sx={{ 
                            bgcolor: 'primary.50', 
                            p: 1.5, 
                            borderRadius: 2,
                            mt: 1
                          }}
                        >
                          <MoneyIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                          <Box>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Current Rate
                            </Typography>
                            <Typography variant="h6" fontWeight="bold" color="primary.main">
                              ₹{job.currentHourlyRate ? (job.currentHourlyRate / 100).toFixed(2) : 'N/A'}/hr
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </CardContent>

                    {/* Actions */}
                    <CardActions sx={{ p: 2, pt: 0, flexWrap: 'wrap', gap: 1 }}>
                      <Button
                        component={Link}
                        to={`/jobs/${job._id}`}
                        variant="outlined"
                        size="small"
                        startIcon={<ViewIcon />}
                        sx={{ flex: 1, minWidth: '100px' }}
                      >
                        View
                      </Button>
                      <Button
                        component={Link}
                        to={`/jobs/${job._id}/edit`}
                        variant="contained"
                        size="small"
                        startIcon={<EditIcon />}
                        sx={{ flex: 1, minWidth: '100px' }}
                      >
                        Edit
                      </Button>
                      <IconButton
                        onClick={() => handleToggleActive(job._id, job.active)}
                        color={job.active ? 'warning' : 'success'}
                        title={job.active ? 'Deactivate' : 'Activate'}
                        sx={{ 
                          border: 1, 
                          borderColor: job.active ? 'warning.main' : 'success.main',
                        }}
                      >
                        <PowerIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDeleteClick(job)}
                        color="error"
                        title="Delete"
                        sx={{ border: 1, borderColor: 'error.main' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </CardActions>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Job?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{deleteDialog.jobTitle}</strong>? This action cannot be undone and will permanently remove all associated data.
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
    </Layout>
  );
};

export default Jobs;

