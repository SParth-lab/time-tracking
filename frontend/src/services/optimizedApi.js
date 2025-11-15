import axios from 'axios';
import { setupCache } from 'axios-cache-interceptor';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Setup cache interceptor
const api = setupCache(axiosInstance, {
  ttl: 5 * 60 * 1000, // Cache for 5 minutes
  methods: ['get'], // Only cache GET requests
  interpretHeader: false,
  etag: false,
  modifiedSince: false,
});

// Map to track pending requests (request deduplication)
const pendingRequests = new Map();

// Generate unique key for request
const generateRequestKey = (config) => {
  const { method, url, params, data } = config;
  return JSON.stringify({ method, url, params, data });
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Request deduplication (only for GET requests)
    if (config.method === 'get') {
      const requestKey = generateRequestKey(config);
      
      // If same request is already pending, return that promise
      if (pendingRequests.has(requestKey)) {
        config.cancelToken = new axios.CancelToken((cancel) => {
          cancel('Duplicate request cancelled');
        });
        return pendingRequests.get(requestKey);
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Remove from pending requests
    const requestKey = generateRequestKey(response.config);
    pendingRequests.delete(requestKey);
    
    return response;
  },
  (error) => {
    // Remove from pending requests
    if (error.config) {
      const requestKey = generateRequestKey(error.config);
      pendingRequests.delete(requestKey);
    }

    // Handle errors
    if (error.response) {
      // Server responded with error
      const { status, data } = error.response;
      
      if (status === 401) {
        // Unauthorized - clear token and redirect to login
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      
      return Promise.reject(data);
    } else if (error.request) {
      // Request made but no response
      return Promise.reject({
        message: 'No response from server. Please check your connection.',
      });
    } else if (axios.isCancel(error)) {
      // Request cancelled (duplicate)
      return Promise.reject({ message: 'Request cancelled', cancelled: true });
    } else {
      // Something else happened
      return Promise.reject({
        message: error.message || 'An unexpected error occurred',
      });
    }
  }
);

// Helper function to make requests with deduplication
const makeRequest = async (method, url, data = null, config = {}) => {
  const requestConfig = {
    method,
    url,
    ...(data && { data }),
    ...config,
  };

  // For GET requests, check if already pending
  if (method === 'get') {
    const requestKey = generateRequestKey(requestConfig);
    
    if (pendingRequests.has(requestKey)) {
      return pendingRequests.get(requestKey);
    }
    
    // Create new promise and store it
    const requestPromise = api.request(requestConfig);
    pendingRequests.set(requestKey, requestPromise);
    
    // Clean up after request completes
    requestPromise.finally(() => {
      pendingRequests.delete(requestKey);
    });
    
    return requestPromise;
  }
  
  // For non-GET requests, just make the request
  return api.request(requestConfig);
};

// Enhanced API methods with request deduplication
export const optimizedAPI = {
  // GET request with automatic deduplication and caching
  get: (url, params = {}, config = {}) => {
    return makeRequest('get', url, null, { params, ...config });
  },

  // POST request
  post: (url, data, config = {}) => {
    return makeRequest('post', url, data, config);
  },

  // PUT request
  put: (url, data, config = {}) => {
    return makeRequest('put', url, data, config);
  },

  // PATCH request
  patch: (url, data, config = {}) => {
    return makeRequest('patch', url, data, config);
  },

  // DELETE request
  delete: (url, config = {}) => {
    return makeRequest('delete', url, null, config);
  },

  // Clear cache for specific endpoint or all
  clearCache: (url = null) => {
    if (url) {
      // Clear cache for specific URL
      api.storage.remove(url);
    } else {
      // Clear all cache
      api.storage.clear();
    }
  },

  // Get cache statistics
  getCacheStats: () => {
    return {
      size: pendingRequests.size,
      keys: Array.from(pendingRequests.keys()),
    };
  },

  // Cancel all pending requests
  cancelAllRequests: () => {
    pendingRequests.clear();
  },
};

// Job API with optimization
export const jobAPI = {
  getJobs: (params) => optimizedAPI.get('/jobs', params),
  getJob: (id) => optimizedAPI.get(`/jobs/${id}`),
  createJob: (data) => {
    // Clear jobs cache after creating
    optimizedAPI.clearCache('/jobs');
    return optimizedAPI.post('/jobs', data);
  },
  updateJob: (id, data) => {
    // Clear cache for this job and all jobs
    optimizedAPI.clearCache(`/jobs/${id}`);
    optimizedAPI.clearCache('/jobs');
    return optimizedAPI.put(`/jobs/${id}`, data);
  },
  deleteJob: (id) => {
    optimizedAPI.clearCache(`/jobs/${id}`);
    optimizedAPI.clearCache('/jobs');
    return optimizedAPI.delete(`/jobs/${id}`);
  },
  addRateChange: (id, data) => {
    optimizedAPI.clearCache(`/jobs/${id}`);
    optimizedAPI.clearCache('/jobs');
    return optimizedAPI.post(`/jobs/${id}/rate-changes`, data);
  },
};

// Time Entry API with optimization
export const timeEntryAPI = {
  getTimeEntries: (params) => optimizedAPI.get('/time-entries', params),
  getTimeEntry: (id) => optimizedAPI.get(`/time-entries/${id}`),
  getSummary: () => optimizedAPI.get('/time-entries/summary'),
  createTimeEntry: (data) => {
    // Clear related caches
    optimizedAPI.clearCache('/time-entries');
    optimizedAPI.clearCache('/time-entries/summary');
    return optimizedAPI.post('/time-entries', data);
  },
  updateTimeEntry: (id, data) => {
    optimizedAPI.clearCache(`/time-entries/${id}`);
    optimizedAPI.clearCache('/time-entries');
    optimizedAPI.clearCache('/time-entries/summary');
    return optimizedAPI.put(`/time-entries/${id}`, data);
  },
  deleteTimeEntry: (id) => {
    optimizedAPI.clearCache(`/time-entries/${id}`);
    optimizedAPI.clearCache('/time-entries');
    optimizedAPI.clearCache('/time-entries/summary');
    return optimizedAPI.delete(`/time-entries/${id}`);
  },
};

// Report API with optimization
export const reportAPI = {
  getSalaryReport: (params) => optimizedAPI.get('/reports/salary', params),
  getMonthlySalaryReport: (params) => optimizedAPI.get('/reports/monthly-salary', params),
  exportSalaryReport: (params) => 
    optimizedAPI.get('/reports/export', params, { responseType: 'blob' }),
};

export default optimizedAPI;

