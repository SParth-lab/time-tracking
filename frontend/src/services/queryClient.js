import { QueryClient } from '@tanstack/react-query';

// Configure React Query client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time - data considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      
      // Cache time - unused data in cache for 10 minutes
      cacheTime: 10 * 60 * 1000,
      
      // Retry failed requests
      retry: 1,
      
      // Retry delay
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch on window focus
      refetchOnWindowFocus: false,
      
      // Refetch on reconnect
      refetchOnReconnect: true,
      
      // Refetch on mount if data is stale
      refetchOnMount: true,
      
      // Keep previous data while fetching new data
      keepPreviousData: true,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      
      // Retry delay for mutations
      retryDelay: 1000,
    },
  },
});

// Query keys factory for consistency
export const queryKeys = {
  // Jobs
  jobs: {
    all: ['jobs'],
    lists: () => [...queryKeys.jobs.all, 'list'],
    list: (filters) => [...queryKeys.jobs.lists(), filters],
    details: () => [...queryKeys.jobs.all, 'detail'],
    detail: (id) => [...queryKeys.jobs.details(), id],
  },
  
  // Time Entries
  timeEntries: {
    all: ['timeEntries'],
    lists: () => [...queryKeys.timeEntries.all, 'list'],
    list: (filters) => [...queryKeys.timeEntries.lists(), filters],
    details: () => [...queryKeys.timeEntries.all, 'detail'],
    detail: (id) => [...queryKeys.timeEntries.details(), id],
    summary: () => [...queryKeys.timeEntries.all, 'summary'],
  },
  
  // Reports
  reports: {
    all: ['reports'],
    salary: (params) => [...queryKeys.reports.all, 'salary', params],
    monthly: (params) => [...queryKeys.reports.all, 'monthly', params],
  },
};

// Cache invalidation helpers
export const invalidateQueries = {
  jobs: () => queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all }),
  job: (id) => queryClient.invalidateQueries({ queryKey: queryKeys.jobs.detail(id) }),
  
  timeEntries: () => queryClient.invalidateQueries({ queryKey: queryKeys.timeEntries.all }),
  timeEntry: (id) => queryClient.invalidateQueries({ queryKey: queryKeys.timeEntries.detail(id) }),
  timeEntrySummary: () => queryClient.invalidateQueries({ queryKey: queryKeys.timeEntries.summary() }),
  
  reports: () => queryClient.invalidateQueries({ queryKey: queryKeys.reports.all }),
};

export default queryClient;

