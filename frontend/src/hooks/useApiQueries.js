import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobAPI, timeEntryAPI, reportAPI } from '../services/optimizedApi';
import { queryKeys, invalidateQueries } from '../services/queryClient';
import { toast } from 'react-toastify';

// ==================== JOB QUERIES ====================

// Get all jobs
export const useJobs = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: queryKeys.jobs.list(filters),
    queryFn: async () => {
      const response = await jobAPI.getJobs(filters);
      return response.data;
    },
    ...options,
  });
};

// Get single job
export const useJob = (id, options = {}) => {
  return useQuery({
    queryKey: queryKeys.jobs.detail(id),
    queryFn: async () => {
      const response = await jobAPI.getJob(id);
      return response.data;
    },
    enabled: !!id, // Only fetch if id exists
    ...options,
  });
};

// Create job mutation
export const useCreateJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => jobAPI.createJob(data),
    onSuccess: () => {
      // Invalidate jobs list
      invalidateQueries.jobs();
      toast.success('🎉 Job created successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create job');
    },
  });
};

// Update job mutation
export const useUpdateJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => jobAPI.updateJob(id, data),
    onSuccess: (_, variables) => {
      // Invalidate specific job and jobs list
      invalidateQueries.job(variables.id);
      invalidateQueries.jobs();
      toast.success('✅ Job updated successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update job');
    },
  });
};

// Delete job mutation
export const useDeleteJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => jobAPI.deleteJob(id),
    onSuccess: () => {
      invalidateQueries.jobs();
      toast.success('🗑️ Job deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete job');
    },
  });
};

// ==================== TIME ENTRY QUERIES ====================

// Get all time entries
export const useTimeEntries = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: queryKeys.timeEntries.list(filters),
    queryFn: async () => {
      const response = await timeEntryAPI.getTimeEntries(filters);
      return response.data;
    },
    ...options,
  });
};

// Get single time entry
export const useTimeEntry = (id, options = {}) => {
  return useQuery({
    queryKey: queryKeys.timeEntries.detail(id),
    queryFn: async () => {
      const response = await timeEntryAPI.getTimeEntry(id);
      return response.data;
    },
    enabled: !!id,
    ...options,
  });
};

// Get time entries summary
export const useTimeEntrySummary = (options = {}) => {
  return useQuery({
    queryKey: queryKeys.timeEntries.summary(),
    queryFn: async () => {
      const response = await timeEntryAPI.getSummary();
      return response.data;
    },
    ...options,
  });
};

// Create time entry mutation
export const useCreateTimeEntry = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => timeEntryAPI.createTimeEntry(data),
    onSuccess: () => {
      // Invalidate time entries list and summary
      invalidateQueries.timeEntries();
      invalidateQueries.timeEntrySummary();
      invalidateQueries.reports();
      toast.success('✅ Time entry created successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create time entry');
    },
  });
};

// Update time entry mutation
export const useUpdateTimeEntry = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => timeEntryAPI.updateTimeEntry(id, data),
    onSuccess: (_, variables) => {
      invalidateQueries.timeEntry(variables.id);
      invalidateQueries.timeEntries();
      invalidateQueries.timeEntrySummary();
      invalidateQueries.reports();
      toast.success('✅ Time entry updated successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update time entry');
    },
  });
};

// Delete time entry mutation
export const useDeleteTimeEntry = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => timeEntryAPI.deleteTimeEntry(id),
    onSuccess: () => {
      invalidateQueries.timeEntries();
      invalidateQueries.timeEntrySummary();
      invalidateQueries.reports();
      toast.success('🗑️ Time entry deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete time entry');
    },
  });
};

// ==================== REPORT QUERIES ====================

// Get salary report
export const useSalaryReport = (params, options = {}) => {
  return useQuery({
    queryKey: queryKeys.reports.salary(params),
    queryFn: async () => {
      const response = await reportAPI.getSalaryReport(params);
      return response.data;
    },
    enabled: !!params.startDate && !!params.endDate, // Only fetch if dates provided
    ...options,
  });
};

// Get monthly salary report
export const useMonthlySalaryReport = (params, options = {}) => {
  return useQuery({
    queryKey: queryKeys.reports.monthly(params),
    queryFn: async () => {
      const response = await reportAPI.getMonthlySalaryReport(params);
      return response.data;
    },
    enabled: !!params.year && !!params.month, // Only fetch if year and month provided
    ...options,
  });
};

// ==================== DASHBOARD QUERIES ====================

// Combined dashboard data query
export const useDashboardData = () => {
  const jobsQuery = useJobs();
  const summaryQuery = useTimeEntrySummary();
  const recentEntriesQuery = useTimeEntries({ limit: 5 });
  
  return {
    jobs: jobsQuery.data?.jobs || [],
    totalHours: summaryQuery.data?.totalHours || 0,
    recentEntries: recentEntriesQuery.data?.timeEntries || [],
    isLoading: jobsQuery.isLoading || summaryQuery.isLoading || recentEntriesQuery.isLoading,
    isError: jobsQuery.isError || summaryQuery.isError || recentEntriesQuery.isError,
    refetch: () => {
      jobsQuery.refetch();
      summaryQuery.refetch();
      recentEntriesQuery.refetch();
    },
  };
};

// ==================== UTILITY HOOKS ====================

// Prefetch query (for hover/route transitions)
export const usePrefetchJob = () => {
  const queryClient = useQueryClient();
  
  return (id) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.jobs.detail(id),
      queryFn: async () => {
        const response = await jobAPI.getJob(id);
        return response.data;
      },
    });
  };
};

// Prefetch time entry
export const usePrefetchTimeEntry = () => {
  const queryClient = useQueryClient();
  
  return (id) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.timeEntries.detail(id),
      queryFn: async () => {
        const response = await timeEntryAPI.getTimeEntry(id);
        return response.data;
      },
    });
  };
};

export default {
  // Jobs
  useJobs,
  useJob,
  useCreateJob,
  useUpdateJob,
  useDeleteJob,
  
  // Time Entries
  useTimeEntries,
  useTimeEntry,
  useTimeEntrySummary,
  useCreateTimeEntry,
  useUpdateTimeEntry,
  useDeleteTimeEntry,
  
  // Reports
  useSalaryReport,
  useMonthlySalaryReport,
  
  // Dashboard
  useDashboardData,
  
  // Utilities
  usePrefetchJob,
  usePrefetchTimeEntry,
};

