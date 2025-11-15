import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  masterLogin: (data) => api.post('/auth/master-login', data),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (token, data) => api.put(`/auth/reset-password/${token}`, data),
  updatePassword: (data) => api.put('/auth/update-password', data),
};

// Job API
export const jobAPI = {
  getJobs: (params) => api.get('/jobs', { params }),
  getJob: (id) => api.get(`/jobs/${id}`),
  createJob: (data) => api.post('/jobs', data),
  updateJob: (id, data) => api.put(`/jobs/${id}`, data),
  deleteJob: (id) => api.delete(`/jobs/${id}`),
  addRateChange: (id, data) => api.post(`/jobs/${id}/rate-change`, data),
  getRateHistory: (id) => api.get(`/jobs/${id}/rate-history`),
};

// Time Entry API
export const timeEntryAPI = {
  getTimeEntries: (params) => api.get('/time-entries', { params }),
  getTimeEntry: (id) => api.get(`/time-entries/${id}`),
  createTimeEntry: (data) => api.post('/time-entries', data),
  updateTimeEntry: (id, data) => api.put(`/time-entries/${id}`, data),
  deleteTimeEntry: (id) => api.delete(`/time-entries/${id}`),
  getSummary: (params) => api.get('/time-entries/summary/stats', { params }),
};

// Report API
export const reportAPI = {
  getSalaryReport: (params) => api.get('/reports/salary', { params }),
  getMonthlySalaryReport: (params) => api.get('/reports/salary/monthly', { params }),
  getJobSalarySummary: (params) => api.get('/reports/job-summary', { params }),
  exportSalaryReport: (params) => {
    return api.get('/reports/salary/export', { 
      params,
      responseType: 'blob',
    });
  },
};

export default api;

